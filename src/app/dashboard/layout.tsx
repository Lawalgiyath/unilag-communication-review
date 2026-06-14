import Link from "next/link";
import { requireSession, isEditor } from "@/lib/auth";
import { JOURNAL } from "@/lib/constants";
import { logoutAction } from "@/app/(auth)/logout/action";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireSession();
  const editor = isEditor(user);

  return (
    <div className="dashboard-shell">
      {/* Sidebar */}
      <nav className="dashboard-sidebar" aria-label="Dashboard navigation">
        <div className="sidebar-logo">
          <Link href="/" className="block font-display text-sm font-semibold text-paper/90 hover:text-paper">
            {JOURNAL.shortTitle}
          </Link>
          <p className="mt-0.5 text-[11px] text-paper/40">Editorial Portal</p>
        </div>

        <div className="sidebar-nav-section">
          <p className="sidebar-nav-label">Author</p>
          <Link href="/dashboard" className="sidebar-nav-link">
            <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5 shrink-0" aria-hidden="true">
              <rect x="1" y="1" width="6" height="6" stroke="currentColor" strokeWidth="1.25"/>
              <rect x="9" y="1" width="6" height="6" stroke="currentColor" strokeWidth="1.25"/>
              <rect x="1" y="9" width="6" height="6" stroke="currentColor" strokeWidth="1.25"/>
              <rect x="9" y="9" width="6" height="6" stroke="currentColor" strokeWidth="1.25"/>
            </svg>
            My Submissions
          </Link>
          <Link href="/dashboard/submissions/new" className="sidebar-nav-link">
            <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5 shrink-0" aria-hidden="true">
              <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            New Submission
          </Link>
        </div>

        <div className="sidebar-nav-section">
          <p className="sidebar-nav-label">Reviewer</p>
          <Link href="/dashboard/reviews" className="sidebar-nav-link">
            <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5 shrink-0" aria-hidden="true">
              <path d="M2 4h12M2 8h8M2 12h5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
            </svg>
            My Reviews
          </Link>
        </div>

        {editor && (
          <div className="sidebar-nav-section">
            <p className="sidebar-nav-label">Editor</p>
            <Link href="/dashboard/editor" className="sidebar-nav-link">
              <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5 shrink-0" aria-hidden="true">
                <path d="M1 8a7 7 0 1014 0A7 7 0 001 8z" stroke="currentColor" strokeWidth="1.25"/>
                <path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
              </svg>
              Editorial Inbox
            </Link>
            <Link href="/dashboard/editor/issues" className="sidebar-nav-link">
              <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5 shrink-0" aria-hidden="true">
                <path d="M2 2h12v12H2z" stroke="currentColor" strokeWidth="1.25"/>
                <path d="M5 7h6M5 10h4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
              </svg>
              Issues
            </Link>
            <Link href="/dashboard/editor/reviewers" className="sidebar-nav-link">
              <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5 shrink-0" aria-hidden="true">
                <circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.25"/>
                <path d="M1 13c0-2.761 2.239-4 5-4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
                <path d="M11 8v6M8 11h6" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
              </svg>
              Users & Roles
            </Link>
            <Link href="/dashboard/editor/board" className="sidebar-nav-link">Board</Link>
            <Link href="/dashboard/editor/pages" className="sidebar-nav-link">Pages (CMS)</Link>
            <Link href="/dashboard/editor/announcements" className="sidebar-nav-link">Announcements</Link>
            <Link href="/dashboard/editor/settings" className="sidebar-nav-link">Settings</Link>
          </div>
        )}

        <div className="mt-auto border-t border-paper/10 pb-4 pt-4">
          <div className="px-4 pb-3">
            <p className="text-sm font-medium text-paper/90">{user.name}</p>
            <p className="text-xs text-paper/50">{user.email}</p>
          </div>
          <Link href="/dashboard/profile" className="sidebar-nav-link">
            Profile
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="sidebar-nav-link w-full text-left">
              Sign out
            </button>
          </form>
        </div>
      </nav>

      {/* Content */}
      <div className="dashboard-content">
        {children}
      </div>
    </div>
  );
}
