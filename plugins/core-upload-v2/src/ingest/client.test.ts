import { describe, expect, it } from "vitest";

import { buildAccessPolicy, buildDublinCore, mediaPackageId } from "./client";

import type { EpisodeMetadata } from "./client";

const base: EpisodeMetadata = {
  title: "Vorlesung 01",
  presenters: ["Ada Lovelace"],
  location: "Upload",
  source: "ada",
};

const values = (xml: string, tag: string) =>
  [...xml.matchAll(new RegExp(`<dcterms:${tag}[^>]*>([^<]*)</dcterms:${tag}>`, "g"))].map(
    (match) => match[1],
  );

describe("buildDublinCore", () => {
  it("uses the recording date, not the time of upload", () => {
    const xml = buildDublinCore({ ...base, recordedAt: "2026-03-04T09:15:00.000Z" });
    expect(values(xml, "created")).toEqual(["2026-03-04T09:15:00.000Z"]);
  });

  it("falls back to now only when no recording date is known", () => {
    const before = Date.now();
    const [created] = values(buildDublinCore(base), "created");
    expect(new Date(created!).getTime()).toBeGreaterThanOrEqual(before);
  });

  it("writes one creator element per presenter", () => {
    const xml = buildDublinCore({ ...base, presenters: ["Ada Lovelace", "Grace Hopper"] });
    expect(values(xml, "creator")).toEqual(["Ada Lovelace", "Grace Hopper"]);
  });

  it("drops blank names instead of emitting empty elements", () => {
    const xml = buildDublinCore({ ...base, presenters: ["Ada Lovelace", "  ", ""] });
    expect(values(xml, "creator")).toEqual(["Ada Lovelace"]);
  });

  it("omits absent optional fields entirely", () => {
    const xml = buildDublinCore(base);
    for (const tag of ["isPartOf", "language", "description", "subject", "license"]) {
      expect(values(xml, tag)).toEqual([]);
    }
  });

  it("includes the optional fields when set", () => {
    const xml = buildDublinCore({
      ...base,
      seriesId: "series-1",
      language: "de",
      description: "Erste Sitzung",
      subject: "Informatik",
      license: "CC-BY-4.0",
      rightsHolder: "Universität Wien",
      contributors: ["Kamerateam"],
    });
    expect(values(xml, "isPartOf")).toEqual(["series-1"]);
    expect(values(xml, "language")).toEqual(["de"]);
    expect(values(xml, "description")).toEqual(["Erste Sitzung"]);
    expect(values(xml, "contributor")).toEqual(["Kamerateam"]);
  });

  it("escapes XML metacharacters in user input", () => {
    const xml = buildDublinCore({ ...base, title: 'A & B <script> "x"' });
    expect(xml).not.toContain("<script>");
    expect(values(xml, "title")).toEqual(["A &amp; B &lt;script&gt; &quot;x&quot;"]);
  });
});

describe("buildAccessPolicy", () => {
  it("returns undefined for an empty rule set", () => {
    // Not "no restriction" but "nobody may do anything" — attaching that would
    // lock the episode away from the person who just uploaded it.
    expect(buildAccessPolicy([])).toBeUndefined();
    expect(buildAccessPolicy([{ role: "ROLE_X", action: [] }])).toBeUndefined();
    expect(buildAccessPolicy([{ role: "", action: ["read"] }])).toBeUndefined();
  });

  it("writes one permit rule per role and action", () => {
    const xml = buildAccessPolicy([
      { role: "ROLE_USER_ADA", action: ["read", "write"] },
      { role: "ROLE_ANONYMOUS", action: ["read"] },
    ]);
    expect(xml).toBeDefined();
    expect([...xml!.matchAll(/<Rule /g)]).toHaveLength(3);
    expect(xml).toContain('RuleId="ROLE_USER_ADA_read_Permit"');
    expect(xml).toContain('RuleId="ROLE_ANONYMOUS_read_Permit"');
    expect(xml).toContain("urn:oasis:names:tc:xacml:2.0:subject:role");
  });

  it("escapes role names so a crafted role cannot inject policy", () => {
    const xml = buildAccessPolicy([{ role: 'ROLE_"/><Rule Effect="Permit"', action: ["read"] }]);
    expect([...xml!.matchAll(/<Rule /g)]).toHaveLength(1);
    expect(xml).toContain("&quot;");
  });
});

describe("mediaPackageId", () => {
  it("reads the id off the root element", () => {
    expect(mediaPackageId('<mediapackage start="x" id="mp-7"><media/></mediapackage>')).toBe("mp-7");
  });

  it("returns undefined when there is no media package", () => {
    expect(mediaPackageId("<html>error</html>")).toBeUndefined();
  });
});
