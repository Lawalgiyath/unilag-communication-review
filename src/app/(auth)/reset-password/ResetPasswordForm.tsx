"use client";

import { useActionState } from "react";
import Link from "next/link";
import { resetPasswordAction, type ResetPasswordState } from "./action";

const initialState: ResetPasswordState = {};

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState<ResetPasswordState, FormData>(
    resetPasswordAction,
    initialState
  );

  return (
    <form action={formAction} className="mt-6 space-y-4" noValidate>
      <input type="hidden" name="token" value={token} />

      {state.errors?.form && (
        <div className="alert alert-error" role="alert">
          {state.errors.form[0]}
        </div>
      )}

      <div className="field">
        <label htmlFor="reset-new-password" className="field-label">
          New password <span aria-hidden="true" className="text-error">*</span>
        </label>
        <input
          id="reset-new-password"
          type="password"
          name="password"
          autoComplete="new-password"
          required
          aria-invalid={!!state.errors?.password}
          aria-describedby={state.errors?.password ? "pw-err" : "pw-hint"}
        />
        {state.errors?.password && (
          <span id="pw-err" className="field-error">
            {state.errors.password[0]}
          </span>
        )}
        <span id="pw-hint" className="field-hint">
          At least 8 characters
        </span>
      </div>

      <div className="field">
        <label htmlFor="reset-confirm-password" className="field-label">
          Confirm new password <span aria-hidden="true" className="text-error">*</span>
        </label>
        <input
          id="reset-confirm-password"
          type="password"
          name="confirmPassword"
          autoComplete="new-password"
          required
          aria-invalid={!!state.errors?.confirmPassword}
          aria-describedby={state.errors?.confirmPassword ? "cpw-err" : undefined}
        />
        {state.errors?.confirmPassword && (
          <span id="cpw-err" className="field-error">
            {state.errors.confirmPassword[0]}
          </span>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="btn btn-primary w-full"
        aria-busy={pending}
      >
        {pending ? "Updating password…" : "Update password"}
      </button>

      <p className="mt-4 text-center text-sm text-secondary">
        <Link href="/login" className="font-semibold text-maroon hover:underline">
          Cancel and return to sign in
        </Link>
      </p>
    </form>
  );
}
