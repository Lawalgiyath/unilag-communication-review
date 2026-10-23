import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata: Metadata = {
  title: "Set New Password",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="border border-hairline bg-white p-8">
        <h1 className="font-display text-2xl font-semibold text-ink">
          Invalid Reset Link
        </h1>
        <div className="alert alert-error mt-4">
          <span>No password reset token was provided.</span>
        </div>
        <p className="mt-5 text-sm text-secondary">
          <Link
            href="/forgot-password"
            className="font-semibold text-maroon hover:underline"
          >
            ← Request a new password reset link
          </Link>
        </p>
      </div>
    );
  }

  const resetToken = await db.passwordResetToken.findUnique({
    where: { token },
  });

  const isExpired = !resetToken || resetToken.expiresAt < new Date();

  if (isExpired) {
    return (
      <div className="border border-hairline bg-white p-8">
        <h1 className="font-display text-2xl font-semibold text-ink">
          Expired or Invalid Link
        </h1>
        <div className="alert alert-error mt-4">
          <span>
            This password reset link is invalid or has expired. Password reset links are valid for one hour for security.
          </span>
        </div>
        <p className="mt-5 text-sm text-secondary">
          <Link
            href="/forgot-password"
            className="font-semibold text-maroon hover:underline"
          >
            ← Request a new password reset link
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="border border-hairline bg-white p-8">
      <h1 className="font-display text-2xl font-semibold text-ink">
        Choose a new password
      </h1>
      <p className="mt-1 text-sm text-secondary">
        Please enter and confirm your new password below.
      </p>

      <ResetPasswordForm token={token} />
    </div>
  );
}
