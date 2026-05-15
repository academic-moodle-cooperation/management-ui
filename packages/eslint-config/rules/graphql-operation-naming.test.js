/**
 * Integration tests for the graphql-operation-naming rule.
 *
 * The rule resolves the expected prefix by walking up from the file's
 * directory looking for `plugin.json` or the special `packages/query/`
 * path. So the test fixtures are real directories on disk under
 * `__fixtures__/`. RuleTester is passed an absolute `filename` for each
 * case so the rule's filesystem traversal hits those fixtures.
 */

import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import * as graphqlEslint from "@graphql-eslint/eslint-plugin";
import { RuleTester } from "eslint";
import { afterAll, describe, it } from "vitest";

import { graphqlOperationNaming } from "./graphql-operation-naming.js";

// Bridge ESLint's RuleTester into Vitest's runner. Without this, RuleTester
// uses its default no-op stubs and Vitest reports "no test suite found".
RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;
RuleTester.afterAll = afterAll;

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES = resolve(__dirname, "__fixtures__");

// File paths used as `filename` for RuleTester cases. The files don't
// need to exist — only the *directory* needs to be reachable for the
// upward `plugin.json` walk. We point at synthetic `.graphql` paths
// inside each fixture dir.
const FIXTURE_FILES = {
  withPlugin: join(FIXTURES, "with-plugin", "queries.graphql"),
  withPluginMulti: join(FIXTURES, "with-plugin-multi", "queries.graphql"),
  sharedCore: join(FIXTURES, "packages", "query", "queries.graphql"),
  noContext: join(FIXTURES, "no-context", "queries.graphql"),
};

const tester = new RuleTester({
  languageOptions: {
    parser: graphqlEslint.parser,
  },
});

tester.run("graphql-operation-naming", graphqlOperationNaming, {
  valid: [
    // 1. Operations in the shared-core package use the `Mui` prefix.
    {
      name: "shared-core operation with Mui prefix",
      filename: FIXTURE_FILES.sharedCore,
      code: /* GraphQL */ `
        query MuiGetMyEvents {
          currentUser {
            __typename
          }
        }
      `,
    },
    {
      name: "shared-core fragment with Mui prefix",
      filename: FIXTURE_FILES.sharedCore,
      code: /* GraphQL */ `
        fragment MuiCurrentUserFields on CurrentUser {
          __typename
        }
      `,
    },

    // 2. Plugin operations use the plugin's PascalCase namespace.
    {
      name: "single-segment plugin namespace",
      filename: FIXTURE_FILES.withPlugin,
      code: /* GraphQL */ `
        query MyPluginGetThings {
          things {
            __typename
          }
        }
      `,
    },
    {
      name: "multi-segment plugin namespace (kebab → Pascal)",
      filename: FIXTURE_FILES.withPluginMulti,
      code: /* GraphQL */ `
        query CoreEpisodesGetEpisode {
          episodes {
            __typename
          }
        }
      `,
    },
    {
      name: "plugin fragment correctly prefixed",
      filename: FIXTURE_FILES.withPlugin,
      code: /* GraphQL */ `
        fragment MyPluginThingFields on Thing {
          __typename
        }
      `,
    },

    // 3. Mutations and subscriptions are checked the same way.
    {
      name: "mutation with the right prefix",
      filename: FIXTURE_FILES.withPlugin,
      code: /* GraphQL */ `
        mutation MyPluginCreateThing($input: ThingInput!) {
          createThing(input: $input) {
            __typename
          }
        }
      `,
    },

    // 4. Anonymous operations are allowed (no name = no possible violation).
    {
      name: "anonymous query (no name)",
      filename: FIXTURE_FILES.withPlugin,
      code: /* GraphQL */ `
        {
          currentUser {
            __typename
          }
        }
      `,
    },

    // 5. Files outside a plugin context and outside packages/query skip
    //    enforcement silently.
    {
      name: "no-context file → rule silently skips",
      filename: FIXTURE_FILES.noContext,
      code: /* GraphQL */ `
        query JustABareName {
          __typename
        }
      `,
    },
  ],

  invalid: [
    // Bare names in shared-core fail with the expected suggestion.
    {
      name: "shared-core query missing Mui prefix",
      filename: FIXTURE_FILES.sharedCore,
      code: /* GraphQL */ `
        query GetMyEvents {
          currentUser {
            __typename
          }
        }
      `,
      errors: [
        {
          messageId: "missingPrefix",
          data: {
            kind: "query",
            name: "GetMyEvents",
            prefix: "Mui",
            example: "MuiGetMyEvents",
          },
        },
      ],
    },

    // Plugin operations without the namespace prefix are flagged.
    {
      name: "plugin query missing plugin namespace prefix",
      filename: FIXTURE_FILES.withPlugin,
      code: /* GraphQL */ `
        query GetThings {
          things {
            __typename
          }
        }
      `,
      errors: [
        {
          messageId: "missingPrefix",
          data: {
            kind: "query",
            name: "GetThings",
            prefix: "MyPlugin",
            example: "MyPluginGetThings",
          },
        },
      ],
    },

    // Multi-segment kebab namespace correctly converts to PascalCase.
    {
      name: "multi-segment plugin missing prefix",
      filename: FIXTURE_FILES.withPluginMulti,
      code: /* GraphQL */ `
        query GetEpisode {
          episodes {
            __typename
          }
        }
      `,
      errors: [
        {
          messageId: "missingPrefix",
          data: {
            kind: "query",
            name: "GetEpisode",
            prefix: "CoreEpisodes",
            example: "CoreEpisodesGetEpisode",
          },
        },
      ],
    },

    // Wrong prefix (real plugin name but lower-cased, or a sibling plugin's) is rejected.
    {
      name: "lower-cased prefix is rejected",
      filename: FIXTURE_FILES.withPlugin,
      code: /* GraphQL */ `
        query myPluginGetThings {
          things {
            __typename
          }
        }
      `,
      errors: [{ messageId: "missingPrefix" }],
    },

    // Fragments are checked too.
    {
      name: "fragment missing prefix",
      filename: FIXTURE_FILES.withPlugin,
      code: /* GraphQL */ `
        fragment ThingFields on Thing {
          __typename
        }
      `,
      errors: [
        {
          messageId: "missingPrefix",
          data: {
            kind: "fragment",
            name: "ThingFields",
            prefix: "MyPlugin",
            example: "MyPluginThingFields",
          },
        },
      ],
    },

    // Multiple violations in the same document are all reported.
    {
      name: "multiple violations all reported",
      filename: FIXTURE_FILES.sharedCore,
      code: /* GraphQL */ `
        fragment EventFields on Event {
          __typename
        }

        query GetMyEvents {
          events {
            ...EventFields
          }
        }

        mutation CreateThing {
          __typename
        }
      `,
      errors: [
        { messageId: "missingPrefix" },
        { messageId: "missingPrefix" },
        { messageId: "missingPrefix" },
      ],
    },
  ],
});
