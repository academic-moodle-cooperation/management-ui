import { describe, expect, it } from "vitest";

import { isSeriesNameQueryEnabled } from "./useSeriesName";

describe("isSeriesNameQueryEnabled", () => {
  it("disables the series-name lookup when no series id is present", () => {
    // The episodes route renders an "all episodes" view with no series, so a
    // missing/empty id must skip the request — otherwise `seriesById` rejects
    // it with "Identifier cannot be null".
    expect(isSeriesNameQueryEnabled(undefined)).toBe(false);
    expect(isSeriesNameQueryEnabled("")).toBe(false);
  });

  it("enables the lookup once a non-empty series id is available", () => {
    expect(isSeriesNameQueryEnabled("series-1")).toBe(true);
  });
});
