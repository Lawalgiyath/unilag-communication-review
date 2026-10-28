import type { Metadata } from "next";
import { DEMO_BOARD } from "@/lib/demo-data";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

const PHOTO_FALLBACKS: Record<string, string> = {
  "Ebenezer Adebisi Olawuyi": "/images/board/ebenezer-adebisi-olawuyi.jpg",
  "Sunday Oloruntola": "/images/board/sunday-oloruntola.png",
  "Unwana Samuel Akpan": "/images/board/unwana-samuel-akpan.jpg",
  "Adepoju Tejumaiye": "/images/board/adepoju-tejumaiye.jpg",
  "Ishmael Ibrahim": "/images/board/ishmael-ibrahim.png",
  "Tayo Popoola": "/images/board/tayo-popoola.jpg",
};

function getMemberPhoto(name: string, photoUrl?: string | null): string | null {
  if (photoUrl && photoUrl.trim()) return photoUrl.trim();
  for (const [key, path] of Object.entries(PHOTO_FALLBACKS)) {
    if (name.toLowerCase().includes(key.toLowerCase())) {
      return path;
    }
  }
  return null;
}

function getInitials(name: string): string {
  const clean = name.replace(/^(Prof\.|Dr\.|Mr\.|Mrs\.|Ms\.)\s+/gi, "").trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return (parts[0]?.[0] || "U").toUpperCase();
}

export default async function EditorialBoardPage() {
  let boardMembers: Array<{
    id: string;
    name: string;
    role: string;
    affiliation: string;
    photoUrl?: string | null;
    orcid: string | null;
    order: number;
  }> = [];

  try {
    const fromDb = await db.boardMember.findMany({
      orderBy: { order: "asc" },
    });
    if (fromDb && fromDb.length > 0) {
      boardMembers = fromDb;
    } else {
      boardMembers = DEMO_BOARD;
    }
  } catch (e) {
    console.error("Failed to fetch board members from db, using fallback", e);
    boardMembers = DEMO_BOARD;
  }

  const grouped = ROLE_ORDER.map((role) => ({
    role,
    members: boardMembers
      .filter((m) => m.role === role)
      .sort((a, b) => a.order - b.order),
  })).filter((g) => g.members.length > 0);

  return (
    <div className="py-2">
      <div className="border-b border-hairline pb-6">
        <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
          Editorial Board
        </h1>
        <p className="mt-2 max-w-2xl font-serif text-base text-secondary">
          The journal is guided by distinguished scholars with international expertise
          spanning political communication, media systems, digital journalism, and African
          public spheres.
        </p>
      </div>

      <div className="mt-8 space-y-12">
        {grouped.map(({ role, members }) => (
          <section key={role}>
            <div className="flex items-center gap-3 border-b border-hairline pb-2.5">
              <span className="h-2 w-2 rounded-full bg-maroon" aria-hidden="true" />
              <h2 className="section-label text-xs font-semibold uppercase tracking-[0.14em] text-secondary">
                {role === "Member" ? "Editorial Board Members" : role}
              </h2>
            </div>

            <ul className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {members.map((m) => {
                const photo = getMemberPhoto(m.name, m.photoUrl);
                const initials = getInitials(m.name);

                return (
                  <li
                    key={m.id}
                    className="group relative flex flex-col gap-4 rounded-sm border border-hairline bg-paper p-5 transition-all duration-200 hover:border-maroon/50 hover:shadow-md"
                  >
                    <div className="flex items-start gap-4">
                      {/* Portrait Photo */}
                      <div className="relative shrink-0 overflow-hidden rounded-md border border-hairline bg-paper-dark shadow-inner w-20 h-24 sm:w-22 sm:h-28">
                        {photo ? (
                          <img
                            src={photo}
                            alt={`Portrait of ${m.name}`}
                            className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center font-display text-2xl font-bold text-maroon/40">
                            {initials}
                          </div>
                        )}
                      </div>

                      {/* Header Info */}
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="inline-block text-[10px] font-bold uppercase tracking-[0.12em] text-maroon">
                          {m.role}
                        </span>
                        <h3 className="mt-1 font-display text-base font-semibold leading-snug text-ink group-hover:text-maroon transition-colors">
                          {m.name}
                        </h3>
                        {m.orcid && (
                          <a
                            href={`https://orcid.org/${m.orcid}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center gap-1.5 text-xs text-maroon hover:underline"
                            title={`ORCID iD for ${m.name}`}
                          >
                            <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#A6CE39] text-[9px] font-bold text-white">
                              iD
                            </span>
                            <span className="font-mono text-[11px] text-secondary hover:text-maroon">
                              {m.orcid}
                            </span>
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Affiliation */}
                    <div className="border-t border-hairline/60 pt-3">
                      <p className="font-serif text-xs leading-relaxed text-secondary">
                        {m.affiliation}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
