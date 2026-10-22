import { db } from "./db";
import { JOURNAL } from "./constants";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";

export interface ZenodoConfig {
  accessToken: string;
  isSandbox: boolean;
  community?: string;
  baseUrl: string;
}

export interface ZenodoCreator {
  name: string; // "Last, First" or "First Last"
  affiliation?: string | null;
  orcid?: string | null;
}

export interface ZenodoDepositParams {
  articleId?: string;
  slug: string;
  title: string;
  abstract: string;
  authors: ZenodoCreator[];
  keywords: string[];
  volumeNumber: number;
  issueNumber: number;
  volumeYear: number;
  firstPage?: number | null;
  lastPage?: number | null;
  pdfBuffer?: Buffer;
  pdfFilename?: string;
  publishImmediately?: boolean;
}

export interface ZenodoDepositResult {
  success: boolean;
  doi?: string;
  recordId?: number;
  doiUrl?: string;
  recordUrl?: string;
  error?: string;
}

/**
 * Fetch active Zenodo configuration from DB settings or process.env
 */
export async function getZenodoConfig(): Promise<ZenodoConfig> {
  let token = process.env.ZENODO_ACCESS_TOKEN ?? "";
  let isSandbox = process.env.ZENODO_SANDBOX === "true";
  let community = process.env.ZENODO_COMMUNITY ?? "";

  try {
    const rows = await db.setting.findMany({
      where: {
        key: {
          in: ["zenodo_token", "zenodo_sandbox", "zenodo_community"],
        },
      },
    });
    for (const r of rows) {
      if (r.key === "zenodo_token" && r.value) token = r.value.trim();
      if (r.key === "zenodo_sandbox") isSandbox = r.value === "true";
      if (r.key === "zenodo_community" && r.value) community = r.value.trim();
    }
  } catch {
    // Fall back to environment variables if db is unavailable
  }

  if (!token && existsSync(path.resolve(process.cwd(), ".env"))) {
    try {
      const envText = await readFile(path.resolve(process.cwd(), ".env"), "utf-8");
      const match = envText.match(/ZENODO_ACCESS_TOKEN=["']?([^"'\r\n]+)["']?/);
      if (match) token = match[1].trim();
      const sandboxMatch = envText.match(/ZENODO_SANDBOX=["']?([^"'\r\n]+)["']?/);
      if (sandboxMatch) isSandbox = sandboxMatch[1].trim() === "true";
      const commMatch = envText.match(/ZENODO_COMMUNITY=["']?([^"'\r\n]+)["']?/);
      if (commMatch) community = commMatch[1].trim();
    } catch {
      // ignore
    }
  }

  const baseUrl = isSandbox
    ? "https://sandbox.zenodo.org/api"
    : "https://zenodo.org/api";

  return {
    accessToken: token,
    isSandbox,
    community: community || undefined,
    baseUrl,
  };
}

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) UNILAG-Communication-Review/1.0 (https://unilag.edu.ng)";

/**
 * Test credentials against Zenodo API
 */
export async function testZenodoConnection(configOverride?: Partial<ZenodoConfig>): Promise<{
  ok: boolean;
  message: string;
  environment: string;
  username?: string;
}> {
  const cfg = { ...(await getZenodoConfig()), ...configOverride };
  const envLabel = cfg.isSandbox ? "Sandbox (sandbox.zenodo.org)" : "Production (zenodo.org)";

  if (!cfg.accessToken) {
    return {
      ok: false,
      environment: envLabel,
      message: "No Zenodo access token provided. Please configure ZENODO_ACCESS_TOKEN.",
    };
  }

  try {
    const res = await fetch(`${cfg.baseUrl}/deposit/depositions?size=1`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${cfg.accessToken}`,
        Accept: "application/json",
        "User-Agent": USER_AGENT,
      },
    });

    if (res.status === 401 || res.status === 403) {
      return {
        ok: false,
        environment: envLabel,
        message: `Authentication failed (HTTP ${res.status}). Ensure the token has 'deposit:actions' and 'deposit:write' scopes.`,
      };
    }

    if (!res.ok) {
      const errText = await res.text();
      return {
        ok: false,
        environment: envLabel,
        message: `Zenodo returned HTTP ${res.status}: ${errText.slice(0, 150)}`,
      };
    }

    return {
      ok: true,
      environment: envLabel,
      message: `Connection successful! Ready to mint official DOIs on ${envLabel}.`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      environment: envLabel,
      message: `Network error connecting to Zenodo: ${msg}`,
    };
  }
}

/**
 * Format author name into "Last, First" for Zenodo
 */
function formatAuthorForZenodo(name: string): string {
  const cleaned = name.trim().replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s+/i, "");
  if (cleaned.includes(",")) return cleaned;
  const parts = cleaned.split(/\s+/);
  if (parts.length <= 1) return cleaned;
  const last = parts.pop()!;
  const first = parts.join(" ");
  return `${last}, ${first}`;
}

/**
 * Clean ORCID string to just 16 characters or URL format
 */
function cleanOrcid(orcid?: string | null): string | undefined {
  if (!orcid) return undefined;
  const m = orcid.match(/\d{4}-\d{4}-\d{4}-[\dX]{4}/);
  return m ? m[0] : undefined;
}

/**
 * Deposit an article and PDF to Zenodo, minting a genuine DOI
 */
export async function depositAndMintZenodoDoi(
  params: ZenodoDepositParams
): Promise<ZenodoDepositResult> {
  const cfg = await getZenodoConfig();

  if (!cfg.accessToken) {
    return {
      success: false,
      error:
        "Zenodo Access Token is not configured. Please add your token in Editor Settings or .env (ZENODO_ACCESS_TOKEN).",
    };
  }

  // 1. Locate PDF file
  let pdfBuffer = params.pdfBuffer;
  const pdfFilename = params.pdfFilename || `${params.slug}.pdf`;

  if (!pdfBuffer) {
    const candidatePath = path.resolve(
      process.cwd(),
      process.env.UPLOADS_DIR ?? "./uploads",
      "published",
      pdfFilename
    );
    if (existsSync(candidatePath)) {
      pdfBuffer = await readFile(candidatePath);
    }
  }

  if (!pdfBuffer) {
    return {
      success: false,
      error: `Could not find PDF file for article "${params.slug}". Ensure PDF exists in uploads/published/`,
    };
  }

  // 2. Prepare metadata payload
  const pages =
    params.firstPage && params.lastPage
      ? `${params.firstPage}-${params.lastPage}`
      : undefined;

  const creators = params.authors.map((a) => {
    const c: { name: string; affiliation?: string; orcid?: string } = {
      name: formatAuthorForZenodo(a.name),
    };
    if (a.affiliation) c.affiliation = a.affiliation;
    const orc = cleanOrcid(a.orcid);
    if (orc) c.orcid = orc;
    return c;
  });

  const metadata: Record<string, unknown> = {
    title: params.title,
    upload_type: "publication",
    publication_type: "article",
    description: params.abstract,
    creators,
    keywords: params.keywords.length > 0 ? params.keywords : ["Communication", "Media Studies"],
    journal_title: JOURNAL.title,
    journal_volume: String(params.volumeNumber),
    journal_issue: String(params.issueNumber),
    journal_issn: JOURNAL.issn,
    publication_date: `${params.volumeYear}-10-22`,
    access_right: "open",
    license: "cc-by-4.0",
    publisher: JOURNAL.publisher,
  };

  if (pages) {
    metadata.journal_pages = pages;
  }

  if (cfg.community) {
    metadata.communities = [{ identifier: cfg.community }];
  }

  try {
    // 3. Create Draft Deposition
    const createRes = await fetch(`${cfg.baseUrl}/deposit/depositions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.accessToken}`,
        "Content-Type": "application/json",
        "User-Agent": USER_AGENT,
      },
      body: JSON.stringify({ metadata }),
    });

    if (!createRes.ok) {
      const errBody = await createRes.text();
      return {
        success: false,
        error: `Zenodo draft creation failed (HTTP ${createRes.status}): ${errBody.slice(0, 300)}`,
      };
    }

    const draft = await createRes.json();
    const depositionId = draft.id;
    const bucketUrl = draft.links?.bucket;

    // 4. Upload PDF
    if (bucketUrl) {
      // InvenioRDM modern bucket upload
      const uploadRes = await fetch(`${bucketUrl}/${encodeURIComponent(pdfFilename)}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${cfg.accessToken}`,
          "Content-Type": "application/octet-stream",
          "User-Agent": USER_AGENT,
        },
        body: new Uint8Array(pdfBuffer),
      });

      if (!uploadRes.ok) {
        const errText = await uploadRes.text();
        return {
          success: false,
          error: `Failed to upload PDF to Zenodo bucket (HTTP ${uploadRes.status}): ${errText.slice(0, 200)}`,
        };
      }
    } else {
      // Legacy multipart upload fallback
      const formData = new FormData();
      const blob = new Blob([new Uint8Array(pdfBuffer)], { type: "application/pdf" });
      formData.append("file", blob, pdfFilename);
      formData.append("name", pdfFilename);

      const legacyRes = await fetch(
        `${cfg.baseUrl}/deposit/depositions/${depositionId}/files`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${cfg.accessToken}`,
            "User-Agent": USER_AGENT,
          },
          body: formData,
        }
      );

      if (!legacyRes.ok) {
        const errText = await legacyRes.text();
        return {
          success: false,
          error: `Failed to upload PDF via legacy API (HTTP ${legacyRes.status}): ${errText.slice(0, 200)}`,
        };
      }
    }

    // 5. Publish to mint official DOI
    if (params.publishImmediately !== false) {
      const pubRes = await fetch(
        `${cfg.baseUrl}/deposit/depositions/${depositionId}/actions/publish`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${cfg.accessToken}`,
            "User-Agent": USER_AGENT,
          },
        }
      );

      if (!pubRes.ok) {
        const errText = await pubRes.text();
        return {
          success: false,
          error: `Failed to publish Zenodo deposition (HTTP ${pubRes.status}): ${errText.slice(0, 200)}`,
        };
      }

      const publishedData = await pubRes.json();
      const mintedDoi = publishedData.doi || draft.metadata?.prereserve_doi?.doi;
      const recordId = publishedData.record_id || depositionId;
      const doiUrl = publishedData.doi_url || `https://doi.org/${mintedDoi}`;
      const recordUrl =
        publishedData.record_url ||
        `${cfg.baseUrl.replace("/api", "")}/records/${recordId}`;

      // 6. Update database record if articleId provided
      if (params.articleId && mintedDoi) {
        await db.article.update({
          where: { id: params.articleId },
          data: { doi: mintedDoi },
        });
      }

      return {
        success: true,
        doi: mintedDoi,
        recordId,
        doiUrl,
        recordUrl,
      };
    } else {
      // Reserved DOI without immediate publish
      const reservedDoi = draft.metadata?.prereserve_doi?.doi;
      return {
        success: true,
        doi: reservedDoi,
        recordId: depositionId,
        doiUrl: reservedDoi ? `https://doi.org/${reservedDoi}` : undefined,
        recordUrl: `${cfg.baseUrl.replace("/api", "")}/deposit/${depositionId}`,
      };
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `Zenodo deposit exception: ${msg}`,
    };
  }
}
