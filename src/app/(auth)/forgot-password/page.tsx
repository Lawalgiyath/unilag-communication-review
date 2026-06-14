import type { Metadata } from "next";
import Link from "next/link";
import { JOURNAL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Forgot Password",
};

export default function ForgotPasswordPage() {
  return (
    <div className="border border-hairline bg-white p-8">
      <h1 className="font-display text-2xl font-semibold text-ink">
        Reset your password
      </h1>
      <div className="alert alert-info mt-5">
        <span>
          To reset your password, please contact the journal office directly at{" "}
          <a href={`mailto:${JOURNAL.contactEmail}`} className="font-semibold underline">
            {JOURNAL.contactEmail}
          </a>{" "}
          with your registered email address. We will respond within 2 working days.
        </span>
      </div>
      <p className="mt-5 text-sm text-secondary">
        <Link href="/login" className="font-semibold text-maroon hover:underline">
          ← Back to sign in
        </Link>
      </p>
    </div>
  );
}
