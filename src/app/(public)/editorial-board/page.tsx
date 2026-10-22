import type { Metadata } from "next";
import { DEMO_BOARD } from "@/lib/demo-data";

export const metadata: Metadata = {
  title: "Editorial Board",
  description: "Meet the editors and board members of UNILAG Communication Review.",
};

const ROLE_ORDER = [
  "Special Issue Guest Editor",
  "Editor-in-Chief",
  "Editor",
  "Member",
];

export default function EditorialBoardPage() {
  const grouped = ROLE_ORDER.map((role) => ({
    role,
    members: DEMO_BOARD.filter((m) => m.role === role).sort(
      (a, b) => a.order - b.order
    ),
  })).filter((g) => g.members.length > 0);

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
        Editorial Board
      </h1>
      <p className="mt-2 max-w-2xl font-serif text-base text-secondary">
        The journal is guided by an international editorial board with expertise
        spanning communication studies, media law, digital media, and African
        media systems.
      </p>

      <div className="mt-10 space-y-10">
        {grouped.map(({ role, members }) => (
          <section key={role}>
            <h2 className="section-label border-b border-hairline pb-2 text-xs font-semibold uppercase tracking-[0.14em] text-secondary">
              {role === "Member" ? "Editorial Board Members" : role}
            </h2>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {members.map((m) => (
                <li key={m.id} className="border border-hairline p-4">
                  <p className="font-display text-base font-semibold text-ink">
                    {m.name}
                  </p>
                  <p className="mt-0.5 text-sm text-secondary">{m.affiliation}</p>
                  {m.orcid && (
                    <a
                      href={`https://orcid.org/${m.orcid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block text-xs text-maroon hover:underline"
                    >
                      ORCID {m.orcid}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
