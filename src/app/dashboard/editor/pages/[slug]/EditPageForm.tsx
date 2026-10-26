"use client";

import { useState, useTransition, useActionState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updatePageAction, revertPageAction } from "./action";
import type { PageState } from "./action";

const initialState: PageState = {};

interface PageRev {
  id: string;
  title: string;
  body: string;
  createdAt: Date;
}

export default function EditPageForm({
  pageId,
  slug,
  title,
  body,
  revisions,
}: {
  pageId: string;
  slug: string;
  title: string;
  body: string;
  revisions?: PageRev[];
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<PageState, FormData>(
    updatePageAction,
    initialState
  );
  const [isReverting, startRevertTransition] = useTransition();
  const [revertMessage, setRevertMessage] = useState<string | null>(null);
  const [revertError, setRevertError] = useState<string | null>(null);

  // Markdown image inserter helper
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showImgHelper, setShowImgHelper] = useState(false);
  const [imgUrl, setImgUrl] = useState("");
  const [imgAlt, setImgAlt] = useState("");

  function handleInsertImage() {
    if (!imgUrl.trim()) return;
    const alt = imgAlt.trim() || "Image";
    const snippet = `\n![${alt}](${imgUrl.trim()})\n`;

    const textarea = textareaRef.current;
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
    setImgUrl("");
    setImgAlt("");
    setShowImgHelper(false);
  }

  function handleRevert(revisionId: string) {
    if (!pageId) return;
    if (
      !confirm(
        "Are you sure you want to revert to this previous edit? Your current changes will be saved as a revision."
      )
    ) {
      return;
    }

    setRevertMessage(null);
    setRevertError(null);

    startRevertTransition(async () => {
      const res = await revertPageAction(pageId, revisionId);
      if (res.success) {
        setRevertMessage("Page successfully reverted to previous edit.");
        router.refresh();
      } else {
        setRevertError(res.error || "Failed to revert page.");
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
        <input type="hidden" name="slug" value={slug} />

        <div className="field">
          <label htmlFor="title" className="field-label">
            Page title <span aria-hidden="true" className="text-error">*</span>
          </label>
          <input
            id="title"
            type="text"
            name="title"
            defaultValue={title}
            required
            aria-invalid={!!state.errors?.title}
          />
          {state.errors?.title && (
            <span className="field-error">{state.errors.title[0]}</span>
          )}
        </div>

        <div className="field">
          <div className="flex items-center justify-between mb-1">
            <div>
              <label htmlFor="body" className="field-label mb-0">
                Page content (Markdown){" "}
                <span aria-hidden="true" className="text-error">
                  *
                </span>
              </label>
              <span className="field-hint text-xs block mt-0.5">
                Markdown headings (##), lists (- item), links ([text](url)), bold (**text**), and images (![caption](url)).
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowImgHelper(!showImgHelper)}
              className="btn btn-ghost btn-sm text-xs py-1 px-2.5 h-auto text-maroon hover:bg-maroon/10 shrink-0"
            >
              + Add Picture into Content
            </button>
          </div>

          {showImgHelper && (
            <div className="mb-3 p-3 bg-surface border border-hairline rounded shadow-sm space-y-2">
              <span className="text-xs font-semibold text-ink block">
                Add Picture / Figure Markdown Tag
              </span>
              <div className="grid gap-2 sm:grid-cols-[2fr_1fr_auto]">
                <input
                  type="text"
                  placeholder="Image URL (e.g. /images/... or https://...)"
                  value={imgUrl}
                  onChange={(e) => setImgUrl(e.target.value)}
                  className="text-xs py-1 px-2"
                />
                <input
                  type="text"
                  placeholder="Caption / Alt text"
                  value={imgAlt}
                  onChange={(e) => setImgAlt(e.target.value)}
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
            ref={textareaRef}
            id="body"
            name="body"
            rows={20}
            defaultValue={body}
            required
            aria-invalid={!!state.errors?.body}
            className="font-mono text-sm"
            style={{ minHeight: "480px" }}
          />
          {state.errors?.body && (
            <span className="field-error">{state.errors.body[0]}</span>
          )}
        </div>

        <div className="flex justify-between items-center pt-2">
          <Link href="/dashboard/editor/pages" className="btn btn-secondary">
            ← Cancel
          </Link>
          <button
            type="submit"
            disabled={pending || isReverting}
            className="btn btn-primary"
            aria-busy={pending || isReverting}
          >
            {pending ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>

      {/* Revision History: Up to 2 previous edits */}
      {revisions && revisions.length > 0 && (
        <section
          aria-labelledby="page-revisions-heading"
          className="mt-10 pt-6 border-t border-hairline"
        >
          <div className="mb-4">
            <h2
              id="page-revisions-heading"
              className="text-sm font-semibold uppercase tracking-wider text-secondary"
            >
              Previous Edits (Revert up to 2 past versions)
            </h2>
            <p className="text-xs text-secondary mt-0.5">
              Restore earlier versions of this page's content if needed.
            </p>
          </div>

          <div className="space-y-3">
            {revisions.map((rev, idx) => (
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
