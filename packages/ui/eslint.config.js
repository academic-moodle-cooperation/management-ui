import { config } from "@oc-mui/eslint-config/react-internal";

/** @type {import("eslint").Linter.Config} */
export default [
  ...config,
  {
    // Exclude auto-generated shadcn/ui components from linting
    ignores: ["src/components/ui/**"],
  },
];
