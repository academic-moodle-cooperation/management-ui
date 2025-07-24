import type { CodegenConfig } from "@graphql-codegen/cli";
import process from 'node:process';

const graphqlEndpoint = process.env.GRAPHQL_ENDPOINT || "http://127.0.0.1:8080/graphql";
const graphqlHeaders = process.env.GRAPHQL_HEADERS ? JSON.parse(process.env.GRAPHQL_HEADERS) : {};

const config: CodegenConfig = {
  schema: [
    {
      [graphqlEndpoint]: {
        headers: graphqlHeaders
      },
    },
  ],
  overwrite: true,
  documents: './src/**/*.graphql',
  emitLegacyCommonJSImports: false,
  generates: {
    "./src/gql-generated.ts": {
      plugins: [
        {
          add: {
            content:
              'import { UseQueryResult, UseSuspenseQueryResult} from "@tanstack/react-query";',
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
        fetcher: {
          func: "./fetcher#fetchData",
        },
      },
    },
  },
};
export default config;
