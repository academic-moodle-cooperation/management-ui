import { describe, expect, it } from "vitest";

import { createCommunityPluginConfig } from "./community-plugin.config.js";

// Regression guard for the `@workspace` → `@oc-mui` scope rename. The
// `DEFAULT_EXTERNALS` regex must match the current host scope; if it ever
// drifts back to the old scope (or any non-matching pattern), community
// plugins silently bundle the host singletons (logger, React, i18n, plugin
// manager) instead of importing them. See changeset fix-plugin-externals-scope.
describe("createCommunityPluginConfig externals", () => {
  const config = createCommunityPluginConfig({ pluginName: "x" });
  const external = config.build?.rollupOptions?.external;

  if (typeof external !== "function") {
    throw new Error("expected build.rollupOptions.external to be a predicate function");
  }

  const isExternal = external as (id: string) => boolean;

  it("externalizes host-provided @oc-mui/* packages", () => {
    expect(isExternal("@oc-mui/utils")).toBe(true);
    expect(isExternal("@oc-mui/plugin-system")).toBe(true);
    expect(isExternal("@oc-mui/ui")).toBe(true);
  });

  it("externalizes the host React runtime", () => {
    expect(isExternal("react")).toBe(true);
    expect(isExternal("react/jsx-runtime")).toBe(true);
  });

  it("does not externalize the old @workspace scope or unrelated deps", () => {
    expect(isExternal("@workspace/utils")).toBe(false);
    expect(isExternal("some-random-lib")).toBe(false);
  });
});
