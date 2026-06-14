"use client";

import { useActionState } from "react";
import Link from "next/link";
import { saveBoardMemberAction } from "./actions";
import type { BoardMemberState } from "./actions";

const initialState: BoardMemberState = {};

export default function BoardForm({
  member,
}: {
  member?: {
    id: string;
    name: string;
    role: string;
    affiliation: string;
    orcid: string | null;
    order: number;
  };
}) {
  const [state, formAction, pending] = useActionState<BoardMemberState, FormData>(saveBoardMemberAction, initialState);

  return (
    <form action={formAction} className="space-y-6">
      {member && <input type="hidden" name="id" value={member.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="field">
          <label htmlFor="name" className="field-label">Name <span aria-hidden="true" className="text-error">*</span></label>
          <input id="name" type="text" name="name" defaultValue={member?.name} required aria-invalid={!!state.errors?.name} />
          {state.errors?.name && <span className="field-error">{state.errors.name[0]}</span>}
        </div>
        <div className="field">
          <label htmlFor="role" className="field-label">Role <span aria-hidden="true" className="text-error">*</span></label>
          <input id="role" type="text" name="role" defaultValue={member?.role} placeholder="e.g. Editor-in-Chief" required aria-invalid={!!state.errors?.role} />
          {state.errors?.role && <span className="field-error">{state.errors.role[0]}</span>}
        </div>
      </div>

      <div className="field">
        <label htmlFor="affiliation" className="field-label">Affiliation <span aria-hidden="true" className="text-error">*</span></label>
        <input id="affiliation" type="text" name="affiliation" defaultValue={member?.affiliation} required aria-invalid={!!state.errors?.affiliation} />
        {state.errors?.affiliation && <span className="field-error">{state.errors.affiliation[0]}</span>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="field">
          <label htmlFor="orcid" className="field-label">ORCID <span className="font-normal text-secondary">(optional)</span></label>
          <input id="orcid" type="text" name="orcid" defaultValue={member?.orcid ?? ""} placeholder="0000-0000-0000-0000" aria-invalid={!!state.errors?.orcid} />
          {state.errors?.orcid && <span className="field-error">{state.errors.orcid[0]}</span>}
        </div>
        <div className="field">
          <label htmlFor="order" className="field-label">Display Order <span aria-hidden="true" className="text-error">*</span></label>
          <span className="field-hint">Lower numbers appear first on the public site.</span>
          <input id="order" type="number" name="order" defaultValue={member?.order ?? 10} min={0} required aria-invalid={!!state.errors?.order} />
          {state.errors?.order && <span className="field-error">{state.errors.order[0]}</span>}
        </div>
      </div>

      <div className="flex justify-between">
        <Link href="/dashboard/editor/board" className="btn btn-secondary">← Cancel</Link>
        <button type="submit" disabled={pending} className="btn btn-primary" aria-busy={pending}>
          {pending ? "Saving…" : "Save Member"}
        </button>
      </div>
    </form>
  );
}
