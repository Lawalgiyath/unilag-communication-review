import fs from "fs";
import { makeSeedPdf } from "./make-seed-pdfs";

const articles = JSON.parse(fs.readFileSync("data/real-articles.json", "utf8"));
const art = articles[0];

async function main() {
  try {
    const pdfBytes = await makeSeedPdf({
      title: art.title,
      authors: art.authors.map((a: any) => a.name),
      journalTitle: "UNILAG Communication Review",
      issn: "1597-0299",
      volume: 9,
      issue: 2,
      year: 2026,
      firstPage: art.firstPage,
      lastPage: art.lastPage,
      doi: art.doi,
      abstract: art.abstract,
      keywords: art.keywords,
      bodyParagraphs: art.bodyParagraphs.slice(0, 15),
      references: art.references.slice(0, 10),
    });
    console.log("SUCCESS! Generated PDF size:", pdfBytes.length);
  } catch (e) {
    console.error("PDF generation failed:", e);
  }
}

main();
