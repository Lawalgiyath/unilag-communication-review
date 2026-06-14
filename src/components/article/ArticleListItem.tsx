import Link from "next/link";
import { articleTypeLabel } from "@/lib/constants";

export interface ArticleListItemData {
  slug: string;
  title: string;
  articleType: string;
  authorNames: string[];
  firstPage: number | null;
  lastPage: number | null;
  viewsCount?: number;
  volume?: number;
  issue?: number;
  year?: number;
}

/** A single article entry in a TOC / list — newspaper index style. */
export function ArticleListItem({
  article,
  showIssue = false,
  showViews = false,
}: {
  article: ArticleListItemData;
  showIssue?: boolean;
  showViews?: boolean;
}) {
  return (
    <article className="border-b border-hairline py-4 last:border-b-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-maroon">
        {articleTypeLabel(article.articleType)}
      </p>
      <h3 className="mt-1">
        <Link
          href={`/articles/${article.slug}`}
          className="font-display text-lg font-semibold leading-snug text-ink hover:text-maroon sm:text-xl"
        >
          {article.title}
        </Link>
      </h3>
      <p className="mt-1.5 font-serif text-sm text-secondary">
        {article.authorNames.join(", ")}
      </p>
      <p className="mt-1 text-xs text-secondary">
        {showIssue && article.volume && (
          <>
            Vol. {article.volume}, No. {article.issue} ({article.year})
            {article.firstPage && " · "}
          </>
        )}
        {article.firstPage && (
          <>
            pp. {article.firstPage}–{article.lastPage}
          </>
        )}
        {showViews && article.viewsCount !== undefined && (
          <> · {article.viewsCount.toLocaleString()} views</>
        )}
      </p>
    </article>
  );
}
