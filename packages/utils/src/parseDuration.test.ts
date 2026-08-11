import { describe, it, expect } from "vitest";

import { parseDuration } from "./index";

describe("parseDuration", () => {
  it("formats ISO 8601 durations as HH:MM:SS", () => {
    expect(parseDuration("PT10M")).toBe("00:10:00");
    expect(parseDuration("PT1H2M3S")).toBe("01:02:03");
    expect(parseDuration("PT1M38S")).toBe("00:01:38");
  });

  it("rounds fractional seconds", () => {
    expect(parseDuration("PT9.6S")).toBe("00:00:10");
  });

  it("returns 00:00:00 for undefined/empty (callers render this as ∞)", () => {
    expect(parseDuration(undefined)).toBe("00:00:00");
    expect(parseDuration("")).toBe("00:00:00");
  });

  // #253 — a single malformed duration used to throw mid-render and unmount
  // the entire Videos page. The raw value comes back instead: one odd cell.
  it("returns the raw value for input tinyduration cannot parse", () => {
    expect(parseDuration("600000")).toBe("600000");
    expect(parseDuration("garbage")).toBe("garbage");
    expect(parseDuration("12:34")).toBe("12:34");
  });
});
