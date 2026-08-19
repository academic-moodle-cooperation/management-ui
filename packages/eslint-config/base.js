import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import js from "@eslint/js";
import * as graphqlEslint from "@graphql-eslint/eslint-plugin";
import eslintConfigPrettier from "eslint-config-prettier";
import boundaries from "eslint-plugin-boundaries";
import importPlugin from "eslint-plugin-import";
import onlyWarn from "eslint-plugin-only-warn";
import turboPlugin from "eslint-plugin-turbo";
import tseslint from "typescript-eslint";

import { localPlugin } from "./rules/index.js";

// Workspace root resolved from this config file's location, so the
// boundaries patterns work regardless of which package's cwd eslint
// happens to be running in (turbo invokes lint per-package).
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const config = [
  js.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommended,
  {
    ignores: [
      "**/coverage/**",
      "**/dist/**",
      "**/node_modules/**",
      "**/.turbo/**",
      "**/*gql-generated.ts",
      "**/*generated.ts",
      "**/gql-generated.ts",
      "**/generated.ts",
      "**/target/**",
      "**/*.d.ts",
    ],
  },
  {
    plugins: {
      turbo: turboPlugin,
      import: importPlugin,
    },
    rules: {
      "turbo/no-undeclared-env-vars": "warn",
      "no-unused-expressions": "off",
      "@typescript-eslint/no-unused-expressions": [
        "error",
        {
          allowShortCircuit: true,
          allowTernary: true,
          allowTaggedTemplates: true,
        },
      ],
      // Import order rules
      "import/order": [
        "error",
        {
          groups: ["builtin", "external", "internal", "parent", "sibling", "index", "type"],
          "newlines-between": "always",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
          pathGroups: [
            {
              pattern: "@oc-mui/**",
              group: "internal",
              position: "before",
            },
            {
              pattern: "@/**",
              group: "internal",
            },
          ],
          pathGroupsExcludedImportTypes: ["builtin"],
        },
      ],
      "import/no-duplicates": "error",
      "import/no-unresolved": "off", // TypeScript handles this
      // Prevent deep imports into UI internals - use stable exports only.
      //
      // Prevent direct imports of external libraries that we wrap on purpose.
      // Everything routing/data/state/i18n related must go through the
      // corresponding @oc-mui/* package so we can swap implementations
      // later without breaking plugins. The wrapping package itself overrides
      // this rule via its own eslint.config.js.
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@oc-mui/ui/src/*",
                "@oc-mui/ui/components/ui/*",
                "@oc-mui/ui/components/appshell/components/*",
              ],
              message:
                "Import from stable entrypoints like '@oc-mui/ui/components' or '@oc-mui/ui/lib/utils' instead of deep paths.",
            },
            {
              group: ["@tanstack/react-router", "@tanstack/react-router/*"],
              message:
                "Do not import @tanstack/react-router directly. Use @oc-mui/router instead. (Only packages/router/ itself may import @tanstack/react-router.)",
            },
            {
              group: ["@tanstack/react-query", "@tanstack/react-query/*"],
              message:
                "Do not import @tanstack/react-query directly. Use @oc-mui/query instead. (Only packages/query/ itself may import @tanstack/react-query.)",
            },
            {
              group: ["react-i18next", "react-i18next/*", "i18next", "i18next/*"],
              message:
                "Do not import i18next / react-i18next directly. Use @oc-mui/i18n instead. (Only packages/i18n/ itself may import them.)",
            },
            {
              group: ["jotai", "jotai/*"],
              message:
                "Do not import jotai directly. Use @oc-mui/store instead. (Only packages/store/ itself may import jotai.)",
            },
          ],
        },
      ],
    },
    settings: {
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
        },
      },
    },
  },
  // ─────────────────────────────────────────────────────────────────────────
  // Architectural import boundaries (file-path based, namespace-independent).
  //
  // Mechanises the cross-plugin / cross-app / app→plugin rules documented in
  // AGENTS.md. Wrapper-library rules (use @oc-mui/router instead of
  // @tanstack/react-router, etc.) live in the no-restricted-imports block
  // above because they're namespace-coupled and will be updated together
  // when Phase 6 finalises the workspace namespace.
  //
  // Elements are folder-based, so renaming the npm scope later won't
  // affect these rules.
  //
  //   app      = anything under apps/<name>/
  //   plugin   = anything under plugins/<name>/  (the plugins/ root barrel
  //              file plugins/index.ts is intentionally unmatched and so
  //              free to re-export from each individual plugin)
  //   package  = anything under packages/<name>/
  //
  // Rule matrix:
  //
  //   app    → app, package, plugin    (the shell mounts plugins)
  //   plugin → package + self + core   (`plugins/core` is the canonical
  //                                     infrastructure plugin owning the
  //                                     shared extension-point identifiers)
  //   package → package                (layered ordering inside packages
  //                                     is not enforced yet — follow-up)
  //
  // External imports (node_modules) are not covered here; the
  // no-restricted-imports rule above gates the wrapper exceptions.
  //
  // ─── Known limitations (documented so a future reader doesn't lose time) ──
  //
  // (b) Per-package eslint via turbo. `boundaries/root-path` below pins
  //     resolution to the workspace root so patterns work the same whether
  //     lint runs from a package's cwd or the workspace root. Removing the
  //     setting requires migrating to a single workspace-root eslint
  //     invocation; tradeoff is slower CI (no per-package cache).
  //
  // (c) v5-shaped selector syntax (`from: ["app"]`, `allow: ["package", …]`,
  //     `${from.plugin}` template). eslint-plugin-boundaries v6 introduced an
  //     "object selectors" migration (`from: { type: "app" }`, `{{from.plugin}}`)
  //     but its schema validator currently rejects `allow:` entries written
  //     with the new `{ type, captured }` object form. The plugin logs a
  //     `[boundaries][warning]` line on every run pointing at the migration
  //     guide; that's plugin stderr, not an eslint warning, so it doesn't
  //     trip --max-warnings. Migrating is a follow-up once upstream lands
  //     the object-shape support for `allow:`.
  //
  // (d) Cross-plugin imports written as workspace specifiers
  //     (`import "@oc-mui/plugin-<other>"`) are NOT caught today; only the
  //     relative-path form is (`import "../../<other-plugin>/..."`). The
  //     boundaries plugin follows the import resolver, but our pnpm symlinks
  //     don't get traversed in a way the plugin can match against the
  //     `plugins/<name>` element pattern. Likely fixable by configuring
  //     `eslint-import-resolver-typescript` more explicitly, or as a
  //     belt-and-suspenders `no-restricted-imports` rule against
  //     `@oc-mui/plugin-*` from inside plugin sources.
  {
    plugins: { boundaries },
    settings: {
      // See limitation (b) above.
      "boundaries/root-path": repoRoot,
      "boundaries/include": ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
      "boundaries/ignore": [
        "**/*.test.ts",
        "**/*.test.tsx",
        "**/*.spec.ts",
        "**/*.spec.tsx",
        "**/vite.config.ts",
        "**/vitest.config.ts",
        "**/playwright.config.ts",
        "**/eslint.config.js",
        "**/.changeset/**",
      ],
      // The plain folder-based pattern (`plugins/*` etc.) works cleanly now
      // that packages/plugin-system/src/plugins/ has been renamed to
      // src/builtins/ — there's no internal-directory collision to work
      // around. Previously this had to use mode:"full" + `plugins/*/**/*`
      // to avoid mistakenly classifying plugin-system's internal host
      // plugins as top-level `plugin` elements.
      "boundaries/elements": [
        { type: "app", pattern: "apps/*", capture: ["app"], mode: "folder" },
        { type: "plugin", pattern: "plugins/*", capture: ["plugin"], mode: "folder" },
        { type: "package", pattern: "packages/*", capture: ["package"], mode: "folder" },
      ],
    },
    rules: {
      "boundaries/no-unknown-files": "off",
      "boundaries/no-unknown": "off",
      // See limitation (c) above for why this uses v5-shaped selectors.
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          message:
            "Disallowed import: ${file.type} (${file.source}) cannot import from ${dependency.type} (${dependency.source}). See AGENTS.md → Boundaries.",
          rules: [
            { from: ["app"], allow: ["app", "package", "plugin"] },
            { from: ["package"], allow: ["package"] },
            {
              from: ["plugin"],
              // Plugins may consume packages, themselves (relative imports),
              // and the special `plugins/core` infrastructure plugin which
              // owns the canonical extension-point constants used across
              // every core/admin plugin.
              allow: [
                "package",
                ["plugin", { plugin: "${from.plugin}" }],
                ["plugin", { plugin: "core" }],
              ],
            },
          ],
        },
      ],
    },
  },
  {
    plugins: {
      onlyWarn,
    },
  },
  {
    languageOptions: {
      globals: {
        process: "readonly",
      },
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      // TypeScript strict rules
      "@typescript-eslint/no-explicit-any": "warn", // Start with warn, can escalate to error later
      // Note: no-floating-promises and no-misused-promises require type information
      // They should be enabled via @oc-mui/eslint-config/type-aware
    },
  },
  // --------------------------------------------------------------------
  // GraphQL operation/fragment naming (CONTRACTS.md §6)
  //
  // The processor extracts gql`...` template literals from TS/TSX files so
  // they get linted as if they were .graphql files; the rule block below
  // applies to both real .graphql files and the virtual ones the processor
  // emits. The processor is intentionally scoped to files that actually
  // host GraphQL (only a handful today) so the extra parse cost stays
  // negligible.
  // --------------------------------------------------------------------
  {
    files: ["**/*.{ts,tsx}"],
    processor: graphqlEslint.processors.graphql,
  },
  {
    files: ["**/*.graphql"],
    languageOptions: {
      parser: graphqlEslint.parser,
    },
    plugins: {
      local: localPlugin,
    },
    rules: {
      "local/graphql-operation-naming": "error",
    },
  },
  // Theme rule, made mechanical (#297): raw Tailwind palette classes are how
  // #279 (unreadable dark-mode inputs) happened. The shadcn layer
  // (packages/ui/src/components/ui/**) is exempt via that package's own
  // eslint ignores; everything else uses semantic tokens. Intentional fixed
  // colors get an eslint-disable-next-line with a reason.
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.jsx"],
    // The rule's own implementation + tests legitimately contain palette
    // strings as examples/fixtures.
    ignores: ["**/rules/no-palette-classes*.js"],
    plugins: {
      local: localPlugin,
    },
    rules: {
      "local/no-palette-classes": "error",
    },
  },
  // Config-slice boundary, made mechanical (#323): nothing reads the raw
  // `plugins` map off an AppConfig — slices are consumed through their
  // definePluginConfig reader, which validates and falls back to defaults.
  // The enumerated ignores are the infrastructure that legitimately touches
  // the raw map: the reader implementation itself, the config-merge tests,
  // and route protection (which by design reads any plugin's `protection`
  // subkey). The rule's own tests carry violating snippets as fixtures.
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.jsx"],
    // Package-relative: each workspace package lints from its own root. The
    // shell entries are the HOST enumerating plugin slices by design — the
    // loader's `enabled` check and the router's per-app config lookup.
    ignores: [
      "**/config/definePluginConfig.*",
      "**/getAppConfig.test.*",
      "**/route-protection/AppProtection.*",
      "**/src/loadPlugins.*",
      "**/components/DynamicRouterProvider.*",
      "**/rules/no-cross-plugin-config*.js",
    ],
    plugins: {
      local: localPlugin,
    },
    rules: {
      "local/no-cross-plugin-config": "error",
    },
  },
  {
    ignores: ["dist/**"],
  },
];
