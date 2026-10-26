import { db } from "@/lib/db";
import {
  type DemoArticle,
  type DemoIssue,
  type DemoVolume,
  DEMO_ARTICLES,
  DEMO_VOLUMES,
  getArticleBySlug,
  getCurrentIssue,
  getIssue,
  getLatestArticles,
  searchArticles,
} from "@/lib/demo-data";

import { stripAcademicTitle } from "./author-name";

function mapDbArticleToDemo(a: any): DemoArticle {
  const volNum = a.issue?.volume?.number ?? 1;
  const issueNum = a.issue?.number ?? 1;
  const volYear =
    a.issue?.volume?.year ??
    a.publishedOnline?.getFullYear() ??
    new Date().getFullYear();

  const authors =
    a.authors && a.authors.length > 0
      ? a.authors.map((auth: any) => {
          const rawName =
            auth.name || `${auth.firstName || ""} ${auth.lastName || ""}`.trim();
          const cleanName = stripAcademicTitle(rawName);
          const rawFirst =
            auth.firstName || rawName.split(" ")[0] || "";
          const rawLast =
            auth.lastName ||
            rawName.split(" ").slice(1).join(" ") ||
            rawName;
          return {
            id: auth.id,
            name: cleanName,
            firstName: stripAcademicTitle(rawFirst),
            lastName: stripAcademicTitle(rawLast),
            affiliation: auth.affiliation || "",
            orcid: auth.orcid || undefined,
            isCorresponding: auth.isCorresponding ?? false,
            order: auth.order ?? 0,
          };
        })
      : [
          {
            id: "author-default",
            name: "Contributing Author",
            firstName: "Contributing",
            lastName: "Author",
            affiliation: "University of Lagos",
            isCorresponding: true,
            order: 0,
          },
        ];

  const keywords =
    a.keywords && a.keywords.length > 0
      ? a.keywords.map((k: any) => ({
          id: k.keyword?.slug || k.id || "kw",
          label: k.keyword?.label || k.label || "",
          slug: k.keyword?.slug || k.slug || "",
        }))
      : (a.submission?.keywordsCsv || "")
          .split(",")
          .map((k: string) => k.trim())
          .filter(Boolean)
          .map((label: string) => ({
            id: label.toLowerCase().replace(/\s+/g, "-"),
            label,
            slug: label.toLowerCase().replace(/\s+/g, "-"),
          }));

  // Preserve full article text, figures, tables, and references from seed manuscripts
  const demoCounterpart = getArticleBySlug(a.slug);
  const bodyParagraphs =
    demoCounterpart && demoCounterpart.bodyParagraphs && demoCounterpart.bodyParagraphs.length > 0
      ? demoCounterpart.bodyParagraphs
      : [a.abstract || ""];
  const references =
    demoCounterpart && demoCounterpart.references && demoCounterpart.references.length > 0
      ? demoCounterpart.references
      : [];
  const resolvedDoi = a.doi || demoCounterpart?.doi || null;

  return {
    id: a.id,
    slug: a.slug,
    title: a.title,
    abstract: a.abstract || "",
    articleType: a.articleType || demoCounterpart?.articleType || "Research Article",
    firstPage: a.firstPage || demoCounterpart?.firstPage || 1,
    lastPage: a.lastPage || demoCounterpart?.lastPage || 1,
    publishedOnline: a.publishedOnline || demoCounterpart?.publishedOnline || new Date(),
    doi: resolvedDoi,
    status: "PUBLISHED",
    orderInIssue: 1,
    issueId: a.issueId,
    volumeNumber: volNum,
    issueNumber: issueNum,
    volumeYear: volYear,
    authors,
    keywords,
    references,
    bodyParagraphs,
  };
}

export async function getLiveArticle(slug: string): Promise<DemoArticle | undefined> {
  try {
    const dbArticle = await db.article.findFirst({
      where: { slug, status: "PUBLISHED" },
      include: {
        authors: { orderBy: { order: "asc" } },
        issue: { include: { volume: true } },
        keywords: { include: { keyword: true } },
        submission: { select: { keywordsCsv: true } },
      },
    });

    if (dbArticle) {
      return mapDbArticleToDemo(dbArticle);
    }
  } catch (err) {
    console.error("Failed to query article from database:", err);
  }

  return getArticleBySlug(slug);
}

export async function getLiveLatestArticles(limit = 10): Promise<DemoArticle[]> {
  try {
    const dbArticles = await db.article.findMany({
      where: { status: "PUBLISHED" },
      include: {
        authors: { orderBy: { order: "asc" } },
        issue: { include: { volume: true } },
        keywords: { include: { keyword: true } },
        submission: { select: { keywordsCsv: true } },
      },
      orderBy: { publishedOnline: "desc" },
      take: limit,
    });

    if (dbArticles && dbArticles.length > 0) {
      return dbArticles.map(mapDbArticleToDemo);
    }
  } catch (err) {
    console.error("Failed to query latest articles from database:", err);
  }

  return getLatestArticles(limit);
}

export async function getLiveCurrentIssue(): Promise<DemoIssue | undefined> {
  try {
    // 1. Look for issue marked current
    let issue = await db.issue.findFirst({
      where: { isCurrent: true },
      include: {
        volume: true,
        articles: {
          where: { status: "PUBLISHED" },
          include: {
            authors: { orderBy: { order: "asc" } },
            issue: { include: { volume: true } },
            keywords: { include: { keyword: true } },
            submission: { select: { keywordsCsv: true } },
          },
          orderBy: { publishedOnline: "desc" },
        },
      },
    });

    // 2. Fallback to latest published issue
    if (!issue) {
      issue = await db.issue.findFirst({
        orderBy: { publishedAt: "desc" },
        include: {
          volume: true,
          articles: {
            where: { status: "PUBLISHED" },
            include: {
              authors: { orderBy: { order: "asc" } },
              issue: { include: { volume: true } },
              keywords: { include: { keyword: true } },
              submission: { select: { keywordsCsv: true } },
            },
            orderBy: { publishedOnline: "desc" },
          },
        },
      });
    }

    if (issue) {
      const volNum = issue.volume?.number ?? 1;
      const volYear =
        issue.volume?.year ??
        issue.publishedAt?.getFullYear() ??
        new Date().getFullYear();
      const articles = issue.articles.map(mapDbArticleToDemo);

      return {
        id: issue.id,
        number: issue.number,
        volumeId: issue.volumeId,
        volumeNumber: volNum,
        volumeYear: volYear,
        title: issue.title || null,
        guestEditor: null,
        publishedAt: issue.publishedAt || new Date(),
        isCurrent: issue.isCurrent,
        articleCount: articles.length,
        articles,
      };
    }
  } catch (err) {
    console.error("Failed to query current issue from database:", err);
  }

  return getCurrentIssue();
}

export async function getLiveIssue(
  volumeNumber: number,
  issueNumber: number
): Promise<DemoIssue | undefined> {
  try {
    const issue = await db.issue.findFirst({
      where: {
        number: issueNumber,
        volume: { number: volumeNumber },
      },
      include: {
        volume: true,
        articles: {
          where: { status: "PUBLISHED" },
          include: {
            authors: { orderBy: { order: "asc" } },
            issue: { include: { volume: true } },
            keywords: { include: { keyword: true } },
            submission: { select: { keywordsCsv: true } },
          },
          orderBy: { publishedOnline: "desc" },
        },
      },
    });

    if (issue) {
      const volNum = issue.volume?.number ?? volumeNumber;
      const volYear =
        issue.volume?.year ??
        issue.publishedAt?.getFullYear() ??
        new Date().getFullYear();
      const articles = issue.articles.map(mapDbArticleToDemo);

      return {
        id: issue.id,
        number: issue.number,
        volumeId: issue.volumeId,
        volumeNumber: volNum,
        volumeYear: volYear,
        title: issue.title || null,
        guestEditor: null,
        publishedAt: issue.publishedAt || new Date(),
        isCurrent: issue.isCurrent,
        articleCount: articles.length,
        articles,
      };
    }
  } catch (err) {
    console.error("Failed to query issue from database:", err);
  }

  return getIssue(volumeNumber, issueNumber);
}

export async function getLiveArchives(): Promise<DemoVolume[]> {
  try {
    const volumes = await db.volume.findMany({
      include: {
        issues: {
          include: {
            articles: {
              where: { status: "PUBLISHED" },
              select: { id: true },
            },
          },
          orderBy: { number: "asc" },
        },
      },
      orderBy: { number: "desc" },
    });

    if (volumes && volumes.length > 0) {
      return volumes.map((vol) => ({
        id: vol.id,
        number: vol.number,
        year: vol.year,
        issues: vol.issues.map((iss) => ({
          id: iss.id,
          number: iss.number,
          volumeId: vol.id,
          volumeNumber: vol.number,
          volumeYear: vol.year,
          title: iss.title || null,
          guestEditor: null,
          publishedAt: iss.publishedAt || new Date(),
          isCurrent: iss.isCurrent,
          articleCount: iss.articles.length,
          articles: [],
        })),
      }));
    }
  } catch (err) {
    console.error("Failed to query archives from database:", err);
  }

  return DEMO_VOLUMES;
}

export async function searchLiveArticles(query: string): Promise<DemoArticle[]> {
  const q = query.trim();
  if (!q) return [];

  const results: DemoArticle[] = [];
  const seenSlugs = new Set<string>();

  try {
    const dbArticles = await db.article.findMany({
      where: {
        status: "PUBLISHED",
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { abstract: { contains: q, mode: "insensitive" } },
          { authors: { some: { name: { contains: q, mode: "insensitive" } } } },
          { keywords: { some: { keyword: { label: { contains: q, mode: "insensitive" } } } } },
          { submission: { keywordsCsv: { contains: q, mode: "insensitive" } } },
        ],
      },
      include: {
        authors: { orderBy: { order: "asc" } },
        issue: { include: { volume: true } },
        keywords: { include: { keyword: true } },
        submission: { select: { keywordsCsv: true } },
      },
      orderBy: { publishedOnline: "desc" },
    });

    for (const a of dbArticles) {
      results.push(mapDbArticleToDemo(a));
      seenSlugs.add(a.slug);
    }
  } catch (err) {
    console.error("Failed to query live search from database:", err);
  }

  try {
    const demoMatches = searchArticles(q);
    for (const d of demoMatches) {
      if (!seenSlugs.has(d.slug)) {
        results.push(d);
        seenSlugs.add(d.slug);
      }
    }
  } catch (err) {
    console.error("Failed to query demo search:", err);
  }

  return results;
}
