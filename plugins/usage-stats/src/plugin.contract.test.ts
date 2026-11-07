import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  loadPluginInHarness,
  readPluginManifest,
  type TestHarness,
} from "@oc-mui/plugin-testing";

import defaultExport, { usageStatsPlugin } from "./index";

const pluginDir = resolve(fileURLToPath(import.meta.url), "..", "..");

describe("usage-stats plugin contract", () => {
  let harness: TestHarness;

  beforeAll(async () => {
    harness = await loadPluginInHarness(usageStatsPlugin, {
      manifest: await readPluginManifest(pluginDir),
      pluginDir,
    });
  });

  afterAll(() => harness.dispose());

  // The remote-plugin loader registers via `module.default`. A named-only
  // export builds and passes the harness below, but is silently never
  // loaded at runtime — so assert the default export explicitly.
  it("exposes the plugin as the default export (required by the loader)", () => {
    expect(defaultExport).toBe(usageStatsPlugin);
  });

  it("activates cleanly", () => harness.expectActivated());

  it("populates every extension point declared in plugin.json", () =>
    harness.expectAllManifestRegistrationsSucceed());

  it("does not log errors or warnings during activation", () =>
    harness.expectCleanRender());

  it("has i18n key parity across shipped locales", () =>
    harness.expectI18nKeyParity());
});
