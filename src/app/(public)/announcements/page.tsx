import Link from "next/link";
import type { Metadata } from "next";
import { format } from "date-fns";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { DEMO_ANNOUNCEMENTS } from "@/lib/demo-data";

export const metadata: Metadata = {
  title: "Announcements",
  description: "News and official notices from UNILAG Communication Review.",
};

export default function AnnouncementsPage() {
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
        Announcements
      </h1>

      <div className="mt-8 space-y-0 divide-y divide-hairline">
        {DEMO_ANNOUNCEMENTS.map((ann) => (
          <article key={ann.id} className="py-6">
            <h2 className="font-display text-xl font-semibold text-ink">
              <Link href={`/announcements/${ann.slug}`} className="hover:text-maroon">
                {ann.title}
              </Link>
            </h2>
            <p className="mt-1 text-xs text-secondary">
              {format(ann.publishedAt, "d MMMM yyyy")}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
