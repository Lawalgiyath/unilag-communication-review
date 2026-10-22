"use client";

import { useActionState } from "react";
import { updateSettingsAction } from "./action";
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

  function getVal(key: string) {
    return settings[key] ?? defaults[key] ?? "";
  }

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
