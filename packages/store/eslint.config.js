import { config } from "@workspace/eslint-config/react-internal";

/**
 * This package is the wrapper around jotai (and internally uses zustand +
 * immer for the upload store), so it is the one place in the monorepo that
 * is allowed to import those libraries directly.
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
