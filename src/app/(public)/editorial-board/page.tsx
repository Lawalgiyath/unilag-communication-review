import type { Metadata } from "next";
import { db } from "@/lib/db";
import { SectionLabel } from "@/components/ui/SectionLabel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Editorial Board",
  description:
    "Meet the editorial board of UNILAG Communication Review — academics and scholars guiding the peer review and publishing standards of the journal.",
};

const ROLE_ORDER = ["Editor-in-Chief", "Editor", "Associate Editor", "Member"];

export default async function EditorialBoardPage() {
  const members = await db.boardMember.findMany({ orderBy: { order: "asc" } });

  const grouped = ROLE_ORDER.reduce(
    (acc, role) => {
      const group = members.filter((m) => m.role === role);
      if (group.length) acc.push({ role, members: group });
      return acc;
    },
    [] as { role: string; members: typeof members }[]
  );

  // Catch any roles not in the predefined order
  const handled = new Set(ROLE_ORDER);
  const other = members.filter((m) => !handled.has(m.role));
  if (other.length) {
    const extraRoles = [...new Set(other.map((m) => m.role))];
    for (const role of extraRoles) {
      grouped.push({ role, members: other.filter((m) => m.role === role) });
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
        Editorial Board
      </h1>
      <p className="mt-2 font-serif text-base text-secondary">
        The UNILAG Communication Review is guided by an international editorial
        board of scholars committed to rigorous peer review and the advancement
        of communication and media studies.
      </p>

      <div className="mt-10 space-y-10">
        {grouped.map(({ role, members: group }) => (
          <section key={role} aria-labelledby={`board-${role.replace(/\s+/g, "-").toLowerCase()}`}>
            <SectionLabel>
              <span id={`board-${role.replace(/\s+/g, "-").toLowerCase()}`}>
                {role}{group.length > 1 ? "s" : ""}
              </span>
            </SectionLabel>
            <ul className="mt-4 divide-y divide-hairline border border-hairline">
              {group.map((member) => (
                <li
                  key={member.id}
                  className="flex items-start justify-between gap-6 px-4 py-3"
                >
                  <div>
                    <p className="font-display text-base font-semibold text-ink">
                      {member.name}
                    </p>
                    <p className="mt-0.5 text-sm text-secondary">
                      {member.affiliation}
                    </p>
                  </div>
                  {member.orcid && (
                    <a
                      href={`https://orcid.org/${member.orcid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-xs font-semibold text-maroon underline decoration-hairline underline-offset-2 hover:decoration-maroon"
                      aria-label={`ORCID for ${member.name}`}
                    >
                      ORCID
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}

        {members.length === 0 && (
          <p className="text-sm text-secondary">
            Editorial board information will be published shortly.
          </p>
        )}
      </div>
    </div>
  );
}
