import { describe, it, expect } from "vitest";
import {
  xmlEscape,
  oaiError,
  oaiIdentify,
  oaiGetRecord,
  oaiListRecords,
  encodeResumptionToken,
  decodeResumptionToken,
  type OaiRecordData,
} from "@/lib/oai";

const record: OaiRecordData = {
  identifier: "oai:example.org:article/media-activism-lagos",
  datestamp: "2026-03-15T00:00:00Z",
  setSpec: "issue:v12i1",
  title: "Media Activism & <Resistance> in Lagos",
  creators: ["Okafor, Adaeze", "Bakare, Tunde"],
  description: 'An abstract with "quotes" & ampersands.',
  publisher: "Faculty of Communication and Media Studies, University of Lagos",
  date: "2026-03-15",
  source: "UNILAG Communication Review, 12(1), 311-325",
  identifiers: [
    "https://example.org/articles/media-activism-lagos",
    "https://doi.org/10.12345/ucr.v12i1.001",
  ],
  subjects: ["media activism", "Lagos"],
};

describe("xmlEscape", () => {
  it("escapes all five XML entities", () => {
    expect(xmlEscape(`<a href="x">&'</a>`)).toBe(
      "&lt;a href=&quot;x&quot;&gt;&amp;&apos;&lt;/a&gt;"
    );
  });
});

describe("oaiError", () => {
  it("emits the error code element", () => {
    const xml = oaiError("https://example.org/api/oai", "badVerb", "Unknown verb");
    expect(xml).toContain('<error code="badVerb">Unknown verb</error>');
    expect(xml).toContain("<?xml version=");
  });
});

describe("oaiIdentify", () => {
  it("contains required Identify fields", () => {
    const xml = oaiIdentify({
      baseUrl: "https://example.org/api/oai",
      repositoryName: "UNILAG Communication Review",
      adminEmail: "ucr@unilag.edu.ng",
      earliestDatestamp: "2024-01-01T00:00:00Z",
      host: "example.org",
    });
    expect(xml).toContain("<protocolVersion>2.0</protocolVersion>");
    expect(xml).toContain("<repositoryName>UNILAG Communication Review</repositoryName>");
    expect(xml).toContain("<deletedRecord>no</deletedRecord>");
  });
});

describe("oaiGetRecord", () => {
  it("escapes title and description in dc fields", () => {
    const xml = oaiGetRecord("https://example.org/api/oai", record);
    expect(xml).toContain(
      "<dc:title>Media Activism &amp; &lt;Resistance&gt; in Lagos</dc:title>"
    );
    expect(xml).toContain("&quot;quotes&quot; &amp; ampersands");
    expect(xml).toContain("<dc:creator>Okafor, Adaeze</dc:creator>");
    expect(xml).toContain("<dc:creator>Bakare, Tunde</dc:creator>");
    expect(xml).toContain("<setSpec>issue:v12i1</setSpec>");
  });
});

describe("oaiListRecords", () => {
  it("includes resumption token when provided", () => {
    const xml = oaiListRecords(
      "https://example.org/api/oai",
      [record],
      "TOKEN123",
      120,
      0
    );
    expect(xml).toContain('completeListSize="120"');
    expect(xml).toContain(">TOKEN123</resumptionToken>");
  });
});

describe("resumption tokens", () => {
  it("round-trips", () => {
    const token = encodeResumptionToken({ offset: 50, set: "issue:v12i1" });
    const decoded = decodeResumptionToken(token);
    expect(decoded).toEqual({ offset: 50, set: "issue:v12i1" });
  });

  it("rejects garbage", () => {
    expect(decodeResumptionToken("not-base64-json!!!")).toBeNull();
  });
});
