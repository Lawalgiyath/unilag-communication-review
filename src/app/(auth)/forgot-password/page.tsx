"use client";

import { useActionState } from "react";
import Link from "next/link";
import { forgotPasswordAction, type ForgotPasswordState } from "./action";

const initialState: ForgotPasswordState = {};

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState<ForgotPasswordState, FormData>(
    forgotPasswordAction,
    initialState
  );

  return (
    <div className="border border-hairline bg-white p-8">
      <h1 className="font-display text-2xl font-semibold text-ink">
        Reset your password
      </h1>
      <p className="mt-1 text-sm text-secondary">
        Enter the email address associated with your account, and we will send you a password reset link.
      </p>

      {state.success ? (
        <div className="mt-6 space-y-4">
          <div className="alert alert-success" role="status">
            <span>{state.message}</span>
          </div>

          {state.devResetUrl && (
            <div className="rounded border border-gold/60 bg-paper-dark p-4 text-xs">
              <p className="font-semibold text-gold-dark uppercase tracking-wider">
                Direct Reset Link (Local Testing):
              </p>
              <p className="mt-1 break-all text-secondary">
                <a
                  href={state.devResetUrl}
                  className="font-mono text-maroon underline hover:text-oxblood"
                >
                  {state.devResetUrl}
                </a>
              </p>
            </div>
          )}

          <p className="text-sm text-secondary">
            <Link href="/login" className="font-semibold text-maroon hover:underline">
              ← Return to sign in
            </Link>
          </p>
        </div>
      ) : (
        <form action={formAction} className="mt-6 space-y-4" noValidate>
          <div className="field">
            <label htmlFor="reset-email" className="field-label">
              Email address <span aria-hidden="true" className="text-error">*</span>
            </label>
            <input
              id="reset-email"
              type="email"
              name="email"
              autoComplete="email"
              required
              aria-invalid={!!state.errors?.email}
              aria-describedby={state.errors?.email ? "reset-email-err" : undefined}
            />
            {state.errors?.email && (
              <span id="reset-email-err" className="field-error">
                {state.errors.email[0]}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={pending}
            className="btn btn-primary w-full"
            aria-busy={pending}
          >
            {pending ? "Sending link…" : "Send password reset link"}
          </button>

          <p className="mt-4 text-center text-sm text-secondary">
            Remember your password?{" "}
            <Link href="/login" className="font-semibold text-maroon hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}
