"use client";

import { useState, useActionState } from "react";
import { updateProfileAction, updatePasswordAction, requestPasswordResetEmailAction } from "./actions";
import type { ProfileState, PasswordState } from "./actions";

// This page is a server component wrapper that passes user data
export { ProfilePageClient as default };

function ProfilePageClient({ user }: { user: { name: string; title: string | null; affiliation: string | null; orcid: string | null; bio?: string | null; country?: string | null; email: string } }) {
  const [profileState, profileAction, profilePending] = useActionState<ProfileState, FormData>(updateProfileAction, {});
  const [pwState, pwAction, pwPending] = useActionState<PasswordState, FormData>(updatePasswordAction, {});
  const [resetEmailState, setResetEmailState] = useState<{ loading: boolean; message?: string; error?: string }>({ loading: false });

  async function handleRequestResetEmail() {
    setResetEmailState({ loading: true });
    try {
      const res = await requestPasswordResetEmailAction();
      if (res.success) {
        setResetEmailState({ loading: false, message: res.message });
      } else {
        setResetEmailState({ loading: false, error: res.error ?? "Failed to send reset email" });
      }
    } catch {
      setResetEmailState({ loading: false, error: "An unexpected error occurred" });
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">{user.email}</p>
        </div>
      </div>

      {/* Profile form */}
      <section aria-labelledby="profile-heading" className="mb-10">
        <h2 id="profile-heading" className="section-label border-b border-hairline pb-2 mb-5">
          Personal information
        </h2>

        {profileState.success && (
          <div className="alert alert-success mb-4">Profile updated successfully.</div>
        )}

        <form action={profileAction} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="field">
              <label htmlFor="p-name" className="field-label">Full name</label>
              <input id="p-name" type="text" name="name" defaultValue={user.name} required aria-invalid={!!profileState.errors?.name} />
              {profileState.errors?.name && <span className="field-error">{profileState.errors.name[0]}</span>}
            </div>
            <div className="field">
              <label htmlFor="p-title" className="field-label">Title</label>
              <select id="p-title" name="title" defaultValue={user.title ?? ""}>
                <option value="">None</option>
                {["Prof.", "Dr.", "Mr.", "Mrs.", "Ms."].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="p-affiliation" className="field-label">Institution / Affiliation</label>
            <input id="p-affiliation" type="text" name="affiliation" defaultValue={user.affiliation ?? ""} required />
            {profileState.errors?.affiliation && <span className="field-error">{profileState.errors.affiliation[0]}</span>}
          </div>

          <div className="field">
            <label htmlFor="p-orcid" className="field-label">ORCID</label>
            <input id="p-orcid" type="text" name="orcid" defaultValue={user.orcid ?? ""} placeholder="0000-0000-0000-0000" />
            {profileState.errors?.orcid && <span className="field-error">{profileState.errors.orcid[0]}</span>}
          </div>

          <div className="field">
            <label htmlFor="p-country" className="field-label">Country</label>
            <input id="p-country" type="text" name="country" defaultValue={user.country ?? ""} />
          </div>

          <div className="field">
            <label htmlFor="p-bio" className="field-label">Short bio</label>
            <textarea id="p-bio" name="bio" rows={4} defaultValue={user.bio ?? ""} />
          </div>

          <button type="submit" disabled={profilePending} className="btn btn-primary" aria-busy={profilePending}>
            {profilePending ? "Saving…" : "Save changes"}
          </button>
        </form>
      </section>

      {/* Password form */}
      <section aria-labelledby="pw-heading">
        <h2 id="pw-heading" className="section-label border-b border-hairline pb-2 mb-5">
          Change password
        </h2>

        {pwState.success && (
          <div className="alert alert-success mb-4">Password updated successfully.</div>
        )}

        <form action={pwAction} className="space-y-4">
          <div className="field">
            <label htmlFor="cur-pw" className="field-label">Current password</label>
            <input id="cur-pw" type="password" name="currentPassword" autoComplete="current-password" aria-invalid={!!pwState.errors?.currentPassword} />
            {pwState.errors?.currentPassword && <span className="field-error">{pwState.errors.currentPassword[0]}</span>}
          </div>
          <div className="field">
            <label htmlFor="new-pw" className="field-label">New password</label>
            <input id="new-pw" type="password" name="newPassword" autoComplete="new-password" aria-invalid={!!pwState.errors?.newPassword} />
            {pwState.errors?.newPassword && <span className="field-error">{pwState.errors.newPassword[0]}</span>}
          </div>
          <div className="field">
            <label htmlFor="conf-pw" className="field-label">Confirm new password</label>
            <input id="conf-pw" type="password" name="confirmPassword" autoComplete="new-password" aria-invalid={!!pwState.errors?.confirmPassword} />
            {pwState.errors?.confirmPassword && <span className="field-error">{pwState.errors.confirmPassword[0]}</span>}
          </div>
          <button type="submit" disabled={pwPending} className="btn btn-secondary" aria-busy={pwPending}>
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
            <div className="alert alert-error mb-3 text-xs">{resetEmailState.error}</div>
          )}
          <button
            type="button"
            onClick={handleRequestResetEmail}
            disabled={resetEmailState.loading}
            className="btn btn-outline text-xs py-2 px-3"
          >
            {resetEmailState.loading ? "Sending reset code..." : "Send password reset code to my email"}
          </button>
        </div>
      </section>
    </div>
  );
}
