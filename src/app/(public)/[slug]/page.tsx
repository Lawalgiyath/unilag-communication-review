import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { marked } from "marked";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Pages served from the DB Page model:
// /about, /aims-scope, /submission-guidelines, /peer-review,
// /publication-fee, /ethics, /open-access, /archiving, /contact

// Slugs that are reserved for Next.js routes (not CMS pages)
const RESERVED = new Set([
  "search",
  "archives",
  "current",
  "editorial-board",
  "announcements",
  "keywords",
  "articles",
  "issues",
  "login",
  "register",
  "logout",
  "dashboard",
  "oai",
  "feed.xml",
  "sitemap.xml",
]);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (RESERVED.has(slug)) return { title: "Not Found" };
  const page = await db.page.findUnique({ where: { slug } });
  if (!page) return { title: "Not Found" };
  return {
    title: page.title,
    description: page.body.slice(0, 200).replace(/[#*_\[\]]/g, ""),
  };
}

export default async function CmsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (RESERVED.has(slug)) notFound();

  const page = await db.page.findUnique({ where: { slug } });
  if (!page) notFound();

  const html = await marked.parse(page.body);

  return (
    <div className="mx-auto max-w-[760px]">
      <h1 className="font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl">
        {page.title}
      </h1>
      <div
        className="prose-journal mt-8"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
