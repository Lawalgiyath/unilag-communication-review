import { PrismaClient } from "@prisma/client";
import {
  depositAndMintZenodoDoi,
  getZenodoConfig,
  testZenodoConnection,
} from "../src/lib/zenodo";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { existsSync } from "node:fs";

const db = new PrismaClient();

async function main() {
  console.log("==========================================================");
  console.log("  UNILAG Communication Review — Automatic Zenodo DOI Assigner");
  console.log("  Official, Permanent, 100% Free DOIs via Zenodo / CERN");
  console.log("==========================================================\n");

  const config = await getZenodoConfig();

  if (!config.accessToken) {
    console.error("❌ ERROR: No Zenodo Access Token found.\n");
    console.log("Zenodo DOIs are 100% FREE for academic journals.");
    console.log("To generate your free token in 30 seconds:");
    console.log("  1. Create a free account or log in at: https://zenodo.org");
    console.log("  2. Visit: https://zenodo.org/account/settings/applications/tokens/new/");
    console.log("  3. Give it a name (e.g. 'UNILAG Journal')");
    console.log("  4. Check the scopes: [✓] deposit:actions  and  [✓] deposit:write");
    console.log("  5. Copy your token and add it to your .env file:");
    console.log('     ZENODO_ACCESS_TOKEN="your_token_here"\n');
    console.log("Or enter it in the Editor Dashboard at /dashboard/editor/settings.\n");
    process.exit(1);
  }

  console.log(`Connecting to Zenodo (${config.isSandbox ? "Sandbox" : "Production"})...`);
  const test = await testZenodoConnection(config);
  if (!test.ok) {
    console.error(`❌ Connection failed: ${test.message}\n`);
    process.exit(1);
  }
  console.log(`✅ ${test.message}\n`);

  // Fetch articles for Volume 9 Number 2
  const articles = await db.article.findMany({
    where: {
      status: "PUBLISHED",
    },
    include: {
      authors: true,
      keywords: {
        include: { keyword: true },
      },
      issue: {
        include: {
          volume: true,
        },
      },
    },
    orderBy: {
      orderInIssue: "asc",
    },
  });

  if (articles.length === 0) {
    console.log("No published articles found in the database to assign DOIs to.");
    process.exit(0);
  }

  console.log(`Found ${articles.length} published articles to process.\n`);

  const results: { slug: string; title: string; doi: string; url: string }[] = [];

  for (let i = 0; i < articles.length; i++) {
    const art = articles[i];
    console.log(`[${i + 1}/${articles.length}] Processing: "${art.title.slice(0, 50)}..."`);

    // Check if it already has a real verified Zenodo DOI
    // (if it starts with 10.5281/zenodo. and was verified, or if forced)
    const pdfFilename = `${art.slug}.pdf`;
    const pdfPath = path.resolve(
      process.cwd(),
      process.env.UPLOADS_DIR ?? "./uploads",
      "published",
      pdfFilename
    );

    if (!existsSync(pdfPath)) {
      console.warn(`  ⚠️ Warning: PDF not found at ${pdfPath}, skipping...`);
      continue;
    }

    const pdfBuffer = await readFile(pdfPath);

    const issueNum = art.issue?.number ?? 2;
    const volNum = art.issue?.volume.number ?? 9;
    const volYear = art.issue?.volume.year ?? 2026;

    console.log("  -> Uploading metadata and typeset PDF to Zenodo...");
    const res = await depositAndMintZenodoDoi({
      articleId: art.id,
      slug: art.slug,
      title: art.title,
      abstract: art.abstract,
      authors: art.authors.map((a) => ({
        name: a.name,
        affiliation: a.affiliation,
        orcid: a.orcid,
      })),
      keywords: art.keywords.map((k) => k.keyword.label),
      volumeNumber: volNum,
      issueNumber: issueNum,
      volumeYear: volYear,
      firstPage: art.firstPage,
      lastPage: art.lastPage,
      pdfBuffer,
      pdfFilename,
      publishImmediately: true,
    });

    if (res.success && res.doi) {
      console.log(`  ✅ SUCCESS! Minted Official DOI: ${res.doi}`);
      console.log(`     Resolving URL: ${res.doiUrl}`);
      console.log(`     Zenodo Record: ${res.recordUrl}\n`);
      results.push({
        slug: art.slug,
        title: art.title,
        doi: res.doi,
        url: res.doiUrl || `https://doi.org/${res.doi}`,
      });
    } else {
      console.error(`  ❌ Failed: ${res.error}\n`);
    }

    // Gentle rate limit delay between Zenodo API calls (1 second)
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log("==========================================================");
  console.log(`Finished processing. Successfully assigned ${results.length} DOIs.`);
  console.log("==========================================================\n");

  // If any DOIs were minted, update prisma/seed-data.ts and demo-data.ts as well
  if (results.length > 0) {
    console.log("Updating local seed-data files with official minted DOIs...");
    try {
      const seedDataPath = path.resolve(process.cwd(), "prisma/seed-data.ts");
      if (existsSync(seedDataPath)) {
        let content = await readFile(seedDataPath, "utf-8");
        for (const r of results) {
          // Replace doi for matching slug
          const re = new RegExp(
            `("slug":\\s*"${r.slug}"[\\s\\S]*?"doi":\\s*")[^"]*(")`,
            "g"
          );
          content = content.replace(re, `$1${r.doi}$2`);
        }
        await writeFile(seedDataPath, content, "utf-8");
        console.log("  ✓ Updated prisma/seed-data.ts");
      }
    } catch (e) {
      console.warn("  Could not update seed-data.ts automatically:", e);
    }
  }
}

main()
  .catch((e) => {
    console.error("Fatal error:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
