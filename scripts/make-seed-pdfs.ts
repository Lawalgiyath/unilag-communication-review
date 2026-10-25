import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import fs from "node:fs";
import path from "node:path";

/**
 * Generates searchable-text article PDFs for seeding, formatted per Google
 * Scholar's parser expectations:
 *  - title is the largest text at the top of page 1 (>= 24pt)
 *  - authors immediately below in 16pt, comma-separated, no affiliations
 *  - bibliographic line (journal, vol, issue, pages, year) in the header
 *  - a "References" section with numbered entries
 * Output is real embedded text (StandardFonts), ~30-80 KB per file.
 */

export interface SeedPdfAuthor {
  name: string;
  affiliation?: string | null;
  orcid?: string | null;
  email?: string | null;
}

export interface SeedPdfInput {
  title: string;
  authors: (string | SeedPdfAuthor)[]; // strings or SeedPdfAuthor objects
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

function cleanWinAnsi(text: string): string {
  if (!text) return "";
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u2026]/g, "...")
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, " ");
}

function wrapText(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number
): string[] {
  const safeText = cleanWinAnsi(text);
  const words = safeText.split(/\s+/).filter(Boolean);
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
    opts: { indent?: number; color?: ReturnType<typeof rgb>; justify?: boolean } = {}
  ) => {
    const maxWidth = contentWidth - (opts.indent ?? 0);
    const lines = wrapText(text, font, size, maxWidth);
    for (let idx = 0; idx < lines.length; idx++) {
      const line = lines[idx];
      const isLastLine = idx === lines.length - 1;
      ensureSpace(leading);

      if (opts.justify && !isLastLine) {
        const words = line.split(/\s+/).filter(Boolean);
        if (words.length > 1) {
          const totalWordsWidth = words.reduce(
            (sum, w) => sum + font.widthOfTextAtSize(w, size),
            0
          );
          const totalSpace = maxWidth - totalWordsWidth;
          const spacePerGap = totalSpace / (words.length - 1);
          const spaceW = font.widthOfTextAtSize(" ", size);

          if (spacePerGap > 0 && spacePerGap < spaceW * 4) {
            let curX = MARGIN + (opts.indent ?? 0);
            for (let wIdx = 0; wIdx < words.length; wIdx++) {
              const word = words[wIdx];
              page.drawText(word, {
                x: curX,
                y,
                size,
                font,
                color: opts.color ?? rgb(0, 0, 0),
              });
              curX += font.widthOfTextAtSize(word, size) + spacePerGap;
            }
            y -= leading;
            continue;
          }
        }
      }

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
  const titleLines = wrapText(input.title, timesBold, 22, contentWidth);
  for (const line of titleLines) {
    page.drawText(line, { x: MARGIN, y, size: 22, font: timesBold });
    y -= 28;
  }
  y -= 8;

  // Authors with Affiliation & ORCID
  const parsedAuthors: SeedPdfAuthor[] = input.authors.map((a) =>
    typeof a === "string" ? { name: a } : a
  );

  for (let aIdx = 0; aIdx < parsedAuthors.length; aIdx++) {
    const auth = parsedAuthors[aIdx];
    const nameStr = cleanWinAnsi(auth.name);
    page.drawText(nameStr, { x: MARGIN, y, size: 13, font: timesBold });
    y -= 16;

    const details: string[] = [];
    if (auth.affiliation) {
      details.push(cleanWinAnsi(auth.affiliation));
    }
    if (auth.orcid) {
      const cleanO = auth.orcid.replace(/^https?:\/\/orcid\.org\//, "").trim();
      details.push(`ORCID: https://orcid.org/${cleanO}`);
    }

    if (details.length > 0) {
      const detailStr = details.join(" | ");
      const detailLines = wrapText(detailStr, timesItalic, 9, contentWidth);
      for (const dl of detailLines) {
        page.drawText(dl, {
          x: MARGIN,
          y,
          size: 9,
          font: timesItalic,
          color: rgb(0.25, 0.25, 0.25),
        });
        y -= 12;
      }
    }
    y -= 3;
  }
  y -= 10;

  // Abstract
  page.drawText("Abstract", { x: MARGIN, y, size: 12, font: timesBold });
  y -= 16;
  drawParagraph(input.abstract, times, 10, 13.5, { justify: true });
  y -= 8;

  drawParagraph(
    `Keywords: ${input.keywords.join(", ")}`,
    timesItalic,
    10,
    13.5
  );
  y -= 16;

  const drawTable = (tableLines: string[]) => {
    const rawRows = tableLines
      .filter((l) => !l.replace(/\s+/g, "").startsWith("|--") && !l.replace(/\s+/g, "").startsWith("|:--"))
      .map((l) =>
        l
          .split("|")
          .slice(1, -1)
          .map((c) => cleanWinAnsi(c.trim()))
      );
    if (rawRows.length === 0) return;

    const numCols = Math.max(...rawRows.map((r) => r.length));
    if (numCols === 0) return;

    const colW = contentWidth / numCols;
    const rowH = 17;
    const padX = 4;

    for (let rIdx = 0; rIdx < rawRows.length; rIdx++) {
      const row = rawRows[rIdx];
      const isHeader = rIdx === 0;
      const font = isHeader ? timesBold : times;
      const fontSize = numCols > 5 ? 7 : numCols > 3 ? 8 : 8.5;

      ensureSpace(rowH + 4);

      if (isHeader) {
        page.drawRectangle({
          x: MARGIN,
          y: y - rowH + 3,
          width: contentWidth,
          height: rowH,
          color: rgb(0.93, 0.93, 0.93),
        });
      }

      page.drawLine({
        start: { x: MARGIN, y: y - rowH + 3 },
        end: { x: MARGIN + contentWidth, y: y - rowH + 3 },
        thickness: isHeader ? 1 : 0.4,
        color: rgb(0.65, 0.65, 0.65),
      });

      for (let cIdx = 0; cIdx < numCols; cIdx++) {
        const text = row[cIdx] ?? "";
        const cellMaxW = colW - 2 * padX;
        let displayText = text;
        while (displayText.length > 3 && font.widthOfTextAtSize(displayText, fontSize) > cellMaxW) {
          displayText = displayText.slice(0, -4) + "...";
        }

        page.drawText(displayText, {
          x: MARGIN + cIdx * colW + padX,
          y: y - rowH + 5,
          size: fontSize,
          font,
          color: rgb(0.1, 0.1, 0.1),
        });
      }

      y -= rowH;
    }
    y -= 10;
  };

  // Body
  for (let i = 0; i < input.bodyParagraphs.length; i++) {
    const para = input.bodyParagraphs[i];
    if (para.startsWith("## ")) {
      ensureSpace(32);
      y -= 8;
      page.drawText(cleanWinAnsi(para.slice(3)), {
        x: MARGIN,
        y,
        size: 13,
        font: timesBold,
      });
      y -= 19;
    } else if (para.startsWith("### ")) {
      ensureSpace(28);
      y -= 6;
      page.drawText(cleanWinAnsi(para.slice(4)), {
        x: MARGIN,
        y,
        size: 11.5,
        font: timesBold,
      });
      y -= 16;
    } else if (para.startsWith("#### ")) {
      ensureSpace(24);
      y -= 4;
      page.drawText(cleanWinAnsi(para.slice(5)), {
        x: MARGIN,
        y,
        size: 11,
        font: timesBold,
      });
      y -= 15;
    } else if (para.startsWith("|")) {
      const tableLines = [para];
      while (i + 1 < input.bodyParagraphs.length && input.bodyParagraphs[i + 1].startsWith("|")) {
        i++;
        tableLines.push(input.bodyParagraphs[i]);
      }
      drawTable(tableLines);
    } else if (para.startsWith("Table ") && (para.includes(":") || para.length < 100)) {
      ensureSpace(24);
      y -= 6;
      page.drawText(cleanWinAnsi(para), {
        x: MARGIN,
        y,
        size: 10,
        font: timesBold,
        color: rgb(0.2, 0.2, 0.2),
      });
      y -= 14;
    } else if (para.startsWith("![")) {
      const match = para.match(/^!\[(.*?)\]\((.*?)\)$/);
      if (match) {
        const caption = cleanWinAnsi(match[1]);
        const imgSrc = match[2];
        const localPath = path.resolve(
          process.cwd(),
          "public",
          imgSrc.replace(/^\//, "")
        );
        if (fs.existsSync(localPath)) {
          try {
            const bytes = fs.readFileSync(localPath);
            const embedded = await doc.embedPng(bytes);
            const dims = embedded.scale(1);
            let w = Math.min(contentWidth, dims.width);
            let h = (dims.height / dims.width) * w;
            const maxH = 220;
            if (h > maxH) {
              h = maxH;
              w = (dims.width / dims.height) * h;
            }
            ensureSpace(h + 30);
            const imgX = MARGIN + (contentWidth - w) / 2;
            page.drawImage(embedded, {
              x: imgX,
              y: y - h,
              width: w,
              height: h,
            });
            y -= h + 6;
            if (caption) {
              const capLines = wrapText(caption, timesItalic, 8.5, contentWidth);
              for (const cl of capLines) {
                ensureSpace(12);
                const cw = timesItalic.widthOfTextAtSize(cl, 8.5);
                page.drawText(cl, {
                  x: MARGIN + (contentWidth - cw) / 2,
                  y,
                  size: 8.5,
                  font: timesItalic,
                  color: rgb(0.35, 0.35, 0.35),
                });
                y -= 11;
              }
            }
            y -= 8;
          } catch (err) {
            console.error("Failed to embed image in PDF:", localPath, err);
          }
        }
      }
    } else {
      // Check for bold subtitle prefix in paragraph (e.g. "Theme One:", "Statement of the Problem:", "Research Question 1:")
      const subtitleMatch = para.match(/^((?:Theme\s+[A-Za-z0-9]+|Research\s+Questions?|Statement\s+of\s+the\s+Problem|Conceptual\s+Framework|Key\s+Finding\s*[0-9]*):)\s*(.*)$/s);
      if (subtitleMatch) {
        const subTitle = subtitleMatch[1];
        const rest = subtitleMatch[2];
        ensureSpace(22);
        page.drawText(cleanWinAnsi(subTitle), {
          x: MARGIN,
          y,
          size: BODY_SIZE,
          font: timesBold,
        });
        y -= BODY_LEADING;
        if (rest) {
          drawParagraph(rest, times, BODY_SIZE, BODY_LEADING, { justify: true });
          y -= 7;
        }
      } else {
        drawParagraph(para, times, BODY_SIZE, BODY_LEADING, { justify: true });
        y -= 7;
      }
    }
  }

  // References
  ensureSpace(40);
  y -= 10;
  page.drawText("References", { x: MARGIN, y, size: 13, font: timesBold });
  y -= 19;
  input.references.forEach((ref, i) => {
    drawParagraph(`${i + 1}. ${ref}`, times, 10, 13, { indent: 0, justify: true });
    y -= 4;
  });

  footer();

  doc.setTitle(input.title);
  doc.setAuthor(parsedAuthors.map((a) => a.name).join("; "));
  doc.setSubject(
    `${input.journalTitle}, ${input.volume}(${input.issue}), ${input.firstPage}-${input.lastPage}`
  );
  doc.setKeywords(input.keywords);
  doc.setProducer("UNILAG Communication Review");
  doc.setCreator("UNILAG Communication Review Editorial System");

  return doc.save();
}
