import { InstitutionalBadge } from "@/components/common/InstitutionalBadge";

/** ORCID icon (inline SVG, official green). */
function OrcidIcon() {
  return (
    <svg
      viewBox="0 0 256 256"
      className="inline-block h-4 w-4 align-text-bottom"
      aria-hidden="true"
    >
      <circle cx="128" cy="128" r="128" fill="#A6CE39" />
      <path
        fill="#fff"
        d="M86.3 186.2H70.9V79.1h15.4v107.1zM78.6 66.9c-5.5 0-10-4.5-10-10s4.5-10 10-10 10 4.5 10 10-4.5 10-10 10zM108.9 79.1h41.6c39.6 0 57 28.3 57 53.6 0 27.5-21.5 53.6-56.8 53.6h-41.8V79.1zm15.4 93.3h24.5c34.9 0 42.9-26.5 42.9-39.7 0-21.5-13.7-39.7-43.7-39.7h-23.7v79.4z"
      />
    </svg>
  );
}

export interface AuthorDisplay {
  name: string;
  affiliation: string | null;
  orcid: string | null;
  email: string | null;
  isCorresponding: boolean;
}

export function AuthorList({ authors }: { authors: AuthorDisplay[] }) {
  // unique affiliations in order of first appearance
  const affiliations: string[] = [];
  for (const a of authors) {
    if (a.affiliation && !affiliations.includes(a.affiliation)) {
      affiliations.push(a.affiliation);
    }
  }

  return (
    <div>
      <ul className="flex flex-wrap items-baseline gap-x-1 font-serif text-lg text-ink">
        {authors.map((a, i) => {
          const affIndex = a.affiliation
            ? affiliations.indexOf(a.affiliation) + 1
            : null;
          return (
            <li key={`${a.name}-${i}`}>
              <span className="font-medium">{a.name}</span>
              {affIndex !== null && affiliations.length > 1 && (
                <sup className="text-xs text-secondary">{affIndex}</sup>
              )}
              {a.orcid && (
                <a
                  href={`https://orcid.org/${a.orcid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`ORCID profile of ${a.name}`}
                  className="ml-1"
                >
                  <OrcidIcon />
                </a>
              )}

              {a.isCorresponding && a.email && (
                <a
                  href={`mailto:${a.email}`}
                  aria-label={`Email corresponding author ${a.name}`}
                  className="ml-1 text-maroon hover:text-oxblood"
                  title={`Corresponding author: ${a.email}`}
                >
                  ✉
                </a>
              )}
              {a.email && <InstitutionalBadge email={a.email} showText={false} className="ml-1 inline-flex align-baseline" />}
              {i < authors.length - 1 && <span aria-hidden="true">,</span>}
            </li>
          );
        })}
      </ul>
      {affiliations.length > 0 && (
        <ol className="mt-2 space-y-0.5 text-sm text-secondary">
          {affiliations.map((aff, i) => (
            <li key={aff}>
              {affiliations.length > 1 && (
                <sup className="mr-1">{i + 1}</sup>
              )}
              {aff}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
