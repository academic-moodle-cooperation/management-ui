import { config } from "@workspace/eslint-config/react-internal";

/**
 * This package is the wrapper around i18next / react-i18next, so it is the
 * one place in the monorepo that is allowed to import them directly.
 *
 * @type {import("eslint").Linter.Config[]}
 */
export default [
  ...config,
  {
    rules: {
      "no-restricted-imports": "off",
    },
  },
];
