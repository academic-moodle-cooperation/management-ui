import { config } from "@oc-mui/eslint-config/react-internal";

/**
 * This package is the wrapper around @dnd-kit (SortableList), so it is the one
 * place in the monorepo that is allowed to import it directly — the same
 * exemption the other facade packages (router, query, i18n, store) carry.
 *
 * @type {import("eslint").Linter.Config[]}
 */
export default [
  ...config,
  {
    // Exclude auto-generated shadcn/ui components from linting
    ignores: ["src/components/ui/**"],
  },
  {
    rules: {
      "no-restricted-imports": "off",
    },
  },
];
