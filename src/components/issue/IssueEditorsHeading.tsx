import React from "react";

export interface EditorInfo {
  role: string;
  name: string;
  affiliation: string;
}

const DEFAULT_EDITORS: EditorInfo[] = [
  {
    role: "Special Issue Guest Editor",
    name: "Dr. Ebenezer Adebisi Olawuyi",
    affiliation: "Department of Communication and Language Arts, University of Ibadan",
  },
  {
    role: "Editor",
    name: "Dr. Unwana Samuel Akpan",
    affiliation: "Department of Journalism, Broadcasting and Media Studies, University of Lagos",
  },
  {
    role: "Editor-in-Chief",
    name: "Prof. Sunday Oloruntola",
    affiliation: "Department of Mass Communication, University of Lagos",
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
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {editors.map((ed) => (
          <div key={ed.role} className="flex flex-col justify-start">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-maroon">
              {ed.role}
            </span>
            <span className="mt-0.5 font-display text-sm font-semibold text-ink">
              {ed.name}
            </span>
            <span className="mt-0.5 text-[11px] leading-relaxed text-secondary font-serif">
              {ed.affiliation}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
