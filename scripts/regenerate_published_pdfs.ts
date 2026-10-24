import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { makeSeedPdf } from "./make-seed-pdfs";
import {
  REAL_ARTICLES,
  SPECIAL_ISSUE_TITLE,
  SPECIAL_ISSUE_VOLUME,
  SPECIAL_ISSUE_NUMBER,
  SPECIAL_ISSUE_YEAR,
} from "../prisma/seed-data";
import { formatAuthorName } from "../src/lib/author-name";

const JOURNAL_TITLE = "UNILAG Communication Review";
const ISSN = "1597-0299";

function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .split("-")
    .slice(0, 10)
    .join("-");
}

async function main() {
  const pdfDir = path.resolve(
    process.cwd(),
    process.env.UPLOADS_DIR ?? "./uploads",
    "published"
  );
  await mkdir(pdfDir, { recursive: true });

  console.log(`Regenerating typeset PDFs with full tables & figures for ${REAL_ARTICLES.length} articles...`);

  for (let j = 0; j < REAL_ARTICLES.length; j++) {
    const art = REAL_ARTICLES[j];
    const slug = art.slug || slugify(art.title);
    const firstPage = art.firstPage;
    const lastPage = art.lastPage;

    console.log(`Generating PDF for Article ${j + 1}: ${art.title.slice(0, 50)}...`);

    const pdfBytes = await makeSeedPdf({
      title: art.title,
      authors: art.authors.map((a) => formatAuthorName(a)),
      journalTitle: JOURNAL_TITLE,
      issn: ISSN,
      volume: SPECIAL_ISSUE_VOLUME,
      issue: SPECIAL_ISSUE_NUMBER,
      year: SPECIAL_ISSUE_YEAR,
      firstPage,
      lastPage,
      doi: art.doi,
      abstract: art.abstract,
      keywords: art.keywords,
      bodyParagraphs: art.bodyParagraphs,
      references: art.references,
    });

    const pdfPath = path.join(pdfDir, `${slug}.pdf`);
    await writeFile(pdfPath, pdfBytes);
    console.log(`  -> Saved ${pdfPath} (${(pdfBytes.length / 1024).toFixed(1)} KB)`);
  }

  console.log("All 10 article PDFs successfully regenerated!");
}

main().catch((err) => {
  console.error("PDF regeneration error:", err);
  process.exit(1);
});
