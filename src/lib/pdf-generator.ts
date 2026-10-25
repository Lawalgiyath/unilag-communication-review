import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { JOURNAL } from "./constants";

export interface ArticlePdfAuthor {
  name: string;
  affiliation?: string | null;
  orcid?: string | null;
}

export interface ArticlePdfData {
  title: string;
  authors: ArticlePdfAuthor[] | string[];
  volume: number;
  issue: number;
  year: number;
  firstPage?: number | null;
  lastPage?: number | null;
  doi?: string | null;
  abstract: string;
  keywords?: { label: string }[] | string[];
  bodyParagraphs?: string[];
  references?: { text: string }[] | string[];
}

const PAGE_W = 595.28; // A4
const PAGE_H = 841.89;
const MARGIN = 54;
const BODY_SIZE = 10.5;
const BODY_LEADING = 14.5;

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

export async function generateArticlePdf(data: ArticlePdfData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const timesRoman = await doc.embedFont(StandardFonts.TimesRoman);
  const timesBold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const timesItalic = await doc.embedFont(StandardFonts.TimesRomanItalic);
  const helvetica = await doc.embedFont(StandardFonts.Helvetica);

  const parsedAuthors: ArticlePdfAuthor[] = Array.isArray(data.authors)
    ? data.authors.map((a) => (typeof a === "string" ? { name: a } : a))
    : [];

  const kwList = Array.isArray(data.keywords)
    ? data.keywords.map((k) => (typeof k === "string" ? k : k.label))
    : [];

  const firstPage = data.firstPage ?? 1;
  const lastPage = data.lastPage ?? 25;
  const doi = data.doi ?? "";

  const headerText = `${JOURNAL.title}, Vol. ${data.volume}, No. ${data.issue} (${data.year}), pp. ${firstPage}-${lastPage}`;

  let pageNum = 0;
  const pages: PDFPage[] = [];

  function newPage(): { page: PDFPage; startY: number } {
    pageNum++;
    const page = doc.addPage([PAGE_W, PAGE_H]);
    pages.push(page);

    // Running header
    page.drawText(cleanWinAnsi(headerText), {
      x: MARGIN,
      y: PAGE_H - 36,
      size: 8.5,
      font: helvetica,
      color: rgb(0.4, 0.4, 0.4),
    });

    if (doi) {
      page.drawText(`https://doi.org/${cleanWinAnsi(doi)}`, {
        x: PAGE_W - MARGIN - helvetica.widthOfTextAtSize(`https://doi.org/${cleanWinAnsi(doi)}`, 8),
        y: PAGE_H - 36,
        size: 8,
        font: helvetica,
        color: rgb(0.5, 0.1, 0.1),
      });
    }

    page.drawLine({
      start: { x: MARGIN, y: PAGE_H - 44 },
      end: { x: PAGE_W - MARGIN, y: PAGE_H - 44 },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    });

    // Running footer
    const footerPage = String(firstPage + pageNum - 1);
    page.drawText(footerPage, {
      x: (PAGE_W - timesRoman.widthOfTextAtSize(footerPage, 9)) / 2,
      y: 32,
      size: 9,
      font: timesRoman,
      color: rgb(0.3, 0.3, 0.3),
    });

    return { page, startY: PAGE_H - 65 };
  }

  let { page: curPage, startY: y } = newPage();
  const maxW = PAGE_W - MARGIN * 2;

  function ensureSpace(height: number): void {
    if (y - height < 50) {
      const res = newPage();
      curPage = res.page;
      y = res.startY;
    }
  }

  const drawParagraph = (
    text: string,
    font: PDFFont,
    size: number,
    leading: number,
    opts: { indent?: number; color?: ReturnType<typeof rgb>; justify?: boolean } = {}
  ) => {
    const maxWidth = maxW - (opts.indent ?? 0);
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
              curPage.drawText(word, {
                x: curX,
                y,
                size,
                font,
                color: opts.color ?? rgb(0.12, 0.12, 0.12),
              });
              curX += font.widthOfTextAtSize(word, size) + spacePerGap;
            }
            y -= leading;
            continue;
          }
        }
      }

      curPage.drawText(line, {
        x: MARGIN + (opts.indent ?? 0),
        y,
        size,
        font,
        color: opts.color ?? rgb(0.12, 0.12, 0.12),
      });
      y -= leading;
    }
  };

  // Page 1 Title
  const titleLines = wrapText(data.title, timesBold, 20, maxW);
  for (const line of titleLines) {
    ensureSpace(24);
    curPage.drawText(line, {
      x: MARGIN,
      y,
      size: 20,
      font: timesBold,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= 24;
  }
  y -= 8;

  // Authors with Affiliation & ORCID
  for (let aIdx = 0; aIdx < parsedAuthors.length; aIdx++) {
    const auth = parsedAuthors[aIdx];
    const nameStr = cleanWinAnsi(auth.name);
    ensureSpace(16);
    curPage.drawText(nameStr, {
      x: MARGIN,
      y,
      size: 13,
      font: timesBold,
      color: rgb(0.1, 0.1, 0.1),
    });
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
      const detailLines = wrapText(detailStr, timesItalic, 9, maxW);
      for (const dl of detailLines) {
        ensureSpace(12);
        curPage.drawText(dl, {
          x: MARGIN,
          y,
          size: 9,
          font: timesItalic,
          color: rgb(0.3, 0.3, 0.3),
        });
        y -= 12;
      }
    }
    y -= 4;
  }
  y -= 10;

  // Divider
  curPage.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_W - MARGIN, y },
    thickness: 0.5,
    color: rgb(0.85, 0.85, 0.85),
  });
  y -= 16;

  // Abstract section
  ensureSpace(16);
  curPage.drawText("ABSTRACT", {
    x: MARGIN,
    y,
    size: 10,
    font: timesBold,
    color: rgb(0.1, 0.1, 0.1),
  });
  y -= 14;

  drawParagraph(data.abstract, timesRoman, 9.5, 13, { justify: true });
  y -= 8;

  // Keywords
  if (kwList.length > 0) {
    ensureSpace(14);
    const kwStr = `Keywords: ${kwList.join(", ")}`;
    const kwLines = wrapText(kwStr, timesItalic, 9, maxW);
    for (const line of kwLines) {
      ensureSpace(12);
      curPage.drawText(line, {
        x: MARGIN,
        y,
        size: 9,
        font: timesItalic,
        color: rgb(0.25, 0.25, 0.25),
      });
      y -= 12;
    }
  }
  y -= 16;

  // Divider
  curPage.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_W - MARGIN, y },
    thickness: 0.5,
    color: rgb(0.85, 0.85, 0.85),
  });
  y -= 20;

  // Body Paragraphs
  const paras = data.bodyParagraphs && data.bodyParagraphs.length > 0
    ? data.bodyParagraphs
    : [
        "1. Introduction\nThe media environment is undergoing rapid transformations with significant implications for civic participation, political discourse, and democratic governance.",
        "2. Theoretical Framework and Literature Review\nConnective action and agenda-setting paradigms offer useful frameworks for evaluating the interplay of digital platforms, citizens, and state institutions.",
        "3. Methodology\nThis research uses rigorous qualitative content analysis, examining documentary evidence, digital texts, and institutional communications.",
        "4. Discussion and Findings\nThe empirical evidence reveals that digital platforms increasingly shape the perceptions and mobilisations of electorates.",
        "5. Conclusion and Recommendations\nStrengthening media literacy, regulatory transparency, and ethical AI deployment will be essential for democratic resilience ahead of upcoming electoral contests.",
      ];

  for (const para of paras) {
    if (para.startsWith("## ")) {
      y -= 8;
      ensureSpace(24);
      curPage.drawText(cleanWinAnsi(para.slice(3)), {
        x: MARGIN,
        y,
        size: 12.5,
        font: timesBold,
        color: rgb(0.1, 0.1, 0.1),
      });
      y -= 17;
    } else if (para.startsWith("### ")) {
      y -= 6;
      ensureSpace(20);
      curPage.drawText(cleanWinAnsi(para.slice(4)), {
        x: MARGIN,
        y,
        size: 11,
        font: timesBold,
        color: rgb(0.1, 0.1, 0.1),
      });
      y -= 15;
    } else {
      const subtitleMatch = para.match(/^((?:Theme\s+[A-Za-z0-9]+|Research\s+Questions?|Statement\s+of\s+the\s+Problem|Conceptual\s+Framework|Key\s+Finding\s*[0-9]*):)\s*(.*)$/s);
      if (subtitleMatch) {
        const subTitle = subtitleMatch[1];
        const rest = subtitleMatch[2];
        ensureSpace(20);
        curPage.drawText(cleanWinAnsi(subTitle), {
          x: MARGIN,
          y,
          size: BODY_SIZE,
          font: timesBold,
          color: rgb(0.1, 0.1, 0.1),
        });
        y -= BODY_LEADING;
        if (rest) {
          drawParagraph(rest, timesRoman, BODY_SIZE, BODY_LEADING, { justify: true });
          y -= 6;
        }
      } else {
        drawParagraph(para, timesRoman, BODY_SIZE, BODY_LEADING, { justify: true });
        y -= 6;
      }
    }
  }

  // References
  const refList = Array.isArray(data.references)
    ? data.references.map((r) => (typeof r === "string" ? r : r.text))
    : [];

  if (refList.length > 0) {
    y -= 12;
    ensureSpace(22);
    curPage.drawText("REFERENCES", {
      x: MARGIN,
      y,
      size: 11,
      font: timesBold,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= 16;

    for (const ref of refList) {
      const rLines = wrapText(ref, timesRoman, 9, maxW - 14);
      let isFirst = true;
      for (const line of rLines) {
        ensureSpace(12);
        curPage.drawText(line, {
          x: isFirst ? MARGIN : MARGIN + 14,
          y,
          size: 9,
          font: timesRoman,
          color: rgb(0.2, 0.2, 0.2),
        });
        y -= 12;
        isFirst = false;
      }
      y -= 4;
    }
  }

  return await doc.save();
}
