import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

/**
 * Generates searchable-text article PDFs for seeding, formatted per Google
 * Scholar's parser expectations:
 *  - title is the largest text at the top of page 1 (>= 24pt)
 *  - authors immediately below in 16pt, comma-separated, no affiliations
 *  - bibliographic line (journal, vol, issue, pages, year) in the header
 *  - a "References" section with numbered entries
 * Output is real embedded text (StandardFonts), ~30-80 KB per file.
 */

export interface SeedPdfInput {
  title: string;
  authors: string[]; // "First Last" display names
  journalTitle: string;
  issn: string;
  volume: number;
  issue: number;
  year: number;
  firstPage: number;
  lastPage: number;
  doi: string | null;
  abstract: string;
  keywords: string[];
  bodyParagraphs: string[];
  references: string[];
}

const PAGE_W = 595.28; // A4
const PAGE_H = 841.89;
const MARGIN = 54;
const BODY_SIZE = 11;
const BODY_LEADING = 15;

function wrapText(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export async function makeSeedPdf(input: SeedPdfInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const times = await doc.embedFont(StandardFonts.TimesRoman);
  const timesBold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const timesItalic = await doc.embedFont(StandardFonts.TimesRomanItalic);

  const contentWidth = PAGE_W - 2 * MARGIN;
  let pageNumber = input.firstPage;
  let page: PDFPage = doc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;

  const header = () => {
    // Running header: journal name + bibliographic line
    page.drawText(input.journalTitle, {
      x: MARGIN,
      y: PAGE_H - 30,
      size: 8,
      font: timesItalic,
      color: rgb(0.3, 0.3, 0.3),
    });
    const biblio = `Vol. ${input.volume}, No. ${input.issue} (${input.year}), pp. ${input.firstPage}-${input.lastPage} | ISSN ${input.issn}`;
    const w = times.widthOfTextAtSize(biblio, 8);
    page.drawText(biblio, {
      x: PAGE_W - MARGIN - w,
      y: PAGE_H - 30,
      size: 8,
      font: times,
      color: rgb(0.3, 0.3, 0.3),
    });
    page.drawLine({
      start: { x: MARGIN, y: PAGE_H - 36 },
      end: { x: PAGE_W - MARGIN, y: PAGE_H - 36 },
      thickness: 0.5,
      color: rgb(0.6, 0.6, 0.6),
    });
  };

  const footer = () => {
    const pn = String(pageNumber);
    const w = times.widthOfTextAtSize(pn, 9);
    page.drawText(pn, {
      x: (PAGE_W - w) / 2,
      y: 28,
      size: 9,
      font: times,
      color: rgb(0.3, 0.3, 0.3),
    });
  };

  const newPage = () => {
    footer();
    pageNumber += 1;
    page = doc.addPage([PAGE_W, PAGE_H]);
    header();
    y = PAGE_H - MARGIN - 10;
  };

  const ensureSpace = (needed: number) => {
    if (y - needed < MARGIN + 20) newPage();
  };

  const drawParagraph = (
    text: string,
    font: PDFFont,
    size: number,
    leading: number,
    opts: { indent?: number; color?: ReturnType<typeof rgb> } = {}
  ) => {
    const lines = wrapText(text, font, size, contentWidth - (opts.indent ?? 0));
    for (const line of lines) {
      ensureSpace(leading);
      page.drawText(line, {
        x: MARGIN + (opts.indent ?? 0),
        y,
        size,
        font,
        color: opts.color ?? rgb(0, 0, 0),
      });
      y -= leading;
    }
  };

  // ===== Page 1 =====
  header();
  y = PAGE_H - MARGIN - 20;

  // Title: largest text, >= 24pt
  const titleLines = wrapText(input.title, timesBold, 24, contentWidth);
  for (const line of titleLines) {
    page.drawText(line, { x: MARGIN, y, size: 24, font: timesBold });
    y -= 30;
  }
  y -= 6;

  // Authors: 16pt, comma separated, no affiliations on this line
  const authorLine = input.authors.join(", ");
  const authorLines = wrapText(authorLine, times, 16, contentWidth);
  for (const line of authorLines) {
    page.drawText(line, { x: MARGIN, y, size: 16, font: times });
    y -= 21;
  }
  y -= 14;

  // Abstract
  page.drawText("Abstract", { x: MARGIN, y, size: 12, font: timesBold });
  y -= 17;
  drawParagraph(input.abstract, times, 10, 13.5);
  y -= 8;

  drawParagraph(
    `Keywords: ${input.keywords.join(", ")}`,
    timesItalic,
    10,
    13.5
  );
  y -= 16;

  // Body
  for (let i = 0; i < input.bodyParagraphs.length; i++) {
    const para = input.bodyParagraphs[i];
    if (para.startsWith("## ")) {
      ensureSpace(30);
      y -= 6;
      page.drawText(para.slice(3), {
        x: MARGIN,
        y,
        size: 13,
        font: timesBold,
      });
      y -= 19;
    } else {
      drawParagraph(para, times, BODY_SIZE, BODY_LEADING);
      y -= 7;
    }
  }

  // References
  ensureSpace(40);
  y -= 10;
  page.drawText("References", { x: MARGIN, y, size: 13, font: timesBold });
  y -= 19;
  input.references.forEach((ref, i) => {
    drawParagraph(`${i + 1}. ${ref}`, times, 10, 13, { indent: 0 });
    y -= 4;
  });

  footer();

  doc.setTitle(input.title);
  doc.setAuthor(input.authors.join("; "));
  doc.setSubject(
    `${input.journalTitle}, ${input.volume}(${input.issue}), ${input.firstPage}-${input.lastPage}`
  );
  doc.setKeywords(input.keywords);
  doc.setProducer("UNILAG Communication Review");
  doc.setCreator("UNILAG Communication Review Editorial System");

  return doc.save();
}
