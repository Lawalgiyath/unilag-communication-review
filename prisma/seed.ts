import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { makeSeedPdf } from "../scripts/make-seed-pdfs";
import {
  REAL_ARTICLES,
  SEED_ARTICLES,
  buildBodyParagraphs,
  SPECIAL_ISSUE_TITLE,
  SPECIAL_ISSUE_VOLUME,
  SPECIAL_ISSUE_NUMBER,
  SPECIAL_ISSUE_YEAR,
} from "./seed-data";
import { formatAuthorName } from "../src/lib/author-name";

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
    .slice(0, 10)
    .join("-");
}

// ============ Static page content ============

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

For questions about the status of a submission, the review process, or the suitability of a manuscript for the journal, please contact the editorial office by email, quoting your submission number where applicable.

## Technical Support

For problems with the online submission system, password resets, or file upload issues, contact the editorial office with a description of the problem.`,
  },
];

const BOARD = [
  {
    name: "Dr. Ebenezer Adebisi Olawuyi",
    role: "Special Issue Guest Editor",
    affiliation: "Department of Communication and Language Arts, University of Ibadan, Nigeria",
    order: 1,
  },
  {
    name: "Prof. Sunday Oloruntola",
    role: "Editor-in-Chief",
    affiliation: "Faculty of Communication and Media Studies, University of Lagos, Nigeria",
    order: 2,
  },
  {
    name: "Dr. Unwana Samuel Akpan",
    role: "Editor",
    affiliation: "Department of Journalism, Broadcasting and Media Studies, University of Lagos, Nigeria.",
    order: 3,
  },
  {
    name: "Prof. Adepoju Tejumaiye",
    role: "Member",
    affiliation: "Faculty of Communication and Media Studies, University of Lagos, Nigeria",
    order: 4,
  },
  {
    name: "Prof. Ishmael Ibrahim",
    role: "Member",
    affiliation: "Faculty of Communication and Media Studies, University of Lagos, Nigeria",
    order: 5,
  },
  {
    name: "Dr. Tayo Popoola",
    role: "Member",
    affiliation: "Faculty of Communication and Media Studies, University of Lagos, Nigeria",
    order: 6,
  },
];

const ANNOUNCEMENTS = [
  {
    slug: "special-issue-vol-9-no-2-published",
    title: "Special Issue Published: Platforms, Power, and Polls: Perspectives Ahead of Nigeria’s 2027 General Elections",
    kind: "NEWS",
    publishedAt: new Date("2026-10-22"),
    body: `The Faculty of Communication and Media Studies, University of Lagos, is proud to announce the publication of **Volume 9, Number 2 (2026)** — our Special Issue titled **Platforms, Power, and Polls: Perspectives Ahead of Nigeria’s 2027 General Elections**.

Guest Edited by **Dr. Ebenezer Adebisi Olawuyi** (Department of Communication and Language Arts, University of Ibadan), with Editor **Dr. Unwana Samuel Akpan** (Department of Journalism, Broadcasting and Media Studies, University of Lagos) and Editor-in-Chief **Prof. Sunday Oloruntola**, this special issue features 10 peer-reviewed research articles addressing youth digital activism, electoral credibility, real-time result transmission, broadcast journalism, musical satire, and artificial intelligence in Nigerian politics.

All articles are published open access with official Zenodo DOIs and available for immediate reading and PDF download. Browse the [Current Issue](/current) to access the table of contents.`,
  },
];

// ============ Seeding ============

async function main() {
  console.log("Seeding database with real faculty data…");

  // ---- wipe (idempotent reseeding) ----
  await db.$transaction([
    (db as any).passwordResetToken ? (db as any).passwordResetToken.deleteMany() : db.$executeRawUnsafe(`DELETE FROM PasswordResetToken`),
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
  try {
    await db.$executeRawUnsafe(`DROP TABLE IF EXISTS article_fts`);
    await db.$executeRawUnsafe(`DROP TABLE IF EXISTS article_fts_map`);
    await db.$executeRawUnsafe(`
      CREATE VIRTUAL TABLE article_fts USING fts5(
        title, abstract, authors, keywords,
        content='', tokenize='porter unicode61'
      )
    `);
    await db.$executeRawUnsafe(`
      CREATE TABLE article_fts_map (
        rowid INTEGER PRIMARY KEY AUTOINCREMENT,
        article_id TEXT UNIQUE NOT NULL
      )
    `);
  } catch {
    // Non-SQLite database (PostgreSQL); skip FTS virtual tables
  }

  // ---- settings ----
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://unilag-communication-review.vercel.app";
  await db.setting.createMany({
    data: [
      { key: "journal_title", value: JOURNAL_TITLE },
      { key: "publisher", value: PUBLISHER },
      { key: "address", value: "Akoka-Lagos, Nigeria" },
      { key: "issn", value: ISSN },
      { key: "eissn", value: EISSN },
      { key: "contact_email", value: "unilagcommunicationreview@gmail.com" },
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
        affiliation: extra.affiliation ?? "Faculty of Communication and Media Studies, University of Lagos, Nigeria",
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
    "Prof. Oloruntola Sunday",
    ["EDITOR", "REVIEWER"],
    { title: "Prof." }
  );
  const editor = await mkUser(
    "uakpan@unilag.edu.ng",
    "Dr. Unwana Samuel Akpan",
    ["EDITOR", "REVIEWER"],
    { title: "Dr.", affiliation: "Department of Journalism, Broadcasting and Media Studies, University of Lagos, Nigeria." }
  );
  const guestEditor = await mkUser(
    "bisi.olawuyi@ui.edu.ng",
    "Dr. Ebenezer Adebisi Olawuyi",
    ["EDITOR", "REVIEWER"],
    { title: "Dr.", affiliation: "Department of Communication and Language Arts, University of Ibadan, Nigeria" }
  );
  await mkUser(
    "tejumaiye@unilag.edu.ng",
    "Prof. Adepoju Tejumaiye",
    ["REVIEWER"],
    { title: "Prof." }
  );
  await mkUser(
    "ibraheem@unilag.edu.ng",
    "Prof. Ismail Ibraheem",
    ["REVIEWER"],
    { title: "Prof." }
  );
  await mkUser(
    "popoola@unilag.edu.ng",
    "Prof. Popoola Ibitayo Samuel",
    ["REVIEWER"],
    { title: "Prof." }
  );

  // Author accounts for corresponding authors of real articles
  const authorAccounts = new Map<string, string>();
  for (const art of REAL_ARTICLES) {
    const corr = art.authors.find((a) => a.corresponding) ?? art.authors[0];
    const email = corr.email || `${corr.first.toLowerCase().replace(/[^a-z]/g, "")}@example.edu.ng`;
    if (!authorAccounts.has(email)) {
      const u = await mkUser(
        email,
        `${corr.first} ${corr.last}`,
        ["AUTHOR"],
        {
          title: corr.title || undefined,
          affiliation: corr.affiliation,
          orcid: corr.orcid || undefined,
        }
      );
      authorAccounts.set(email, u.id);
    }
  }

  // ---- Volume & Issue (Volume 9, Number 2 - Special Issue) ----
  const volume = await db.volume.create({
    data: {
      number: SPECIAL_ISSUE_VOLUME,
      year: SPECIAL_ISSUE_YEAR,
    },
  });

  const issue = await db.issue.create({
    data: {
      volumeId: volume.id,
      number: SPECIAL_ISSUE_NUMBER,
      title: SPECIAL_ISSUE_TITLE,
      publishedAt: new Date("2026-10-22"),
      isCurrent: true,
      coverBlurb: "Platforms, Power, and Polls: Perspectives Ahead of Nigeria’s 2027 General Elections. Guest Editor: Dr. Ebenezer Adebisi Olawuyi.",
    },
  });

  const pdfDir = path.resolve(
    process.cwd(),
    process.env.UPLOADS_DIR ?? "./uploads",
    "published"
  );
  await mkdir(pdfDir, { recursive: true });

  console.log(`Generating typeset PDFs and seeding ${REAL_ARTICLES.length} articles for Volume 9 Number 2…`);

  for (let j = 0; j < REAL_ARTICLES.length; j++) {
    const art = REAL_ARTICLES[j];
    const slug = art.slug || slugify(art.title);
    const doi = art.doi;
    const firstPage = art.firstPage;
    const lastPage = art.lastPage;
    const refs = art.references;

    // generate PDF with real text
    const pdfBytes = await makeSeedPdf({
      title: art.title,
      authors: art.authors.map((a) => formatAuthorName(a)),
      journalTitle: JOURNAL_TITLE,
      issn: ISSN,
      volume: SPECIAL_ISSUE_VOLUME,
      issue: SPECIAL_ISSUE_NUMBER,
      year: SPECIAL_ISSUE_YEAR,
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

    const corr = art.authors.find((a) => a.corresponding) ?? art.authors[0];
    const corrEmail = corr.email || `${corr.first.toLowerCase().replace(/[^a-z]/g, "")}@example.edu.ng`;
    const corrUserId = authorAccounts.get(corrEmail) ?? admin.id;

    const storedFile = await db.storedFile.create({
      data: {
        filename: pdfFilename,
        originalName: pdfFilename,
        mimeType: "application/pdf",
        sizeBytes: pdfBytes.length,
        kind: "TYPESET_PDF",
        uploadedById: admin.id,
        fileData: Buffer.from(pdfBytes),
      },
    });

    const received = new Date("2026-08-15");
    const accepted = new Date("2026-10-10");
    const published = new Date("2026-10-22");

    // Create completed submission record so dashboard workflow is fully populated
    const submission = await db.submission.create({
      data: {
        number: j + 1,
        title: art.title,
        abstract: art.abstract,
        keywordsCsv: art.keywords.join(", "),
        articleType: art.type,
        wordCount: 5500 + (j * 150),
        status: "PUBLISHED",
        correspondingAuthorId: corrUserId,
        guidelinesConfirmed: true,
        feeAcknowledged: true,
        paymentConfirmed: true,
        paymentConfirmedAt: accepted,
        paymentConfirmedById: editor.id,
        submittedAt: received,
        authors: {
          create: art.authors.map((a, idx) => ({
            name: formatAuthorName(a),
            email: a.email || `${a.first.toLowerCase().replace(/[^a-z]/g, "")}@example.edu.ng`,
            affiliation: a.affiliation,
            orcid: a.orcid || null,
            isCorresponding: !!a.corresponding,
            order: idx,
          })),
        },
        events: {
          create: [
            { type: "SUBMITTED", actorId: corrUserId, createdAt: received },
            { type: "ACCEPTED", actorId: editor.id, createdAt: accepted },
            { type: "PUBLISHED", actorId: admin.id, createdAt: published },
          ],
        },
      },
    });

    const article = await db.article.create({
      data: {
        slug,
        issueId: issue.id,
        submissionId: submission.id,
        title: art.title,
        abstract: art.abstract,
        articleType: art.type,
        doi,
        firstPage,
        lastPage,
        receivedDate: received,
        acceptedDate: accepted,
        publishedOnline: published,
        status: "PUBLISHED",
        pdfFileId: storedFile.id,
        viewsCount: 300 + ((j * 137) % 500),
        orderInIssue: j,
        authors: {
          create: art.authors.map((a, idx) => ({
            name: formatAuthorName(a),
            firstName: a.first,
            lastName: a.last,
            email: a.email || null,
            affiliation: a.affiliation,
            orcid: a.orcid || null,
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

    // FTS index (SQLite only)
    try {
      await db.$executeRaw`INSERT OR IGNORE INTO article_fts_map (article_id) VALUES (${article.id})`;
      const rows = await db.$queryRaw<{ rowid: bigint }[]>`
        SELECT rowid FROM article_fts_map WHERE article_id = ${article.id}`;
      if (rows && rows.length > 0) {
        const rowid = Number(rows[0].rowid);
        const authorsStr = art.authors.map((a) => `${a.first} ${a.last}`).join(", ");
        await db.$executeRaw`INSERT INTO article_fts (rowid, title, abstract, authors, keywords)
          VALUES (${rowid}, ${art.title}, ${art.abstract}, ${authorsStr}, ${art.keywords.join(", ")})`;
      }
    } catch {
      // Non-SQLite database fallback
    }
  }

  const articleCount = await db.article.count();
  const userCount = await db.user.count();
  const submissionCount = await db.submission.count();
  console.log(
    `Seed complete: ${articleCount} articles, ${userCount} users, ${submissionCount} submissions.`
  );
  console.log(`Volume: Volume ${SPECIAL_ISSUE_VOLUME}, Issue ${SPECIAL_ISSUE_NUMBER} (${SPECIAL_ISSUE_TITLE})`);
  console.log(`All seeded accounts use password: ${PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
