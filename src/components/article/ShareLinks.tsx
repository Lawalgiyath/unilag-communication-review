"use client";

import { useState } from "react";

export function ShareLinks({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const links = [
    {
      label: "X",
      href: `https://x.com/intent/post?text=${encodedTitle}&url=${encodedUrl}`,
    },
    {
      label: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    },
    {
      label: "Email",
      href: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`,
    },
  ];

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Share this article">
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-secondary">
        Share:
      </span>
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          className="border border-hairline px-2.5 py-1 text-xs font-medium text-secondary hover:border-maroon hover:text-maroon"
        >
          {l.label}
        </a>
      ))}
      <button
        type="button"
        onClick={copyLink}
        className="border border-hairline px-2.5 py-1 text-xs font-medium text-secondary hover:border-maroon hover:text-maroon"
      >
        {copied ? "Copied ✓" : "Copy link"}
      </button>
    </div>
  );
}
