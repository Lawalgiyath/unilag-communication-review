import Link from "next/link";
import type { Metadata } from "next";
import { format } from "date-fns";
import { db } from "@/lib/db";
import { SectionLabel } from "@/components/ui/SectionLabel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Announcements",
  description:
    "Latest announcements, news, and calls for papers from UNILAG Communication Review.",
};

export default async function AnnouncementsPage() {
  const announcements = await db.announcement.findMany({
    where: { publishedAt: { not: null } },
    orderBy: { publishedAt: "desc" },
  });

  const cfp = announcements.filter((a) => a.kind === "CALL_FOR_PAPERS");
  const news = announcements.filter((a) => a.kind !== "CALL_FOR_PAPERS");

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
        Announcements
      </h1>

      {announcements.length === 0 && (
        <p className="mt-6 text-secondary">No announcements at this time.</p>
      )}

      {cfp.length > 0 && (
        <section aria-labelledby="cfp-heading" className="mt-10">
          <SectionLabel>
            <span id="cfp-heading">Calls for Papers</span>
          </SectionLabel>
          <ul className="mt-4 space-y-0 divide-y divide-hairline border border-hairline">
            {cfp.map((ann) => (
              <li key={ann.id} className="px-4 py-4">
                <span className="inline-block border border-gold px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-gold-dark">
                  Call for Papers
                </span>
                <Link
                  href={`/announcements/${ann.slug}`}
                  className="mt-1 block font-display text-lg font-semibold leading-snug text-ink hover:text-maroon"
                >
                  {ann.title}
                </Link>
                {ann.publishedAt && (
                  <p className="mt-1 text-xs text-secondary">
                    {format(ann.publishedAt, "d MMMM yyyy")}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {news.length > 0 && (
        <section aria-labelledby="news-heading" className="mt-10">
          <SectionLabel>
            <span id="news-heading">News</span>
          </SectionLabel>
          <ul className="mt-4 divide-y divide-hairline border border-hairline">
            {news.map((ann) => (
              <li key={ann.id} className="px-4 py-4">
                <Link
                  href={`/announcements/${ann.slug}`}
                  className="block font-display text-lg font-semibold leading-snug text-ink hover:text-maroon"
                >
                  {ann.title}
                </Link>
                {ann.publishedAt && (
                  <p className="mt-1 text-xs text-secondary">
                    {format(ann.publishedAt, "d MMMM yyyy")}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
