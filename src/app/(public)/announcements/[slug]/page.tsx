import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { marked } from "marked";
import { JOURNAL } from "@/lib/constants";
import { Badge } from "@/components/ui/Badge";
import { getAnnouncementBySlug, DEMO_ANNOUNCEMENTS } from "@/lib/demo-data";

export function generateStaticParams() {
  return DEMO_ANNOUNCEMENTS.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const ann = getAnnouncementBySlug(slug);
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
  const ann = getAnnouncementBySlug(slug);
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
          {JOURNAL.shortTitle} · {format(ann.publishedAt, "d MMMM yyyy")}
        </p>
      </header>

      <div
        className="prose-journal mt-8"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
