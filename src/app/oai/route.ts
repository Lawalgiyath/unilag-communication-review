import { db } from "@/lib/db";
import { JOURNAL, siteUrl } from "@/lib/constants";
import {
  oaiError,
  oaiIdentify,
  oaiListMetadataFormats,
  oaiListSets,
  oaiGetRecord,
  oaiListRecords,
  oaiListIdentifiers,
  encodeResumptionToken,
  decodeResumptionToken,
  type OaiRecordData,
} from "@/lib/oai";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 100;

function toOaiRecord(
  article: {
    id: string;
    slug: string;
    title: string;
    abstract: string;
    doi: string | null;
    firstPage: number | null;
    lastPage: number | null;
    updatedAt: Date;
    publishedOnline: Date | null;
    authors: { name: string }[];
    keywords: { keyword: { label: string } }[];
    issue: { number: number; volume: { number: number; year: number } } | null;
  },
  base: string,
  host: string
): OaiRecordData {
  const date = article.publishedOnline ?? article.updatedAt;
  const volIssue = article.issue
    ? `Vol. ${article.issue.volume.number}, No. ${article.issue.number} (${article.issue.volume.year})`
    : "Online first";
  const pages =
    article.firstPage && article.lastPage
      ? `, pp. ${article.firstPage}–${article.lastPage}`
      : "";

  const identifiers: string[] = [`${base}/articles/${article.slug}`];
  if (article.doi) identifiers.push(`https://doi.org/${article.doi}`);

  return {
    identifier: `oai:${host}:article/${article.slug}`,
    datestamp: date.toISOString().replace(/\.\d{3}Z$/, "Z"),
    setSpec: article.issue
      ? `issue:v${article.issue.volume.number}i${article.issue.number}`
      : null,
    title: article.title,
    creators: article.authors.map((a) => a.name),
    description: article.abstract,
    publisher: JOURNAL.publisher,
    date: date.toISOString().slice(0, 10),
    source: `${JOURNAL.title}, ${volIssue}${pages}`,
    identifiers,
    subjects: article.keywords.map((k) => k.keyword.label),
  };
}

export async function GET(request: Request) {
  const base = siteUrl();
  const url = new URL(request.url);
  const host = new URL(base).hostname;
  const baseUrl = `${base}/oai`;
  const verb = url.searchParams.get("verb") ?? "";

  const articleInclude = {
    authors: { orderBy: { order: "asc" as const } },
    keywords: { include: { keyword: true } },
    issue: { include: { volume: true } },
  };

  async function getEarliest(): Promise<string> {
    const first = await db.article.findFirst({
      where: { status: "PUBLISHED" },
      orderBy: { publishedOnline: "asc" },
      select: { publishedOnline: true, updatedAt: true },
    });
    const d = first?.publishedOnline ?? first?.updatedAt ?? new Date();
    return d.toISOString().slice(0, 10) + "T00:00:00Z";
  }

  const xml = await (async () => {
    switch (verb) {
      case "Identify": {
        return oaiIdentify({
          baseUrl,
          repositoryName: JOURNAL.title,
          adminEmail: JOURNAL.contactEmail,
          earliestDatestamp: await getEarliest(),
          host,
        });
      }

      case "ListMetadataFormats": {
        return oaiListMetadataFormats(baseUrl);
      }

      case "ListSets": {
        const issues = await db.issue.findMany({
          where: { publishedAt: { not: null } },
          include: { volume: true },
          orderBy: { publishedAt: "desc" },
        });
        const sets = issues.map((i) => ({
          spec: `issue:v${i.volume.number}i${i.number}`,
          name: `${JOURNAL.shortTitle} Vol. ${i.volume.number}, No. ${i.number} (${i.volume.year})`,
        }));
        return oaiListSets(baseUrl, sets);
      }

      case "GetRecord": {
        const identifier = url.searchParams.get("identifier") ?? "";
        const metadataPrefix = url.searchParams.get("metadataPrefix") ?? "";
        if (metadataPrefix !== "oai_dc")
          return oaiError(baseUrl, "cannotDisseminateFormat", "Only oai_dc is supported");

        const slug = identifier.split(":").pop() ?? "";
        const prefixed = slug.startsWith("article/") ? slug.slice("article/".length) : slug;
        const article = await db.article.findFirst({
          where: { slug: prefixed, status: "PUBLISHED" },
          include: articleInclude,
        });
        if (!article) return oaiError(baseUrl, "idDoesNotExist", "No such record");
        return oaiGetRecord(baseUrl, toOaiRecord(article, base, host));
      }

      case "ListIdentifiers":
      case "ListRecords": {
        const metadataPrefix = url.searchParams.get("metadataPrefix") ?? "";
        if (metadataPrefix !== "oai_dc" && !url.searchParams.get("resumptionToken"))
          return oaiError(baseUrl, "cannotDisseminateFormat", "Only oai_dc is supported");

        let offset = 0;
        const tokenParam = url.searchParams.get("resumptionToken");
        if (tokenParam) {
          const cursor = decodeResumptionToken(tokenParam);
          if (!cursor) return oaiError(baseUrl, "badResumptionToken", "Invalid or expired token");
          offset = cursor.offset;
        }

        const total = await db.article.count({ where: { status: "PUBLISHED" } });
        const articles = await db.article.findMany({
          where: { status: "PUBLISHED" },
          orderBy: { updatedAt: "asc" },
          skip: offset,
          take: PAGE_SIZE,
          include: articleInclude,
        });

        if (articles.length === 0)
          return oaiError(baseUrl, "noRecordsMatch", "No records match the query");

        const records = articles.map((a) => toOaiRecord(a, base, host));
        const nextOffset = offset + articles.length;
        const resumptionToken =
          nextOffset < total ? encodeResumptionToken({ offset: nextOffset }) : null;

        return verb === "ListIdentifiers"
          ? oaiListIdentifiers(baseUrl, records, resumptionToken, total, offset)
          : oaiListRecords(baseUrl, records, resumptionToken, total, offset);
      }

      default:
        return oaiError(baseUrl, "badVerb", `Unknown verb: ${verb}`);
    }
  })();

  return new Response(xml, {
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
