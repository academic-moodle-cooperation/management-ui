import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { loadPluginInHarness, readPluginManifest, type TestHarness } from "@oc-mui/plugin-testing";

import defaultExport, { coreSeriesPlugin } from "./index";

const pluginDir = resolve(fileURLToPath(import.meta.url), "..", "..");

describe("core-series plugin contract", () => {
  let harness: TestHarness;

  beforeAll(async () => {
    harness = await loadPluginInHarness(coreSeriesPlugin, {
      manifest: await readPluginManifest(pluginDir),
      pluginDir,
    });
  });

  afterAll(() => harness.dispose());

  // The remote-plugin loader registers via `module.default`; a named-only
  // export passes the harness but is never loaded at runtime.
  it("exposes the plugin as the default export (required by the loader)", () => {
    expect(defaultExport).toBe(coreSeriesPlugin);
  });

  it("activates cleanly", () => harness.expectActivated());

  it("populates every extension point declared in plugin.json", () =>
    harness.expectAllManifestRegistrationsSucceed());

  it("does not log errors or warnings during activation", () => harness.expectCleanRender());

  it("has i18n key parity across shipped locales", () => harness.expectI18nKeyParity());
});
