"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";

interface ArticleBodyProps {
  paragraphs: string[];
}

interface TableBlock {
  type: "table";
  caption?: string;
  headers: string[];
  rows: string[][];
}

interface FigureBlock {
  type: "figure";
  caption: string;
  src: string;
}

interface HeadingBlock {
  type: "heading";
  level: number;
  id: string;
  text: string;
}

interface ParagraphBlock {
  type: "paragraph";
  text: string;
}

type ContentBlock = TableBlock | FigureBlock | HeadingBlock | ParagraphBlock;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-")
    .trim();
}

function parseMarkdownTable(lines: string[]): { headers: string[]; rows: string[][] } {
  const contentLines = lines.filter((l) => {
    const trimmed = l.trim();
    return trimmed.startsWith("|") && !trimmed.replace(/\s+/g, "").startsWith("|---");
  });

  if (contentLines.length === 0) return { headers: [], rows: [] };

  const parsed = contentLines.map((l) =>
    l
      .split("|")
      .slice(1, -1)
      .map((c) => c.trim())
  );

  return {
    headers: parsed[0] || [],
    rows: parsed.slice(1),
  };
}

export function ArticleBody({ paragraphs }: ArticleBodyProps) {
  const [activeHeading, setActiveHeading] = useState<string | null>(null);

  const { blocks, headings } = useMemo(() => {
    const result: ContentBlock[] = [];
    const navHeadings: { id: string; text: string }[] = [];
    let i = 0;

    while (i < paragraphs.length) {
      const p = paragraphs[i];

      // Check for Table Caption followed by Table
      if (
        (p.startsWith("Table ") || p.startsWith("TABLE ")) &&
        (p.includes(":") || p.length < 120)
      ) {
        let caption = p;
        if (i + 1 < paragraphs.length && paragraphs[i + 1].startsWith("|")) {
          i++;
          const tableLines: string[] = [];
          while (i < paragraphs.length && paragraphs[i].startsWith("|")) {
            tableLines.push(paragraphs[i]);
            i++;
          }
          const { headers, rows } = parseMarkdownTable(tableLines);
          result.push({
            type: "table",
            caption,
            headers,
            rows,
          });
          continue;
        } else {
          result.push({ type: "paragraph", text: p });
          i++;
          continue;
        }
      }

      // Check for Table without separate caption
      if (p.startsWith("|")) {
        const tableLines: string[] = [];
        while (i < paragraphs.length && paragraphs[i].startsWith("|")) {
          tableLines.push(paragraphs[i]);
          i++;
        }
        const { headers, rows } = parseMarkdownTable(tableLines);
        result.push({
          type: "table",
          headers,
          rows,
        });
        continue;
      }

      // Check for Figure ![caption](/images/articles/...)
      const imgMatch = p.match(/^!\[(.*?)\]\((.*?)\)$/);
      if (imgMatch) {
        result.push({
          type: "figure",
          caption: imgMatch[1],
          src: imgMatch[2],
        });
        i++;
        continue;
      }

      // Check for Section Heading ## ...
      if (p.startsWith("## ")) {
        const text = p.slice(3).trim();
        const id = slugify(text);
        result.push({
          type: "heading",
          level: 2,
          id,
          text,
        });
        navHeadings.push({ id, text });
        i++;
        continue;
      }

      // Standard paragraph
      result.push({
        type: "paragraph",
        text: p,
      });
      i++;
    }

    return { blocks: result, headings: navHeadings };
  }, [paragraphs]);

  return (
    <article className="article-body">
      {/* Table of Contents / Outline navigation for quick navigation */}
      {headings.length > 2 && (
        <nav
          aria-label="Article outline"
          className="no-print my-8 rounded-sm border border-hairline bg-paper-dark/30 p-4 sm:p-5"
        >
          <div className="flex items-center justify-between">
            <h3 className="section-label text-xs font-semibold uppercase tracking-[0.14em] text-secondary">
              Article Contents & Structure
            </h3>
            <span className="text-[11px] text-muted font-sans">
              {headings.length} sections
            </span>
          </div>
          <ul className="mt-3 grid gap-1.5 sm:grid-cols-2 text-sm font-sans">
            {headings.map((h) => (
              <li key={h.id}>
                <a
                  href={`#${h.id}`}
                  onClick={() => setActiveHeading(h.id)}
                  className={`block truncate py-1 text-xs sm:text-[13px] transition-colors hover:text-maroon ${
                    activeHeading === h.id
                      ? "font-semibold text-maroon underline underline-offset-4"
                      : "text-secondary"
                  }`}
                >
                  {h.text}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {/* Main Blocks */}
      <div className="prose-journal space-y-5">
        {blocks.map((block, idx) => {
          switch (block.type) {
            case "heading":
              return (
                <div key={idx} className="pt-6 first:pt-0">
                  <h3
                    id={block.id}
                    className="scroll-mt-24 border-b border-hairline pb-2 font-display text-xl sm:text-2xl font-semibold text-ink"
                  >
                    {block.text}
                  </h3>
                </div>
              );

            case "table":
              return (
                <div key={idx} className="my-8 overflow-hidden rounded-sm border border-hairline bg-paper shadow-xs">
                  {block.caption && (
                    <div className="border-b border-hairline bg-paper-dark/50 px-4 py-3">
                      <p className="font-sans text-xs sm:text-sm font-semibold text-ink">
                        {block.caption}
                      </p>
                    </div>
                  )}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-hairline text-left font-sans text-xs sm:text-sm">
                      {block.headers.length > 0 && (
                        <thead className="bg-paper-dark font-medium text-ink">
                          <tr>
                            {block.headers.map((h, hIdx) => (
                              <th
                                key={hIdx}
                                className="whitespace-nowrap px-3.5 py-2.5 text-xs font-semibold uppercase tracking-wider text-secondary border-r border-hairline last:border-r-0"
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                      )}
                      <tbody className="divide-y divide-hairline bg-paper text-ink">
                        {block.rows.map((row, rIdx) => (
                          <tr
                            key={rIdx}
                            className={`transition-colors hover:bg-paper-dark/40 ${
                              rIdx % 2 === 1 ? "bg-paper-dark/20" : ""
                            }`}
                          >
                            {row.map((cell, cIdx) => (
                              <td
                                key={cIdx}
                                className="px-3.5 py-2 leading-relaxed text-secondary border-r border-hairline last:border-r-0"
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );

            case "figure":
              return (
                <figure
                  key={idx}
                  className="my-8 rounded-sm border border-hairline bg-paper-dark/20 p-3 sm:p-5 text-center shadow-xs"
                >
                  <div className="relative mx-auto flex justify-center">
                    {/* Native responsive image */}
                    <img
                      src={block.src}
                      alt={block.caption || "Article figure"}
                      loading="lazy"
                      className="max-h-[550px] w-auto max-w-full rounded-sm border border-hairline/60 bg-paper object-contain shadow-sm"
                    />
                  </div>
                  {block.caption && (
                    <figcaption className="mt-3 font-sans text-xs sm:text-sm text-secondary italic">
                      {block.caption}
                    </figcaption>
                  )}
                </figure>
              );

            case "paragraph":
            default:
              return (
                <p
                  key={idx}
                  className="font-serif text-[16px] leading-[1.8] text-ink text-justify sm:text-left hyphens-auto"
                >
                  {block.text}
                </p>
              );
          }
        })}
      </div>
    </article>
  );
}
