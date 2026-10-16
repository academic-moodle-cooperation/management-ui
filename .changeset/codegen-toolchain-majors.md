---
"@oc-mui/query": minor
"@oc-mui/ui": minor
"@oc-mui/plugin-core-series": patch
"@oc-mui/plugin-core-episodes": patch
---

Move the GraphQL codegen toolchain to its current majors (`@graphql-codegen/cli` 7,
`typescript` 6, `typescript-operations` 6, `typescript-react-query` 7; the unused
`client-preset` is dropped) and regenerate `gql-generated.ts`. Nothing changes at
runtime — the hooks, fetchers and document constants behave exactly as before —
but the generators tightened the **types**, and the generated types are part of
this package's public surface:

- **Nullable result fields are no longer optional.** A field the schema declares
  nullable used to be generated as `title?: string | null`; it is now
  `title: string | null`. Reading code is unaffected (the new type is assignable
  to the old one). Code that *constructs* values of a generated type — test
  fixtures, mock data, `satisfies` checks — must now spell out `null` for every
  nullable field it omitted.
- **Custom scalars are typed.** `DateTime` and `Duration` are `string`, `Long`
  is `number`, `JSON` is `unknown`. They used to be `any`, which silently
  accepted e.g. treating a `Long` id as a string; such places now fail to
  compile and need an explicit conversion or narrowing.
- **Deprecated:** `Exact`, `MakeOptional`, `MakeMaybe`, `MakeEmpty`. The
  generator no longer exports these internal helpers; hand-written copies keep
  them available, marked `@deprecated`, until the next major.

The generators' other new behaviour is neutralised in the codegen config and
post-processing rather than passed on: duplicate input/enum declarations are
suppressed via `importSchemaTypesFrom`, and the `TypedDocumentString` wrapper
`typescript-react-query` 7 puts around every document constant is unwrapped back
into the plain string it always was (the wrapper would have broken `===` and
`graphql-request`'s `client.request()` for consumers while typing nothing).

`@oc-mui/ui`, `@oc-mui/plugin-core-series` and `@oc-mui/plugin-core-episodes`
adapt to the typed scalars and the required-with-`null` fields: the ACL editor
converts the managed-ACL id to the `Long` the mutation input expects,
`MetadataField` renders through the string form of the field value instead of
relying on `any`, and `MetadataUpdateField` now accepts the field's value in
whatever scalar type the API delivers it (`value: unknown`) and normalises it
itself — callers that passed `string | string[]` are unaffected.
