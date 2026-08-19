import { i18next } from "./index";

/**
 * Locale-aware date formatting.
 *
 * Six call sites across the tables, the metadata fields and the date picker
 * used to build `new Intl.DateTimeFormat("de-DE", …)` themselves, so a user on
 * English still read German dates. They now share this helper, which takes the
 * locale from the active i18n language instead of a constant.
 */

/** Dates in this UI are shown as "12 Aug 2026, 14:30" unless stated otherwise. */
const DEFAULT_OPTIONS: Intl.DateTimeFormatOptions = {
  dateStyle: "medium",
  timeStyle: "short",
};

/**
 * The language `Intl` should format for.
 *
 * `resolvedLanguage` is what i18next actually serves translations in — it
 * accounts for the fallback, so an unsupported detected language yields `en`
 * rather than a locale nothing else in the UI uses. Regional tags survive
 * (`de-AT` stays `de-AT`), which is exactly what `Intl` wants.
 */
export const activeDateLocale = (): string => i18next.resolvedLanguage || i18next.language || "en";

/**
 * Format a date in the active UI language.
 *
 * Accepts whatever the GraphQL layer hands over — an ISO string, a timestamp,
 * or a `Date`. An unparsable value yields an empty string: these run inside
 * table cells, where `Intl` throwing a `RangeError` on `Invalid Date` would
 * take down the whole row.
 */
export const formatDate = (
  value: string | number | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = DEFAULT_OPTIONS,
): string => {
  if (value === null || value === undefined || value === "") return "";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat(activeDateLocale(), options).format(date);
};
