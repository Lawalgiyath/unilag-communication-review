/**
 * OAI-PMH 2.0 XML builders (oai_dc metadata format).
 * Pure string-building functions, unit-testable without the DB.
 * Spec: https://www.openarchives.org/OAI/openarchivesprotocol.html
 */

export function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export interface OaiRecordData {
  identifier: string; // oai:host:article/slug
  datestamp: string; // YYYY-MM-DDThh:mm:ssZ
  setSpec: string | null; // issue:v12i1
  title: string;
  creators: string[];
  description: string;
  publisher: string;
  date: string; // YYYY-MM-DD
  source: string; // journal, vol(issue), pages
  identifiers: string[]; // article url, doi url
  subjects: string[];
}

const OAI_NS = `xmlns="http://www.openarchives.org/OAI/2.0/"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.openarchives.org/OAI/2.0/ http://www.openarchives.org/OAI/2.0/OAI-PMH.xsd"`;

function envelope(
  verb: string | null,
  baseUrl: string,
  requestAttrs: string,
  body: string
): string {
  const responseDate = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  return `<?xml version="1.0" encoding="UTF-8"?>
<OAI-PMH ${OAI_NS}>
  <responseDate>${responseDate}</responseDate>
  <request${verb ? ` verb="${verb}"` : ""}${requestAttrs}>${xmlEscape(baseUrl)}</request>
${body}
</OAI-PMH>`;
}

export function oaiError(
  baseUrl: string,
  code:
    | "badVerb"
    | "badArgument"
    | "badResumptionToken"
    | "cannotDisseminateFormat"
    | "idDoesNotExist"
    | "noRecordsMatch"
    | "noMetadataFormats"
    | "noSetHierarchy",
  message: string
): string {
  return envelope(
    null,
    baseUrl,
    "",
    `  <error code="${code}">${xmlEscape(message)}</error>`
  );
}

export function oaiIdentify(opts: {
  baseUrl: string;
  repositoryName: string;
  adminEmail: string;
  earliestDatestamp: string;
  host: string;
}): string {
  const body = `  <Identify>
    <repositoryName>${xmlEscape(opts.repositoryName)}</repositoryName>
    <baseURL>${xmlEscape(opts.baseUrl)}</baseURL>
    <protocolVersion>2.0</protocolVersion>
    <adminEmail>${xmlEscape(opts.adminEmail)}</adminEmail>
    <earliestDatestamp>${opts.earliestDatestamp}</earliestDatestamp>
    <deletedRecord>no</deletedRecord>
    <granularity>YYYY-MM-DDThh:mm:ssZ</granularity>
    <description>
      <oai-identifier xmlns="http://www.openarchives.org/OAI/2.0/oai-identifier"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.openarchives.org/OAI/2.0/oai-identifier http://www.openarchives.org/OAI/2.0/oai-identifier.xsd">
        <scheme>oai</scheme>
        <repositoryIdentifier>${xmlEscape(opts.host)}</repositoryIdentifier>
        <delimiter>:</delimiter>
        <sampleIdentifier>oai:${xmlEscape(opts.host)}:article/sample-article</sampleIdentifier>
      </oai-identifier>
    </description>
  </Identify>`;
  return envelope("Identify", opts.baseUrl, "", body);
}

export function oaiListMetadataFormats(baseUrl: string): string {
  const body = `  <ListMetadataFormats>
    <metadataFormat>
      <metadataPrefix>oai_dc</metadataPrefix>
      <schema>http://www.openarchives.org/OAI/2.0/oai_dc.xsd</schema>
      <metadataNamespace>http://www.openarchives.org/OAI/2.0/oai_dc/</metadataNamespace>
    </metadataFormat>
  </ListMetadataFormats>`;
  return envelope("ListMetadataFormats", baseUrl, "", body);
}

export function oaiListSets(
  baseUrl: string,
  sets: { spec: string; name: string }[]
): string {
  const setsXml = sets
    .map(
      (s) => `    <set>
      <setSpec>${xmlEscape(s.spec)}</setSpec>
      <setName>${xmlEscape(s.name)}</setName>
    </set>`
    )
    .join("\n");
  return envelope(
    "ListSets",
    baseUrl,
    "",
    `  <ListSets>\n${setsXml}\n  </ListSets>`
  );
}

function recordHeader(r: OaiRecordData): string {
  return `      <header>
        <identifier>${xmlEscape(r.identifier)}</identifier>
        <datestamp>${r.datestamp}</datestamp>${
          r.setSpec ? `\n        <setSpec>${xmlEscape(r.setSpec)}</setSpec>` : ""
        }
      </header>`;
}

function dcMetadata(r: OaiRecordData): string {
  const fields: string[] = [];
  fields.push(`<dc:title>${xmlEscape(r.title)}</dc:title>`);
  for (const c of r.creators)
    fields.push(`<dc:creator>${xmlEscape(c)}</dc:creator>`);
  for (const s of r.subjects)
    fields.push(`<dc:subject>${xmlEscape(s)}</dc:subject>`);
  fields.push(`<dc:description>${xmlEscape(r.description)}</dc:description>`);
  fields.push(`<dc:publisher>${xmlEscape(r.publisher)}</dc:publisher>`);
  fields.push(`<dc:date>${r.date}</dc:date>`);
  fields.push(`<dc:type>info:eu-repo/semantics/article</dc:type>`);
  fields.push(`<dc:format>application/pdf</dc:format>`);
  for (const id of r.identifiers)
    fields.push(`<dc:identifier>${xmlEscape(id)}</dc:identifier>`);
  fields.push(`<dc:source>${xmlEscape(r.source)}</dc:source>`);
  fields.push(`<dc:language>en</dc:language>`);
  fields.push(
    `<dc:rights>https://creativecommons.org/licenses/by/4.0/</dc:rights>`
  );
  return `      <metadata>
        <oai_dc:dc xmlns:oai_dc="http://www.openarchives.org/OAI/2.0/oai_dc/"
          xmlns:dc="http://purl.org/dc/elements/1.1/"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="http://www.openarchives.org/OAI/2.0/oai_dc/ http://www.openarchives.org/OAI/2.0/oai_dc.xsd">
          ${fields.join("\n          ")}
        </oai_dc:dc>
      </metadata>`;
}

export function oaiGetRecord(baseUrl: string, r: OaiRecordData): string {
  const body = `  <GetRecord>
    <record>
${recordHeader(r)}
${dcMetadata(r)}
    </record>
  </GetRecord>`;
  return envelope(
    "GetRecord",
    baseUrl,
    ` identifier="${xmlEscape(r.identifier)}" metadataPrefix="oai_dc"`,
    body
  );
}

export function oaiListRecords(
  baseUrl: string,
  records: OaiRecordData[],
  resumptionToken: string | null,
  completeListSize: number,
  cursor: number
): string {
  const recordsXml = records
    .map((r) => `    <record>\n${recordHeader(r)}\n${dcMetadata(r)}\n    </record>`)
    .join("\n");
  const tokenXml =
    resumptionToken !== null
      ? `\n    <resumptionToken completeListSize="${completeListSize}" cursor="${cursor}">${xmlEscape(resumptionToken)}</resumptionToken>`
      : completeListSize > records.length
        ? `\n    <resumptionToken completeListSize="${completeListSize}" cursor="${cursor}"></resumptionToken>`
        : "";
  const body = `  <ListRecords>\n${recordsXml}${tokenXml}\n  </ListRecords>`;
  return envelope(
    "ListRecords",
    baseUrl,
    ` metadataPrefix="oai_dc"`,
    body
  );
}

export function oaiListIdentifiers(
  baseUrl: string,
  records: OaiRecordData[],
  resumptionToken: string | null,
  completeListSize: number,
  cursor: number
): string {
  const headersXml = records.map((r) => recordHeader(r).replace(/^ {6}/gm, "    ")).join("\n");
  const tokenXml =
    resumptionToken !== null
      ? `\n    <resumptionToken completeListSize="${completeListSize}" cursor="${cursor}">${xmlEscape(resumptionToken)}</resumptionToken>`
      : "";
  const body = `  <ListIdentifiers>\n${headersXml}${tokenXml}\n  </ListIdentifiers>`;
  return envelope("ListIdentifiers", baseUrl, ` metadataPrefix="oai_dc"`, body);
}

// ----- resumption token helpers -----

export interface OaiCursor {
  offset: number;
  from?: string;
  until?: string;
  set?: string;
}

export function encodeResumptionToken(c: OaiCursor): string {
  return Buffer.from(JSON.stringify(c), "utf8").toString("base64url");
}

export function decodeResumptionToken(token: string): OaiCursor | null {
  try {
    const parsed = JSON.parse(
      Buffer.from(token, "base64url").toString("utf8")
    );
    if (typeof parsed.offset !== "number" || parsed.offset < 0) return null;
    return parsed as OaiCursor;
  } catch {
    return null;
  }
}
