import Link from "next/link";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/current", label: "Current Issue" },
  { href: "/archives", label: "Archives" },
  { href: "/aims-scope", label: "Aims & Scope" },
  { href: "/editorial-board", label: "Editorial Board" },
  { href: "/submission-guidelines", label: "For Authors" },
  { href: "/announcements", label: "Announcements" },
  { href: "/search", label: "Search" },
];

export function MainNav() {
  return (
    <nav
      aria-label="Main navigation"
      className="border-b border-hairline bg-paper"
    >
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        {/* Mobile: native disclosure; Desktop: horizontal links */}
        <details className="group py-2 sm:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold uppercase tracking-[0.1em] text-ink [&::-webkit-details-marker]:hidden">
            Menu
            <svg
              className="h-4 w-4 transition-transform group-open:rotate-180"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M4 6l4 4 4-4"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </summary>
          <ul className="border-t border-hairline pt-2">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block py-2 text-sm text-ink hover:text-maroon"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="border-t border-hairline pt-2">
              <Link
                href="/dashboard/submissions/new"
                className="block py-2 text-sm font-semibold text-maroon"
              >
                Submit Article
              </Link>
            </li>
            <li>
              <Link
                href="/login"
                className="block py-2 text-sm text-secondary hover:text-maroon"
              >
                Log in
              </Link>
            </li>
          </ul>
        </details>

        <div className="hidden items-center justify-between sm:flex">
          <ul className="flex flex-wrap items-center">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block px-3 py-3 text-[13px] font-medium uppercase tracking-[0.08em] text-ink first:pl-0 hover:text-maroon"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-[13px] font-medium uppercase tracking-[0.08em] text-secondary hover:text-maroon"
            >
              Log in
            </Link>
            <Link
              href="/dashboard/submissions/new"
              className="bg-maroon px-4 py-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-paper hover:bg-oxblood"
            >
              Submit Article
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
