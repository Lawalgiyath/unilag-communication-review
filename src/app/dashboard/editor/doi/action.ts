"use server";

import { db } from "@/lib/db";
import { requireSession, requireRole } from "@/lib/auth";
import {
  depositAndMintZenodoDoi,
  getZenodoConfig,
  testZenodoConnection,
} from "@/lib/zenodo";
import { revalidatePath } from "next/cache";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";

export async function saveZenodoConfigAction(formData: FormData) {
  const user = await requireSession();
  await requireRole(user, ["EDITOR", "ADMIN"]);

  const token = (formData.get("zenodo_token") as string)?.trim() ?? "";
  const isSandbox = (formData.get("zenodo_sandbox") as string) === "true";
  const community = (formData.get("zenodo_community") as string)?.trim() ?? "";

  await db.setting.upsert({
    where: { key: "zenodo_token" },
    update: { value: token },
    create: { key: "zenodo_token", value: token },
  });

  await db.setting.upsert({
    where: { key: "zenodo_sandbox" },
    update: { value: isSandbox ? "true" : "false" },
    create: { key: "zenodo_sandbox", value: isSandbox ? "true" : "false" },
  });

  await db.setting.upsert({
    where: { key: "zenodo_community" },
    update: { value: community },
    create: { key: "zenodo_community", value: community },
  });

  revalidatePath("/dashboard/editor/doi");
  revalidatePath("/dashboard/editor/settings");
  return { success: true };
}

export async function testConnectionAction() {
  const user = await requireSession();
  await requireRole(user, ["EDITOR", "ADMIN"]);
  return await testZenodoConnection();
}

export async function mintSingleDoiAction(articleId: string) {
  const user = await requireSession();
  await requireRole(user, ["EDITOR", "ADMIN"]);

  const art = await db.article.findUnique({
    where: { id: articleId },
    include: {
      authors: true,
      keywords: {
        include: { keyword: true },
      },
      issue: {
        include: { volume: true },
      },
    },
  });

  if (!art) {
    return { success: false, error: "Article not found" };
  }

  const pdfFilename = `${art.slug}.pdf`;
  const pdfPath = path.resolve(
    process.cwd(),
    process.env.UPLOADS_DIR ?? "./uploads",
    "published",
    pdfFilename
  );

  let pdfBuffer: Buffer | undefined;
  if (existsSync(pdfPath)) {
    pdfBuffer = await readFile(pdfPath);
  }

  const res = await depositAndMintZenodoDoi({
    articleId: art.id,
    slug: art.slug,
    title: art.title,
    abstract: art.abstract,
    authors: art.authors.map((a) => ({
      name: a.name,
      affiliation: a.affiliation,
      orcid: a.orcid,
    })),
    keywords: art.keywords.map((k) => k.keyword.label),
    volumeNumber: art.issue?.volume.number ?? 9,
    issueNumber: art.issue?.number ?? 2,
    volumeYear: art.issue?.volume.year ?? 2026,
    firstPage: art.firstPage,
    lastPage: art.lastPage,
    pdfBuffer,
    pdfFilename,
    publishImmediately: true,
  });

  revalidatePath("/dashboard/editor/doi");
  revalidatePath(`/articles/${art.slug}`);
  revalidatePath("/");
  return res;
}

export async function mintAllDoisAction() {
  const user = await requireSession();
  await requireRole(user, ["EDITOR", "ADMIN"]);

  const articles = await db.article.findMany({
    where: { status: "PUBLISHED" },
    include: {
      authors: true,
      keywords: {
        include: { keyword: true },
      },
      issue: {
        include: { volume: true },
      },
    },
    orderBy: { orderInIssue: "asc" },
  });

  const results: { slug: string; success: boolean; doi?: string; error?: string }[] = [];

  for (const art of articles) {
    const pdfFilename = `${art.slug}.pdf`;
    const pdfPath = path.resolve(
      process.cwd(),
      process.env.UPLOADS_DIR ?? "./uploads",
      "published",
      pdfFilename
    );

    let pdfBuffer: Buffer | undefined;
    if (existsSync(pdfPath)) {
      pdfBuffer = await readFile(pdfPath);
    }

    const res = await depositAndMintZenodoDoi({
      articleId: art.id,
      slug: art.slug,
      title: art.title,
      abstract: art.abstract,
      authors: art.authors.map((a) => ({
        name: a.name,
        affiliation: a.affiliation,
        orcid: a.orcid,
      })),
      keywords: art.keywords.map((k) => k.keyword.label),
      volumeNumber: art.issue?.volume.number ?? 9,
      issueNumber: art.issue?.number ?? 2,
      volumeYear: art.issue?.volume.year ?? 2026,
      firstPage: art.firstPage,
      lastPage: art.lastPage,
      pdfBuffer,
      pdfFilename,
      publishImmediately: true,
    });

    results.push({
      slug: art.slug,
      success: res.success,
      doi: res.doi,
      error: res.error,
    });

    // 1-second delay between Zenodo API calls
    await new Promise((r) => setTimeout(r, 1000));
  }

  revalidatePath("/dashboard/editor/doi");
  revalidatePath("/");
  return { success: true, results };
}
