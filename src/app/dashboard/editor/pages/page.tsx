import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { format } from "date-fns";

export const metadata: Metadata = { title: "CMS Pages" };
export const dynamic = "force-dynamic";

// Standard pages we expect to exist
const STANDARD_PAGES = [
  { slug: "about", title: "About the Journal" },
  { slug: "aims-scope", title: "Aims & Scope" },
  { slug: "submission-guidelines", title: "Submission Guidelines" },
  { slug: "peer-review", title: "Peer Review Process" },
  { slug: "publication-fee", title: "Publication Fee" },
  { slug: "ethics", title: "Ethics & Malpractice Statement" },
  { slug: "open-access", title: "Open Access Policy" },
  { slug: "archiving", title: "Archiving Policy" },
  { slug: "contact", title: "Contact Us" },
];

export default async function PagesIndex() {
  const pages = await db.page.findMany({
    include: { updatedBy: { select: { name: true } } },
  });

  const pageMap = new Map(pages.map((p) => [p.slug, p]));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Pages (CMS)</h1>
          <p className="page-subtitle">Manage static content for the public site</p>
        </div>
        <form action={async () => {
          "use server";
          const { db: p } = await import("@/lib/db");
          // Ensure all standard pages exist
          for (const sp of STANDARD_PAGES) {
            await p.page.upsert({
              where: { slug: sp.slug },
              update: {},
              create: { slug: sp.slug, title: sp.title, body: `Content for ${sp.title} goes here.` },
            });
          }
        }}>
          <button type="submit" className="btn btn-secondary btn-sm">
            Initialize Missing Pages
          </button>
        </form>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>URL path</th>
            <th>Last updated</th>
            <th>By</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {STANDARD_PAGES.map((sp) => {
            const p = pageMap.get(sp.slug);
            return (
              <tr key={sp.slug}>
                <td className="font-medium text-ink">{p ? p.title : sp.title}</td>
                <td className="font-mono text-xs text-secondary">/{sp.slug}</td>
                <td className="text-sm text-secondary">
                  {p ? format(p.updatedAt, "d MMM yyyy, HH:mm") : "Not created yet"}
                </td>
                <td className="text-sm text-secondary">{p?.updatedBy?.name ?? "—"}</td>
                <td>
                  <div className="flex gap-2">
                    {p ? (
                      <Link href={`/dashboard/editor/pages/${p.slug}`} className="btn btn-primary btn-sm">
                        Edit →
                      </Link>
                    ) : (
                      <span className="text-xs text-secondary italic">Click Initialize</span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
