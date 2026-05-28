import { describe, expect, it } from "vitest";

import { EVENT_SORTABLE_FIELDS, SERIES_SORTABLE_FIELDS } from "./sortableFields";

// These tests pin the runtime field lists so an unintended change shows up
// in a diff. The compile-time `satisfies` + completeness assertions in
// sortableFields.ts already guarantee the lists agree with the generated
// EventOrderByInput / SeriesOrderByInput types; the snapshot here guards
// against a *deliberate-looking* but wrong edit (e.g. dropping a field by
// hand without the schema actually changing).

describe("EVENT_SORTABLE_FIELDS", () => {
  it("matches the backend's EventOrderByInput fields", () => {
    expect([...EVENT_SORTABLE_FIELDS].sort()).toEqual(
      [
        "created",
        "endDate",
        "eventStatus",
        "location",
        "presenters",
        "seriesName",
        "startDate",
        "technicalEndTime",
        "technicalStartTime",
        "title",
        "workflowState",
      ].sort(),
    );
  });

  it("does not include description, contributors, or duration", () => {
    // The exact fields that caused the original "/episodes sort" bug —
    // they are NOT orderable for events.
    expect(EVENT_SORTABLE_FIELDS).not.toContain("description");
    expect(EVENT_SORTABLE_FIELDS).not.toContain("contributors");
    expect(EVENT_SORTABLE_FIELDS).not.toContain("duration");
  });
});

describe("SERIES_SORTABLE_FIELDS", () => {
  it("matches the backend's SeriesOrderByInput fields", () => {
    expect([...SERIES_SORTABLE_FIELDS].sort()).toEqual(
      [
        "contributors",
        "created",
        "creator",
        "description",
        "language",
        "license",
        "publishers",
        "rightHolder",
        "subject",
        "title",
      ].sort(),
    );
  });

  it("includes description and contributors (sortable for series, unlike events)", () => {
    // Documents the asymmetry that confused us during the bug hunt.
    expect(SERIES_SORTABLE_FIELDS).toContain("description");
    expect(SERIES_SORTABLE_FIELDS).toContain("contributors");
  });
});
