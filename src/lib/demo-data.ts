/**
 * Static real data — 10 real articles for Special Issue Volume 9 Number 2.
 * Public pages read from this file; no database is required.
 */

import {
  SEED_ARTICLES,
  buildBodyParagraphs,
  SPECIAL_ISSUE_TITLE,
  SPECIAL_ISSUE_VOLUME,
  SPECIAL_ISSUE_NUMBER,
  SPECIAL_ISSUE_YEAR,
} from "../../prisma/seed-data";
import { formatAuthorName } from "./author-name";

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
  title?: string | null;
  guestEditor?: string | null;
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
  new Date("2026-10-22"), // Volume 9 Number 2 (Special Issue)
];

const VOLUME_DEFS = [
  {
    vol: SPECIAL_ISSUE_VOLUME,
    year: SPECIAL_ISSUE_YEAR,
    issue: SPECIAL_ISSUE_NUMBER,
    title: SPECIAL_ISSUE_TITLE,
    guestEditor: "Dr. Bisi Crown Olawuyi",
    isCurrent: true,
  },
];


let globalArticleIndex = 0;
const allArticles: DemoArticle[] = [];
const allIssues: DemoIssue[] = [];
const volumeMap = new Map<number, DemoVolume>();

SEED_ARTICLES.forEach((issueArticles, issueGroupIdx) => {
  const volDef = VOLUME_DEFS[issueGroupIdx] ?? VOLUME_DEFS[0];
  const issueNum = volDef.issue;
  const pubDate = ISSUE_DATES[issueGroupIdx] ?? new Date("2026-10-22");
  const isCurrent = true;

  const issueId = `issue-${volDef.vol}-${issueNum}`;
  const volumeId = `vol-${volDef.vol}`;

  const builtArticles: DemoArticle[] = issueArticles.map((a, orderIdx) => {
    const ai = globalArticleIndex++;
    const firstPage = a.firstPage ?? (1 + orderIdx * 20);
    const lastPage = a.lastPage ?? (firstPage + 18);

    const refs = a.references ?? [];

    const authors: DemoAuthor[] = a.authors.map((au, i) => ({
      name: formatAuthorName(au),
      firstName: au.first,
      lastName: au.last,
      affiliation: au.affiliation,
      orcid: au.orcid ?? null,
      email: au.email ?? null,
      isCorresponding: au.corresponding ?? false,
      order: i,
    }));

    const keywords: DemoKeyword[] = a.keywords.map((kw) => ({
      slug: slug(kw),
      label: kw,
    }));

    const articleSlug = a.slug || slug(a.title);

    return {
      id: `art-${ai}`,
      slug: articleSlug,
      title: a.title,
      abstract: a.abstract,
      articleType: a.type,
      firstPage,
      lastPage,
      publishedOnline: pubDate,
      doi: a.doi || null,
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
    title: volDef.title,
    guestEditor: volDef.guestEditor,
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
  kind: "NEWS";
  publishedAt: Date;
}

export const DEMO_ANNOUNCEMENTS: DemoAnnouncement[] = [
  {
    id: "ann-1",
    slug: "special-issue-vol-9-no-2-published",
    title: "Special Issue Published: Platforms, Power, and Polls: Perspectives Ahead of Nigeria’s 2027 General Elections",
    body: `The Faculty of Communication and Media Studies, University of Lagos, is proud to announce the publication of **Volume 9, Number 2 (2026)** — our Special Issue titled **Platforms, Power, and Polls: Perspectives Ahead of Nigeria’s 2027 General Elections**.

Guest Edited by **Dr. Bisi Crown Olawuyi** (University of Ibadan), with Editor **Dr. Unwana Samuel Akpan** and Editor-in-Chief **Prof. Oloruntola Sunday**, this special issue features 10 peer-reviewed research articles addressing youth digital activism, electoral credibility, real-time result transmission, broadcast journalism, musical satire, and artificial intelligence in Nigerian politics.

All articles are published open access with official Zenodo DOIs and available for immediate reading and PDF download. Browse the [Current Issue](/current) to access the table of contents.`,
    kind: "NEWS",
    publishedAt: new Date("2026-10-22"),
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
  {
    id: "b1",
    name: "Dr. Bisi Crown Olawuyi",
    role: "Special Issue Guest Editor",
    affiliation: "Department of Communication and Language Arts, University of Ibadan, Nigeria",
    orcid: null,
    order: 1,
  },
  {
    id: "b2",
    name: "Prof. Sunday Oloruntola",
    role: "Editor-in-Chief",
    affiliation: "Faculty of Communication and Media Studies, University of Lagos, Nigeria",
    orcid: null,
    order: 2,
  },
  {
    id: "b3",
    name: "Unwana Samuel Akpan, Ph.D.",
    role: "Editor",
    affiliation: "Faculty of Communication and Media Studies, University of Lagos, Nigeria",
    orcid: null,
    order: 3,
  },
  {
    id: "b4",
    name: "Prof. Adepoju Tejumaiye",
    role: "Member",
    affiliation: "Faculty of Communication and Media Studies, University of Lagos, Nigeria",
    orcid: null,
    order: 4,
  },
  {
    id: "b5",
    name: "Prof. Ishmael Ibrahim",
    role: "Member",
    affiliation: "Faculty of Communication and Media Studies, University of Lagos, Nigeria",
    orcid: null,
    order: 5,
  },
  {
    id: "b6",
    name: "Dr. Tayo Popoola",
    role: "Member",
    affiliation: "Faculty of Communication and Media Studies, University of Lagos, Nigeria",
    orcid: null,
    order: 6,
  },
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
