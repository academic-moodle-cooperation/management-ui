import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import importPlugin from "eslint-plugin-import";
import onlyWarn from "eslint-plugin-only-warn";
import turboPlugin from "eslint-plugin-turbo";
import tseslint from "typescript-eslint";

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
      // Prevent direct imports of @tanstack/react-router - everything routing
      // related must go through @workspace/router so we can swap the router
      // later without breaking plugins (see packages/router/README.md).
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
