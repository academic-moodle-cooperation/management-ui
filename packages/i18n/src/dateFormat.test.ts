import { describe, it, expect, beforeEach, vi } from "vitest";

// The real `./index` boots i18next with the HTTP backend and the browser
// language detector, neither of which works in this package's node
// environment. Only the active language matters here, so a stub is enough.
const mocked = vi.hoisted(() => ({
  i18next: {
    resolvedLanguage: "en" as string | undefined,
    language: undefined as string | undefined,
  },
}));
vi.mock("./index", () => mocked);

import { activeDateLocale, formatDate } from "./dateFormat";

describe("activeDateLocale", () => {
  beforeEach(() => {
    mocked.i18next.resolvedLanguage = "en";
    mocked.i18next.language = undefined;
  });

  it("prefers the language i18next actually resolved to", () => {
    mocked.i18next.resolvedLanguage = "de";
    mocked.i18next.language = "de-AT";

    expect(activeDateLocale()).toBe("de");
  });

  it("falls back to the detected language, then to English", () => {
    mocked.i18next.resolvedLanguage = undefined;
    mocked.i18next.language = "de-AT";
    expect(activeDateLocale()).toBe("de-AT");

    mocked.i18next.language = undefined;
    expect(activeDateLocale()).toBe("en");
  });
});

describe("formatDate", () => {
  const date = new Date("2026-08-14T12:30:00Z");

  beforeEach(() => {
    mocked.i18next.resolvedLanguage = "en";
    mocked.i18next.language = undefined;
  });

  it("formats in the active language rather than a fixed locale", () => {
    const options: Intl.DateTimeFormatOptions = { dateStyle: "medium", timeZone: "UTC" };

    const english = formatDate(date, options);
    mocked.i18next.resolvedLanguage = "de";
    const german = formatDate(date, options);

    expect(english).toBe(new Intl.DateTimeFormat("en", options).format(date));
    expect(german).toBe(new Intl.DateTimeFormat("de", options).format(date));
    expect(english).not.toBe(german);
  });

  it("accepts what the API layer hands over — ISO string, timestamp or Date", () => {
    const options: Intl.DateTimeFormatOptions = { dateStyle: "medium", timeZone: "UTC" };
    const expected = formatDate(date, options);

    expect(formatDate(date.toISOString(), options)).toBe(expected);
    expect(formatDate(date.getTime(), options)).toBe(expected);
  });

  // These run inside table cells: `Intl` throws a RangeError on an invalid
  // date, which would take out the whole row rather than one field.
  it("yields an empty string instead of throwing on unusable input", () => {
    expect(formatDate(null)).toBe("");
    expect(formatDate(undefined)).toBe("");
    expect(formatDate("")).toBe("");
    expect(formatDate("not a date")).toBe("");
  });
});
