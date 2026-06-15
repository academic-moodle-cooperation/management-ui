import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, beforeAll, describe, it } from "vitest";

import {
  loadPluginInHarness,
  readPluginManifest,
  type TestHarness,
} from "@opencast-mui/plugin-testing";

import { coreUploadPlugin } from "./index";

const pluginDir = resolve(fileURLToPath(import.meta.url), "..", "..");

describe("core-upload plugin contract", () => {
  let harness: TestHarness;

  beforeAll(async () => {
    harness = await loadPluginInHarness(coreUploadPlugin, {
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
