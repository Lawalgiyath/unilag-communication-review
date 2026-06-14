import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { IssueCover } from "@/components/issue/IssueCover";
import { ArticleListItem } from "@/components/article/ArticleListItem";
import { JOURNAL } from "@/lib/constants";
import { getCurrentIssue } from "@/lib/demo-data";

export const metadata: Metadata = {
  title: "Current Issue",
  description: "The latest issue of UNILAG Communication Review.",
};

export default function CurrentPage() {
  const data = getCurrentIssue();
  if (!data) notFound();

  return (
    <div>
      <nav aria-label="Breadcrumb" className="text-xs text-secondary">
        <Link href="/archives" className="hover:text-maroon">Archives</Link>{" "}
        / Current Issue
      </nav>

      <div className="mt-6 grid gap-8 sm:grid-cols-[220px_1fr]">
        <div>
          <IssueCover
            volume={data.volumeNumber}
            issue={data.number}
            year={data.volumeYear}
            publishedAt={data.publishedAt}
            size="lg"
          />
          <p className="mt-3 border border-gold px-2 py-1 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-dark">
            Current Issue
          </p>
        </div>
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">
            Volume {data.volumeNumber}, Issue {data.number} ({data.volumeYear})
          </h1>
          <p className="mt-2 text-sm text-secondary">
            Published {format(data.publishedAt, "d MMMM yyyy")} ·{" "}
            {data.articleCount} articles · ISSN {JOURNAL.issn}
          </p>

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
