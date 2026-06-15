/**
 * Workspace-local ESLint plugin.
 *
 * This is a tiny ESLint plugin that bundles custom rules specific to the
 * Management UI workspace. It is wired in `base.js` under the plugin name
 * `local` so configurations refer to rules as `local/<rule-name>`.
 *
 * Today only one rule lives here. If the count grows past a handful, split
 * into a dedicated `@opencast-mui/eslint-plugin-*` package per the comment in
 * docs/operations/open-followups.md.
 */

import { graphqlOperationNaming, ruleName as graphqlOperationNamingRuleName } from "./graphql-operation-naming.js";

export const localPlugin = {
  meta: {
    name: "@opencast-mui/eslint-config/rules",
    version: "1.0.0",
  },
  rules: {
    [graphqlOperationNamingRuleName]: graphqlOperationNaming,
  },
};
