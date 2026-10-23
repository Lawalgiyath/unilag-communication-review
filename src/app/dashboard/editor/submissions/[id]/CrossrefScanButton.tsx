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
          setMessage(`Potential match found (${Math.round((res.highestSimilarity ?? 0) * 100)}% similarity). Flagged below.`);
        } else {
          setMessage(`Clean scan: No duplicate title found on Crossref (${Math.round((res.highestSimilarity ?? 0) * 100)}% max similarity).`);
        }
      } else {
        setMessage(res.error ?? "Scan failed. Please try again.");
      }
    } catch {
      setMessage("Error contacting Crossref API.");
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
        {loading ? "Scanning Crossref..." : "🔍 Scan Crossref Duplicates"}
      </button>
      {message && (
        <p className="text-[11px] leading-tight text-gray-600 bg-gray-50 p-1.5 rounded border border-gray-200">
          {message}
        </p>
      )}
    </div>
  );
}
