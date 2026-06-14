import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { db } from "@/lib/db";
import { JOURNAL } from "@/lib/constants";
import { IssueCover } from "@/components/issue/IssueCover";
import { ArticleListItem } from "@/components/article/ArticleListItem";

export const dynamic = "force-dynamic";

async function getIssue(volumeNum: number, issueNum: number) {
  if (!Number.isInteger(volumeNum) || !Number.isInteger(issueNum)) return null;
  return db.issue.findFirst({
    where: {
      number: issueNum,
      publishedAt: { not: null },
      volume: { number: volumeNum },
    },
    include: {
      volume: true,
      articles: {
        where: { status: "PUBLISHED" },
        orderBy: { orderInIssue: "asc" },
        include: { authors: { orderBy: { order: "asc" } } },
      },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ volume: string; issue: string }>;
}): Promise<Metadata> {
  const { volume, issue } = await params;
  const data = await getIssue(Number(volume), Number(issue));
  if (!data) return { title: "Issue not found" };
  return {
    title: `Volume ${data.volume.number}, Issue ${data.number} (${data.volume.year})`,
    description: `Table of contents for ${JOURNAL.title}, Volume ${data.volume.number}, Issue ${data.number} (${data.volume.year}).`,
  };
}

export default async function IssuePage({
  params,
}: {
  params: Promise<{ volume: string; issue: string }>;
}) {
  const { volume, issue } = await params;
  const data = await getIssue(Number(volume), Number(issue));
  if (!data) notFound();

  return (
    <div>
      <nav aria-label="Breadcrumb" className="text-xs text-secondary">
        <Link href="/archives" className="hover:text-maroon">
          Archives
        </Link>{" "}
        / Volume {data.volume.number} / Issue {data.number}
      </nav>

      <div className="mt-6 grid gap-8 sm:grid-cols-[220px_1fr]">
        <div>
          <IssueCover
            volume={data.volume.number}
            issue={data.number}
            year={data.volume.year}
            publishedAt={data.publishedAt}
            size="lg"
          />
          {data.isCurrent && (
            <p className="mt-3 border border-gold px-2 py-1 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-dark">
              Current Issue
            </p>
          )}
        </div>
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">
            Volume {data.volume.number}, Issue {data.number} (
            {data.volume.year})
          </h1>
          {data.publishedAt && (
            <p className="mt-2 text-sm text-secondary">
              Published {format(data.publishedAt, "d MMMM yyyy")} ·{" "}
              {data.articles.length} articles · ISSN {JOURNAL.issn}
            </p>
          )}
          {data.coverBlurb && (
            <p className="mt-3 max-w-2xl font-serif text-base text-secondary">
              {data.coverBlurb}
            </p>
          )}

          <h2 className="section-label mt-8 border-b border-hairline pb-2">
            Table of Contents
          </h2>
          <div>
            {data.articles.map((a) => (
              <ArticleListItem
                key={a.id}
                article={{
                  slug: a.slug,
                  title: a.title,
                  articleType: a.articleType,
                  authorNames: a.authors.map((x) => x.name),
                  firstPage: a.firstPage,
                  lastPage: a.lastPage,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
