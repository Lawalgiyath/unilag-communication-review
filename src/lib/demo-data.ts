/**
 * Static demo data — all 30 seed articles across 6 issues / 3 volumes.
 * Public pages read from this file; no database is required.
 */

import { REFERENCE_POOL, SEED_ARTICLES, buildBodyParagraphs } from "../../prisma/seed-data";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DemoAuthor {
  name: string;
  firstName: string;
  lastName: string;
  affiliation: string | null;
  orcid: string | null;
  email: string | null;
  isCorresponding: boolean;
  order: number;
}

export interface DemoKeyword {
  slug: string;
  label: string;
}

export interface DemoReference {
  order: number;
  text: string;
}

export interface DemoArticle {
  id: string;
  slug: string;
  title: string;
  abstract: string;
  articleType: string;
  firstPage: number;
  lastPage: number;
  publishedOnline: Date;
  receivedDate: Date;
  acceptedDate: Date;
  viewsCount: number;
  doi: string | null;
  status: "PUBLISHED";
  orderInIssue: number;
  issueId: string;
  volumeNumber: number;
  issueNumber: number;
  volumeYear: number;
  authors: DemoAuthor[];
  keywords: DemoKeyword[];
  references: DemoReference[];
  bodyParagraphs: string[];
}

export interface DemoIssue {
  id: string;
  number: number;
  volumeId: string;
  volumeNumber: number;
  volumeYear: number;
  publishedAt: Date;
  isCurrent: boolean;
  articleCount: number;
  articles: DemoArticle[];
}

export interface DemoVolume {
  id: string;
  number: number;
  year: number;
  issues: DemoIssue[];
}

// ─── Build ────────────────────────────────────────────────────────────────────

function slug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

const ISSUE_DATES: Date[] = [
  new Date("2024-03-01"),
  new Date("2024-09-01"),
  new Date("2025-03-01"),
  new Date("2025-09-01"),
  new Date("2026-03-01"),
  new Date("2026-06-01"), // current
];

const VOLUME_DEFS = [
  { vol: 10, year: 2024 },
  { vol: 10, year: 2024 },
  { vol: 11, year: 2025 },
  { vol: 11, year: 2025 },
  { vol: 12, year: 2026 },
  { vol: 12, year: 2026 },
];

const VIEW_COUNTS = [312, 87, 203, 145, 421, 66, 188, 99, 340, 155, 278, 63, 90, 501, 122, 74, 230, 88, 167, 310, 45, 199, 83, 260, 137, 392, 58, 175, 210, 323];

let globalArticleIndex = 0;
const allArticles: DemoArticle[] = [];
const allIssues: DemoIssue[] = [];
const volumeMap = new Map<number, DemoVolume>();

SEED_ARTICLES.forEach((issueArticles, issueGroupIdx) => {
  const volDef = VOLUME_DEFS[issueGroupIdx];
  const issueNum = issueGroupIdx % 2 === 0 ? 1 : 2;
  const pubDate = ISSUE_DATES[issueGroupIdx];
  const isCurrent = issueGroupIdx === SEED_ARTICLES.length - 1;

  const issueId = `issue-${volDef.vol}-${issueNum}`;
  const volumeId = `vol-${volDef.vol}`;

  const builtArticles: DemoArticle[] = issueArticles.map((a, orderIdx) => {
    const ai = globalArticleIndex++;
    const firstPage = 1 + orderIdx * 22;
    const received = new Date(pubDate);
    received.setMonth(received.getMonth() - 4);
    const accepted = new Date(pubDate);
    accepted.setMonth(accepted.getMonth() - 2);

    const refs = (() => {
      const out: string[] = [];
      for (let k = 0; k < 12; k++) {
        out.push(REFERENCE_POOL[(ai * 7 + k * 3) % REFERENCE_POOL.length]);
      }
      return [...new Set(out)].sort();
    })();

    const authors: DemoAuthor[] = a.authors.map((au, i) => ({
      name: `${au.first} ${au.last}`,
      firstName: au.first,
      lastName: au.last,
      affiliation: au.affiliation,
      orcid: au.orcid ?? null,
      email: au.corresponding ? `${au.first.toLowerCase()}.${au.last.toLowerCase()}@example.edu.ng` : null,
      isCorresponding: au.corresponding ?? false,
      order: i,
    }));

    const keywords: DemoKeyword[] = a.keywords.map((kw) => ({
      slug: slug(kw),
      label: kw,
    }));

    const articleSlug = slug(a.title);

    return {
      id: `art-${ai}`,
      slug: articleSlug,
      title: a.title,
      abstract: a.abstract,
      articleType: a.type,
      firstPage,
      lastPage: firstPage + 20,
      publishedOnline: pubDate,
      receivedDate: received,
      acceptedDate: accepted,
      viewsCount: VIEW_COUNTS[ai % VIEW_COUNTS.length],
      doi: `10.58999/ucr.${volDef.vol}.${issueNum}.${orderIdx + 1}`,
      status: "PUBLISHED" as const,
      orderInIssue: orderIdx,
      issueId,
      volumeNumber: volDef.vol,
      issueNumber: issueNum,
      volumeYear: volDef.year,
      authors,
      keywords,
      references: refs.map((text, i) => ({ order: i, text })),
      bodyParagraphs: buildBodyParagraphs(a),
    };
  });

  allArticles.push(...builtArticles);

  const issue: DemoIssue = {
    id: issueId,
    number: issueNum,
    volumeId,
    volumeNumber: volDef.vol,
    volumeYear: volDef.year,
    publishedAt: pubDate,
    isCurrent,
    articleCount: builtArticles.length,
    articles: builtArticles,
  };
  allIssues.push(issue);

  if (!volumeMap.has(volDef.vol)) {
    volumeMap.set(volDef.vol, {
      id: volumeId,
      number: volDef.vol,
      year: volDef.year,
      issues: [],
    });
  }
  volumeMap.get(volDef.vol)!.issues.push(issue);
});

export const DEMO_ARTICLES: DemoArticle[] = allArticles;
export const DEMO_ISSUES: DemoIssue[] = allIssues;
export const DEMO_VOLUMES: DemoVolume[] = Array.from(volumeMap.values()).sort(
  (a, b) => b.number - a.number
);

// ─── Lookup helpers ───────────────────────────────────────────────────────────

export function getArticleBySlug(s: string): DemoArticle | undefined {
  return DEMO_ARTICLES.find((a) => a.slug === s);
}

export function getIssue(vol: number, iss: number): DemoIssue | undefined {
  return DEMO_ISSUES.find(
    (i) => i.volumeNumber === vol && i.number === iss
  );
}

export function getCurrentIssue(): DemoIssue {
  return DEMO_ISSUES.find((i) => i.isCurrent) ?? DEMO_ISSUES[DEMO_ISSUES.length - 1];
}

export function getLatestArticles(n = 6): DemoArticle[] {
  return [...DEMO_ARTICLES]
    .sort((a, b) => b.publishedOnline.getTime() - a.publishedOnline.getTime())
    .slice(0, n);
}

export function getMostReadArticles(n = 6): DemoArticle[] {
  return [...DEMO_ARTICLES]
    .sort((a, b) => b.viewsCount - a.viewsCount)
    .slice(0, n);
}

export function getRelatedArticles(article: DemoArticle, n = 3): DemoArticle[] {
  const kwSlugs = new Set(article.keywords.map((k) => k.slug));
  return DEMO_ARTICLES.filter(
    (a) => a.id !== article.id && a.keywords.some((k) => kwSlugs.has(k.slug))
  )
    .sort((a, b) => b.publishedOnline.getTime() - a.publishedOnline.getTime())
    .slice(0, n);
}

export function getArticlesByKeyword(kwSlug: string): DemoArticle[] {
  return DEMO_ARTICLES.filter((a) =>
    a.keywords.some((k) => k.slug === kwSlug)
  ).sort((a, b) => b.publishedOnline.getTime() - a.publishedOnline.getTime());
}

export function searchArticles(q: string): DemoArticle[] {
  const lower = q.toLowerCase();
  return DEMO_ARTICLES.filter(
    (a) =>
      a.title.toLowerCase().includes(lower) ||
      a.abstract.toLowerCase().includes(lower) ||
      a.authors.some((au) => au.name.toLowerCase().includes(lower)) ||
      a.keywords.some((k) => k.label.toLowerCase().includes(lower))
  );
}

// ─── Demo announcements ───────────────────────────────────────────────────────

export interface DemoAnnouncement {
  id: string;
  slug: string;
  title: string;
  body: string;
  kind: "NEWS" | "CALL_FOR_PAPERS";
  publishedAt: Date;
}

export const DEMO_ANNOUNCEMENTS: DemoAnnouncement[] = [
  {
    id: "ann-1",
    slug: "call-for-papers-vol-13",
    title: "Call for Papers — Volume 13 (2027)",
    body: `The UNILAG Communication Review invites original research articles, review articles, commentaries, and book reviews for Volume 13 (2027).\n\n**Submission deadline:** 31 October 2026.\n\nWe welcome contributions in all areas of communication and media studies with particular emphasis on African media systems, digital communication, and media policy. All submissions undergo double-blind peer review.\n\nPlease review our [submission guidelines](/submission-guidelines) before submitting.`,
    kind: "CALL_FOR_PAPERS",
    publishedAt: new Date("2026-06-01"),
  },
  {
    id: "ann-2",
    slug: "indexing-google-scholar",
    title: "Communication Review now indexed in Google Scholar",
    body: `We are pleased to announce that all articles published in the UNILAG Communication Review are now indexed in Google Scholar. Authors can verify their articles' presence by searching article titles directly in Google Scholar.\n\nThis milestone improves the discoverability and citation reach of all published work. We thank our editorial board and contributing authors for their role in achieving this recognition.`,
    kind: "NEWS",
    publishedAt: new Date("2026-05-15"),
  },
  {
    id: "ann-3",
    slug: "new-editorial-board-members",
    title: "Welcome to our new Editorial Board members",
    body: `The UNILAG Communication Review is delighted to welcome three new members to its Editorial Board for the 2026–2028 term. The new members bring expertise in digital journalism, platform governance, and health communication.\n\nThe full updated board list is available on our [Editorial Board](/editorial-board) page.`,
    kind: "NEWS",
    publishedAt: new Date("2026-04-20"),
  },
];

export function getAnnouncementBySlug(s: string): DemoAnnouncement | undefined {
  return DEMO_ANNOUNCEMENTS.find((a) => a.slug === s);
}

// ─── Demo editorial board ─────────────────────────────────────────────────────

export interface DemoBoardMember {
  id: string;
  name: string;
  role: string;
  affiliation: string;
  orcid: string | null;
  order: number;
}

export const DEMO_BOARD: DemoBoardMember[] = [
  { id: "b1", name: "Prof. Lai Oso", role: "Editor-in-Chief", affiliation: "University of Lagos, Nigeria", orcid: "0000-0001-5555-1234", order: 0 },
  { id: "b2", name: "Prof. Abiodun Salawu", role: "Editor", affiliation: "North-West University, South Africa", orcid: null, order: 1 },
  { id: "b3", name: "Dr. Nkosi Ndlela", role: "Editor", affiliation: "Inland Norway University, Norway", orcid: null, order: 2 },
  { id: "b4", name: "Prof. Herman Wasserman", role: "Member", affiliation: "University of Cape Town, South Africa", orcid: null, order: 3 },
  { id: "b5", name: "Dr. Chioma Agwu", role: "Member", affiliation: "University of Nigeria, Nsukka", orcid: null, order: 4 },
  { id: "b6", name: "Prof. Kwame Karikari", role: "Member", affiliation: "University of Ghana, Legon", orcid: null, order: 5 },
  { id: "b7", name: "Dr. Aisha Lawan", role: "Member", affiliation: "Bayero University, Kano, Nigeria", orcid: null, order: 6 },
  { id: "b8", name: "Prof. Winston Mano", role: "Member", affiliation: "University of Westminster, UK", orcid: null, order: 7 },
  { id: "b9", name: "Dr. Tunde Akanni", role: "Member", affiliation: "Lagos State University, Nigeria", orcid: null, order: 8 },
];

// ─── Demo static pages ────────────────────────────────────────────────────────

export interface DemoPage {
  slug: string;
  title: string;
  body: string;
}

export const DEMO_PAGES: DemoPage[] = [
  {
    slug: "about",
    title: "About the Journal",
    body: `# About UNILAG Communication Review

The *UNILAG Communication Review* is a double-blind peer-reviewed, open-access academic journal published by the Faculty of Communication and Media Studies, University of Lagos. The journal publishes original research in all areas of communication and media studies, with a special focus on African media systems and the Global South.

## Mission

The journal's mission is to advance scholarship in communication and media studies by providing a rigorous, accessible, and internationally recognised publication venue for researchers working on African communication contexts.

## History

The journal was established in 2025 as the flagship publication of the Faculty of Communication and Media Studies. It publishes two issues per year (March and September).

## Open Access Policy

All articles are published under a Creative Commons Attribution 4.0 (CC BY 4.0) licence. There are no subscription fees for readers. Authors may be required to pay a publication fee to cover editorial costs.

## Contact

For editorial enquiries, please contact: **ucr@unilag.edu.ng**`,
  },
  {
    slug: "aims-scope",
    title: "Aims & Scope",
    body: `# Aims and Scope

The *UNILAG Communication Review* publishes original scholarly work in the following areas:

- **Media and journalism studies** — including print, broadcast, and digital journalism
- **Political communication** — including elections, government communication, and public opinion
- **Digital media and platform studies** — including social media, algorithms, and platform governance
- **Development communication** — including health, agriculture, and community communication
- **Media law and policy** — including regulation, press freedom, and media ethics
- **Cultural and popular media studies** — including film, music, and audience research
- **Media history** — including colonial media, broadcasting history, and archival research

We especially encourage submissions that address African media systems and contribute to communication theory from Global South perspectives.

## Article Types

- **Research Articles** (6,000–10,000 words): Empirical or theoretical contributions with original findings
- **Review Articles** (6,000–10,000 words): Systematic reviews of existing scholarship
- **Commentaries** (2,000–4,000 words): Informed opinion pieces on topical issues
- **Book Reviews** (800–1,500 words): Critical assessments of recently published books`,
  },
  {
    slug: "submission-guidelines",
    title: "Submission Guidelines",
    body: `# Submission Guidelines

Please read these guidelines carefully before submitting to the *UNILAG Communication Review*.

## Eligibility

All submissions must be:

- Original and not under consideration elsewhere
- Written in English
- Between 6,000 and 10,000 words (research/review articles) or 2,000–4,000 words (commentaries)
- Formatted in APA 7th edition

## Manuscript Preparation

1. **Title page** (separate file): Title, all author names, affiliations, ORCID iDs, corresponding author contact
2. **Anonymous manuscript** (main file): Title only — no author names, affiliations, or acknowledgements that could identify the authors
3. **Abstract**: 150–250 words
4. **Keywords**: 4–6 keywords
5. **References**: APA 7th edition

## Submission Process

Submit via the [author dashboard](/dashboard/submissions/new). You will need to create an account first.

## Publication Fee

A publication fee of ₦30,000 applies upon acceptance. Fee waivers are available for authors without institutional funding — contact the editor.`,
  },
  {
    slug: "peer-review",
    title: "Peer Review Process",
    body: `# Peer Review Process

The *UNILAG Communication Review* operates a **double-blind peer review** process. Neither authors nor reviewers know each other's identities.

## Process

1. **Submission** — Author submits anonymised manuscript
2. **Desk review** — Editor-in-Chief checks scope fit and basic quality (1–2 weeks)
3. **Reviewer assignment** — Two qualified reviewers are invited (1–3 weeks)
4. **Review** — Reviewers submit evaluations within 4 weeks
5. **Decision** — Editor communicates decision: Accept, Minor Revisions, Major Revisions, or Reject
6. **Revision** — Authors respond to reviewer comments
7. **Final decision** — Editor makes final accept/reject decision
8. **Production** — Accepted articles enter copyediting and typesetting

## Reviewer Decisions

- **Accept**: Published as submitted (minor corrections only)
- **Minor Revisions**: Small changes required; re-review at editor's discretion
- **Major Revisions**: Substantial revision required; re-sent to reviewers
- **Reject**: Manuscript declined`,
  },
  {
    slug: "ethics",
    title: "Publication Ethics",
    body: `# Publication Ethics

The *UNILAG Communication Review* adheres to the **COPE (Committee on Publication Ethics)** guidelines. All parties — editors, reviewers, and authors — are expected to uphold the highest ethical standards.

## Author Responsibilities

- All listed authors must have contributed substantially to the work
- Data and findings must be reported accurately
- Sources must be cited correctly
- Plagiarism, fabrication, and falsification are grounds for immediate rejection and retraction

## Reviewer Responsibilities

- Reviewers must declare conflicts of interest
- Reviews must be confidential
- Reviewers must report suspected ethical violations to the editor

## Editor Responsibilities

- Editors must make decisions based solely on scholarly merit
- Editors must not disclose submitted manuscript details to third parties
- Editors must manage conflicts of interest transparently`,
  },
  {
    slug: "open-access",
    title: "Open Access Statement",
    body: `# Open Access Statement

The *UNILAG Communication Review* is a fully open-access journal. All articles are freely available online immediately upon publication, with no embargo period.

## Licence

All articles are published under a **Creative Commons Attribution 4.0 International (CC BY 4.0)** licence. Under this licence, readers may:

- Share — copy and redistribute the material in any medium or format
- Adapt — remix, transform, and build upon the material for any purpose, including commercial use

Provided that appropriate credit is given, a link to the licence is provided, and any changes made are indicated.

## No Access Barriers

There are no subscription fees, registration requirements, or paywalls for any content. The journal's commitment to open access reflects the University of Lagos's mission to advance knowledge for the public good.`,
  },
  {
    slug: "contact",
    title: "Contact",
    body: `# Contact

## Editorial Office

**UNILAG Communication Review**  
Faculty of Communication and Media Studies  
University of Lagos  
Akoka-Yaba, Lagos, Nigeria

**Email:** ucr@unilag.edu.ng

## IT Support & Error Reporting

For technical issues with the journal website, please contact:

**Mr. Lawal Giyath**  
Phone: 08062679191

## Submissions

To submit a manuscript, please use the [author submission portal](/dashboard/submissions/new). We do not accept submissions by email.

## Review Enquiries

Authors may enquire about the status of their submission by emailing the editorial office with their submission reference number.`,
  },
  {
    slug: "publication-fee",
    title: "Publication Fee",
    body: `# Publication Fee

## Fee Structure

A publication processing fee of **₦30,000** (thirty thousand naira) applies to articles accepted for publication. The fee covers copyediting, typesetting, DOI registration, and long-term digital archiving.

**No fee is charged at submission.** The fee is only payable after an article has been accepted following peer review.

## Payment Process

Upon acceptance, the corresponding author will receive a payment instruction email. Payment should be made via bank transfer to the Faculty of Communication and Media Studies designated account. Proof of payment must be uploaded through the author dashboard.

## Fee Waivers

The journal is committed to accessibility. Authors without institutional or grant funding may apply for a full or partial waiver by emailing the editor-in-chief at the time of submission. Waiver decisions are made independently of the editorial process.`,
  },
  {
    slug: "archiving",
    title: "Archiving Policy",
    body: `# Archiving Policy

## Digital Preservation

The *UNILAG Communication Review* is committed to the long-term preservation of all published content.

- All published articles are deposited in the **University of Lagos Institutional Repository**
- Article metadata is available via the **OAI-PMH** endpoint at [/oai](/oai)
- The site generates a continuously updated **sitemap** and **RSS feed** to facilitate discovery and archiving by third-party services

## LOCKSS / CLOCKSS

The journal is working toward LOCKSS (Lots of Copies Keep Stuff Safe) network participation to ensure distributed digital preservation.

## Authors' Rights

Authors retain copyright and grant the journal a licence to publish. Authors may self-archive their accepted manuscripts (post-prints) immediately upon publication in any repository, including institutional repositories and preprint servers, with attribution to the journal.`,
  },
];

export function getPageBySlug(s: string): DemoPage | undefined {
  return DEMO_PAGES.find((p) => p.slug === s);
}
