/**
 * Crossref Public REST API client for duplicate detection and plagiarism pre-screening.
 * Uses Crossref's free polite pool: https://api.crossref.org
 */

export interface CrossrefMatch {
  doi: string;
  title: string;
  publisher?: string;
  url?: string;
  similarity: number;
  score?: number;
}

export interface CrossrefCheckResult {
  checked: boolean;
  foundDuplicate: boolean;
  highestSimilarity: number;
  matches: CrossrefMatch[];
  queryTitle: string;
}

/**
 * Normalizes title text for fair comparison:
 * lowercase, removes non-alphanumeric chars, removes extra spaces.
 */
export function normalizeTitle(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Calculates Sørensen-Dice coefficient on character bigrams (0 to 1).
 * Excellent for detecting identical or slightly modified titles.
 */
export function calculateTitleSimilarity(str1: string, str2: string): number {
  const s1 = normalizeTitle(str1);
  const s2 = normalizeTitle(str2);

  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1.0;

  // Word token overlap as primary check
  const words1 = new Set(s1.split(" ").filter((w) => w.length > 2));
  const words2 = new Set(s2.split(" ").filter((w) => w.length > 2));

  if (words1.size > 0 && words2.size > 0) {
    let commonWords = 0;
    for (const w of words1) {
      if (words2.has(w)) commonWords++;
    }
    const wordJaccard = commonWords / (words1.size + words2.size - commonWords);
    // If exact same significant words in any order, score is high
    if (wordJaccard >= 0.85) return wordJaccard;
  }

  // Character bigram Sørensen-Dice coefficient
  if (s1.length < 2 || s2.length < 2) return 0;

  const getBigrams = (str: string): Map<string, number> => {
    const map = new Map<string, number>();
    for (let i = 0; i < str.length - 1; i++) {
      const bigram = str.substring(i, i + 2);
      map.set(bigram, (map.get(bigram) ?? 0) + 1);
    }
    return map;
  };

  const bg1 = getBigrams(s1);
  const bg2 = getBigrams(s2);

  let intersection = 0;
  for (const [bigram, count1] of bg1.entries()) {
    const count2 = bg2.get(bigram) ?? 0;
    intersection += Math.min(count1, count2);
  }

  const total = (s1.length - 1) + (s2.length - 1);
  return total > 0 ? (2 * intersection) / total : 0;
}

/**
 * Searches Crossref Works for possible prior publication or duplicate submissions.
 * Flags matches with similarity >= 0.70.
 */
export async function checkCrossrefDuplicates(
  title: string
): Promise<CrossrefCheckResult> {
  const clean = title.trim();
  if (clean.length < 5) {
    return {
      checked: false,
      foundDuplicate: false,
      highestSimilarity: 0,
      matches: [],
      queryTitle: title,
    };
  }

  try {
    const politeEmail = process.env.SMTP_USER || "lawalgiyath200716@gmail.com";
    const url = `https://api.crossref.org/works?query.title=${encodeURIComponent(
      clean
    )}&rows=3&select=DOI,title,publisher,score,URL`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000); // 6s max timeout

    const res = await fetch(url, {
      headers: {
        "User-Agent": `UNILAG-Communication-Review/1.0 (mailto:${politeEmail})`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      console.warn(`[crossref] HTTP error ${res.status}`);
      return {
        checked: false,
        foundDuplicate: false,
        highestSimilarity: 0,
        matches: [],
        queryTitle: title,
      };
    }

    const data = await res.json();
    const items = data.message?.items ?? [];

    const matches: CrossrefMatch[] = [];
    let highestSim = 0;

    for (const item of items) {
      const itemTitle = item.title?.[0] ?? "";
      if (!itemTitle) continue;

      const sim = calculateTitleSimilarity(clean, itemTitle);
      if (sim > highestSim) highestSim = sim;

      matches.push({
        doi: item.DOI,
        title: itemTitle,
        publisher: item.publisher,
        url: item.URL ?? `https://doi.org/${item.DOI}`,
        similarity: Math.round(sim * 100) / 100,
        score: item.score,
      });
    }

    // Sort by highest similarity first
    matches.sort((a, b) => b.similarity - a.similarity);

    const DUPLICATE_THRESHOLD = 0.7; // 70% similarity threshold
    const foundDuplicate = highestSim >= DUPLICATE_THRESHOLD;

    return {
      checked: true,
      foundDuplicate,
      highestSimilarity: Math.round(highestSim * 100) / 100,
      matches,
      queryTitle: title,
    };
  } catch (err) {
    console.warn("[crossref:error] Failed duplicate check:", err);
    return {
      checked: false,
      foundDuplicate: false,
      highestSimilarity: 0,
      matches: [],
      queryTitle: title,
    };
  }
}
