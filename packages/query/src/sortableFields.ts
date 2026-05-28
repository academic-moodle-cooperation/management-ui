/**
 * Backend-sortable field lists.
 *
 * The GraphQL backend only accepts a fixed set of fields in its
 * `*OrderByInput` types. A table column that maps to a field *not* in
 * that set must not offer a sort control — sending it as an `orderBy`
 * variable fails the query ("field name '<x>' is not defined for input
 * object type 'EventOrderByInput'").
 *
 * These arrays are the runtime representation of those sets. They're the
 * source of truth a table consumer feeds into
 * `restrictSortingToFields` (from `@oc-mui/ui`) so the UI never offers a
 * sort the backend rejects.
 *
 * They are kept honest at compile time by the assertions at the bottom of
 * this file:
 *  - `satisfies` proves every listed field is a real key of the generated
 *    input type (catches typos / removed fields).
 *  - the `Missing*` checks prove the list is complete (catches a newly
 *    added orderable field the list forgot).
 *
 * When the schema changes, `pnpm --filter @oc-mui/query codegen`
 * regenerates the input types and these assertions surface any drift.
 */

import type { EventOrderByInput, SeriesOrderByInput } from "./gql-generated";

/** Fields the backend accepts in `EventOrderByInput`. */
export const EVENT_SORTABLE_FIELDS = [
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
] as const satisfies readonly (keyof EventOrderByInput)[];

/** Fields the backend accepts in `SeriesOrderByInput`. */
export const SERIES_SORTABLE_FIELDS = [
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
] as const satisfies readonly (keyof SeriesOrderByInput)[];

export type EventSortableField = (typeof EVENT_SORTABLE_FIELDS)[number];
export type SeriesSortableField = (typeof SERIES_SORTABLE_FIELDS)[number];

// ---------------------------------------------------------------------------
// Compile-time completeness checks.
//
// `satisfies` above guarantees no INVALID entries. These guarantee no
// MISSING ones: if the schema gains an orderable field that the runtime
// list forgot, `Missing*` resolves to that field's name (a string literal)
// and `true` is no longer assignable — a compile error naming the gap.
// ---------------------------------------------------------------------------

type MissingEventSortableFields = Exclude<keyof EventOrderByInput, EventSortableField>;
type MissingSeriesSortableFields = Exclude<keyof SeriesOrderByInput, SeriesSortableField>;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _eventFieldsComplete: MissingEventSortableFields extends never
  ? true
  : MissingEventSortableFields = true;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _seriesFieldsComplete: MissingSeriesSortableFields extends never
  ? true
  : MissingSeriesSortableFields = true;
