import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { DEMO_ARTICLES } from "@/lib/demo-data";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug).replace(/-/g, " ");
  return {
    title: `Articles tagged: ${decoded}`,
    description: `Search articles tagged with "${decoded}" in UNILAG Communication Review.`,
  };
}

export default async function KeywordPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let term = "";

  try {
    const kw = await db.keyword.findFirst({
      where: { slug },
      select: { label: true },
    });
    if (kw?.label) {
      term = kw.label;
    }
  } catch {}

  if (!term) {
    const demoKw = DEMO_ARTICLES.flatMap((a) => a.keywords).find((k) => k.slug === slug);
    if (demoKw?.label) {
      term = demoKw.label;
    }
  }

  if (!term) {
    term = decodeURIComponent(slug).replace(/-/g, " ");
  }

  redirect(`/search?q=${encodeURIComponent(term)}`);
}
