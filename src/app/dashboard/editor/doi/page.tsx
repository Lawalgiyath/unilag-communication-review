import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireSession, requireRole } from "@/lib/auth";
import { DoiManagerClient } from "./DoiManagerClient";

export const metadata: Metadata = {
  title: "DOI Assigner — Zenodo",
};

export const dynamic = "force-dynamic";

export default async function DoiAssignerPage() {
  const user = await requireSession();
  await requireRole(user, ["EDITOR", "ADMIN"]);

  const [settings, articles] = await Promise.all([
    db.setting.findMany({
      where: {
        key: {
          in: ["zenodo_token", "zenodo_sandbox", "zenodo_community"],
        },
      },
    }),
    db.article.findMany({
      where: {
        status: "PUBLISHED",
      },
      include: {
        authors: {
          select: { name: true },
        },
        issue: {
          include: {
            volume: true,
          },
        },
      },
      orderBy: {
        orderInIssue: "asc",
      },
    }),
  ]);

  const map = new Map(settings.map((s) => [s.key, s.value]));
  const token = map.get("zenodo_token") || process.env.ZENODO_ACCESS_TOKEN || "";
  const isSandbox = (map.get("zenodo_sandbox") || process.env.ZENODO_SANDBOX) === "true";
  const community = map.get("zenodo_community") || process.env.ZENODO_COMMUNITY || "";

  const articleItems = articles.map((a) => ({
    id: a.id,
    slug: a.slug,
    title: a.title,
    firstPage: a.firstPage,
    lastPage: a.lastPage,
    doi: a.doi,
    authors: a.authors,
    issueTitle: a.issue?.title || `Issue ${a.issue?.number || 2}`,
    volumeNumber: a.issue?.volume.number || 9,
    issueNumber: a.issue?.number || 2,
  }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Automatic Zenodo DOI Assigner</h1>
          <p className="page-subtitle">
            Mint official, permanent, 100% free DOIs via CERN/Zenodo for all published articles.
          </p>
        </div>
      </div>

      <DoiManagerClient
        initialToken={token}
        initialSandbox={isSandbox}
        initialCommunity={community}
        articles={articleItems}
      />
    </div>
  );
}
