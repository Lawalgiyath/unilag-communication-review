"use client";

import { useEffect } from "react";

/**
 * Fires a view-count beacon once per page load. Client-side so that
 * non-JS crawlers don't inflate counts; server dedupes per visitor per day.
 */
export function ViewBeacon({ articleId }: { articleId: string }) {
  useEffect(() => {
    fetch(`/api/articles/${articleId}/view`, {
      method: "POST",
      keepalive: true,
    }).catch(() => {});
  }, [articleId]);
  return null;
}
