import json

def main():
    with open('data/real-articles.json', 'r', encoding='utf-8') as f:
        articles = json.load(f)

    # Format into TypeScript
    ts_content = '''/**
 * Real articles for UNILAG Communication Review
 * Special Issue: Platforms, Power, and Polls: Perspectives Ahead of Nigeria’s 2027 General Elections
 * Volume 9, Number 2 (2026)
 * Extracted from faculty-approved clean manuscripts.
 */

export interface SeedAuthor {
  first: string;
  last: string;
  title?: string;
  email?: string;
  affiliation: string;
  orcid?: string;
  corresponding?: boolean;
}

export interface SeedArticle {
  title: string;
  slug: string;
  type: "RESEARCH_ARTICLE" | "REVIEW_ARTICLE" | "COMMENTARY" | "BOOK_REVIEW";
  authors: SeedAuthor[];
  abstract: string;
  keywords: string[];
  doi: string;
  firstPage: number;
  lastPage: number;
  bodyParagraphs: string[];
  references: string[];
}

export const SPECIAL_ISSUE_TITLE = "Platforms, Power, and Polls: Perspectives Ahead of Nigeria’s 2027 General Elections";
export const SPECIAL_ISSUE_VOLUME = 9;
export const SPECIAL_ISSUE_NUMBER = 2;
export const SPECIAL_ISSUE_YEAR = 2026;

export const REAL_ARTICLES: SeedArticle[] = '''

    # Convert articles to SeedArticle array
    formatted_articles = []
    for a in articles:
        authors_list = []
        for au in a["authors"]:
            authors_list.append({
                "first": au["firstName"],
                "last": au["lastName"],
                "title": au.get("title") or None,
                "email": au.get("email") or None,
                "affiliation": au["affiliation"],
                "orcid": au.get("orcid") or None,
                "corresponding": au.get("isCorresponding", False)
            })
        formatted_articles.append({
            "title": a["title"],
            "slug": a["slug"],
            "type": a["type"],
            "doi": a["doi"],
            "firstPage": a["firstPage"],
            "lastPage": a["lastPage"],
            "abstract": a["abstract"],
            "keywords": a["keywords"],
            "authors": authors_list,
            "bodyParagraphs": a["bodyParagraphs"],
            "references": a["references"]
        })

    ts_content += json.dumps(formatted_articles, indent=2, ensure_ascii=False)
    ts_content += ''';

// Array of issues: Currently Volume 9 Issue 2 (10 articles). Batch 2 can be appended here.
export const SEED_ARTICLES: SeedArticle[][] = [
  REAL_ARTICLES
];

export const REFERENCE_POOL: string[] = Array.from(
  new Set(REAL_ARTICLES.flatMap((a) => a.references))
);

export function buildBodyParagraphs(a: SeedArticle): string[] {
  return a.bodyParagraphs && a.bodyParagraphs.length > 0
    ? a.bodyParagraphs
    : ["## Introduction", a.abstract];
}

export function pickReferences(articleIndex: number, n = 12): string[] {
  const art = REAL_ARTICLES[(articleIndex - 1) % REAL_ARTICLES.length];
  if (art && art.references && art.references.length > 0) {
    return art.references;
  }
  return REFERENCE_POOL.slice(0, n);
}
'''

    with open('prisma/seed-data.ts', 'w', encoding='utf-8') as f:
        f.write(ts_content)

    print("prisma/seed-data.ts successfully written with real data.")

if __name__ == '__main__':
    main()
