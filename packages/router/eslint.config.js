import { config } from "@oc-mui/eslint-config/react-internal";

/**
 * This package is the wrapper around @tanstack/react-router, so it is the one
 * place in the monorepo that is allowed to import it directly.
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
