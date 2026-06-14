import { db } from "./db";
import { Prisma } from "@prisma/client";

/**
 * FTS5-backed article search with a LIKE fallback.
 * The FTS table is contentless; we maintain rows here on publish/update.
 */

/** Quote-wrap each token so user input can never be FTS5 syntax. */
export function sanitizeFtsQuery(input: string): string {
  const tokens = input
    .replace(/"/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 12);
  if (tokens.length === 0) return "";
  return tokens.map((t) => `"${t}"`).join(" ");
}

/** (Re)index one published article into FTS. Call on publish and on edit. */
export async function reindexArticle(articleId: string): Promise<void> {
  const article = await db.article.findUnique({
    where: { id: articleId },
    include: {
      authors: { orderBy: { order: "asc" } },
      keywords: { include: { keyword: true } },
    },
  });
  if (!article || article.status !== "PUBLISHED") {
    await removeFromIndex(articleId);
    return;
  }
  const authors = article.authors.map((a) => a.name).join(", ");
  const keywords = article.keywords.map((k) => k.keyword.label).join(", ");

  // Ensure a rowid mapping exists
  await db.$executeRaw`INSERT OR IGNORE INTO article_fts_map (article_id) VALUES (${articleId})`;
  const rows = await db.$queryRaw<{ rowid: bigint }[]>`
    SELECT rowid FROM article_fts_map WHERE article_id = ${articleId}`;
  const rowid = Number(rows[0].rowid);

  // Contentless FTS5: delete then insert
  try {
    await db.$executeRaw`INSERT INTO article_fts (article_fts, rowid, title, abstract, authors, keywords)
      VALUES ('delete', ${rowid}, '', '', '', '')`;
  } catch {
    // row may not exist yet — fine
  }
  await db.$executeRaw`INSERT INTO article_fts (rowid, title, abstract, authors, keywords)
    VALUES (${rowid}, ${article.title}, ${article.abstract}, ${authors}, ${keywords})`;
}

export async function removeFromIndex(articleId: string): Promise<void> {
  const rows = await db.$queryRaw<{ rowid: bigint }[]>`
    SELECT rowid FROM article_fts_map WHERE article_id = ${articleId}`;
  if (rows.length === 0) return;
  const rowid = Number(rows[0].rowid);
  try {
    await db.$executeRaw`INSERT INTO article_fts (article_fts, rowid, title, abstract, authors, keywords)
      VALUES ('delete', ${rowid}, '', '', '', '')`;
  } catch {
    // not indexed — fine
  }
}

export interface SearchFilters {
  query?: string;
  year?: number;
  volume?: number;
  issue?: number;
  keyword?: string; // keyword slug
  author?: string;
  page?: number;
  pageSize?: number;
}

export interface SearchResult {
  articleIds: string[];
  total: number;
}

/**
 * Search published articles. Returns ordered article IDs (FTS rank or
 * recency) plus the total count for pagination.
 */
export async function searchArticles(
  filters: SearchFilters
): Promise<SearchResult> {
  const pageSize = filters.pageSize ?? 20;
  const page = Math.max(1, filters.page ?? 1);

  let ftsIds: string[] | null = null;
  if (filters.query?.trim()) {
    const ftsQuery = sanitizeFtsQuery(filters.query);
    if (ftsQuery) {
      try {
        const rows = await db.$queryRaw<{ article_id: string }[]>`
          SELECT m.article_id FROM article_fts f
          JOIN article_fts_map m ON m.rowid = f.rowid
          WHERE article_fts MATCH ${ftsQuery}
          ORDER BY rank
          LIMIT 500`;
        ftsIds = rows.map((r) => r.article_id);
      } catch {
        ftsIds = null; // fall through to LIKE
      }
    }
    if (ftsIds === null) {
      const term = `%${filters.query.trim()}%`;
      const likeRows = await db.article.findMany({
        where: {
          status: "PUBLISHED",
          OR: [{ title: { contains: term.slice(1, -1) } }, { abstract: { contains: term.slice(1, -1) } }],
        },
        select: { id: true },
        take: 500,
      });
      ftsIds = likeRows.map((r) => r.id);
    }
    if (ftsIds.length === 0) return { articleIds: [], total: 0 };
  }

  const where: Prisma.ArticleWhereInput = {
    status: "PUBLISHED",
    ...(ftsIds ? { id: { in: ftsIds } } : {}),
    ...(filters.volume || filters.year || filters.issue
      ? {
          issue: {
            ...(filters.issue ? { number: filters.issue } : {}),
            volume: {
              ...(filters.volume ? { number: filters.volume } : {}),
              ...(filters.year ? { year: filters.year } : {}),
            },
          },
        }
      : {}),
    ...(filters.keyword
      ? { keywords: { some: { keyword: { slug: filters.keyword } } } }
      : {}),
    ...(filters.author
      ? { authors: { some: { name: { contains: filters.author } } } }
      : {}),
  };

  const [matching, total] = await Promise.all([
    db.article.findMany({
      where,
      select: { id: true },
      orderBy: { publishedOnline: "desc" },
    }),
    db.article.count({ where }),
  ]);

  let ordered = matching.map((m) => m.id);
  if (ftsIds) {
    // preserve FTS relevance order
    const allowed = new Set(ordered);
    ordered = ftsIds.filter((id) => allowed.has(id));
  }

  const start = (page - 1) * pageSize;
  return { articleIds: ordered.slice(start, start + pageSize), total };
}
