// @vitest-environment jsdom
//
// jsdom because the catalog template escapes values through `XMLSerializer`.
import { afterEach, describe, expect, it, vi } from "vitest";

import { addDcCatalog } from "./opencastUpload";

type CatalogArgs = Parameters<typeof addDcCatalog>[0];

const template = `<?xml version="1.0" encoding="UTF-8"?>
<dublincore xmlns="http://www.opencastproject.org/xsd/1.0/dublincore/"
            xmlns:dcterms="http://purl.org/dc/terms/">
  <dcterms:title>{{ title }}</dcterms:title>
  <dcterms:creator>{{ presenter }}</dcterms:creator>
  <dcterms:isPartOf>{{ seriesId }}</dcterms:isPartOf>
  <dcterms:spatial>{{ location }}</dcterms:spatial>
</dublincore>`;

const args: CatalogArgs = {
  mediaPackage: '<mediapackage id="mp-1"/>',
  title: "Vorlesung 01 & Übung",
  presenter: "Ada Lovelace",
  uploadSettings: {
    seriesId: "series-1",
    workflowId: "wf",
    acl: "",
    dcc: template,
    titleField: "",
    presenterField: "",
  },
  currentUser: { user: { name: "Ada Lovelace" } } as unknown as CatalogArgs["currentUser"],
  location: "Upload",
  setUploadError: () => {},
};

describe("addDcCatalog", () => {
  afterEach(() => vi.unstubAllGlobals());

  // Regression: the catalog used to be percent-encoded by hand into a multipart
  // body. Opencast does not URL-decode multipart fields, so it saw "%3C%3Fxml…",
  // failed with "Content is not allowed in prolog" and answered HTTP 500.
  it("posts the raw catalog XML in a urlencoded body, never percent-encoded by hand", async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init: RequestInit) => {
        calls.push({ url, init });
        return new Response('<mediapackage id="mp-1"><metadata/></mediapackage>', {
          status: 200,
        });
      }),
    );

    const result = await addDcCatalog(args);

    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toBe("/ingest/addDCCatalog");
    expect(calls[0]!.init.method).toBe("post");

    const body = calls[0]!.init.body;
    expect(body).toBeInstanceOf(URLSearchParams);
    const params = body as URLSearchParams;

    const dc = params.get("dublinCore") ?? "";
    expect(dc.startsWith("<?xml")).toBe(true);
    expect(dc).not.toContain("%3C");
    // Values are XML-escaped by the template, not URL-escaped.
    expect(dc).toContain("<dcterms:title>Vorlesung 01 &amp; Übung</dcterms:title>");
    expect(dc).toContain("<dcterms:isPartOf>series-1</dcterms:isPartOf>");
    expect(params.get("mediaPackage")).toBe('<mediapackage id="mp-1"/>');
    expect(params.get("flavor")).toBe("dublincore/episode");

    expect(result).toBe('<mediapackage id="mp-1"><metadata/></mediapackage>');
  });

  // A percent sign in a title used to be rewritten to "%25" by hand. With a
  // urlencoded body that is the browser's job, done exactly once.
  it("leaves a percent sign in the title to the body encoding", async () => {
    let sent = "";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init: RequestInit) => {
        sent = (init.body as URLSearchParams).toString();
        return new Response("<mediapackage/>", { status: 200 });
      }),
    );

    await addDcCatalog({ ...args, title: "Auslastung 100%" });

    // The decoded value is the real title; on the wire it is escaped once.
    expect(new URLSearchParams(sent).get("dublinCore")).toContain(
      "<dcterms:title>Auslastung 100%</dcterms:title>",
    );
    expect(sent).toContain("Auslastung+100%25");
    expect(sent).not.toContain("%2525");
  });
});
