import React from "react";

export interface EditorInfo {
  role: string;
  name: string;
  affiliation: string;
  photoUrl?: string;
}

const DEFAULT_EDITORS: EditorInfo[] = [
  {
    role: "Special Issue Guest Editor",
    name: "Dr. Ebenezer Adebisi Olawuyi",
    affiliation: "Department of Communication and Language Arts, University of Ibadan",
    photoUrl: "/images/board/ebenezer-adebisi-olawuyi.jpg",
  },
  {
    role: "Editor",
    name: "Dr. Unwana Samuel Akpan",
    affiliation: "Department of Journalism, Broadcasting and Media Studies, University of Lagos",
    photoUrl: "/images/board/unwana-samuel-akpan.jpg",
  },
  {
    role: "Editor-in-Chief",
    name: "Prof. Sunday Oloruntola",
    affiliation: "Department of Mass Communication, University of Lagos",
    photoUrl: "/images/board/sunday-oloruntola.png",
  },
];

export function IssueEditorsHeading({
  className = "",
  showEditorInChief = true,
}: {
  className?: string;
  showEditorInChief?: boolean;
}) {
  const editors = showEditorInChief
    ? DEFAULT_EDITORS
    : DEFAULT_EDITORS.slice(0, 2);

  return (
    <div
      className={`my-4 border border-hairline bg-paper-dark/60 p-3.5 sm:p-4 text-xs ${className}`}
      aria-label="Editorial leadership for this issue"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {editors.map((ed) => (
          <div key={ed.role} className="flex items-start gap-3">
            {ed.photoUrl ? (
              <img
                src={ed.photoUrl}
                alt={ed.name}
                className="h-12 w-12 shrink-0 rounded-full object-cover object-top border border-hairline shadow-xs"
                loading="lazy"
              />
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-parchment font-serif text-sm font-semibold text-maroon border border-hairline">
                {ed.name.split(" ").slice(-1)[0][0]}
              </div>
            )}
            <div className="flex flex-col justify-start min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-maroon">
                {ed.role}
              </span>
              <span className="mt-0.5 font-display text-sm font-semibold text-ink leading-snug">
                {ed.name}
              </span>
              <span className="mt-0.5 text-[11px] leading-relaxed text-secondary font-serif">
                {ed.affiliation}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
