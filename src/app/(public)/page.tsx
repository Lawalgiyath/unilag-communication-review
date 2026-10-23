import Link from "next/link";
import { format } from "date-fns";
import { JOURNAL } from "@/lib/constants";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { IssueCover } from "@/components/issue/IssueCover";
import {
  ArticleListItem,
  type ArticleListItemData,
} from "@/components/article/ArticleListItem";
import {
  getCurrentIssue,
  getLatestArticles,
  DEMO_ANNOUNCEMENTS,
  type DemoArticle,
} from "@/lib/demo-data";

export const dynamic = "force-dynamic";

function toListItem(a: DemoArticle): ArticleListItemData {
  return {
    slug: a.slug,
    title: a.title,
    articleType: a.articleType,
    authorNames: a.authors.map((x) => x.name),
    firstPage: a.firstPage,
    lastPage: a.lastPage,
    volume: a.volumeNumber,
    issue: a.issueNumber,
    year: a.volumeYear,
  };
}

export default async function HomePage() {
  const currentIssue = getCurrentIssue();
  const latestArticles = getLatestArticles(10);
  const announcements = DEMO_ANNOUNCEMENTS.slice(0, 3);

  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_320px]">
      <div>
        {/* ===== Current issue hero ===== */}
        <section aria-labelledby="current-issue-heading">
          <SectionLabel>
            <span id="current-issue-heading">Current Issue</span>
          </SectionLabel>
          <div className="mt-4 grid gap-6 sm:grid-cols-[200px_1fr]">
            <Link
              href={`/issues/${currentIssue.volumeNumber}/${currentIssue.number}`}
              aria-label={`Browse Volume ${currentIssue.volumeNumber}, Number ${currentIssue.number}`}
            >
              <IssueCover
                volume={currentIssue.volumeNumber}
                issue={currentIssue.number}
                year={currentIssue.volumeYear}
                publishedAt={currentIssue.publishedAt}
                size="lg"
                isSpecialIssue={!!currentIssue.title}
              />
            </Link>
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="border border-gold/80 bg-gold/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-gold-dark">
                  Special Issue
                </span>
                {currentIssue.guestEditor && (
                  <span className="text-xs text-secondary">
                    Guest Editor: <strong className="font-medium text-ink">{currentIssue.guestEditor}</strong>
                  </span>
                )}
              </div>
              <h2 className="font-display text-2xl font-semibold leading-snug text-ink sm:text-3xl">
                {currentIssue.title ?? `Volume ${currentIssue.volumeNumber}, Number ${currentIssue.number} (${currentIssue.volumeYear})`}
              </h2>
              <p className="mt-1 font-serif text-sm text-secondary">
                Volume {currentIssue.volumeNumber}, Number {currentIssue.number} ({currentIssue.volumeYear}) · Published {format(currentIssue.publishedAt, "d MMMM yyyy")} · {currentIssue.articleCount} articles
              </p>
              <div className="mt-4">
                {currentIssue.articles.slice(0, 5).map((a) => (
                  <ArticleListItem key={a.id} article={toListItem(a)} />
                ))}
              </div>
              <Link
                href={`/issues/${currentIssue.volumeNumber}/${currentIssue.number}`}
                className="mt-3 inline-block text-sm font-semibold text-maroon underline decoration-hairline underline-offset-4 hover:decoration-maroon"
              >
                View full table of contents →
              </Link>
            </div>
          </div>
        </section>

        {/* ===== Articles in this Issue ===== */}
        <section className="mt-12" aria-labelledby="browse-heading">
          <div className="flex items-end justify-between border-b border-hairline pb-2">
            <h2 id="browse-heading" className="text-[13px] font-semibold uppercase tracking-[0.1em] text-maroon border-b-2 border-maroon pb-2 -mb-2">
              Articles in this Issue
            </h2>
            <Link
              href="/archives"
              className="text-xs font-semibold uppercase tracking-[0.1em] text-maroon hover:underline"
            >
              All issues →
            </Link>
          </div>
          <div>
            {latestArticles.map((a) => (
              <ArticleListItem
                key={a.id}
                article={toListItem(a)}
                showIssue
              />
            ))}
          </div>
        </section>
      </div>

      {/* ===== Sidebar ===== */}
      <aside className="space-y-10">
        {/* Submit CTA */}
        <div className="border border-hairline bg-paper-dark p-5">
          <p className="font-display text-lg font-semibold text-ink">
            Publish with us
          </p>
          <p className="mt-2 text-sm leading-relaxed text-secondary">
            Original research in communication, media and sociocultural
            studies. Double-blind peer review, open access, global visibility.
          </p>
          <Link
            href="/dashboard/submissions/new"
            className="mt-4 inline-block w-full bg-maroon px-4 py-2.5 text-center text-[13px] font-semibold uppercase tracking-[0.08em] text-paper hover:bg-oxblood"
          >
            Submit your manuscript
          </Link>
          <Link
            href="/submission-guidelines"
            className="mt-2 inline-block w-full border border-hairline px-4 py-2.5 text-center text-[13px] font-semibold uppercase tracking-[0.08em] text-ink hover:border-maroon hover:text-maroon"
          >
            Author guidelines
          </Link>
        </div>

        {/* Announcements */}
        <section aria-labelledby="announcements-heading">
          <SectionLabel>
            <span id="announcements-heading">Announcements</span>
          </SectionLabel>
          <ul className="mt-3">
            {announcements.map((ann) => (
              <li key={ann.id} className="border-b border-hairline py-3 last:border-b-0">
                <Link
                  href={`/announcements/${ann.slug}`}
                  className="block font-display text-base font-semibold leading-snug text-ink hover:text-maroon"
                >
                  {ann.title}
                </Link>
                <p className="mt-1 text-xs text-secondary">
                  {format(ann.publishedAt, "d MMMM yyyy")}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* Journal facts */}
        <section aria-labelledby="ataglance-heading" className="border-t-2 border-maroon pt-4">
          <SectionLabel>
            <span id="ataglance-heading">At a Glance</span>
          </SectionLabel>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-secondary">Publisher</dt>
              <dd className="text-right text-ink">{JOURNAL.publisherShort}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-secondary">ISSN (Print)</dt>
              <dd className="text-ink">{JOURNAL.issn}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-secondary">ISSN (Online)</dt>
              <dd className="text-ink">{JOURNAL.eissn}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-secondary">Review model</dt>
              <dd className="text-ink">Double-blind</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-secondary">Access</dt>
              <dd className="text-ink">Open access (CC BY 4.0)</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-secondary">Frequency</dt>
              <dd className="text-ink">2 issues / year</dd>
            </div>
          </dl>
        </section>

        {/* Indexing strip */}
        <section aria-labelledby="indexing-heading">
          <SectionLabel>
            <span id="indexing-heading">Indexing &amp; Discovery</span>
          </SectionLabel>
          <ul className="mt-3 flex flex-wrap gap-2">
            {["Zenodo DOI", "Google Scholar", "Crossref", "OAI-PMH", "RSS Feed", "UNILAG Repository"].map((s) => (
              <li
                key={s}
                className="border border-hairline px-2.5 py-1 text-xs font-medium text-secondary"
              >
                {s}
              </li>
            ))}
          </ul>
        </section>
      </aside>
    </div>
  );
}
