/**
 * Backend-sortable field lists.
 *
 * The GraphQL backend only accepts a fixed set of fields in its
 * `*OrderByInput` types. A table column that maps to a field *not* in
 * that set must not offer a sort control — sending it as an `orderBy`
 * variable fails the query ("field name '<x>' is not defined for input
 * object type 'EventOrderByInput'").
 *
 * These arrays are the runtime representation of those sets, consumed by
 * `restrictSortingToFields` (from `@oc-mui/ui`) so the UI never offers a
 * sort the backend rejects.
 *
 * They are **derived from the schema, not hand-written**: the
 * `codegen-plugins/input-field-names.mjs` plugin emits
 * `EVENT_ORDER_BY_FIELDS` / `SERIES_ORDER_BY_FIELDS` (and the rest) into
 * `schema-input-fields.generated.ts` straight from the introspected
 * GraphQL schema. This module re-exports them under the sorting-oriented
 * names the UI uses. When the schema changes, run
 * `pnpm --filter @oc-mui/query codegen` and the lists update with it.
 */

import { EVENT_ORDER_BY_FIELDS, SERIES_ORDER_BY_FIELDS } from "./schema-input-fields.generated";

/** Fields the backend accepts in `EventOrderByInput`. */
export const EVENT_SORTABLE_FIELDS = EVENT_ORDER_BY_FIELDS;

/** Fields the backend accepts in `SeriesOrderByInput`. */
export const SERIES_SORTABLE_FIELDS = SERIES_ORDER_BY_FIELDS;

export type EventSortableField = (typeof EVENT_SORTABLE_FIELDS)[number];
export type SeriesSortableField = (typeof SERIES_SORTABLE_FIELDS)[number];
