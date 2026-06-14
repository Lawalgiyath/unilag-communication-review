import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { makeSeedPdf } from "../scripts/make-seed-pdfs";
import {
  SEED_ARTICLES,
  buildBodyParagraphs,
  pickReferences,
} from "./seed-data";

const db = new PrismaClient();

const JOURNAL_TITLE = "UNILAG Communication Review";
const PUBLISHER =
  "Faculty of Communication and Media Studies, University of Lagos";
const ISSN = "1597-0299";
const EISSN = "3027-1851";
const PASSWORD = "Password123!";

function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .split("-")
    .slice(0, 8)
    .join("-");
}

// ============ Static page content (from the requirements document) ============

const PAGES: { slug: string; title: string; body: string }[] = [
  {
    slug: "about",
    title: "Why Publish with Us?",
    body: `Communication Review is one of Africa's leading academic journals, renowned internationally for its prestige and high-quality scholarship. It maintains rigorous academic standards and publishes cutting-edge research in communication, media, and sociocultural studies. Published by the Faculty of Communication and Media Studies, University of Lagos, Akoka-Lagos, Nigeria, UNILAG Communication Review has been a trusted platform for groundbreaking research for decades.

Publishing with us guarantees:

- **Global Visibility** — Your work reaches an international audience of scholars, researchers, and practitioners.
- **High Impact** — As a top-tier journal, we ensure your research contributes meaningfully to interdisciplinary discourse.
- **Academic Prestige** — Being featured in Communication Review enhances your scholarly reputation and acceptability.
- **Engagement & Recognition** — Join a network of leading thinkers shaping the future of communication studies.

*UNILAG Communication Review — Where Excellence Meets Impact!*`,
  },
  {
    slug: "aims-scope",
    title: "Aims and Scope",
    body: `UNILAG Communication Review is an academic journal dedicated to publishing original, cutting-edge research that explores the intersection between sociocultural issues and communication. We champion studies that critically examine media systems, theories, biases, misrepresentation, and underrepresentation, with a strong emphasis on amplifying voices from diverse and underrepresented backgrounds.

UNILAG Communication Review welcomes high-quality research articles that explore communication, media, and sociocultural-mediatized phenomena. We encourage interdisciplinary scholarship that advances theoretical, empirical, and methodological debates in these fields. Our journal serves as a platform for innovative research that bridges academia and real-world media practices.

Our mission is to serve as a vibrant platform for researchers, policymakers, and decision-makers who leverage academic inquiry to drive social awareness and transformative change. With a longstanding commitment to inclusivity and academic excellence, UNILAG Communication Review provides a vital space for marginalized perspectives and ideas that might otherwise go unheard.

We invite submissions that make substantive contributions to key focus areas, including but not limited to:

- Gender and media representation
- Ethnic, racial, and intercultural dynamics in communication
- Cultural resistance and media activism
- Emerging trends in global and digital communication

Both quantitative and qualitative methodologies are welcome, as we prioritize rigorous, innovative scholarship. Every submission undergoes a double-blind peer review process, evaluated by leading experts in the field to ensure academic rigor and relevance.

Join us in shaping the future of communication research — where diversity, critical inquiry, and impact converge.`,
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
    slug: "ethics",
    title: "Publication Ethics",
    body: `UNILAG Communication Review is committed to the highest standards of publication ethics, guided by the principles of the **Committee on Publication Ethics (COPE)**.

## For Authors

- Manuscripts must be original and must not be under consideration elsewhere.
- All sources must be properly cited; plagiarism in any form is unacceptable.
- All listed authors must have made substantive contributions to the research.
- Conflicts of interest and funding sources must be disclosed.
- Fabrication or falsification of data constitutes grounds for rejection and reporting to the author's institution.

## Plagiarism Screening

All submissions are screened for textual overlap using similarity-detection software before being sent to reviewers. Manuscripts with significant unattributed overlap are rejected at the screening stage.

## For Reviewers

- Reviews must be objective, constructive, and free of personal criticism.
- Reviewers must declare conflicts of interest and decline assignments where impartiality is compromised.
- Manuscripts under review are confidential documents and must not be shared or used for personal advantage.

## For Editors

- Editorial decisions are based solely on scholarly merit, relevance, and fit with the journal's scope.
- Editors recuse themselves from decisions involving their own work or that of close collaborators.

## Corrections and Retractions

Where significant errors are discovered after publication, the journal will publish corrections, and in cases of serious misconduct, retract articles with a clearly marked retraction notice.`,
  },
  {
    slug: "open-access",
    title: "Open Access Statement",
    body: `UNILAG Communication Review is a fully **open access** journal. All articles are freely available online immediately upon publication, without subscription charges or registration barriers.

## License

Unless otherwise stated, articles are published under the **Creative Commons Attribution 4.0 International License (CC BY 4.0)**. This means anyone may copy, distribute, transmit, and adapt the work, provided the original work and source are appropriately credited.

## Copyright

Authors retain copyright in their work. By publishing with UNILAG Communication Review, authors grant the journal the right of first publication under the CC BY 4.0 license.

## Self-Archiving

Authors are encouraged to deposit the published version of their article in institutional repositories, subject repositories, and personal websites — immediately, with no embargo.`,
  },
  {
    slug: "archiving",
    title: "Archiving Policy",
    body: `UNILAG Communication Review is committed to the long-term preservation of the scholarly record.

- **Digital preservation:** all published articles, including full-text PDFs and metadata, are preserved in multiple secure locations, including university library systems.
- **Metadata harvesting:** the journal exposes its complete metadata via an OAI-PMH endpoint, enabling harvesting by aggregators, libraries, and preservation services worldwide.
- **Persistent identification:** articles are assigned DOIs to guarantee stable citation and discovery, and article URLs are permanent.
- **Format:** articles are archived as searchable PDF together with full bibliographic metadata.`,
  },
  {
    slug: "contact",
    title: "Contact",
    body: `**UNILAG Communication Review**

Faculty of Communication and Media Studies
University of Lagos
Akoka-Lagos, Nigeria

**Email:** ucr@unilag.edu.ng

## Editorial Enquiries

For questions about the status of a submission, the review process, or the suitability of a manuscript for the journal, please contact the editorial office by email, quoting your submission number (e.g. UCR-2026-0012) where applicable.

## Technical Support

For problems with the online submission system, password resets, or file upload issues, contact the editorial office with a description of the problem and a screenshot where possible.`,
  },
];

const BOARD = [
  {
    name: "Prof. Sunday Oloruntola",
    role: "Editor-in-Chief",
    affiliation: "University of Lagos, Nigeria",
    order: 1,
  },
  {
    name: "Dr. Unwana Samuel Akpan",
    role: "Editor",
    affiliation: "University of Lagos, Nigeria",
    order: 2,
  },
  {
    name: "Prof. Sunday Oloruntola",
    role: "Member",
    affiliation: "University of Lagos, Nigeria",
    order: 3,
  },
  {
    name: "Prof. Adepoju Tejumaiye",
    role: "Member",
    affiliation: "University of Lagos, Nigeria",
    order: 4,
  },
  {
    name: "Prof. Ishmael Ibrahim",
    role: "Member",
    affiliation: "University of Lagos, Nigeria",
    order: 5,
  },
  {
    name: "Dr. Tayo Popoola",
    role: "Member",
    affiliation: "University of Lagos, Nigeria",
    order: 6,
  },
];

const ANNOUNCEMENTS = [
  {
    slug: "call-for-papers-vol-13",
    title: "Call for Papers — Volume 13 (2027): Communication, AI and African Futures",
    kind: "CALL_FOR_PAPERS",
    publishedAt: new Date("2026-05-02"),
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
  },
  {
    slug: "vol-12-issue-2-published",
    title: "Volume 12, Issue 2 (2026) now online",
    kind: "NEWS",
    publishedAt: new Date("2026-04-20"),
    body: `We are delighted to announce the publication of **Volume 12, Issue 2 (2026)** of UNILAG Communication Review.

This issue features research on data costs and digital news stratification, religious broadcasting and public health, platform moderation in African languages, the editorial cartoon in Nigerian democracy, and media literacy in secondary education.

All articles are freely available — browse the [current issue](/current).`,
  },
  {
    slug: "journal-indexing-update",
    title: "Indexing and visibility update",
    kind: "NEWS",
    publishedAt: new Date("2026-02-10"),
    body: `As part of our commitment to global visibility, all articles published in UNILAG Communication Review now carry full bibliographic metadata for indexing services, including Google Scholar citation tags, DOIs, and OAI-PMH harvesting support for library aggregators.

Authors can expect their published work to be discoverable through major academic search engines. Questions about indexing can be directed to the editorial office.`,
  },
];

// ============ Seeding ============

async function main() {
  console.log("Seeding database…");

  // ---- wipe (idempotent reseeding) ----
  await db.$transaction([
    db.review.deleteMany(),
    db.reviewAssignment.deleteMany(),
    db.decision.deleteMany(),
    db.submissionEvent.deleteMany(),
    db.submissionVersion.deleteMany(),
    db.submissionAuthor.deleteMany(),
    db.articleView.deleteMany(),
    db.articleKeyword.deleteMany(),
    db.articleReference.deleteMany(),
    db.articleAuthor.deleteMany(),
    db.article.deleteMany(),
    db.submission.deleteMany(),
    db.storedFile.deleteMany(),
    db.keyword.deleteMany(),
    db.issue.deleteMany(),
    db.volume.deleteMany(),
    db.announcement.deleteMany(),
    db.boardMember.deleteMany(),
    db.page.deleteMany(),
    db.setting.deleteMany(),
    db.emailLog.deleteMany(),
    db.session.deleteMany(),
    db.userRole.deleteMany(),
    db.user.deleteMany(),
  ]);
  await db.$executeRawUnsafe(`DELETE FROM article_fts`);
  await db.$executeRawUnsafe(`DELETE FROM article_fts_map`);

  // ---- settings ----
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  await db.setting.createMany({
    data: [
      { key: "journal_title", value: JOURNAL_TITLE },
      { key: "publisher", value: PUBLISHER },
      { key: "address", value: "Akoka-Lagos, Nigeria" },
      { key: "issn", value: ISSN },
      { key: "eissn", value: EISSN },
      { key: "contact_email", value: "ucr@unilag.edu.ng" },
      { key: "base_url", value: baseUrl },
      {
        key: "fee_text",
        value:
          "To support the peer review and online publication process, authors are required to pay a non-refundable fee of thirty thousand Naira (₦30,000) per article.",
      },
    ],
  });

  // ---- pages & board & announcements ----
  for (const p of PAGES) await db.page.create({ data: p });
  for (const b of BOARD) await db.boardMember.create({ data: b });
  for (const a of ANNOUNCEMENTS) await db.announcement.create({ data: a });

  // ---- users ----
  const passwordHash = hashSync(PASSWORD, 11);
  const mkUser = (
    email: string,
    name: string,
    roles: string[],
    extra: { title?: string; affiliation?: string; orcid?: string } = {}
  ) =>
    db.user.create({
      data: {
        email,
        name,
        passwordHash,
        affiliation: extra.affiliation ?? "University of Lagos, Nigeria",
        title: extra.title,
        orcid: extra.orcid,
        roles: { create: roles.map((role) => ({ role })) },
      },
    });

  const admin = await mkUser(
    "admin@unilagcommunicationreview.ng",
    "Journal Administrator",
    ["ADMIN", "EDITOR"]
  );
  const editorInChief = await mkUser(
    "oloruntola@unilag.edu.ng",
    "Sunday Oloruntola",
    ["EDITOR", "REVIEWER"],
    { title: "Prof." }
  );
  const editor = await mkUser(
    "uakpan@unilag.edu.ng",
    "Unwana Samuel Akpan",
    ["EDITOR", "REVIEWER"],
    { title: "Dr." }
  );
  const reviewer1 = await mkUser(
    "tejumaiye@unilag.edu.ng",
    "Adepoju Tejumaiye",
    ["REVIEWER"],
    { title: "Prof." }
  );
  const reviewer2 = await mkUser(
    "ibrahim@unilag.edu.ng",
    "Ishmael Ibrahim",
    ["REVIEWER"],
    { title: "Prof." }
  );
  const reviewer3 = await mkUser(
    "popoola@unilag.edu.ng",
    "Tayo Popoola",
    ["REVIEWER"],
    { title: "Dr." }
  );
  const author1 = await mkUser(
    "adaeze.okafor@example.edu.ng",
    "Adaeze Okafor",
    ["AUTHOR"],
    { orcid: "0000-0002-1825-0097" }
  );
  const author2 = await mkUser(
    "tunde.bakare@example.edu.ng",
    "Tunde Bakare",
    ["AUTHOR"],
    { affiliation: "Lagos State University, Nigeria" }
  );
  const author3 = await mkUser(
    "ngozi.chukwu@example.edu.ng",
    "Ngozi Chukwu",
    ["AUTHOR"],
    { affiliation: "University of Nigeria, Nsukka" }
  );

  // ---- volumes, issues, articles ----
  const issueDefs = [
    { volume: 10, year: 2024, issue: 1, published: new Date("2024-04-15") },
    { volume: 10, year: 2024, issue: 2, published: new Date("2024-10-20") },
    { volume: 11, year: 2025, issue: 1, published: new Date("2025-04-18") },
    { volume: 11, year: 2025, issue: 2, published: new Date("2025-10-22") },
    { volume: 12, year: 2026, issue: 1, published: new Date("2026-01-25") },
    { volume: 12, year: 2026, issue: 2, published: new Date("2026-04-20") },
  ];

  const volumes = new Map<number, string>();
  for (const def of issueDefs) {
    if (!volumes.has(def.volume)) {
      const v = await db.volume.create({
        data: { number: def.volume, year: def.year },
      });
      volumes.set(def.volume, v.id);
    }
  }

  const pdfDir = path.resolve(
    process.cwd(),
    process.env.UPLOADS_DIR ?? "./uploads",
    "published"
  );
  await mkdir(pdfDir, { recursive: true });

  let globalIdx = 0;
  for (let i = 0; i < issueDefs.length; i++) {
    const def = issueDefs[i];
    const isCurrent = i === issueDefs.length - 1;
    const issue = await db.issue.create({
      data: {
        volumeId: volumes.get(def.volume)!,
        number: def.issue,
        publishedAt: def.published,
        isCurrent,
      },
    });

    let firstPage = 1;
    const articles = SEED_ARTICLES[i];
    for (let j = 0; j < articles.length; j++) {
      const art = articles[j];
      globalIdx++;
      const lastPage = firstPage + 14 + ((globalIdx * 3) % 8);
      const slug = slugify(art.title);
      const doi = `10.5281/ucr.v${def.volume}i${def.issue}.${String(j + 1).padStart(3, "0")}`;
      const refs = pickReferences(globalIdx);

      // generate PDF
      const pdfBytes = await makeSeedPdf({
        title: art.title,
        authors: art.authors.map((a) => `${a.first} ${a.last}`),
        journalTitle: JOURNAL_TITLE,
        issn: ISSN,
        volume: def.volume,
        issue: def.issue,
        year: def.year,
        firstPage,
        lastPage,
        doi,
        abstract: art.abstract,
        keywords: art.keywords,
        bodyParagraphs: buildBodyParagraphs(art),
        references: refs,
      });
      const pdfFilename = `${slug}.pdf`;
      await writeFile(path.join(pdfDir, pdfFilename), pdfBytes);

      const storedFile = await db.storedFile.create({
        data: {
          filename: pdfFilename,
          originalName: pdfFilename,
          mimeType: "application/pdf",
          sizeBytes: pdfBytes.length,
          kind: "TYPESET_PDF",
          uploadedById: admin.id,
        },
      });

      const received = new Date(def.published);
      received.setMonth(received.getMonth() - 7);
      const accepted = new Date(def.published);
      accepted.setMonth(accepted.getMonth() - 2);

      const article = await db.article.create({
        data: {
          slug,
          issueId: issue.id,
          title: art.title,
          abstract: art.abstract,
          articleType: art.type,
          doi,
          firstPage,
          lastPage,
          receivedDate: received,
          acceptedDate: accepted,
          publishedOnline: def.published,
          status: "PUBLISHED",
          pdfFileId: storedFile.id,
          viewsCount: 200 + ((globalIdx * 731) % 3500),
          orderInIssue: j,
          authors: {
            create: art.authors.map((a, idx) => ({
              name: `${a.first} ${a.last}`,
              firstName: a.first,
              lastName: a.last,
              email: a.corresponding
                ? `${a.first.toLowerCase()}.${a.last.toLowerCase()}@example.edu.ng`
                : null,
              affiliation: a.affiliation,
              orcid: a.orcid,
              isCorresponding: !!a.corresponding,
              order: idx,
            })),
          },
          references: {
            create: refs.map((text, idx) => ({ order: idx, text })),
          },
        },
      });

      // keywords
      for (const kw of art.keywords) {
        const kwSlug = slugify(kw);
        const keyword = await db.keyword.upsert({
          where: { slug: kwSlug },
          create: { slug: kwSlug, label: kw },
          update: {},
        });
        await db.articleKeyword.create({
          data: { articleId: article.id, keywordId: keyword.id },
        });
      }

      // FTS index
      await db.$executeRaw`INSERT OR IGNORE INTO article_fts_map (article_id) VALUES (${article.id})`;
      const rows = await db.$queryRaw<{ rowid: bigint }[]>`
        SELECT rowid FROM article_fts_map WHERE article_id = ${article.id}`;
      const rowid = Number(rows[0].rowid);
      const authorsStr = art.authors.map((a) => `${a.first} ${a.last}`).join(", ");
      await db.$executeRaw`INSERT INTO article_fts (rowid, title, abstract, authors, keywords)
        VALUES (${rowid}, ${art.title}, ${art.abstract}, ${authorsStr}, ${art.keywords.join(", ")})`;

      firstPage = lastPage + 1;
    }
  }

  // ---- in-flight sample submissions (cover the workflow statuses) ----
  const YEAR = 2026;
  let subNumber = 40;

  const mkSubmission = async (opts: {
    title: string;
    abstract: string;
    keywords: string;
    status: string;
    author: { id: string; name: string; email: string; affiliation: string };
    extras?: Record<string, unknown>;
  }) => {
    subNumber++;
    return db.submission.create({
      data: {
        number: subNumber,
        title: opts.title,
        abstract: opts.abstract,
        keywordsCsv: opts.keywords,
        articleType: "RESEARCH_ARTICLE",
        wordCount: 5400,
        status: opts.status,
        correspondingAuthorId: opts.author.id,
        guidelinesConfirmed: true,
        feeAcknowledged: true,
        submittedAt: new Date(`${YEAR}-05-0${(subNumber % 8) + 1}`),
        authors: {
          create: [
            {
              name: opts.author.name,
              email: opts.author.email,
              affiliation: opts.author.affiliation,
              isCorresponding: true,
              order: 0,
            },
          ],
        },
        events: {
          create: [
            {
              type: "SUBMITTED",
              actorId: opts.author.id,
            },
          ],
        },
        ...(opts.extras ?? {}),
      },
    });
  };

  // a couple of fake manuscript files for the in-flight submissions
  const msDir = path.resolve(
    process.cwd(),
    process.env.UPLOADS_DIR ?? "./uploads",
    "manuscripts"
  );
  await mkdir(msDir, { recursive: true });
  const dummyPdf = await makeSeedPdf({
    title: "Anonymized Manuscript (Sample)",
    authors: ["[Author identities removed for review]"],
    journalTitle: JOURNAL_TITLE,
    issn: ISSN,
    volume: 0,
    issue: 0,
    year: YEAR,
    firstPage: 1,
    lastPage: 18,
    doi: null,
    abstract:
      "This is a sample anonymized manuscript file generated for development and demonstration purposes.",
    keywords: ["sample"],
    bodyParagraphs: ["## 1. Introduction", "Sample manuscript body."],
    references: ["Sample reference (2026)."],
  });

  const mkManuscriptFile = async (label: string) => {
    const filename = `seed-${label}.pdf`;
    await writeFile(path.join(msDir, filename), dummyPdf);
    return db.storedFile.create({
      data: {
        filename,
        originalName: `manuscript-${label}.pdf`,
        mimeType: "application/pdf",
        sizeBytes: dummyPdf.length,
        kind: "ANONYMIZED_MANUSCRIPT",
        uploadedById: author1.id,
      },
    });
  };

  const a1 = { id: author1.id, name: "Adaeze Okafor", email: "adaeze.okafor@example.edu.ng", affiliation: "University of Lagos, Nigeria" };
  const a2 = { id: author2.id, name: "Tunde Bakare", email: "tunde.bakare@example.edu.ng", affiliation: "Lagos State University, Nigeria" };
  const a3 = { id: author3.id, name: "Ngozi Chukwu", email: "ngozi.chukwu@example.edu.ng", affiliation: "University of Nigeria, Nsukka" };

  // 1. freshly SUBMITTED
  const subA = await mkSubmission({
    title: "Live-Streamed Worship and the Mediatization of Religious Authority in Lagos Megachurches",
    abstract: "This study examines how live-streamed services reconfigure pastoral authority and congregational participation in three Lagos megachurches, drawing on service observation and member interviews.",
    keywords: "mediatization, religion, live streaming, authority",
    status: "SUBMITTED",
    author: a1,
  });
  const fileA = await mkManuscriptFile("a");
  await db.submissionVersion.create({
    data: { submissionId: subA.id, versionNumber: 1, anonymizedFileId: fileA.id },
  });

  // 2. UNDER_REVIEW with two accepted assignments
  const subB = await mkSubmission({
    title: "Influencer Disclosure Practices and Advertising Regulation on Nigerian Instagram",
    abstract: "An audit of sponsored-content disclosure among 150 Nigerian Instagram influencers, assessed against ARCON's advertising code, with implications for consumer protection.",
    keywords: "influencers, advertising, disclosure, regulation",
    status: "UNDER_REVIEW",
    author: a2,
  });
  const fileB = await mkManuscriptFile("b");
  await db.submissionVersion.create({
    data: { submissionId: subB.id, versionNumber: 1, anonymizedFileId: fileB.id },
  });
  await db.decision.create({
    data: {
      submissionId: subB.id,
      versionNumber: 1,
      decision: "SEND_TO_REVIEW",
      letterToAuthor: "Your manuscript has passed initial screening and has been sent for double-blind peer review.",
      decidedById: editor.id,
    },
  });
  const due = new Date();
  due.setDate(due.getDate() + 28);
  await db.reviewAssignment.create({
    data: {
      submissionId: subB.id,
      reviewerId: reviewer1.id,
      versionNumber: 1,
      status: "ACCEPTED",
      respondedAt: new Date(),
      dueDate: due,
      invitedById: editor.id,
    },
  });
  await db.reviewAssignment.create({
    data: {
      submissionId: subB.id,
      reviewerId: reviewer2.id,
      versionNumber: 1,
      status: "INVITED",
      dueDate: due,
      invitedById: editor.id,
    },
  });

  // 3. REVISIONS_REQUESTED with completed reviews
  const subC = await mkSubmission({
    title: "Mobile Money Adverts and Financial Inclusion Narratives in Nigerian Mass Media",
    abstract: "A multimodal discourse analysis of mobile money advertising across radio, television, and out-of-home media, interrogating who is imagined as the 'unbanked' Nigerian.",
    keywords: "financial inclusion, advertising, discourse analysis, mobile money",
    status: "REVISIONS_REQUESTED",
    author: a3,
  });
  const fileC = await mkManuscriptFile("c");
  await db.submissionVersion.create({
    data: { submissionId: subC.id, versionNumber: 1, anonymizedFileId: fileC.id },
  });
  const asgC1 = await db.reviewAssignment.create({
    data: {
      submissionId: subC.id,
      reviewerId: reviewer1.id,
      versionNumber: 1,
      status: "SUBMITTED",
      respondedAt: new Date(),
      dueDate: due,
      invitedById: editor.id,
    },
  });
  await db.review.create({
    data: {
      assignmentId: asgC1.id,
      recommendation: "MAJOR_REVISIONS",
      commentsToAuthor:
        "The manuscript addresses an important topic, but the analytical framework needs sharper definition. The multimodal analysis would benefit from a systematic coding scheme, and the sample of advertisements should be justified. Sections 2 and 4 partially duplicate each other and should be consolidated.",
      commentsToEditor: "Promising but needs a substantial second round.",
    },
  });
  const asgC2 = await db.reviewAssignment.create({
    data: {
      submissionId: subC.id,
      reviewerId: reviewer3.id,
      versionNumber: 1,
      status: "SUBMITTED",
      respondedAt: new Date(),
      dueDate: due,
      invitedById: editor.id,
    },
  });
  await db.review.create({
    data: {
      assignmentId: asgC2.id,
      recommendation: "MINOR_REVISIONS",
      commentsToAuthor:
        "A well-written study. Please update the literature review to engage recent work on fintech marketing in East Africa, clarify the period of data collection, and correct several APA formatting inconsistencies in the reference list.",
      commentsToEditor: null,
    },
  });
  await db.decision.create({
    data: {
      submissionId: subC.id,
      versionNumber: 1,
      decision: "MAJOR_REVISIONS",
      letterToAuthor:
        "Thank you for your submission. Following double-blind review, we invite you to revise and resubmit your manuscript. Please address the reviewers' comments point by point, in particular the definition of the analytical framework and the coding scheme for the multimodal analysis.",
      decidedById: editorInChief.id,
    },
  });

  // 4. ACCEPTED, awaiting payment/production
  const subD = await mkSubmission({
    title: "Radio Phone-In Programmes and Everyday Accountability Politics in Ibadan",
    abstract: "Based on six months of listening ethnography, this article analyses how morning phone-in programmes mediate accountability claims between residents and local government officials.",
    keywords: "radio, accountability, phone-in, local politics",
    status: "ACCEPTED",
    author: a1,
  });
  const fileD = await mkManuscriptFile("d");
  await db.submissionVersion.create({
    data: { submissionId: subD.id, versionNumber: 1, anonymizedFileId: fileD.id },
  });
  await db.decision.create({
    data: {
      submissionId: subD.id,
      versionNumber: 1,
      decision: "ACCEPT",
      letterToAuthor:
        "We are pleased to inform you that your manuscript has been accepted for publication in UNILAG Communication Review. Payment instructions for the publication fee accompany this letter; production will begin once payment is confirmed.",
      decidedById: editorInChief.id,
    },
  });

  // 5. DESK_REJECTED
  await mkSubmission({
    title: "A General Overview of Communication",
    abstract: "This paper presents a broad overview of the field of communication and its many definitions across time.",
    keywords: "communication, overview",
    status: "DESK_REJECTED",
    author: a2,
    extras: {
      deskRejectReason:
        "The manuscript does not present original research and falls outside the journal's scope, which prioritises empirical and theoretical contributions on communication and sociocultural phenomena.",
    },
  });

  // 6. REJECTED after review
  const subF = await mkSubmission({
    title: "Newspaper Reading Habits of Undergraduate Students",
    abstract: "A survey of newspaper reading habits among 120 undergraduates at a single Nigerian university.",
    keywords: "newspapers, reading habits, students",
    status: "REJECTED",
    author: a3,
  });
  const fileF = await mkManuscriptFile("f");
  await db.submissionVersion.create({
    data: { submissionId: subF.id, versionNumber: 1, anonymizedFileId: fileF.id },
  });
  await db.decision.create({
    data: {
      submissionId: subF.id,
      versionNumber: 1,
      decision: "REJECT",
      letterToAuthor:
        "Following double-blind review, we regret that we are unable to accept your manuscript. Reviewers found the sample insufficient for the claims advanced and the contribution to existing literature limited. We encourage you to consider the attached reports in developing future work.",
      decidedById: editor.id,
    },
  });

  const articleCount = await db.article.count();
  const userCount = await db.user.count();
  const submissionCount = await db.submission.count();
  console.log(
    `Seed complete: ${articleCount} articles, ${userCount} users, ${submissionCount} submissions.`
  );
  console.log(`All seeded accounts use the password: ${PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
