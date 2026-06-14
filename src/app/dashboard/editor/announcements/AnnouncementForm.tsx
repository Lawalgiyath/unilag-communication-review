"use client";

import { useActionState } from "react";
import Link from "next/link";
import { saveAnnouncementAction } from "./actions";
import type { AnnouncementState } from "./actions";

const initialState: AnnouncementState = {};

export default function AnnouncementForm({
  announcement,
}: {
  announcement?: {
    id: string;
    title: string;
    body: string;
    kind: string;
    publishedAt: Date | null;
  };
}) {
  const [state, formAction, pending] = useActionState<AnnouncementState, FormData>(saveAnnouncementAction, initialState);

  const pubDateStr = announcement?.publishedAt
    ? announcement.publishedAt.toISOString().slice(0, 16) // yyyy-MM-ddThh:mm
    : "";

  return (
    <form action={formAction} className="space-y-6">
      {announcement && <input type="hidden" name="id" value={announcement.id} />}

      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <div className="field">
          <label htmlFor="title" className="field-label">Title <span aria-hidden="true" className="text-error">*</span></label>
          <input id="title" type="text" name="title" defaultValue={announcement?.title} required aria-invalid={!!state.errors?.title} />
          {state.errors?.title && <span className="field-error">{state.errors.title[0]}</span>}
        </div>
        <div className="field">
          <label htmlFor="kind" className="field-label">Type <span aria-hidden="true" className="text-error">*</span></label>
          <select id="kind" name="kind" defaultValue={announcement?.kind ?? "NEWS"} required>
            <option value="NEWS">News</option>
            <option value="CALL_FOR_PAPERS">Call for Papers</option>
          </select>
        </div>
      </div>

      <div className="field">
        <label htmlFor="body" className="field-label">Content (Markdown) <span aria-hidden="true" className="text-error">*</span></label>
        <textarea
          id="body"
          name="body"
          rows={15}
          defaultValue={announcement?.body}
          required
          aria-invalid={!!state.errors?.body}
          className="font-mono text-sm"
          style={{ minHeight: "400px" }}
        />
        {state.errors?.body && <span className="field-error">{state.errors.body[0]}</span>}
      </div>

      <div className="field border border-hairline p-4">
        <label htmlFor="publishedAt" className="field-label">Publish date/time <span className="font-normal text-secondary">(optional)</span></label>
        <span className="field-hint">Leave blank to keep as draft. Set a future date to schedule publication.</span>
        <input id="publishedAt" type="datetime-local" name="publishedAt" defaultValue={pubDateStr} className="w-auto mt-2" />
      </div>

      <div className="flex justify-between">
        <Link href="/dashboard/editor/announcements" className="btn btn-secondary">← Cancel</Link>
        <button type="submit" disabled={pending} className="btn btn-primary" aria-busy={pending}>
          {pending ? "Saving…" : "Save Announcement"}
        </button>
      </div>
    </form>
  );
}
