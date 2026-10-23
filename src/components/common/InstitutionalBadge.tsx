import React from "react";

/**
 * Checks whether an email belongs to a recognized higher education or academic research institution
 * (e.g., .edu, .edu.ng, .ac.uk, .ac.za, .edu.*, .ac.*).
 */
export function isInstitutionalEmail(email?: string | null): boolean {
  if (!email) return false;
  const parts = email.trim().toLowerCase().split("@");
  if (parts.length !== 2) return false;
  const domain = parts[1];

  // Matches .edu, .edu.<country>, .ac.<country>
  return /(\.edu(\.[a-z]{2,})?|\.ac\.[a-z]{2,})$/i.test(domain);
}

interface InstitutionalBadgeProps {
  email?: string | null;
  className?: string;
  showText?: boolean;
}

export function InstitutionalBadge({
  email,
  className = "",
  showText = true,
}: InstitutionalBadgeProps) {
  if (!isInstitutionalEmail(email)) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded bg-[#ecfdf5] px-1.5 py-0.5 text-[11px] font-medium text-[#065f46] border border-[#a7f3d0] ${className}`}
      title="Verified Institutional Researcher - Email verified from an accredited academic or research domain (.edu / .ac)"
    >
      <svg
        className="h-3 w-3 text-[#059669]"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M16.403 12.652a3 3 0 000-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.883l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
          clipRule="evenodd"
        />
      </svg>
      {showText && <span>Verified Researcher</span>}
    </span>
  );
}
