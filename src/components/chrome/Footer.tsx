import Link from "next/link";
import { JOURNAL } from "@/lib/constants";

const FOOTER_COLS: { heading: string; links: { href: string; label: string }[] }[] =
  [
    {
      heading: "Journal",
      links: [
        { href: "/about", label: "About the Journal" },
        { href: "/aims-scope", label: "Aims & Scope" },
        { href: "/editorial-board", label: "Editorial Board" },
        { href: "/archives", label: "All Issues" },
        { href: "/announcements", label: "Announcements" },
      ],
    },
    {
      heading: "For Authors",
      links: [
        { href: "/submission-guidelines", label: "Submission Guidelines" },
        { href: "/peer-review", label: "Peer Review Process" },
        { href: "/publication-fee", label: "Publication Fee" },
        { href: "/ethics", label: "Publication Ethics" },
        { href: "/dashboard/submissions/new", label: "Submit Article" },
      ],
    },
    {
      heading: "Policies",
      links: [
        { href: "/open-access", label: "Open Access Statement" },
        { href: "/archiving", label: "Archiving Policy" },
        { href: "/contact", label: "Contact" },
        { href: "/feed.xml", label: "RSS Feed" },
      ],
    },
  ];

export function Footer() {
  return (
    <footer className="mt-16 no-print">
      <div className="double-rule" aria-hidden="true" />
      <div className="bg-oxblood text-paper">
        <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="font-display text-xl font-semibold">
                {JOURNAL.title}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-paper/80">
                {JOURNAL.publisher}, {JOURNAL.address}
              </p>
              <p className="mt-3 text-sm text-paper/80">
                ISSN {JOURNAL.issn} (Print)
                <br />
                ISSN {JOURNAL.eissn} (Online)
              </p>
              <div className="mt-6 rounded border border-paper/20 p-3 text-xs text-paper/80 bg-paper/5">
                <p className="font-semibold text-paper">IT Support & Error Reporting</p>
                <p className="mt-1">Mr. Lawal Giyath</p>
                <p>Phone: 08062679191</p>
              </div>
            </div>
            {FOOTER_COLS.map((col) => (
              <nav key={col.heading} aria-label={col.heading}>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">
                  {col.heading}
                </p>
                <ul className="mt-3 space-y-2">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        className="text-sm text-paper/90 hover:text-gold"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
          <div className="mt-10 border-t border-paper/20 pt-6 text-xs text-paper/70">
            <p>
              © {new Date().getFullYear()} {JOURNAL.title}. Content is licensed
              under{" "}
              <a
                href="https://creativecommons.org/licenses/by/4.0/"
                className="underline hover:text-gold"
              >
                CC BY 4.0
              </a>{" "}
              unless otherwise stated. {JOURNAL.tagline}.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
