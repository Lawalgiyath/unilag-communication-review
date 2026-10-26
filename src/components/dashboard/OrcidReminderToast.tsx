"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "unilag_orcid_toast_dismissed";
const COOLDOWN_DAYS = 3;

export function OrcidReminderToast({
  user,
}: {
  user: {
    orcid?: string | null;
    name: string;
  };
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // If the researcher already has an ORCID linked, never show
    if (user.orcid && user.orcid.trim()) {
      return;
    }

    try {
      const dismissedAt = localStorage.getItem(STORAGE_KEY);
      if (dismissedAt) {
        const diffDays =
          (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
        if (diffDays < COOLDOWN_DAYS) {
          return;
        }
      }

      // Delay slightly for smooth page entrance
      const timer = setTimeout(() => {
        setVisible(true);
      }, 1500);

      return () => clearTimeout(timer);
    } catch {
      // LocalStorage unavailable
    }
  }, [user.orcid]);

  function handleDismiss() {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
    } catch {
      // ignore
    }
  }

  if (!visible) return null;

  return (
    <aside
      aria-label="ORCID profile recommendation"
      className="fixed bottom-5 right-5 z-50 max-w-sm rounded-lg border border-hairline bg-white p-4 shadow-xl ring-1 ring-black/5 animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* ORCID Green Icon */}
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#a6ce39] text-xs font-bold text-white shadow-xs">
            iD
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink">
              Connect your ORCID iD
            </h4>
            <p className="text-[11px] text-secondary">Scholarly Identity Recommendation</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="text-secondary hover:text-ink -mr-1 -mt-1 p-1 text-base leading-none"
          title="Dismiss notification"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>

      <p className="mt-2.5 text-xs text-secondary leading-relaxed">
        Dear <strong>{user.name.split(" ")[0]}</strong>, linking your ORCID iD to your account ensures all your accepted papers and peer reviews are verified and attributed to your international academic record.
      </p>

      <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-hairline pt-3">
        <button
          type="button"
          onClick={handleDismiss}
          className="text-xs text-secondary hover:text-ink hover:underline"
        >
          Remind me later
        </button>

        <Link
          href="/dashboard/profile"
          onClick={handleDismiss}
          className="btn btn-primary text-xs py-1.5 px-3 h-auto"
        >
          Add ORCID →
        </Link>
      </div>
    </aside>
  );
}
