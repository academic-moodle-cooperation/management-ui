---
---

Derive the backend-orderable field lists from the GraphQL schema via
codegen instead of hand-writing them.

Follow-up to the sortable-fields work: a new local codegen plugin
(`packages/query/src/codegen-plugins/input-field-names.mjs`) walks the
introspected schema and emits runtime `as const` arrays of the field
names in every `*OrderByInput` / `*FilterByInput` type, into
`packages/query/src/schema-input-fields.generated.ts` (committed,
regenerated alongside `gql-generated.ts`). `sortableFields.ts` now
re-exports those generated arrays under the friendly
`EVENT_SORTABLE_FIELDS` / `SERIES_SORTABLE_FIELDS` names rather than
declaring them by hand.

Net effect: `@opencast-mui/query`'s public surface is unchanged (same exported
names and types as before), but the values are now single-sourced from
the schema — a backend change to which fields are orderable flows through
`pnpm --filter @opencast-mui/query codegen` automatically. Covers all four
matching input types today (Event/Series OrderBy, ManagedAcl OrderBy,
Event FilterBy), so future sortable/filterable tables are pre-covered.

No version bump: the public API is identical to what the preceding
sortable-fields change already introduced. Empty changeset records the
internal-derivation refactor.
