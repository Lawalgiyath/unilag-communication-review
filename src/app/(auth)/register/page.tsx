"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction } from "./action";
import type { RegisterState } from "./action";

const initialState: RegisterState = {};

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerAction, initialState);

  return (
    <div className="border border-hairline bg-white p-8">
      <h1 className="font-display text-2xl font-semibold text-ink">
        Create an account
      </h1>
      <p className="mt-1 text-sm text-secondary">
        Register to submit manuscripts to {" "}
        <span className="font-medium">UNILAG Communication Review</span>.
      </p>

      <form action={formAction} className="mt-6 space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="field">
            <label htmlFor="reg-name" className="field-label">Full name <span aria-hidden="true" className="text-error">*</span></label>
            <input id="reg-name" type="text" name="name" autoComplete="name" required
              aria-invalid={!!state.errors?.name} aria-describedby={state.errors?.name ? "name-err" : undefined} />
            {state.errors?.name && <span id="name-err" className="field-error">{state.errors.name[0]}</span>}
          </div>
          <div className="field">
            <label htmlFor="reg-title" className="field-label">Title <span className="text-secondary font-normal">(optional)</span></label>
            <select id="reg-title" name="title">
              <option value="">None</option>
              <option value="Prof.">Prof.</option>
              <option value="Dr.">Dr.</option>
              <option value="Mr.">Mr.</option>
              <option value="Mrs.">Mrs.</option>
              <option value="Ms.">Ms.</option>
            </select>
          </div>
        </div>

        <div className="field">
          <label htmlFor="reg-affiliation" className="field-label">Institution / Affiliation <span aria-hidden="true" className="text-error">*</span></label>
          <input id="reg-affiliation" type="text" name="affiliation" autoComplete="organization" required
            aria-invalid={!!state.errors?.affiliation} />
          {state.errors?.affiliation && <span className="field-error">{state.errors.affiliation[0]}</span>}
        </div>

        <div className="field">
          <label htmlFor="reg-orcid" className="field-label">
            ORCID <span className="text-secondary font-normal">(optional)</span>
          </label>
          <input id="reg-orcid" type="text" name="orcid" placeholder="0000-0000-0000-0000" aria-invalid={!!state.errors?.orcid} />
          {state.errors?.orcid && <span className="field-error">{state.errors.orcid[0]}</span>}
        </div>

        <div className="field">
          <label htmlFor="reg-email" className="field-label">Email address <span aria-hidden="true" className="text-error">*</span></label>
          <input id="reg-email" type="email" name="email" autoComplete="email" required
            aria-invalid={!!state.errors?.email} />
          {state.errors?.email && <span className="field-error">{state.errors.email[0]}</span>}
        </div>

        <div className="field">
          <label htmlFor="reg-password" className="field-label">Password <span aria-hidden="true" className="text-error">*</span></label>
          <input id="reg-password" type="password" name="password" autoComplete="new-password" required
            aria-invalid={!!state.errors?.password} />
          {state.errors?.password && <span className="field-error">{state.errors.password[0]}</span>}
          <span className="field-hint">At least 8 characters</span>
        </div>

        <div className="field">
          <label htmlFor="reg-confirm" className="field-label">Confirm password <span aria-hidden="true" className="text-error">*</span></label>
          <input id="reg-confirm" type="password" name="confirmPassword" autoComplete="new-password" required
            aria-invalid={!!state.errors?.confirmPassword} />
          {state.errors?.confirmPassword && <span className="field-error">{state.errors.confirmPassword[0]}</span>}
        </div>

        <button type="submit" disabled={pending} className="btn btn-primary w-full" aria-busy={pending}>
          {pending ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-secondary">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-maroon hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
