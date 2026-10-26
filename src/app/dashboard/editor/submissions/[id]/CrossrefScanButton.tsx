"use client";

import { useState } from "react";
import { runCrossrefScanAction } from "./actions";

export function CrossrefScanButton({ submissionId }: { submissionId: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleScan() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await runCrossrefScanAction(submissionId);
      if (res.success) {
        if (res.foundDuplicate) {
          setMessage(
            `Potential duplicate found (${Math.round(
              (res.highestSimilarity ?? 0) * 100
            )}% similarity). Flagged in submission events below.`
          );
        } else {
          setMessage(
            `Clean scan: No duplicate title found across Crossref, OpenAlex, and Europe PMC (${Math.round(
              (res.highestSimilarity ?? 0) * 100
            )}% max similarity).`
          );
        }
      } else {
        setMessage(res.error ?? "Scan failed. Please try again.");
      }
    } catch {
      setMessage("Error contacting scholarly indexing APIs.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={handleScan}
        disabled={loading}
        className="btn btn-secondary btn-sm w-full text-xs"
      >
        {loading
          ? "Scanning Crossref, OpenAlex, Europe PMC…"
          : "🔍 Multi-Index Scholarly Scan"}
      </button>
      {message && (
        <p className="text-[11px] leading-tight text-gray-600 bg-gray-50 p-1.5 rounded border border-gray-200">
          {message}
        </p>
      )}
    </div>
  );
}
