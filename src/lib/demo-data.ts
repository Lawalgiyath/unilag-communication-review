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
    title: "Call for Papers — Volume 13 (2027): Communication, AI and African Futures",
    body: `UNILAG Communication Review invites submissions for **Volume 13 (2027)**, with a special focus on **Communication, Artificial Intelligence, and African Futures**.

We welcome original research articles, review articles, and commentaries addressing themes including (but not limited to):

- Generative AI in African newsrooms and creative industries
- Algorithmic governance, moderation, and African languages
- AI, misinformation, and electoral integrity
- Data justice and digital rights in the Global South
- Indigenous knowledge systems and machine learning

**Submission deadline:** 31 October 2026

Manuscripts must not exceed 6,000 words (including references), formatted in APA 7th Edition, 12-point Times New Roman, double-spaced. All submissions undergo double-blind peer review.

Submit through the journal's online submission system. General submissions outside the special focus remain welcome on a rolling basis.`,
    kind: "CALL_FOR_PAPERS",
    publishedAt: new Date("2026-05-02"),
  },
  {
    id: "ann-2",
    slug: "vol-12-issue-2-published",
    title: "Volume 12, Issue 2 (2026) now online",
    body: `We are delighted to announce the publication of **Volume 12, Issue 2 (2026)** of UNILAG Communication Review.

This issue features research on data costs and digital news stratification, religious broadcasting and public health, platform moderation in African languages, the editorial cartoon in Nigerian democracy, and media literacy in secondary education.

All articles are freely available — browse the [current issue](/current).`,
    kind: "NEWS",
    publishedAt: new Date("2026-04-20"),
  },
  {
    id: "ann-3",
    slug: "journal-indexing-update",
    title: "Indexing and visibility update",
    body: `As part of our commitment to global visibility, all articles published in UNILAG Communication Review now carry full bibliographic metadata for indexing services, including Google Scholar citation tags, DOIs, and OAI-PMH harvesting support for library aggregators.

Authors can expect their published work to be discoverable through major academic search engines. Questions about indexing can be directed to the editorial office.`,
    kind: "NEWS",
    publishedAt: new Date("2026-02-10"),
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
  { id: "b1", name: "Prof. Sunday Oloruntola", role: "Editor-in-Chief", affiliation: "University of Lagos, Nigeria", orcid: null, order: 1 },
  { id: "b2", name: "Dr. Unwana Samuel Akpan", role: "Editor", affiliation: "University of Lagos, Nigeria", orcid: null, order: 2 },
  { id: "b3", name: "Prof. Sunday Oloruntola", role: "Member", affiliation: "University of Lagos, Nigeria", orcid: null, order: 3 },
  { id: "b4", name: "Prof. Adepoju Tejumaiye", role: "Member", affiliation: "University of Lagos, Nigeria", orcid: null, order: 4 },
  { id: "b5", name: "Prof. Ishmael Ibrahim", role: "Member", affiliation: "University of Lagos, Nigeria", orcid: null, order: 5 },
  { id: "b6", name: "Dr. Tayo Popoola", role: "Member", affiliation: "University of Lagos, Nigeria", orcid: null, order: 6 },
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
    body: `UNILAG Communication Review is a peer-reviewed academic journal dedicated to advancing scholarly discourse in communication, media, and sociocultural studies. The journal provides a platform for rigorous research that examines the complex interplay between communication systems, media institutions, cultural practices, and societal dynamics.

## Scope of Coverage

The journal welcomes original research, theoretical explorations, and critical analyses across a broad spectrum of communication disciplines, including:

- **Media Studies**: Investigations into media institutions, practices, and their socio-cultural impacts, including journalism, broadcasting, film, and digital media.
- **Communication Theory**: Theoretical frameworks and models that explain communication processes, effects, and meaning-making.
- **Political Communication**: Analysis of political messaging, media-politics relationships, public opinion formation, and democratic processes.
- **Health Communication**: Research on communication strategies and campaigns related to public health, medical contexts, and health behaviour change.
- **Development Communication**: Studies examining the role of communication in social development, community engagement, and global inequalities.
- **ICT and Digital Media**: Research on the impact of digital technologies, social media, and the internet on communication practices and society.
- **Cross-cultural and International Communication**: Comparative studies of communication practices across cultures and nations, with a focus on global media flows.
- **Advertising and Public Relations**: Analysis of persuasive communication, marketing strategies, and reputation management.

## Our Commitment

UNILAG Communication Review is committed to publishing high-quality, impactful research that contributes to our understanding of communication in a rapidly changing world. We welcome submissions from scholars worldwide and particularly encourage research with relevance to African communication contexts and the Global South.`,
  },
  {
    slug: "submission-guidelines",
    title: "Submission Guidelines for Authors",
    body: `To ensure a smooth review process, authors must adhere to the following guidelines:

- **Word Limit:** Articles must not exceed **6,000 words** (including references).
- **Referencing Style:** Use **APA 7th Edition** formatting.
- **Font & Layout:** 12-point Times New Roman, double-spaced, with standard margins.
- **Compliance:** Submissions that do not follow these guidelines will be automatically rejected.

## Preparing Your Submission

Because UNILAG Communication Review uses double-blind peer review, you must upload **two separate files**:

1. **Anonymized manuscript** — the full article with all author names, affiliations, acknowledgements, and self-identifying citations removed.
2. **Title page** — a separate document containing the article title, all author names, affiliations, ORCID iDs (where available), and the corresponding author's email address.

## Submission Checklist

Before submitting, please confirm that:

- The manuscript is original, unpublished, and not under consideration elsewhere.
- The manuscript does not exceed 6,000 words including references.
- All references follow APA 7th Edition.
- The manuscript file contains no author-identifying information.
- An abstract of 150–250 words and 4–6 keywords are included.
- You acknowledge the publication fee of ₦30,000, payable upon acceptance.

Ready to contribute to leading communication scholarship? [Create an account and submit your manuscript](/register) to join a community of distinguished researchers shaping the future of media and communication studies.`,
  },
  {
    slug: "peer-review",
    title: "Peer Review Process",
    body: `UNILAG Communication Review maintains a **double-blind peer review** system to ensure fairness and academic rigor. Each submission is evaluated by:

1. **The Editorial Team** for initial screening — checking scope fit, originality, and compliance with submission guidelines.
2. **At least two anonymous referees** with expertise in the relevant field.

This stringent process guarantees that only high-quality, original, and impactful research is published.

## What to Expect

- **Initial screening:** within 2 weeks of submission. Manuscripts outside the journal's scope or not meeting the guidelines are returned without external review.
- **Peer review:** reviewers are asked to return reports within 4–6 weeks. Reviewer identities are never disclosed to authors, and author identities are never disclosed to reviewers.
- **Decision:** the Editor communicates one of four decisions — Accept, Minor Revisions, Major Revisions, or Reject — together with anonymized reviewer reports.
- **Revisions:** revised manuscripts must be accompanied by a point-by-point response to reviewers and may be returned to the original referees.

## Reviewer Recognition

Our reviewers are active scholars in communication, media, and sociocultural studies. We gratefully acknowledge their contribution to maintaining the journal's standards.`,
  },
  {
    slug: "publication-fee",
    title: "Publication Fee",
    body: `To support the peer review and online publication process, authors are required to pay a **non-refundable fee of thirty thousand Naira (₦30,000) per article**. This fee ensures rigorous editorial handling, professional typesetting, and long-term digital archiving of your work.

## How to Pay

Payment is made by bank transfer after your article has been accepted for publication. Bank account details and a payment reference will be sent to the corresponding author together with the acceptance letter.

After payment, forward your proof of payment (deposit slip or transfer receipt) to the editorial office by replying to the acceptance email. The editorial team will confirm receipt of your payment before your article moves into production.

**Please note:**

- The fee covers peer review administration, copyediting, typesetting, DOI registration, and online archiving.
- No fee is charged at the point of submission — payment is requested only after acceptance.
- The fee is non-refundable once the article enters production.`,
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
