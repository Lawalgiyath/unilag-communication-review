"use client";

import { useState, useTransition, useActionState } from "react";
import {
  updateProfileAction,
  updatePasswordAction,
  requestPasswordResetEmailAction,
  verifyOrcidLiveAction,
  requestAccountDeletionAction,
} from "./actions";
import type { ProfileState, PasswordState } from "./actions";
import { InstitutionalBadge } from "@/components/common/InstitutionalBadge";
import type { OrcidVerificationResult } from "@/lib/orcid";

export { ProfilePageClient as default };

function ProfilePageClient({
  user,
}: {
  user: {
    name: string;
    title: string | null;
    affiliation: string | null;
    orcid: string | null;
    bio?: string | null;
    country?: string | null;
    email: string;
  };
}) {
  const [profileState, profileAction, profilePending] = useActionState<
    ProfileState,
    FormData
  >(updateProfileAction, {});
  const [pwState, pwAction, pwPending] = useActionState<PasswordState, FormData>(
    updatePasswordAction,
    {}
  );
  const [resetEmailState, setResetEmailState] = useState<{
    loading: boolean;
    message?: string;
    error?: string;
  }>({ loading: false });

  // Live ORCID check state
  const [currentName, setCurrentName] = useState(user.name);
  const [currentOrcid, setCurrentOrcid] = useState(user.orcid ?? "");
  const [orcidCheckResult, setOrcidCheckResult] = useState<OrcidVerificationResult | null>(
    user.orcid
      ? {
          valid: true,
          cleanOrcid: user.orcid,
          orcidName: "Linked ORCID iD",
        }
      : null
  );
  const [isCheckingOrcid, startOrcidCheck] = useTransition();

  // Deletion state
  const [isDeletingAccount, startDeleteAccount] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function handleLiveOrcidVerify() {
    if (!currentOrcid.trim()) {
      setOrcidCheckResult(null);
      return;
    }
    startOrcidCheck(async () => {
      const res = await verifyOrcidLiveAction(currentOrcid, currentName);
      setOrcidCheckResult(res);
    });
  }

  async function handleRequestResetEmail() {
    setResetEmailState({ loading: true });
    try {
      const res = await requestPasswordResetEmailAction();
      if (res.success) {
        setResetEmailState({ loading: false, message: res.message });
      } else {
        setResetEmailState({
          loading: false,
          error: res.error ?? "Failed to send reset email",
        });
      }
    } catch {
      setResetEmailState({ loading: false, error: "An unexpected error occurred" });
    }
  }

  function handleDeleteAccount() {
    if (
      !confirm(
        "Are you sure you want to delete your account?\n\nSafety Guarantee: Your account will not be immediately deleted. It is safely retained for 30 days. You can cancel deletion and restore your account at any time simply by signing back in within 30 days."
      )
    ) {
      return;
    }

    setDeleteError(null);
    startDeleteAccount(async () => {
      const res = await requestAccountDeletionAction();
      if (res && !res.success) {
        setDeleteError(res.error || "Failed to schedule account deletion.");
      }
    });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <div className="page-subtitle flex items-center gap-2 mt-1">
            <span>{user.email}</span>
            <InstitutionalBadge email={user.email} />
          </div>
        </div>
      </div>

      {/* Profile form */}
      <section aria-labelledby="profile-heading" className="mb-10">
        <h2
          id="profile-heading"
          className="section-label border-b border-hairline pb-2 mb-5"
        >
          Personal information
        </h2>

        {profileState.success && (
          <div className="alert alert-success mb-4">
            Profile updated successfully.
            {profileState.orcidVerified && (
              <span className="block mt-1 font-semibold text-xs">
                ORCID iD verified and linked to your publications.
              </span>
            )}
            {profileState.orcidWarning && (
              <span className="block mt-1 text-xs text-secondary">
                {profileState.orcidWarning}
              </span>
            )}
          </div>
        )}

        <form action={profileAction} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="field">
              <label htmlFor="p-name" className="field-label">
                Full name
              </label>
              <input
                id="p-name"
                type="text"
                name="name"
                defaultValue={user.name}
                onChange={(e) => setCurrentName(e.target.value)}
                required
                aria-invalid={!!profileState.errors?.name}
              />
              {profileState.errors?.name && (
                <span className="field-error">{profileState.errors.name[0]}</span>
              )}
            </div>
            <div className="field">
              <label htmlFor="p-title" className="field-label">
                Title
              </label>
              <select id="p-title" name="title" defaultValue={user.title ?? ""}>
                <option value="">None</option>
                {["Prof.", "Dr.", "Mr.", "Mrs.", "Ms."].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="p-affiliation" className="field-label">
              Institution / Affiliation
            </label>
            <input
              id="p-affiliation"
              type="text"
              name="affiliation"
              defaultValue={user.affiliation ?? ""}
              required
            />
            {profileState.errors?.affiliation && (
              <span className="field-error">
                {profileState.errors.affiliation[0]}
              </span>
            )}
          </div>

          {/* ORCID with Live Verification */}
          <div className="field">
            <div className="flex items-center justify-between">
              <label htmlFor="p-orcid" className="field-label mb-0">
                ORCID iD <span className="font-normal text-secondary">(optional)</span>
              </label>
              <button
                type="button"
                onClick={handleLiveOrcidVerify}
                disabled={isCheckingOrcid || !currentOrcid.trim()}
                className="text-xs font-semibold text-maroon hover:underline disabled:opacity-50"
              >
                {isCheckingOrcid ? "Checking registry…" : "Verify ORCID"}
              </button>
            </div>
            <span className="field-hint text-xs block mb-1.5">
              16-character identifier (e.g. 0000-0002-1825-0097). We verify that at least one of your names matches the ORCID record before linking.
            </span>
            <div className="relative">
              <input
                id="p-orcid"
                type="text"
                name="orcid"
                value={currentOrcid}
                onChange={(e) => {
                  setCurrentOrcid(e.target.value);
                  setOrcidCheckResult(null);
                }}
                placeholder="0000-0000-0000-0000"
              />
            </div>

            {/* Verification result feedback */}
            {orcidCheckResult && (
              <div className="mt-2 text-xs">
                {orcidCheckResult.valid ? (
                  <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-2">
                    <span className="font-bold text-emerald-600">✓ Verified:</span>
                    <div>
                      <span>
                        Linked to <strong>{orcidCheckResult.orcidName}</strong> (ID: {orcidCheckResult.cleanOrcid})
                      </span>
                      {orcidCheckResult.matchedNameToken && (
                        <span className="block text-[11px] text-emerald-700 mt-0.5">
                          Matched name token: "{orcidCheckResult.matchedNameToken}"
                        </span>
                      )}
                      {orcidCheckResult.warning && (
                        <span className="block text-[11px] text-amber-700 mt-0.5">
                          {orcidCheckResult.warning}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded bg-red-50 border border-red-200 text-red-800">
                    <span className="font-bold">Verification Failed: </span>
                    {orcidCheckResult.error}
                  </div>
                )}
              </div>
            )}

            {profileState.errors?.orcid && (
              <span className="field-error">{profileState.errors.orcid[0]}</span>
            )}
          </div>

          <div className="field">
            <label htmlFor="p-country" className="field-label">
              Country
            </label>
            <input
              id="p-country"
              type="text"
              name="country"
              defaultValue={user.country ?? ""}
            />
          </div>

          <div className="field">
            <label htmlFor="p-bio" className="field-label">
              Short bio
            </label>
            <textarea
              id="p-bio"
              name="bio"
              rows={4}
              defaultValue={user.bio ?? ""}
            />
          </div>

          <button
            type="submit"
            disabled={profilePending}
            className="btn btn-primary"
            aria-busy={profilePending}
          >
            {profilePending ? "Saving…" : "Save changes"}
          </button>
        </form>
      </section>

      {/* Password form */}
      <section aria-labelledby="pw-heading" className="mb-10">
        <h2
          id="pw-heading"
          className="section-label border-b border-hairline pb-2 mb-5"
        >
          Change password
        </h2>

        {pwState.success && (
          <div className="alert alert-success mb-4">
            Password updated successfully.
          </div>
        )}

        <form action={pwAction} className="space-y-4">
          <div className="field">
            <label htmlFor="cur-pw" className="field-label">
              Current password
            </label>
            <input
              id="cur-pw"
              type="password"
              name="currentPassword"
              autoComplete="current-password"
              aria-invalid={!!pwState.errors?.currentPassword}
            />
            {pwState.errors?.currentPassword && (
              <span className="field-error">
                {pwState.errors.currentPassword[0]}
              </span>
            )}
          </div>
          <div className="field">
            <label htmlFor="new-pw" className="field-label">
              New password
            </label>
            <input
              id="new-pw"
              type="password"
              name="newPassword"
              autoComplete="new-password"
              aria-invalid={!!pwState.errors?.newPassword}
            />
            {pwState.errors?.newPassword && (
              <span className="field-error">
                {pwState.errors.newPassword[0]}
              </span>
            )}
          </div>
          <div className="field">
            <label htmlFor="conf-pw" className="field-label">
              Confirm new password
            </label>
            <input
              id="conf-pw"
              type="password"
              name="confirmPassword"
              autoComplete="new-password"
              aria-invalid={!!pwState.errors?.confirmPassword}
            />
            {pwState.errors?.confirmPassword && (
              <span className="field-error">
                {pwState.errors.confirmPassword[0]}
              </span>
            )}
          </div>
          <button
            type="submit"
            disabled={pwPending}
            className="btn btn-secondary"
            aria-busy={pwPending}
          >
            {pwPending ? "Updating…" : "Update password"}
          </button>
        </form>

        <div className="mt-8 pt-5 border-t border-hairline">
          <h3 className="text-sm font-semibold text-ink mb-1">
            Prefer a secure reset code sent to your email?
          </h3>
          <p className="text-xs text-secondary mb-3">
            If you have forgotten your current password, you can request a one-time secure reset link and code sent to your registered email ({user.email}).
          </p>
          {resetEmailState.message && (
            <div className="alert alert-success mb-3 text-xs">
              {resetEmailState.message}{" "}
              <a href="/reset-password" className="font-semibold underline ml-1">
                Go to reset page
              </a>
            </div>
          )}
          {resetEmailState.error && (
            <div className="alert alert-error mb-3 text-xs">
              {resetEmailState.error}
            </div>
          )}
          <button
            type="button"
            onClick={handleRequestResetEmail}
            disabled={resetEmailState.loading}
            className="btn btn-outline text-xs py-2 px-3"
          >
            {resetEmailState.loading
              ? "Sending reset code..."
              : "Send password reset code to my email"}
          </button>
        </div>
      </section>

      {/* Danger Zone: Soft Account Deletion (30-day retention) */}
      <section
        aria-labelledby="danger-heading"
        className="pt-6 border-t border-hairline"
      >
        <h2
          id="danger-heading"
          className="section-label text-error border-b border-hairline pb-2 mb-4"
        >
          Danger Zone
        </h2>

        <div className="rounded-md border border-red-200 bg-red-50/40 p-4 space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-red-950">
              Delete Account (30-Day Retention Protection)
            </h3>
            <p className="text-xs text-red-800/90 mt-1 leading-relaxed">
              If you delete your account, your login and public profile will be deactivated immediately. To prevent accidental loss of your academic publications, reviewer history, and manuscripts, <strong>your account is securely retained for 30 days</strong>. You can cancel deletion and reactivate your account at any time within 30 days simply by signing back in.
            </p>
          </div>

          {deleteError && (
            <div className="alert alert-error text-xs">{deleteError}</div>
          )}

          <button
            type="button"
            onClick={handleDeleteAccount}
            disabled={isDeletingAccount}
            className="btn btn-error btn-sm text-xs py-2 px-3 font-semibold"
          >
            {isDeletingAccount ? "Scheduling deletion…" : "Delete My Account (30-day grace period)"}
          </button>
        </div>
      </section>
    </div>
  );
}
