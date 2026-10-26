import { describe, it, expect } from "vitest";
import { formatAuthorName, normaliseTitle } from "@/lib/author-name";
import { REAL_ARTICLES } from "../prisma/seed-data";

describe("Author Name Formatting (Google Scholar & Faculty Policy)", () => {
  it("normaliseTitle returns null for doctorate post-nominals", () => {
    expect(normaliseTitle("Ph.D.")).toBeNull();
    expect(normaliseTitle("PhD")).toBeNull();
    expect(normaliseTitle("Ph.D")).toBeNull();
    expect(normaliseTitle("D.Phil.")).toBeNull();
  });

  it("normaliseTitle preserves academic prefix titles", () => {
    expect(normaliseTitle("Prof.")).toEqual({ kind: "prefix", text: "Prof." });
    expect(normaliseTitle("Professor")).toEqual({ kind: "prefix", text: "Prof." });
    expect(normaliseTitle("Dr.")).toEqual({ kind: "prefix", text: "Dr." });
  });

  it("formatAuthorName formats doctorate authors without Ph.D. suffix", () => {
    const formatted = formatAuthorName({
      first: "Janet Aver",
      last: "Adikpo",
      title: "Ph.D.",
    });
    expect(formatted).toBe("Janet Aver Adikpo");
    expect(formatted).not.toContain("Ph.D");
  });

  it("formatAuthorName safely removes any accidental trailing Ph.D. from last name", () => {
    const formatted = formatAuthorName({
      first: "Janet Aver",
      last: "Adikpo, Ph.D.",
      title: null,
    });
    expect(formatted).toBe("Janet Aver Adikpo");
  });

  it("formatAuthorName strips academic titles (Prof., Dr.) for article indexing", () => {
    expect(
      formatAuthorName({ first: "Sunday", last: "Oloruntola", title: "Prof." })
    ).toBe("Sunday Oloruntola");
    expect(
      formatAuthorName({ first: "Unwana Samuel", last: "Akpan", title: "Dr." })
    ).toBe("Unwana Samuel Akpan");
    expect(
      formatAuthorName({ first: "Prof. Sunday", last: "Oloruntola", title: null })
    ).toBe("Sunday Oloruntola");
  });

  it("seed dataset contains zero Ph.D. titles across all authors", () => {
    for (const article of REAL_ARTICLES) {
      for (const author of article.authors) {
        expect(author.title ?? "").not.toMatch(/ph\.?d/i);
        expect(author.last).not.toMatch(/,\s*ph\.?d/i);
        const displayName = formatAuthorName(author);
        expect(displayName).not.toContain("Ph.D");
      }
    }
  });

  it("seed dataset contains tables and figures in empirical articles", () => {
    const art1 = REAL_ARTICLES[0]; // Article 1 has 4 figures
    expect(art1.bodyParagraphs.some((p) => p.startsWith("![Figure"))).toBe(true);

    const art2 = REAL_ARTICLES[1]; // Article 2 has 3 tables
    expect(art2.bodyParagraphs.some((p) => p.startsWith("|"))).toBe(true);

    const art3 = REAL_ARTICLES[2]; // Article 3 has tables and appendix figures
    expect(art3.bodyParagraphs.some((p) => p.startsWith("|"))).toBe(true);
    expect(art3.bodyParagraphs.some((p) => p.startsWith("![Figure"))).toBe(true);

    const art4 = REAL_ARTICLES[3]; // Article 4 has 7 tables
    expect(art4.bodyParagraphs.some((p) => p.startsWith("|"))).toBe(true);

    const art5 = REAL_ARTICLES[4]; // Article 5 has Figure 1
    expect(
      art5.bodyParagraphs.some((p) => p.includes("Figure 1: Broadcast Editors"))
    ).toBe(true);
  });
});
