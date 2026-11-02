import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  // One committed SDL per supported Opencast major (schema-19.graphql,
  // schema-20.graphql, …). Codegen always runs against the NEWEST one: the
  // schemas form a strict superset chain, so the generated types serve every
  // release line and the generated file is identical on all of them.
  // `pnpm schema:validate` (src/validate-schemas.mjs) enforces the superset
  // property and validates every document against every schema it must work
  // with; `codegen:check` runs both. Refreshing an SDL from a live Opencast is
  // the separate, reviewed step: `pnpm schema:refresh` (src/refresh-schema.mjs).
  schema: "./src/schema-20.graphql",
  overwrite: true,
  documents: "./src/**/*.graphql",
  emitLegacyCommonJSImports: false,
  generates: {
    "./src/gql-generated.ts": {
      plugins: [
        {
          add: {
            content:
              'import type { UseQueryResult, UseSuspenseQueryResult} from "@tanstack/react-query";',
          },
        },
        {
          add: {
            content: "/* eslint-disable */",
          },
        },
        "typescript",
        "typescript-operations",
        "typescript-react-query",
      ],
      config: {
        reactQueryVersion: 5,
        legacyMode: false,
        exposeFetcher: true,
        exposeQueryKeys: true,
        addSuspenseQuery: true,
        skipTypename: true,
        // Fragments on interfaces (PlaylistEntry) generate one sub-type per
        // implementation; export them so consumers can name the narrowed
        // member instead of re-deriving it with Extract<>.
        exportFragmentSpreadSubTypes: true,
        useTypeImports: true,
        // typescript-operations >= 6 is self-contained: it re-emits every
        // input type and enum an operation names, which duplicates the
        // declarations the `typescript` plugin already writes into this same
        // file. Pointing `importSchemaTypesFrom` at the output file tells it
        // the schema types live "elsewhere" (here), so it emits neither the
        // duplicates nor an import — the bare references resolve against the
        // `typescript` plugin's declarations above them.
        importSchemaTypesFrom: "./src/gql-generated.ts",
        // Without this the plugin would prefix every such reference with
        // `Types.` and add `import type * as Types from './gql-generated'` —
        // a self-import. An empty namespace keeps the references bare.
        namespacedImportName: "",
        // Custom scalars default to `unknown` since typescript@6 (was `any`).
        // Map them to what the backend actually puts on the wire: RFC-3339
        // timestamps and ISO-8601 durations as strings, Long as a JSON number,
        // JSON as an opaque value the consumer narrows itself.
        scalars: {
          DateTime: "string",
          Duration: "string",
          JSON: "unknown",
          Long: "number",
        },
        fetcher: {
          func: "./fetcher#fetchData",
        },
      },
    },
    // Runtime field-name arrays for the backend's *OrderByInput /
    // *FilterByInput types. TypeScript input types are erased at runtime,
    // so the UI can't enumerate them — this emits real `as const` arrays
    // the table layer feeds into restrictSortingToFields (@oc-mui/ui).
    // Plugin path is cwd-relative (codegen runs from packages/query/),
    // matching the `documents` and output paths above.
    "./src/schema-input-fields.generated.ts": {
      plugins: ["./src/codegen-plugins/input-field-names.mjs"],
    },
  },
};
export default config;
