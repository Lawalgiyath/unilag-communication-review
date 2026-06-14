"use client";

import { useActionState } from "react";
import Link from "next/link";
import { updatePageAction } from "./action";
import type { PageState } from "./action";

const initialState: PageState = {};

export default function EditPageForm({
  slug,
  title,
  body,
}: {
  slug: string;
  title: string;
  body: string;
}) {
  const [state, formAction, pending] = useActionState<PageState, FormData>(updatePageAction, initialState);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="slug" value={slug} />

      <div className="field">
        <label htmlFor="title" className="field-label">Page title <span aria-hidden="true" className="text-error">*</span></label>
        <input id="title" type="text" name="title" defaultValue={title} required aria-invalid={!!state.errors?.title} />
        {state.errors?.title && <span className="field-error">{state.errors.title[0]}</span>}
      </div>

      <div className="field">
        <label htmlFor="body" className="field-label">Page content (Markdown) <span aria-hidden="true" className="text-error">*</span></label>
        <span className="field-hint">You can use Markdown for headings (##), lists (- item), links ([text](url)), and bold (**text**).</span>
        <textarea
          id="body"
          name="body"
          rows={20}
          defaultValue={body}
          required
          aria-invalid={!!state.errors?.body}
          className="font-mono text-sm"
          style={{ minHeight: "500px" }}
        />
        {state.errors?.body && <span className="field-error">{state.errors.body[0]}</span>}
      </div>

      <div className="flex justify-between">
        <Link href="/dashboard/editor/pages" className="btn btn-secondary">← Cancel</Link>
        <button type="submit" disabled={pending} className="btn btn-primary" aria-busy={pending}>
          {pending ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
