/**
 * graphql-operation-naming
 *
 * Enforces the GraphQL Operation Naming Contract (docs/architecture/CONTRACTS.md §6):
 * every `query` / `mutation` / `subscription` / `fragment` declared by a plugin
 * is prefixed with the plugin's namespace in PascalCase, so two plugins can't
 * collide on a fragment name at GraphQL Codegen, attribute load to the wrong
 * plugin in server logs, or fight over the same TanStack Query cache entry.
 *
 * How the rule decides what the prefix should be:
 *
 *   1. Walk up the file's directory tree from `context.filename`.
 *   2. If we hit a directory that *is* `packages/query/` (the shared-core
 *      GraphQL package), the prefix is `Mui`. Shared-core operations don't
 *      belong to any one plugin; the contract calls out `Mui` explicitly.
 *   3. Otherwise, the first `plugin.json` we find is the owning plugin's
 *      manifest. We read `namespace` (kebab-case) and convert to PascalCase.
 *   4. If neither is found, we skip enforcement — many packages don't host
 *      GraphQL at all and shouldn't be required to add a `plugin.json`.
 *
 * The rule visits `OperationDefinition` and `FragmentDefinition` nodes from
 * the GraphQL AST. It works on both `.graphql` files (parsed directly) and
 * `gql` template literals inside `.ts` / `.tsx` files (extracted by the
 * `@graphql-eslint/eslint-plugin` processor configured in `base.js`).
 *
 * Reports go on the operation/fragment NAME node, so the squiggle highlights
 * exactly the identifier that needs renaming.
 */

import { existsSync, readFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";

const RULE_NAME = "graphql-operation-naming";

/**
 * Convert kebab-case to PascalCase.
 *
 *   "core"          -> "Core"
 *   "my-plugin"     -> "MyPlugin"
 *   "core-episodes" -> "CoreEpisodes"
 *   ""              -> ""
 *   "MyPlugin"      -> "MyPlugin"   (already PascalCase: leave alone)
 *
 * The "already PascalCase" branch protects manifests that already declare
 * a PascalCase-looking namespace, even though kebab-case is the documented
 * shape. It's defensive — we never want to reject a name that's already
 * conformant with the contract.
 */
function kebabToPascal(input) {
  if (typeof input !== "string" || input.length === 0) return "";
  // Already PascalCase? Leave alone.
  if (/^[A-Z]/.test(input) && !input.includes("-")) return input;
  return input
    .split("-")
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

/**
 * Resolve the expected operation/fragment prefix for a file.
 *
 * Cached per directory to avoid re-reading `plugin.json` for every operation
 * in the same file (a large `.graphql` file will visit this many times).
 */
const prefixCache = new Map();

function resolvePrefix(filePath) {
  if (typeof filePath !== "string" || filePath.length === 0) return null;
  let dir = dirname(filePath);
  if (prefixCache.has(dir)) return prefixCache.get(dir);

  // Walk up. Stop at filesystem root (when dirname(dir) === dir).
  let cursor = dir;
  let prefix = null;
  while (cursor && cursor !== dirname(cursor)) {
    // Shared-core special case: packages/query/ -> "Mui".
    // We match on basename to avoid being fooled by paths like
    // `.../some-thing/packages/query/...` outside the workspace, but
    // accept both `<root>/packages/query` and any deeper variant.
    if (
      basename(cursor) === "query" &&
      basename(dirname(cursor)) === "packages"
    ) {
      prefix = "Mui";
      break;
    }
    const manifestPath = join(cursor, "plugin.json");
    if (existsSync(manifestPath)) {
      try {
        const raw = readFileSync(manifestPath, "utf8");
        const manifest = JSON.parse(raw);
        if (typeof manifest?.namespace === "string") {
          prefix = kebabToPascal(manifest.namespace);
        }
      } catch {
        // Unreadable / unparseable manifest — skip. The plugin's own
        // schema-validation step will catch this; we just don't enforce
        // GraphQL naming on it.
      }
      break;
    }
    cursor = dirname(cursor);
  }

  prefixCache.set(dir, prefix);
  return prefix;
}

/** @type {import('@graphql-eslint/eslint-plugin').GraphQLESLintRule} */
export const graphqlOperationNaming = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforce that every GraphQL operation and fragment is prefixed with the plugin's namespace in PascalCase (CONTRACTS.md §6).",
      recommended: true,
      url: "https://github.com/academic-moodle-cooperation/management-ui/blob/HEAD/docs/architecture/CONTRACTS.md#6-graphql-operation-naming",
    },
    messages: {
      missingPrefix:
        "GraphQL {{kind}} '{{name}}' must be prefixed with the plugin's namespace. Expected something starting with '{{prefix}}' (e.g. '{{example}}'). See docs/architecture/CONTRACTS.md §6.",
    },
    schema: [],
  },

  create(context) {
    const prefix = resolvePrefix(context.filename);
    if (!prefix) {
      // No plugin context (and not in packages/query/) — skip silently.
      // This is intentionally permissive: the rule doesn't fire on packages
      // that don't host GraphQL.
      return {};
    }

    function check(node, kind) {
      if (!node.name?.value) return; // Anonymous operations are allowed.
      const actual = node.name.value;
      if (actual.startsWith(prefix)) return;
      context.report({
        node: node.name,
        messageId: "missingPrefix",
        data: {
          kind,
          name: actual,
          prefix,
          example: `${prefix}${actual.charAt(0).toUpperCase()}${actual.slice(1)}`,
        },
      });
    }

    return {
      OperationDefinition(node) {
        check(node, node.operation);
      },
      FragmentDefinition(node) {
        check(node, "fragment");
      },
    };
  },
};

export const ruleName = RULE_NAME;
