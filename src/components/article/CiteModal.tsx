"use client";

import { useRef, useState } from "react";

const FORMATS = ["APA", "MLA", "Chicago", "Harvard"] as const;
type Format = (typeof FORMATS)[number];

export function CiteModal({
  citations,
  slug,
}: {
  citations: Record<Format, string>;
  slug: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [format, setFormat] = useState<Format>("APA");
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(citations[format]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — user can select manually
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="border border-hairline px-4 py-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink hover:border-maroon hover:text-maroon"
      >
        Cite this article
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="cite-modal-title"
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current?.close();
        }}
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <h2
              id="cite-modal-title"
              className="font-display text-xl font-semibold text-ink"
            >
              Cite this article
            </h2>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label="Close"
              className="text-2xl leading-none text-secondary hover:text-ink"
            >
              ×
            </button>
          </div>

          <div
            className="mt-4 flex gap-1 border-b border-hairline"
            role="tablist"
            aria-label="Citation format"
          >
            {FORMATS.map((f) => (
              <button
                key={f}
                type="button"
                role="tab"
                aria-selected={format === f}
                onClick={() => setFormat(f)}
                className={`px-3 py-2 text-[13px] font-semibold uppercase tracking-[0.08em] ${
                  format === f
                    ? "border-b-2 border-maroon text-maroon"
                    : "text-secondary hover:text-ink"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <blockquote className="mt-4 border border-hairline bg-paper-dark p-4 font-serif text-sm leading-relaxed text-ink">
            {citations[format]}
          </blockquote>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={copy}
              className="bg-maroon px-4 py-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-paper hover:bg-oxblood"
            >
              {copied ? "Copied ✓" : "Copy citation"}
            </button>
            <a
              href={`/articles/${slug}/citation.bib`}
              className="border border-hairline px-4 py-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink hover:border-maroon hover:text-maroon"
            >
              BibTeX
            </a>
            <a
              href={`/articles/${slug}/citation.ris`}
              className="border border-hairline px-4 py-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink hover:border-maroon hover:text-maroon"
            >
              RIS / EndNote
            </a>
          </div>
        </div>
      </dialog>
    </>
  );
}
