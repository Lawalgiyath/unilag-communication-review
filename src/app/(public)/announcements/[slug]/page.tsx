import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { marked } from "marked";
import { JOURNAL } from "@/lib/constants";
import { Badge } from "@/components/ui/Badge";
import { getAnnouncementBySlug, DEMO_ANNOUNCEMENTS } from "@/lib/demo-data";

import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export function generateStaticParams() {
  return DEMO_ANNOUNCEMENTS.map((a) => ({ slug: a.slug }));
}

interface AnnouncementViewData {
  id: string;
  title: string;
  slug: string;
  body: string;
  kind?: string;
  publishedAt: Date | null;
  imageUrl?: string | null;
  linkUrl?: string | null;
  linkText?: string | null;
}

async function findAnnouncement(slug: string): Promise<AnnouncementViewData | undefined> {
  try {
    const fromDb = await db.announcement.findUnique({
      where: { slug },
    });
    if (fromDb) return fromDb;
  } catch (e) {
    // ignore
  }
  const demo = getAnnouncementBySlug(slug);
  if (!demo) return undefined;
  return {
    ...demo,
    imageUrl: null,
    linkUrl: null,
    linkText: null,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const ann = await findAnnouncement(slug);
  if (!ann) return { title: "Not Found" };
  return {
    title: ann.title,
    description: ann.body.slice(0, 200).replace(/[#*_\[\]]/g, ""),
  };
}

export default async function AnnouncementPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ann = await findAnnouncement(slug);
  if (!ann) notFound();

  const html = await marked.parse(ann.body);

  return (
    <div className="mx-auto max-w-[760px]">
      <nav aria-label="Breadcrumb" className="text-xs text-secondary">
        <a href="/announcements" className="hover:text-maroon">
          Announcements
        </a>
      </nav>

      <header className="mt-4">
        <h1 className="font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl">
          {ann.title}
        </h1>
        <p className="mt-3 text-sm text-secondary">
          {JOURNAL.shortTitle}{ann.publishedAt ? ` · ${format(ann.publishedAt, "d MMMM yyyy")}` : ""}
        </p>
      </header>

      {ann.imageUrl && (
        <div className="mt-6 overflow-hidden rounded-md border border-hairline bg-surface max-h-[420px]">
          <img
            src={ann.imageUrl}
            alt={ann.title}
            className="w-full h-full object-cover max-h-[420px]"
          />
        </div>
      )}

      <div
        className="prose-journal mt-8"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {ann.linkUrl && (
        <div className="mt-10 pt-6 border-t border-hairline">
          <a
            href={ann.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary inline-flex items-center gap-2"
          >
            {ann.linkText || "Visit External Link"} ↗
          </a>
        </div>
      )}
    </div>
  );
}
