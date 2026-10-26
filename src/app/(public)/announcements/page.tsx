import Link from "next/link";
import type { Metadata } from "next";
import { format } from "date-fns";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { DEMO_ANNOUNCEMENTS } from "@/lib/demo-data";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Announcements",
  description: "News and official notices from UNILAG Communication Review.",
};

export default async function AnnouncementsPage() {
  let announcements: Array<{
    id: string;
    slug: string;
    title: string;
    imageUrl?: string | null;
    linkUrl?: string | null;
    linkText?: string | null;
    publishedAt: Date | null;
  }> = [];

  try {
    const fromDb = await db.announcement.findMany({
      orderBy: { publishedAt: "desc" },
    });
    if (fromDb && fromDb.length > 0) {
      announcements = fromDb;
    } else {
      announcements = DEMO_ANNOUNCEMENTS;
    }
  } catch (e) {
    console.error("Failed to fetch announcements from db, using fallback", e);
    announcements = DEMO_ANNOUNCEMENTS;
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
        Announcements
      </h1>

      <div className="mt-8 space-y-0 divide-y divide-hairline">
        {announcements.map((ann) => (
          <article key={ann.id} className="py-6 flex flex-col sm:flex-row gap-5 items-start">
            {ann.imageUrl && (
              <div className="w-full sm:w-48 h-32 flex-shrink-0 bg-surface border border-hairline overflow-hidden rounded">
                <img
                  src={ann.imageUrl}
                  alt={ann.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1">
              <h2 className="font-display text-xl font-semibold text-ink">
                <Link href={`/announcements/${ann.slug}`} className="hover:text-maroon">
                  {ann.title}
                </Link>
              </h2>
              <p className="mt-1 text-xs text-secondary">
                {ann.publishedAt ? format(ann.publishedAt, "d MMMM yyyy") : ""}
              </p>
              {ann.linkUrl && (
                <div className="mt-3">
                  <a
                    href={ann.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-xs font-semibold text-maroon hover:underline"
                  >
                    {ann.linkText || "Learn more"} ↗
                  </a>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
