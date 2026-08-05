import { describe, expect, it } from "vitest";

import { parseWorkflowDefinitions } from "./workflows";

/**
 * The sample mirrors Opencast's own `etc/workflows/*.yaml`: `fast` carries
 * `tags: [upload, schedule]`, and `configuration_panel_json` arrives as a
 * string holding JSON.
 */
const FAST_PANEL = JSON.stringify([
  {
    description: "Publication",
    fieldset: [
      { name: "straightToPublishing", type: "checkbox", label: "Publish immediately", value: "true" },
    ],
  },
  {
    description: "Subtitles",
    fieldset: [
      { name: "transcription", type: "checkbox", label: "Generate subtitles" },
      { name: "translate", type: "checkbox", label: "Translate to English" },
    ],
  },
]);

describe("parseWorkflowDefinitions", () => {
  it("flattens the declared fieldsets into workflow property keys", () => {
    const [wf] = parseWorkflowDefinitions([
      { identifier: "fast", title: "Fast Testing Workflow", configuration_panel_json: FAST_PANEL },
    ]);
    // These names are exactly what has to be posted to /ingest/ingest.
    expect(wf?.fields.map((f) => f.name)).toEqual([
      "straightToPublishing",
      "transcription",
      "translate",
    ]);
    expect(wf?.fields[1]?.label).toBe("Generate subtitles");
  });

  it("accepts the panel as an already-parsed array too", () => {
    const [wf] = parseWorkflowDefinitions([
      {
        identifier: "x",
        title: "X",
        configuration_panel_json: [{ fieldset: [{ name: "a", type: "text" }] }],
      },
    ]);
    expect(wf?.fields.map((f) => f.name)).toEqual(["a"]);
  });

  it("sorts by displayOrder, then title", () => {
    const ids = parseWorkflowDefinitions([
      { identifier: "c", title: "C", displayOrder: 10 },
      { identifier: "a", title: "A" },
      { identifier: "b", title: "B", displayOrder: 1 },
    ]).map((w) => w.id);
    // No displayOrder sorts last rather than first — an unordered workflow
    // should not jump ahead of one the admin deliberately ranked.
    expect(ids).toEqual(["b", "c", "a"]);
  });

  it("survives a workflow whose panel is broken", () => {
    const defs = parseWorkflowDefinitions([
      { identifier: "good", title: "Good", configuration_panel_json: FAST_PANEL },
      { identifier: "bad", title: "Bad", configuration_panel_json: "{not json" },
    ]);
    expect(defs).toHaveLength(2);
    expect(defs.find((d) => d.id === "bad")?.fields).toEqual([]);
  });

  it("falls back to the id when a workflow has no title", () => {
    expect(parseWorkflowDefinitions([{ identifier: "no-title" }])[0]?.title).toBe("no-title");
  });

  it("ignores entries without an identifier and non-array payloads", () => {
    expect(parseWorkflowDefinitions([{ title: "orphan" }])).toEqual([]);
    expect(parseWorkflowDefinitions(null)).toEqual([]);
    expect(parseWorkflowDefinitions({ error: "nope" })).toEqual([]);
  });
});
