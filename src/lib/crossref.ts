/**
 * Crossref Public REST API client for duplicate detection and plagiarism pre-screening.
 * Uses Crossref's free polite pool: https://api.crossref.org
 */

export function normalizeTitle(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Calculates string similarity using word overlap and Dice's coefficient on character bigrams (0.0 to 1.0).
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

  const total = s1.length - 1 + (s2.length - 1);
  return total > 0 ? (2 * intersection) / total : 0;
}

export interface CrossrefMatch {
  source?: "Crossref" | "OpenAlex" | "Europe PMC";
  doi?: string;
  title: string;
  publisher?: string;
  url?: string;
  similarity: number;
  score?: number;
  year?: number | string;
}

export interface CrossrefCheckResult {
  checked: boolean;
  foundDuplicate: boolean;
  highestSimilarity: number;
  matches: CrossrefMatch[];
  queryTitle: string;
  sourcesScanned?: string[];
}

/**
 * Searches Crossref, OpenAlex, and Europe PMC for possible prior publication or duplicate submissions.
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

  const politeEmail = process.env.SMTP_USER || "lawalgiyath200716@gmail.com";
  const userAgent = `UNILAG-Communication-Review/1.0 (mailto:${politeEmail})`;
  const sourcesScanned: string[] = [];
  const matches: CrossrefMatch[] = [];
  const seenDois = new Set<string>();
  const seenTitles = new Set<string>();

  const [crossrefRes, openAlexRes, europePmcRes] = await Promise.allSettled([
    // 1. Crossref
    fetch(
      `https://api.crossref.org/works?query.title=${encodeURIComponent(
        clean
      )}&rows=3&select=DOI,title,publisher,score,URL`,
      {
        headers: { "User-Agent": userAgent },
        signal: AbortSignal.timeout(6000),
      }
    ),
    // 2. OpenAlex
    fetch(
      `https://api.openalex.org/works?search=${encodeURIComponent(
        clean
      )}&per-page=3`,
      {
        headers: { "User-Agent": userAgent },
        signal: AbortSignal.timeout(6000),
      }
    ),
    // 3. Europe PMC
    fetch(
      `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${encodeURIComponent(
        clean
      )}&format=json&pageSize=3`,
      {
        headers: { "User-Agent": userAgent },
        signal: AbortSignal.timeout(6000),
      }
    ),
  ]);

  // Process Crossref
  if (crossrefRes.status === "fulfilled" && crossrefRes.value.ok) {
    sourcesScanned.push("Crossref");
    try {
      const data = await crossrefRes.value.json();
      const items = data.message?.items ?? [];
      for (const item of items) {
        const itemTitle = item.title?.[0] ?? "";
        if (!itemTitle) continue;
        const norm = normalizeTitle(itemTitle);
        if (seenTitles.has(norm)) continue;
        seenTitles.add(norm);
        if (item.DOI) seenDois.add(item.DOI.toLowerCase());

        const sim = calculateTitleSimilarity(clean, itemTitle);
        matches.push({
          source: "Crossref",
          doi: item.DOI,
          title: itemTitle,
          publisher: item.publisher,
          url: item.URL ?? (item.DOI ? `https://doi.org/${item.DOI}` : undefined),
          similarity: Math.round(sim * 100) / 100,
          score: item.score,
        });
      }
    } catch {
      // ignore
    }
  }

  // Process OpenAlex
  if (openAlexRes.status === "fulfilled" && openAlexRes.value.ok) {
    sourcesScanned.push("OpenAlex");
    try {
      const data = await openAlexRes.value.json();
      const items = data.results ?? [];
      for (const item of items) {
        const itemTitle = item.title ?? "";
        if (!itemTitle) continue;
        const norm = normalizeTitle(itemTitle);
        if (seenTitles.has(norm)) continue;
        seenTitles.add(norm);

        const rawDoi = item.doi ? item.doi.replace(/^https?:\/\/doi\.org\//, "") : undefined;
        if (rawDoi && seenDois.has(rawDoi.toLowerCase())) continue;
        if (rawDoi) seenDois.add(rawDoi.toLowerCase());

        const sim = calculateTitleSimilarity(clean, itemTitle);
        matches.push({
          source: "OpenAlex",
          doi: rawDoi,
          title: itemTitle,
          publisher: item.primary_location?.source?.display_name,
          url: item.doi || (rawDoi ? `https://doi.org/${rawDoi}` : undefined),
          similarity: Math.round(sim * 100) / 100,
          year: item.publication_year,
        });
      }
    } catch {
      // ignore
    }
  }

  // Process Europe PMC
  if (europePmcRes.status === "fulfilled" && europePmcRes.value.ok) {
    sourcesScanned.push("Europe PMC");
    try {
      const data = await europePmcRes.value.json();
      const items = data.resultList?.result ?? [];
      for (const item of items) {
        const itemTitle = item.title ?? "";
        if (!itemTitle) continue;
        const norm = normalizeTitle(itemTitle);
        if (seenTitles.has(norm)) continue;
        seenTitles.add(norm);

        const rawDoi = item.doi;
        if (rawDoi && seenDois.has(rawDoi.toLowerCase())) continue;
        if (rawDoi) seenDois.add(rawDoi.toLowerCase());

        const sim = calculateTitleSimilarity(clean, itemTitle);
        matches.push({
          source: "Europe PMC",
          doi: rawDoi,
          title: itemTitle,
          publisher: item.journalTitle,
          url: rawDoi ? `https://doi.org/${rawDoi}` : undefined,
          similarity: Math.round(sim * 100) / 100,
          year: item.pubYear,
        });
      }
    } catch {
      // ignore
    }
  }

  // Sort by highest similarity first
  matches.sort((a, b) => b.similarity - a.similarity);

  const highestSim = matches.length > 0 ? matches[0].similarity : 0;
  const DUPLICATE_THRESHOLD = 0.7; // 70% similarity threshold
  const foundDuplicate = highestSim >= DUPLICATE_THRESHOLD;

  return {
    checked: sourcesScanned.length > 0,
    foundDuplicate,
    highestSimilarity: Math.round(highestSim * 100) / 100,
    matches,
    queryTitle: title,
    sourcesScanned,
  };
}
