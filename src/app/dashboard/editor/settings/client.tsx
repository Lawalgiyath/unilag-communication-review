"use client";

import { useState, useActionState, useTransition } from "react";
import { updateSettingsAction, testEmailAction } from "./action";
import type { SettingsState } from "./action";

const initialState: SettingsState = {};

export default function SettingsClient({
  settings,
  defaults,
}: {
  settings: Record<string, string>;
  defaults: Record<string, string>;
}) {
  const [state, formAction, pending] = useActionState<SettingsState, FormData>(updateSettingsAction, initialState);
  const [testEmailTarget, setTestEmailTarget] = useState("");
  const [testEmailResult, setTestEmailResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [testingEmail, startTestingEmail] = useTransition();

  function getVal(key: string) {
    return settings[key] ?? defaults[key] ?? "";
  }

  const handleTestEmail = () => {
    startTestingEmail(async () => {
      setTestEmailResult(null);
      const res = await testEmailAction(testEmailTarget);
      setTestEmailResult(res);
    });
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">Journal Settings</h1>
          <p className="page-subtitle">Configure global journal metadata</p>
        </div>
      </div>

      {state.success && (
        <div className="alert alert-success mb-6">
          Settings updated successfully. Changes may take a few minutes to appear on all pages.
        </div>
      )}

      {state.errors?.form && (
        <div className="alert alert-error mb-6">{state.errors.form[0]}</div>
      )}

      <form action={formAction} className="space-y-6">
        <fieldset className="border border-hairline p-5">
          <legend className="px-1 text-sm font-semibold text-secondary">Basic Info</legend>
          <div className="mt-3 space-y-4">
            <div className="field">
              <label htmlFor="title" className="field-label">Full journal title</label>
              <input id="title" type="text" name="title" defaultValue={getVal("title")} required />
            </div>
            <div className="field">
              <label htmlFor="shortTitle" className="field-label">Short title</label>
              <input id="shortTitle" type="text" name="shortTitle" defaultValue={getVal("shortTitle")} required />
            </div>
            <div className="field">
              <label htmlFor="tagline" className="field-label">Tagline</label>
              <input id="tagline" type="text" name="tagline" defaultValue={getVal("tagline")} />
            </div>
            <div className="field">
              <label htmlFor="base_url" className="field-label">Production Website URL</label>
              <input id="base_url" type="url" name="base_url" defaultValue={getVal("base_url") || "https://unilag-communication-review.vercel.app"} placeholder="https://unilag-communication-review.vercel.app" required />
              <p className="mt-1 text-[11px] text-secondary">
                Canonical domain used for citation exports (RIS, BibTeX), Highwire Press metadata, RSS feeds, and email notifications.
              </p>
            </div>
          </div>
        </fieldset>

        <fieldset className="border border-hairline p-5">
          <legend className="px-1 text-sm font-semibold text-secondary">Publisher & Identity</legend>
          <div className="mt-3 space-y-4">
            <div className="field">
              <label htmlFor="publisher" className="field-label">Publisher</label>
              <input id="publisher" type="text" name="publisher" defaultValue={getVal("publisher")} required />
            </div>
            <div className="field">
              <label htmlFor="publisherShort" className="field-label">Publisher (short)</label>
              <input id="publisherShort" type="text" name="publisherShort" defaultValue={getVal("publisherShort")} required />
            </div>
            <div className="field">
              <label htmlFor="address" className="field-label">Editorial address</label>
              <textarea id="address" name="address" rows={2} defaultValue={getVal("address")} required />
            </div>
          </div>
        </fieldset>

        <fieldset className="border border-hairline p-5">
          <legend className="px-1 text-sm font-semibold text-secondary">Identifiers & Contact</legend>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div className="field">
              <label htmlFor="issn" className="field-label">Print ISSN</label>
              <input id="issn" type="text" name="issn" defaultValue={getVal("issn")} />
            </div>
            <div className="field">
              <label htmlFor="eissn" className="field-label">Online eISSN</label>
              <input id="eissn" type="text" name="eissn" defaultValue={getVal("eissn")} />
            </div>
            <div className="field">
              <label htmlFor="contactEmail" className="field-label">Contact email</label>
              <input id="contactEmail" type="email" name="contactEmail" defaultValue={getVal("contactEmail")} required />
            </div>
            <div className="field">
              <label htmlFor="feeNaira" className="field-label">Publication fee (₦)</label>
              <input id="feeNaira" type="text" name="feeNaira" defaultValue={getVal("feeNaira")} required />
            </div>
            <div className="field">
              <label htmlFor="doiPrefix" className="field-label">DOI Prefix</label>
              <input id="doiPrefix" type="text" name="doiPrefix" defaultValue={getVal("doiPrefix") || "10.5281/zenodo"} />
            </div>
          </div>
        </fieldset>

        {/* SMTP & Automated Email Delivery Configuration */}
        <fieldset className="border border-hairline p-5">
          <legend className="px-2 text-xs font-semibold uppercase tracking-[0.14em] text-maroon">
            Automated Email Delivery (SMTP)
          </legend>
          <p className="mt-1 text-xs text-secondary">
            Configures automated system emails for new user registrations, manuscript submissions, reviewer invitations, editorial decisions, and publication alerts.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="field">
              <label htmlFor="smtp_host" className="field-label">SMTP Host</label>
              <input
                id="smtp_host"
                type="text"
                name="smtp_host"
                defaultValue={getVal("smtp_host") || "smtp.gmail.com"}
                placeholder="smtp.gmail.com"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="smtp_port" className="field-label">SMTP Port</label>
              <input
                id="smtp_port"
                type="number"
                name="smtp_port"
                defaultValue={getVal("smtp_port") || "465"}
                placeholder="465"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="smtp_user" className="field-label">SMTP Username / Email</label>
              <input
                id="smtp_user"
                type="email"
                name="smtp_user"
                defaultValue={getVal("smtp_user") || "lawalgiyath200716@gmail.com"}
                placeholder="e.g. editorial@unilag.edu.ng"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="smtp_pass" className="field-label">SMTP Password / App Password</label>
              <input
                id="smtp_pass"
                type="password"
                name="smtp_pass"
                defaultValue={getVal("smtp_pass") || "rosgjlmbnvlfudov"}
                placeholder="Google App Password (16 characters)"
                required
              />
            </div>
            <div className="field sm:col-span-2">
              <label htmlFor="smtp_from" className="field-label">From Name & Address</label>
              <input
                id="smtp_from"
                type="text"
                name="smtp_from"
                defaultValue={getVal("smtp_from") || "UNILAG Communication Review <lawalgiyath200716@gmail.com>"}
                placeholder="UNILAG Communication Review <editorial@unilag.edu.ng>"
                required
              />
            </div>
          </div>

          <div className="mt-4 border-t border-hairline pt-4">
            <p className="text-xs font-semibold text-ink">Test Email Delivery</p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                type="email"
                placeholder="Enter recipient email for test message"
                value={testEmailTarget}
                onChange={(e) => setTestEmailTarget(e.target.value)}
                className="text-xs"
              />
              <button
                type="button"
                onClick={handleTestEmail}
                disabled={testingEmail}
                className="btn btn-secondary btn-sm whitespace-nowrap"
              >
                {testingEmail ? "Sending Test…" : "Send Test Email"}
              </button>
            </div>
            {testEmailResult && (
              <div className={`mt-2 p-2 text-xs ${testEmailResult.ok ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
                {testEmailResult.message}
              </div>
            )}
          </div>
        </fieldset>

        {/* Zenodo DOI Integration */}
        <fieldset className="border border-hairline p-5">
          <legend className="px-2 text-xs font-semibold uppercase tracking-[0.14em] text-maroon">
            Zenodo Automatic DOI Engine (100% Free)
          </legend>
          <p className="mt-1 text-xs text-secondary">
            Mint official, permanent DOIs (<code>10.5281/zenodo.XXXXXXX</code>) through CERN / Zenodo for all accepted manuscripts.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="field">
              <label htmlFor="zenodo_token" className="field-label">
                Zenodo Access Token
              </label>
              <input
                id="zenodo_token"
                type="password"
                name="zenodo_token"
                defaultValue={getVal("zenodo_token")}
                placeholder="Personal access token with deposit:actions, deposit:write"
              />
              <p className="mt-1 text-[11px] text-secondary">
                Generate free token at <a href="https://zenodo.org/account/settings/applications/tokens/new/" target="_blank" rel="noopener noreferrer" className="text-maroon underline">zenodo.org/tokens</a>
              </p>
            </div>

            <div className="field">
              <label htmlFor="zenodo_community" className="field-label">
                Zenodo Community (Optional)
              </label>
              <input
                id="zenodo_community"
                type="text"
                name="zenodo_community"
                defaultValue={getVal("zenodo_community")}
                placeholder="e.g. unilag-communication-review"
              />
            </div>

            <div className="field sm:col-span-2">
              <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
                <input
                  type="checkbox"
                  name="zenodo_sandbox"
                  value="true"
                  defaultChecked={getVal("zenodo_sandbox") === "true"}
                  className="rounded border-hairline text-maroon"
                />
                <span>Use Sandbox environment (<code>sandbox.zenodo.org</code> for testing without registering public DOIs)</span>
              </label>
            </div>
          </div>
        </fieldset>

        <button type="submit" disabled={pending} className="btn btn-primary" aria-busy={pending}>
          {pending ? "Saving…" : "Save Settings"}
        </button>
      </form>
    </div>
  );
}
