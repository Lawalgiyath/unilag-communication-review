"use client";

import { useState, useTransition, useActionState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveAnnouncementAction, revertAnnouncementAction } from "./actions";
import type { AnnouncementState } from "./actions";

const initialState: AnnouncementState = {};

interface Revision {
  id: string;
  title: string;
  body: string;
  imageUrl?: string | null;
  linkUrl?: string | null;
  linkText?: string | null;
  createdAt: Date;
}

export default function AnnouncementForm({
  announcement,
}: {
  announcement?: {
    id: string;
    title: string;
    body: string;
    kind: string;
    imageUrl?: string | null;
    linkUrl?: string | null;
    linkText?: string | null;
    publishedAt: Date | null;
    revisions?: Revision[];
  };
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<AnnouncementState, FormData>(
    saveAnnouncementAction,
    initialState
  );
  const [isReverting, startRevertTransition] = useTransition();
  const [revertMessage, setRevertMessage] = useState<string | null>(null);
  const [revertError, setRevertError] = useState<string | null>(null);

  // Markdown helper state
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [showImgHelper, setShowImgHelper] = useState(false);
  const [helperImgUrl, setHelperImgUrl] = useState("");
  const [helperImgAlt, setHelperImgAlt] = useState("");

  const pubDateStr = announcement?.publishedAt
    ? announcement.publishedAt.toISOString().slice(0, 16)
    : "";

  function handleInsertImage() {
    if (!helperImgUrl.trim()) return;
    const alt = helperImgAlt.trim() || "Image";
    const snippet = `\n![${alt}](${helperImgUrl.trim()})\n`;

    const textarea = bodyTextareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const current = textarea.value;
      const next = current.substring(0, start) + snippet + current.substring(end);
      textarea.value = next;
      textarea.focus();
      textarea.selectionStart = start + snippet.length;
      textarea.selectionEnd = start + snippet.length;
    }
    setHelperImgUrl("");
    setHelperImgAlt("");
    setShowImgHelper(false);
  }

  function handleRevert(revisionId: string) {
    if (!announcement?.id) return;
    if (
      !confirm(
        "Are you sure you want to revert to this previous edit? Your current content will be preserved as a revision."
      )
    ) {
      return;
    }

    setRevertMessage(null);
    setRevertError(null);

    startRevertTransition(async () => {
      const res = await revertAnnouncementAction(announcement.id, revisionId);
      if (res.success) {
        setRevertMessage("Announcement successfully reverted to previous edit.");
        router.refresh();
      } else {
        setRevertError(res.error || "Failed to revert announcement.");
      }
    });
  }

  return (
    <div className="space-y-8">
      {revertMessage && (
        <div className="alert alert-success">{revertMessage}</div>
      )}
      {revertError && <div className="alert alert-error">{revertError}</div>}

      <form action={formAction} className="space-y-6">
        {announcement && <input type="hidden" name="id" value={announcement.id} />}

        <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
          <div className="field">
            <label htmlFor="title" className="field-label">
              Title <span aria-hidden="true" className="text-error">*</span>
            </label>
            <input
              id="title"
              type="text"
              name="title"
              defaultValue={announcement?.title}
              required
              aria-invalid={!!state.errors?.title}
            />
            {state.errors?.title && (
              <span className="field-error">{state.errors.title[0]}</span>
            )}
          </div>
          <div className="field">
            <label htmlFor="kind" className="field-label">
              Type <span aria-hidden="true" className="text-error">*</span>
            </label>
            <select
              id="kind"
              name="kind"
              defaultValue={announcement?.kind ?? "NEWS"}
              required
            >
              <option value="NEWS">News</option>
              <option value="CALL_FOR_PAPERS">Call for Papers</option>
            </select>
          </div>
        </div>

        {/* Media & Link Attachments */}
        <div className="rounded-md border border-hairline bg-gray-50/60 p-4 space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-secondary">
            Attachments: Cover Image & Action Link
          </h3>

          <div className="field">
            <label htmlFor="imageUrl" className="field-label">
              Cover Image URL <span className="font-normal text-secondary">(optional)</span>
            </label>
            <span className="field-hint">
              Enter a web image link or public path (e.g. /images/articles/announcement-banner.jpg or https://...).
            </span>
            <input
              id="imageUrl"
              type="text"
              name="imageUrl"
              defaultValue={announcement?.imageUrl ?? ""}
              placeholder="https://example.com/images/announcement.jpg"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="field">
              <label htmlFor="linkUrl" className="field-label">
                Link URL <span className="font-normal text-secondary">(optional)</span>
              </label>
              <span className="field-hint">e.g. https://forms.gle/... or /call-for-papers</span>
              <input
                id="linkUrl"
                type="text"
                name="linkUrl"
                defaultValue={announcement?.linkUrl ?? ""}
                placeholder="https://example.com/call-for-papers"
              />
            </div>

            <div className="field">
              <label htmlFor="linkText" className="field-label">
                Link Button Text <span className="font-normal text-secondary">(optional)</span>
              </label>
              <span className="field-hint">e.g. "View Call for Papers" or "Learn More"</span>
              <input
                id="linkText"
                type="text"
                name="linkText"
                defaultValue={announcement?.linkText ?? ""}
                placeholder="Learn More →"
              />
            </div>
          </div>
        </div>

        {/* Markdown Content */}
        <div className="field">
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="body" className="field-label mb-0">
              Content (Markdown) <span aria-hidden="true" className="text-error">*</span>
            </label>
            <button
              type="button"
              onClick={() => setShowImgHelper(!showImgHelper)}
              className="btn btn-ghost btn-sm text-xs py-1 px-2.5 h-auto text-maroon hover:bg-maroon/10"
            >
              + Insert Picture into Content
            </button>
          </div>

          {showImgHelper && (
            <div className="mb-3 p-3 bg-surface border border-hairline rounded shadow-sm space-y-2">
              <span className="text-xs font-semibold text-ink block">Insert Picture Markdown Tag</span>
              <div className="grid gap-2 sm:grid-cols-[2fr_1fr_auto]">
                <input
                  type="text"
                  placeholder="Image URL (https://... or /images/...)"
                  value={helperImgUrl}
                  onChange={(e) => setHelperImgUrl(e.target.value)}
                  className="text-xs py-1 px-2"
                />
                <input
                  type="text"
                  placeholder="Alt text / Caption"
                  value={helperImgAlt}
                  onChange={(e) => setHelperImgAlt(e.target.value)}
                  className="text-xs py-1 px-2"
                />
                <button
                  type="button"
                  onClick={handleInsertImage}
                  className="btn btn-primary text-xs py-1 px-3 h-auto"
                >
                  Insert
                </button>
              </div>
            </div>
          )}

          <textarea
            ref={bodyTextareaRef}
            id="body"
            name="body"
            rows={15}
            defaultValue={announcement?.body}
            required
            aria-invalid={!!state.errors?.body}
            className="font-mono text-sm"
            style={{ minHeight: "380px" }}
          />
          {state.errors?.body && (
            <span className="field-error">{state.errors.body[0]}</span>
          )}
        </div>

        <div className="field border border-hairline p-4">
          <label htmlFor="publishedAt" className="field-label">
            Publish date/time <span className="font-normal text-secondary">(optional)</span>
          </label>
          <span className="field-hint">
            Leave blank to keep as draft. Set a future date to schedule publication.
          </span>
          <input
            id="publishedAt"
            type="datetime-local"
            name="publishedAt"
            defaultValue={pubDateStr}
            className="w-auto mt-2"
          />
        </div>

        <div className="flex justify-between items-center pt-2">
          <Link href="/dashboard/editor/announcements" className="btn btn-secondary">
            ← Cancel
          </Link>
          <button
            type="submit"
            disabled={pending || isReverting}
            className="btn btn-primary"
            aria-busy={pending || isReverting}
          >
            {pending ? "Saving…" : "Save Announcement"}
          </button>
        </div>
      </form>

      {/* Revision History: Up to 2 previous edits */}
      {announcement?.revisions && announcement.revisions.length > 0 && (
        <section
          aria-labelledby="revisions-heading"
          className="mt-10 pt-6 border-t border-hairline"
        >
          <div className="mb-4">
            <h2
              id="revisions-heading"
              className="text-sm font-semibold uppercase tracking-wider text-secondary"
            >
              Previous Edits (Revert up to 2 past versions)
            </h2>
            <p className="text-xs text-secondary mt-0.5">
              You can restore any of your 2 most recent previous edits at any time.
            </p>
          </div>

          <div className="space-y-3">
            {announcement.revisions.map((rev, idx) => (
              <div
                key={rev.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-md border border-hairline bg-white shadow-xs gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="badge badge-neutral text-xs">
                      Version -{idx + 1}
                    </span>
                    <span className="text-xs font-mono text-secondary">
                      {new Date(rev.createdAt).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                  <h4 className="font-semibold text-sm text-ink mt-1">
                    {rev.title}
                  </h4>
                  <p className="text-xs text-secondary line-clamp-2 mt-0.5 max-w-xl">
                    {rev.body}
                  </p>
                  {(rev.imageUrl || rev.linkUrl) && (
                    <div className="mt-1 flex gap-3 text-[11px] text-secondary">
                      {rev.imageUrl && <span>Has Image</span>}
                      {rev.linkUrl && <span>Has Link ({rev.linkUrl})</span>}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleRevert(rev.id)}
                  disabled={isReverting}
                  className="btn btn-outline btn-sm whitespace-nowrap self-start sm:self-auto"
                >
                  {isReverting ? "Reverting…" : "Revert to This Version"}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
