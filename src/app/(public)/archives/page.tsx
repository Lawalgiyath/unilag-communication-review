import Link from "next/link";
import type { Metadata } from "next";
import { format } from "date-fns";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { IssueCover } from "@/components/issue/IssueCover";
import { DEMO_VOLUMES } from "@/lib/demo-data";

export const metadata: Metadata = {
  title: "Archives",
  description: "Browse all published volumes and issues of UNILAG Communication Review.",
};

export default function ArchivesPage() {
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
        Archives
      </h1>
      <p className="mt-2 max-w-2xl font-serif text-base text-secondary">
        All published issues of UNILAG Communication Review. Every article is
        freely available in full text.
      </p>

      <div className="mt-10 space-y-12">
        {DEMO_VOLUMES.map((volume) => (
          <section key={volume.id} aria-labelledby={`vol-${volume.number}`}>
            <SectionLabel>
              <span id={`vol-${volume.number}`}>
                Volume {volume.number} ({volume.year})
              </span>
            </SectionLabel>
            <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {volume.issues.map((issue) => (
                <li key={issue.id}>
                  <Link
                    href={`/issues/${volume.number}/${issue.number}`}
                    className="block border border-hairline hover:border-maroon"
                  >
                    <IssueCover
                      volume={volume.number}
                      issue={issue.number}
                      year={volume.year}
                      publishedAt={issue.publishedAt}
                    />
                    <div className="px-3 py-2.5">
                      <p className="text-sm font-semibold text-ink">
                        Issue {issue.number}
                      </p>
                      <p className="mt-0.5 text-xs text-secondary">
                        {format(issue.publishedAt, "MMMM yyyy")} · {issue.articleCount} articles
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
