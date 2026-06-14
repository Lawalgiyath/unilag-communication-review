# UNILAG Communication Review

Production journal website and editorial management system for **UNILAG Communication Review**, the peer-reviewed journal of the Faculty of Communication and Media Studies, University of Lagos.

## What this is

A complete, self-hosted academic journal platform:

- **Public journal site** — homepage with current issue, browseable archives (volume → issue → article), full article pages, search with filters, keyword browsing, announcements & calls for papers, editorial board, author guidelines, and all policy pages.
- **Google Scholar–ready** — every article page renders Highwire Press `citation_*` meta tags server-side, with a `citation_pdf_url` ending in `.pdf` in the same URL subtree, a plain-HTML browse path from the homepage (3 clicks), open abstracts, searchable PDFs, JSON-LD `ScholarlyArticle` data, sitemap, RSS feed, and a compliant `robots.txt`.
- **OAI-PMH 2.0 endpoint** (`/oai`, `oai_dc`) for harvesting by AJOL, BASE, OpenAIRE, and library discovery services.
- **Full editorial system** — author registration & multi-step manuscript submission (anonymized manuscript + separate title page), editor screening/desk rejection, reviewer invitation and structured double-blind review, decisions with letters, revision rounds, manual publication-fee confirmation, production (typeset PDF, issue/pages/DOI assignment) and one-click publishing.
- **Citation tooling** — APA/MLA/Chicago/Harvard previews plus BibTeX and RIS downloads per article.
- **View metrics** with per-visitor daily dedupe.

Design: a "Lagos Broadsheet" system — scholarly newspaper aesthetic (Fraunces/Source Serif 4/Inter, maroon & gold on warm paper, hairline rules, sharp corners, no shadows), WCAG-AA focused, light-weight pages for low-bandwidth readers, print stylesheet for articles.

## Stack

- **Next.js 15** (App Router, React 19, TypeScript, standalone output)
- **SQLite** via **Prisma 6** (+ FTS5 full-text search)
- Session auth (DB-backed, bcrypt), Nodemailer (optional SMTP), Tailwind CSS 4, pdf-lib (seed PDFs), Vitest

## Quick start (development)

```bash
npm install
cp .env.example .env          # adjust if needed
npx prisma migrate dev        # creates data/journal.db and runs the seed
npm run dev                   # http://localhost:3000
```

If the database already exists: `npm run db:reset` wipes and reseeds everything.

### Seeded accounts (all use password `Password123!`)

| Role | Email |
|---|---|
| Admin + Editor | `admin@unilagcommunicationreview.ng` |
| Editor-in-Chief | `oloruntola@unilag.edu.ng` |
| Editor | `uakpan@unilag.edu.ng` |
| Reviewers | `tejumaiye@unilag.edu.ng`, `ibrahim@unilag.edu.ng`, `popoola@unilag.edu.ng` |
| Authors | `adaeze.okafor@example.edu.ng`, `tunde.bakare@example.edu.ng`, `ngozi.chukwu@example.edu.ng` |

**Change every seeded password before going live** (log in → Profile), or delete the sample users in the admin dashboard.

The seed also creates 3 volumes / 6 issues / 30 published sample articles with generated PDFs, plus 6 in-flight submissions covering every workflow state.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm run start` | Production build / serve |
| `npm run typecheck` | TypeScript check |
| `npm test` | Unit tests (citations, workflow, OAI, views, slugs) |
| `npm run db:migrate` | Apply schema migrations |
| `npm run db:seed` | Reseed sample content |
| `npm run db:reset` | Drop, migrate, reseed |

## Environment variables (`.env`)

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | yes | `file:../data/journal.db` (path relative to `prisma/`) |
| `NEXT_PUBLIC_SITE_URL` | yes in prod | Absolute public URL, no trailing slash. Used in citation_pdf_url, sitemap, RSS, OAI. |
| `UPLOADS_DIR` | yes | Manuscripts + published PDFs. Keep outside the web root; back it up. |
| `SMTP_HOST/PORT/USER/PASS/FROM` | optional | Unset = emails logged to console + EmailLog table only. |

## Editorial workflow

```
SUBMITTED → UNDER_REVIEW → (REVISIONS_REQUESTED → RESUBMITTED → UNDER_REVIEW)*
         → ACCEPTED → IN_PRODUCTION → PUBLISHED
   ↘ DESK_REJECTED            ↘ REJECTED        (WITHDRAWN possible while open)
```

Double-blind is enforced structurally: reviewers can only download the anonymized manuscript file (never the title page), reviewer-facing queries exclude author identities, and authors see reviews as "Reviewer 1/2" without names or confidential editor comments.

The ₦30,000 publication fee is displayed on the public site; editors confirm payment manually on the submission page before production (no payment gateway).

## Deployment

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for the step-by-step guide to deploying on the University of Lagos CITS server (Node + nginx + systemd/pm2, HTTPS, backups, and the Google Scholar go-live checklist).
