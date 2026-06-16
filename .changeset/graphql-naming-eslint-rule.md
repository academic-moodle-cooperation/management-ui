---
"@opencast-mui/eslint-config": minor
---

Phase 8.5.1b — mechanical enforcement of the GraphQL Operation Naming
Contract (CONTRACTS.md §6).

New custom ESLint rule `local/graphql-operation-naming` parses every
`.graphql` file and every `gql\`\`` template literal inside `.ts`/`.tsx`,
walks up from the file's directory to find the owning plugin's
`plugin.json` (or detects `packages/query/` for shared-core), and fails
the lint pass on any operation or fragment whose name doesn't start
with the expected PascalCase prefix.

The rule lives at `packages/eslint-config/rules/graphql-operation-naming.js`
and is exported through a small local plugin (`local/*` in `base.js`).
14 RuleTester cases cover valid + invalid scenarios including multi-segment
kebab-to-PascalCase conversion and the `packages/query/` → `Mui` special
case.

New dependencies: `@graphql-eslint/eslint-plugin` (parser + processor for
`.graphql` and `gql\`\`` extraction), `graphql` (parser dep), and `vitest`
(rule tests).

Legacy operations in `packages/query/src/queries.graphql` (33),
`packages/query/src/hooks/useGetCurrentUser.ts` (1), and
`plugins/core-upload/src/App.tsx` (1) are grandfathered with
`# eslint-disable-next-line local/graphql-operation-naming` comments
which double as the migration tracker — `git grep -c` of the comment
gives the number of legacy ops still to rename. The actual rename batch
is tracked as the next follow-up in
`docs/operations/open-followups.md` §5.1.
