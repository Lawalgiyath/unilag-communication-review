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

  let isExpired = false;
  if (token) {
    const resetToken = await db.passwordResetToken.findUnique({
      where: { token },
    });
    isExpired = !resetToken || resetToken.expiresAt < new Date();
  }

  return (
    <div className="border border-hairline bg-white p-8">
      <h1 className="font-display text-2xl font-semibold text-ink">
        Choose a new password
      </h1>
      <p className="mt-1 text-sm text-secondary">
        Enter the secure reset code sent to your email and choose your new password.
      </p>

      {isExpired && (
        <div className="alert alert-error mt-4">
          <span>
            The reset link in your URL has expired or is invalid. If you requested a newer code, please paste it into the box below or{" "}
            <Link href="/forgot-password" className="underline font-medium">
              request a new reset link
            </Link>
            .
          </span>
        </div>
      )}

      <ResetPasswordForm token={isExpired ? "" : (token ?? "")} />
    </div>
  );
}
