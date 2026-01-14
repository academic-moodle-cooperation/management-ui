import tseslint from "typescript-eslint";

/**
 * Type-aware ESLint configuration that requires TypeScript type information.
 *
 * This config should be added to packages that want strict Promise and any type checking.
 *
 * Usage:
 * ```javascript
 * import { config as baseConfig } from "@workspace/eslint-config/base";
 * import { config as typeAwareConfig } from "@workspace/eslint-config/type-aware";
 *
 * export default [
 *   ...baseConfig,
 *   ...typeAwareConfig,
 * ];
 * ```
 *
 * @type {import("eslint").Linter.Config[]}
 */
export const config = [
  ...tseslint.configs.recommendedTypeChecked,
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parserOptions: {
        project: true, // Automatically find tsconfig.json
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // TypeScript strict rules (require type information)
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": [
        "error",
        {
          checksVoidReturn: false, // Allow promises in void return contexts (e.g., useEffect)
        },
      ],
    },
  },
];
