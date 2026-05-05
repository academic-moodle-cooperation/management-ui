import React, { type ReactNode } from "react";

import { PluginContext, type PluginManager } from "@workspace/plugin-system";

/**
 * Thin provider that feeds an externally-managed {@link PluginManager} into
 * the plugin-system React context. Mirrors what the production
 * `PluginProvider` sets up, but skips the implicit `createPluginManager()`
 * so the harness retains full control.
 *
 * The MVP intentionally ships only the plugin-system context. Contract tests
 * that need i18n/query/router wrappers should layer those on top per test;
 * if a common stack emerges, it will be promoted here in a later commit.
 */
export const HarnessPluginProvider: React.FC<{
  manager: PluginManager;
  children: ReactNode;
}> = ({ manager, children }) => {
  return <PluginContext.Provider value={manager}>{children}</PluginContext.Provider>;
};
