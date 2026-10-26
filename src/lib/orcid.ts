/**
 * ORCID Public Registry Integration & Name Verification
 * https://pub.orcid.org/v3.0/
 */

const HONORIFIC_STOPWORDS = new Set([
  "dr",
  "doctor",
  "prof",
  "professor",
  "mr",
  "mrs",
  "ms",
  "phd",
  "msc",
  "bsc",
  "engr",
  "rev",
  "arc",
  "hon",
  "al",
]);

function tokenizeName(name: string): string[] {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove diacritics
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 2 && !HONORIFIC_STOPWORDS.has(token));
}

export interface OrcidVerificationResult {
  valid: boolean;
  cleanOrcid?: string;
  orcidName?: string;
  matchedNameToken?: string;
  warning?: string;
  error?: string;
}

export async function verifyOrcid(
  inputOrcid: string,
  accountName: string
): Promise<OrcidVerificationResult> {
  const match = inputOrcid.trim().match(/(\d{4}-\d{4}-\d{4}-\d{3}[\dX])/i);
  if (!match) {
    return {
      valid: false,
      error: "Invalid ORCID format. Must be a 16-character identifier (e.g. 0000-0002-1825-0097).",
    };
  }

  const cleanOrcid = match[1].toUpperCase();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`https://pub.orcid.org/v3.0/${cleanOrcid}/person`, {
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.status === 404) {
      return {
        valid: false,
        cleanOrcid,
        error: `ORCID iD "${cleanOrcid}" does not exist in the public ORCID registry.`,
      };
    }

    if (!res.ok) {
      // If ORCID returns a server error, allow linking with warning
      return {
        valid: true,
        cleanOrcid,
        warning: `ORCID iD format is valid, but ORCID server returned status ${res.status}. Linking permitted.`,
      };
    }

    const data = await res.json();
    const given = data?.name?.["given-names"]?.value || "";
    const family = data?.name?.["family-name"]?.value || "";
    const credit = data?.name?.["credit-name"]?.value || "";
    const otherNames =
      data?.name?.["other-names"]?.["other-name"]?.map(
        (o: { content?: string }) => o.content || ""
      ) || [];

    const orcidFullName =
      [given, family].filter(Boolean).join(" ") ||
      credit ||
      otherNames.join(", ") ||
      "";

    // If the researcher profile has privacy settings hiding their name, allow link with warning
    if (!orcidFullName) {
      return {
        valid: true,
        cleanOrcid,
        orcidName: "Researcher (Privacy Protected)",
        warning: "ORCID name is private on the public registry. Identifier format accepted.",
      };
    }

    // Token matching
    const accountTokens = tokenizeName(accountName);
    const orcidTokens = new Set([
      ...tokenizeName(given),
      ...tokenizeName(family),
      ...tokenizeName(credit),
      ...otherNames.flatMap((n: string) => tokenizeName(n)),
    ]);

    // Check if at least 1 meaningful name token matches
    const matchedToken = accountTokens.find((tok) => orcidTokens.has(tok));

    if (matchedToken) {
      return {
        valid: true,
        cleanOrcid,
        orcidName: orcidFullName,
        matchedNameToken: matchedToken,
      };
    }

    // Name mismatch
    return {
      valid: false,
      cleanOrcid,
      orcidName: orcidFullName,
      error: `Name mismatch: The ORCID iD (${cleanOrcid}) is registered to "${orcidFullName}", which does not match your account name ("${accountName}"). At least 1 name part must match to link this ORCID.`,
    };
  } catch (err: unknown) {
    console.error("ORCID verification network error:", err);
    // On network failure / timeout, don't block the user completely
    return {
      valid: true,
      cleanOrcid,
      warning: "ORCID identifier verified by format (ORCID registry connection timed out).",
    };
  }
}
