import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { marked } from "marked";
import { getPageBySlug, DEMO_PAGES } from "@/lib/demo-data";

export function generateStaticParams() {
  return DEMO_PAGES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = getPageBySlug(slug);
  if (!page) return { title: "Not found" };
  return { title: page.title };
}

export default async function StaticPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = getPageBySlug(slug);
  if (!page) notFound();

  const html = await marked.parse(page.body);

  return (
    <div className="mx-auto max-w-[760px]">
      <div
        className="prose-journal"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
