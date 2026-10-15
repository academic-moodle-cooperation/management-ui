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

// The scaffolded plugin.json declares `entry: dist/<name>.mjs` and
// `css: dist/<name>.css`, and the remote loader falls back to `<name>.css`
// next to the .mjs. Both only hold if the build names its outputs after the
// plugin — Vite's default CSS name is derived from package.json instead.
describe("createCommunityPluginConfig output names", () => {
  const config = createCommunityPluginConfig({ pluginName: "my-plugin" });
  const lib = config.build?.lib;

  if (!lib || typeof lib !== "object") {
    throw new Error("expected build.lib to be configured");
  }

  it("names the ES module <pluginName>.mjs", () => {
    const fileName = lib.fileName;
    if (typeof fileName !== "function") {
      throw new Error("expected build.lib.fileName to be a function");
    }
    expect(fileName("es", "index")).toBe("my-plugin.mjs");
  });

  it("names the extracted stylesheet <pluginName>.css", () => {
    expect(lib.cssFileName).toBe("my-plugin");
  });
});
