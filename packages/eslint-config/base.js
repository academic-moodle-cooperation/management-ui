import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import boundaries from "eslint-plugin-boundaries";
import importPlugin from "eslint-plugin-import";
import onlyWarn from "eslint-plugin-only-warn";
import turboPlugin from "eslint-plugin-turbo";
import tseslint from "typescript-eslint";

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
              pattern: "@workspace/**",
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
      // corresponding @workspace/* package so we can swap implementations
      // later without breaking plugins. The wrapping package itself overrides
      // this rule via its own eslint.config.js.
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@workspace/ui/src/*",
                "@workspace/ui/components/ui/*",
                "@workspace/ui/components/appshell/components/*",
              ],
              message:
                "Import from stable entrypoints like '@workspace/ui/components' or '@workspace/ui/lib/utils' instead of deep paths.",
            },
            {
              group: ["@tanstack/react-router", "@tanstack/react-router/*"],
              message:
                "Do not import @tanstack/react-router directly. Use @workspace/router instead. (Only packages/router/ itself may import @tanstack/react-router.)",
            },
            {
              group: ["@tanstack/react-query", "@tanstack/react-query/*"],
              message:
                "Do not import @tanstack/react-query directly. Use @workspace/query instead. (Only packages/query/ itself may import @tanstack/react-query.)",
            },
            {
              group: ["react-i18next", "react-i18next/*", "i18next", "i18next/*"],
              message:
                "Do not import i18next / react-i18next directly. Use @workspace/i18n instead. (Only packages/i18n/ itself may import them.)",
            },
            {
              group: ["jotai", "jotai/*"],
              message:
                "Do not import jotai directly. Use @workspace/store instead. (Only packages/store/ itself may import jotai.)",
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
  // AGENTS.md. Wrapper-library rules (use @workspace/router instead of
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
  //   app    → app, package, plugin   (the shell mounts plugins)
  //   plugin → package + self         (no cross-plugin, no app deps)
  //   package → package               (layered ordering inside packages
  //                                    is not enforced yet — follow-up)
  //
  // External imports (node_modules) are not covered here; the
  // no-restricted-imports rule above gates the wrapper exceptions.
  {
    plugins: { boundaries },
    settings: {
      // Pin the boundaries plugin to the workspace root so per-package
      // eslint invocations (turbo runs lint inside each package's cwd)
      // resolve element patterns the same way as a workspace-root run.
      // Without this, `process.cwd()` is each package's directory and the
      // plain `apps/*` / `plugins/*` / `packages/*` patterns fail to match.
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
      // Patterns are anchored at the root and use mode "full" so that
      // packages with internal subdirectories named the same as a top-level
      // category (notably packages/plugin-system/src/plugins/) don't get
      // mistakenly classified as a different element type.
      "boundaries/elements": [
        { type: "app", pattern: "apps/*/**/*", capture: ["app"], mode: "full" },
        { type: "plugin", pattern: "plugins/*/**/*", capture: ["plugin"], mode: "full" },
        { type: "package", pattern: "packages/*/**/*", capture: ["package"], mode: "full" },
      ],
    },
    rules: {
      "boundaries/no-unknown-files": "off",
      "boundaries/no-unknown": "off",
      // Using the v5 selector shape on the v6 plugin: it's the only form whose
      // schema validator currently accepts our config. The plugin emits a
      // [boundaries][warning] line on every run noting the legacy syntax and
      // pointing at the v5→v6 migration guide; that's plugin stderr, not an
      // eslint warning, so it doesn't trip --max-warnings. Migrating to the
      // v6 object syntax tracked as a follow-up — the v6 API for `allow:`
      // entries doesn't accept `{ type, captured }` directly today and the
      // "self-only" shape needs a different idiom we haven't worked out.
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
      // They should be enabled via @workspace/eslint-config/type-aware
    },
  },
  {
    ignores: ["dist/**"],
  },
];
