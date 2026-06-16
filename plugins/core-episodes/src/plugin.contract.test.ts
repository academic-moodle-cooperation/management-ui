import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, beforeAll, describe, it } from "vitest";

import {
  loadPluginInHarness,
  readPluginManifest,
  type TestHarness,
} from "@opencast-mui/plugin-testing";

import { coreEpisodesPlugin } from "./index";

/**
 * Contract test for `plugins/core-episodes`.
 *
 * Drives the reference pattern for all core/community plugin contract tests:
 * the manifest declares `extensionPoints`, and `expectAllManifestRegistrations
 * Succeed` verifies that `initialize()` actually populates each of them.
 * If the plugin is refactored to add, remove or rename an extension point,
 * the authoritative source is still the manifest — the test failure points
 * you at the drift.
 */
const pluginDir = resolve(fileURLToPath(import.meta.url), "..", "..");

describe("core-episodes plugin contract", () => {
  let harness: TestHarness;

  beforeAll(async () => {
    harness = await loadPluginInHarness(coreEpisodesPlugin, {
      manifest: await readPluginManifest(pluginDir),
      pluginDir,
    });
  });

  afterAll(() => harness.dispose());

  it("activates cleanly", () => harness.expectActivated());

  it("populates every extension point declared in plugin.json", () =>
    harness.expectAllManifestRegistrationsSucceed());

  it("does not log errors or warnings during activation", () =>
    harness.expectCleanRender());

  it("has i18n key parity across shipped locales", () => harness.expectI18nKeyParity());
});
