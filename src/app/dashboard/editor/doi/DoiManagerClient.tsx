"use client";

import { useState, useTransition } from "react";
import {
  saveZenodoConfigAction,
  testConnectionAction,
  mintSingleDoiAction,
  mintAllDoisAction,
} from "./action";

interface ArticleItem {
  id: string;
  slug: string;
  title: string;
  firstPage: number | null;
  lastPage: number | null;
  doi: string | null;
  authors: { name: string }[];
  issueTitle: string;
  volumeNumber: number;
  issueNumber: number;
}

interface DoiManagerProps {
  initialToken: string;
  initialSandbox: boolean;
  initialCommunity: string;
  articles: ArticleItem[];
}

export function DoiManagerClient({
  initialToken,
  initialSandbox,
  initialCommunity,
  articles,
}: DoiManagerProps) {
  const [token, setToken] = useState(initialToken);
  const [sandbox, setSandbox] = useState(initialSandbox);
  const [community, setCommunity] = useState(initialCommunity);

  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
    environment: string;
  } | null>(null);

  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [activeArticleId, setActiveArticleId] = useState<string | null>(null);

  const [isSaving, startSave] = useTransition();
  const [isTesting, startTest] = useTransition();
  const [isMintingAll, startMintAll] = useTransition();

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("zenodo_token", token);
    fd.append("zenodo_sandbox", sandbox ? "true" : "false");
    fd.append("zenodo_community", community);

    startSave(async () => {
      await saveZenodoConfigAction(fd);
      setStatusMsg("Zenodo settings saved successfully.");
      setTimeout(() => setStatusMsg(null), 4000);
    });
  };

  const handleTestConnection = () => {
    startTest(async () => {
      const res = await testConnectionAction({
        accessToken: token,
        isSandbox: sandbox,
        community,
      });
      setTestResult(res);
    });
  };

  const handleMintSingle = async (id: string) => {
    setActiveArticleId(id);
    try {
      const res = await mintSingleDoiAction(id);
      if (res.success) {
        setStatusMsg(`Successfully minted DOI ${res.doi}!`);
      } else {
        setStatusMsg(`Error: ${res.error}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatusMsg(`Exception: ${msg}`);
    } finally {
      setActiveArticleId(null);
    }
  };

  const handleMintAll = () => {
    if (!token) {
      alert("Please provide a Zenodo Access Token first.");
      return;
    }
    if (
      !confirm(
        `Are you ready to mint official Zenodo DOIs for all ${articles.length} articles? This will upload PDFs and register DOIs on ${sandbox ? "Sandbox" : "Production Zenodo"}.`
      )
    ) {
      return;
    }

    startMintAll(async () => {
      setStatusMsg("Minting DOIs in progress. Uploading PDFs and metadata to Zenodo...");
      const res = await mintAllDoisAction();
      if (res.success) {
        const successful = res.results.filter((r) => r.success).length;
        setStatusMsg(`Batch completed: ${successful} of ${res.results.length} DOIs successfully minted!`);
      } else {
        setStatusMsg("Batch process encountered errors.");
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Overview Notice */}
      <div className="border border-hairline bg-paper-dark p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="border border-gold/80 bg-gold/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-gold-dark">
              100% Free Permanent DOIs
            </span>
            <h2 className="mt-2 font-display text-xl font-semibold text-ink">
              Official Zenodo / CERN DOI Engine
            </h2>
            <p className="mt-1 text-sm text-secondary">
              Zenodo assigns real, citable DOIs (<code className="text-xs text-maroon">10.5281/zenodo.XXXXXXX</code>) that resolve globally on <span className="font-medium text-ink">doi.org</span> and are automatically indexed by Google Scholar and DataCite.
            </p>
          </div>
          <div>
            <a
              href="https://zenodo.org/account/settings/applications/tokens/new/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 border border-hairline bg-paper px-3 py-2 text-xs font-semibold text-ink shadow-sm hover:border-maroon hover:text-maroon transition-colors"
            >
              Get Free Zenodo Token ↗
            </a>
          </div>
        </div>
      </div>

      {statusMsg && (
        <div className="border border-gold bg-gold/10 px-4 py-3 text-sm text-ink">
          {statusMsg}
        </div>
      )}

      {/* Configuration Box */}
      <section className="border border-hairline bg-paper p-6">
        <h3 className="section-label border-b border-hairline pb-2">
          Zenodo Credentials &amp; Environment
        </h3>
        <form onSubmit={handleSaveConfig} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="token-input" className="block text-xs font-semibold uppercase tracking-wider text-secondary">
                Personal Access Token
              </label>
              <input
                id="token-input"
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste token from zenodo.org (needs deposit:actions, deposit:write)"
                className="mt-1 w-full border border-hairline bg-paper px-3 py-2 text-sm text-ink focus:border-maroon focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-secondary">
                Generate at <a href="https://zenodo.org/account/settings/applications/tokens/new/" target="_blank" rel="noopener noreferrer" className="text-maroon underline">zenodo.org/tokens</a> with scopes <code className="text-xs">deposit:actions</code> and <code className="text-xs">deposit:write</code>.
              </p>
            </div>

            <div>
              <label htmlFor="community-input" className="block text-xs font-semibold uppercase tracking-wider text-secondary">
                Zenodo Community (Optional)
              </label>
              <input
                id="community-input"
                type="text"
                value={community}
                onChange={(e) => setCommunity(e.target.value)}
                placeholder="e.g. unilag-communication-review"
                className="mt-1 w-full border border-hairline bg-paper px-3 py-2 text-sm text-ink focus:border-maroon focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-secondary">
                Optional collection identifier on Zenodo.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-hairline pt-4">
            <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
              <input
                type="checkbox"
                checked={sandbox}
                onChange={(e) => setSandbox(e.target.checked)}
                className="rounded border-hairline text-maroon focus:ring-maroon"
              />
              <span>Use Zenodo Sandbox (<code className="text-xs text-secondary">sandbox.zenodo.org</code> for testing)</span>
            </label>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting || !token}
                className="border border-hairline px-4 py-2 text-xs font-semibold uppercase tracking-wider text-ink hover:border-maroon disabled:opacity-50"
              >
                {isTesting ? "Testing…" : "Test Connection"}
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="bg-maroon px-4 py-2 text-xs font-semibold uppercase tracking-wider text-paper hover:bg-oxblood disabled:opacity-50"
              >
                {isSaving ? "Saving…" : "Save Credentials"}
              </button>
            </div>
          </div>

          {testResult && (
            <div
              className={`mt-3 p-3 text-xs ${
                testResult.ok
                  ? "border border-green-300 bg-green-50 text-green-900"
                  : "border border-red-300 bg-red-50 text-red-900"
              }`}
            >
              <strong>{testResult.ok ? "✓ Success: " : "✕ Failed: "}</strong>
              {testResult.message} ({testResult.environment})
            </div>
          )}
        </form>
      </section>

      {/* Article List & Batch Actions */}
      <section className="border border-hairline bg-paper p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline pb-4">
          <div>
            <h3 className="section-label">Published Articles &amp; DOI Registry</h3>
            <p className="text-xs text-secondary">
              Volume 9, Number 2 (Special Issue: Platforms, Power, and Polls)
            </p>
          </div>

          <button
            type="button"
            onClick={handleMintAll}
            disabled={isMintingAll || !token}
            className="inline-flex items-center gap-2 bg-maroon px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-paper hover:bg-oxblood disabled:opacity-50 transition-colors shadow-sm"
          >
            {isMintingAll ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Minting All DOIs…</span>
              </>
            ) : (
              <span>Mint All DOIs for Volume 9 Number 2</span>
            )}
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-hairline text-xs font-semibold uppercase tracking-wider text-secondary">
                <th className="py-2.5 pr-4">#</th>
                <th className="py-2.5 pr-4">Article Title &amp; Authors</th>
                <th className="py-2.5 pr-4">Pages</th>
                <th className="py-2.5 pr-4">Current DOI</th>
                <th className="py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {articles.map((art, idx) => {
                const isMintingThis = activeArticleId === art.id;
                return (
                  <tr key={art.id} className="hover:bg-paper-dark/50">
                    <td className="py-3 pr-4 font-mono text-xs text-secondary">{idx + 1}</td>
                    <td className="py-3 pr-4">
                      <p className="font-serif font-medium text-ink">{art.title}</p>
                      <p className="text-xs text-secondary">
                        {art.authors.map((a) => a.name).join(", ")}
                      </p>
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs text-secondary">
                      {art.firstPage && art.lastPage ? `${art.firstPage}–${art.lastPage}` : "—"}
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs">
                      {art.doi ? (
                        <a
                          href={`https://doi.org/${art.doi}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-maroon underline hover:text-oxblood break-all"
                        >
                          {art.doi}
                        </a>
                      ) : (
                        <span className="text-secondary italic">Not assigned</span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleMintSingle(art.id)}
                        disabled={isMintingThis || isMintingAll || !token}
                        className="border border-hairline bg-paper px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-ink hover:border-maroon hover:text-maroon disabled:opacity-50"
                      >
                        {isMintingThis ? "Minting…" : "Mint DOI"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
