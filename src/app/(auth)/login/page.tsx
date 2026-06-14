"use client";

import { useActionState, use } from "react";
import Link from "next/link";
import { loginAction } from "./action";
import type { LoginState } from "./action";

const initialState: LoginState = {};

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(loginAction, initialState);
  const sp = use(searchParams);
  const next = sp?.next ?? "";

  return (
    <div className="border border-hairline bg-white p-8">
      <h1 className="font-display text-2xl font-semibold text-ink">
        Sign in
      </h1>
      <p className="mt-1 text-sm text-secondary">
        Access your author, reviewer, or editor dashboard.
      </p>

      {state.errors?.form && (
        <div className="alert alert-error mt-5" role="alert">
          {state.errors.form[0]}
        </div>
      )}

      <form action={formAction} className="mt-6 space-y-4" noValidate>
        <input type="hidden" name="next" value={next} />

        <div className="field">
          <label htmlFor="login-email" className="field-label">Email address</label>
          <input
            id="login-email"
            type="email"
            name="email"
            autoComplete="email"
            required
            aria-invalid={!!state.errors?.email}
            aria-describedby={state.errors?.email ? "email-err" : undefined}
          />
          {state.errors?.email && (
            <span id="email-err" className="field-error">{state.errors.email[0]}</span>
          )}
        </div>

        <div className="field">
          <div className="flex items-center justify-between">
            <label htmlFor="login-password" className="field-label">Password</label>
            <Link href="/forgot-password" className="text-xs text-maroon hover:underline">
              Forgot password?
            </Link>
          </div>
          <input
            id="login-password"
            type="password"
            name="password"
            autoComplete="current-password"
            required
            aria-invalid={!!state.errors?.password}
            aria-describedby={state.errors?.password ? "pw-err" : undefined}
          />
          {state.errors?.password && (
            <span id="pw-err" className="field-error">{state.errors.password[0]}</span>
          )}
        </div>

        <button
          type="submit"
          disabled={pending}
          className="btn btn-primary w-full"
          aria-busy={pending}
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-secondary">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-semibold text-maroon hover:underline">
          Register
        </Link>
      </p>
    </div>
  );
}
