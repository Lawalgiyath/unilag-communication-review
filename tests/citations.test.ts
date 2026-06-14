import { describe, it, expect } from "vitest";
import {
  formatAPA,
  formatMLA,
  formatChicago,
  formatHarvard,
  formatBibTeX,
  formatRIS,
  type CitationData,
} from "@/lib/citations";

const base: CitationData = {
  title: "Gender Framing in Nigerian Television News",
  authors: [
    { firstName: "Adaeze", lastName: "Okafor" },
    { firstName: "Tunde", lastName: "Bakare" },
  ],
  year: 2026,
  journalTitle: "UNILAG Communication Review",
  volume: 12,
  issue: 1,
  firstPage: 311,
  lastPage: 325,
  doi: "10.12345/ucr.v12i1.001",
  url: "https://example.org/articles/gender-framing",
};

describe("APA", () => {
  it("formats two authors with ampersand", () => {
    const s = formatAPA(base);
    expect(s).toContain("Okafor, A., & Bakare, T. (2026).");
    expect(s).toContain("UNILAG Communication Review, 12(1), 311–325.");
    expect(s).toContain("https://doi.org/10.12345/ucr.v12i1.001");
  });

  it("single author", () => {
    const s = formatAPA({ ...base, authors: [base.authors[0]] });
    expect(s).toMatch(/^Okafor, A\. \(2026\)\./);
  });

  it("three+ authors keeps serial ampersand", () => {
    const s = formatAPA({
      ...base,
      authors: [
        ...base.authors,
        { firstName: "Chidinma", lastName: "Eze" },
      ],
    });
    expect(s).toContain("Okafor, A., Bakare, T., & Eze, C.");
  });

  it("missing DOI falls back to URL", () => {
    const s = formatAPA({ ...base, doi: null });
    expect(s).toContain(base.url);
    expect(s).not.toContain("doi.org");
  });

  it("missing pages omits page range", () => {
    const s = formatAPA({ ...base, firstPage: null, lastPage: null });
    expect(s).toContain("UNILAG Communication Review, 12(1).");
  });

  it("multi-part first names get all initials", () => {
    const s = formatAPA({
      ...base,
      authors: [{ firstName: "Unwana Samuel", lastName: "Akpan" }],
    });
    expect(s).toContain("Akpan, U. S.");
  });
});

describe("MLA", () => {
  it("two authors", () => {
    const s = formatMLA(base);
    expect(s).toContain("Okafor, Adaeze, and Tunde Bakare.");
    expect(s).toContain('"Gender Framing in Nigerian Television News."');
    expect(s).toContain("vol. 12, no. 1, 2026, pp. 311–325.");
  });

  it("three+ authors uses et al.", () => {
    const s = formatMLA({
      ...base,
      authors: [...base.authors, { firstName: "Chidinma", lastName: "Eze" }],
    });
    expect(s).toContain("Okafor, Adaeze, et al.");
  });
});

describe("Chicago", () => {
  it("inverts only the first author", () => {
    const s = formatChicago(base);
    expect(s).toContain("Okafor, Adaeze, and Tunde Bakare.");
    expect(s).toContain("12, no. 1: 311–325.");
  });
});

describe("Harvard", () => {
  it("uses initials and single quotes", () => {
    const s = formatHarvard(base);
    expect(s).toContain("Okafor, A. and Bakare, T. (2026)");
    expect(s).toContain("'Gender Framing in Nigerian Television News',");
    expect(s).toContain("12(1), pp. 311–325.");
  });
});

describe("BibTeX", () => {
  it("produces a valid @article entry", () => {
    const s = formatBibTeX(base);
    expect(s).toMatch(/^@article\{okafor2026,/);
    expect(s).toContain("author  = {Okafor, Adaeze and Bakare, Tunde},");
    expect(s).toContain("pages   = {311--325},");
    expect(s).toContain("doi     = {10.12345/ucr.v12i1.001},");
    expect(s.trim().endsWith("}")).toBe(true);
  });

  it("omits empty fields", () => {
    const s = formatBibTeX({ ...base, doi: null, firstPage: null, lastPage: null });
    expect(s).not.toContain("doi");
    expect(s).not.toContain("pages");
  });
});

describe("RIS", () => {
  it("produces JOUR record with one AU per author", () => {
    const s = formatRIS(base);
    expect(s.startsWith("TY  - JOUR")).toBe(true);
    expect(s).toContain("AU  - Okafor, Adaeze");
    expect(s).toContain("AU  - Bakare, Tunde");
    expect(s).toContain("SP  - 311");
    expect(s).toContain("EP  - 325");
    expect(s.trimEnd().endsWith("ER  -")).toBe(true);
  });
});
