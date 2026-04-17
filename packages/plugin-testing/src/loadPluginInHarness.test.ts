import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { Plugin } from "@workspace/plugin-system";

import { loadPluginInHarness } from "./loadPluginInHarness";

import type { PluginManifest, TestHarness } from "./types";

const makeFakePlugin = (overrides: Partial<Plugin> = {}): Plugin => ({
  name: "test:fake",
  version: "1.0.0",
  initialize(manager) {
    manager.registerObject("apps:definitions", "fake-app", {
      id: "fake-app",
      name: "Fake App",
      routePath: "/fake",
    });
  },
  activate() {},
  deactivate() {},
  ...overrides,
});

const makeFakeManifest = (overrides: Partial<PluginManifest> = {}): PluginManifest => ({
  id: "fake",
  name: "Fake",
  description: "Fake plugin for harness self-tests.",
  version: "1.0.0",
  namespace: "test",
  author: { name: "harness" },
  ...overrides,
});

describe("loadPluginInHarness", () => {
  let harness: TestHarness | undefined;

  afterEach(() => {
    harness?.dispose();
    harness = undefined;
  });

  it("bootstraps built-in plugins so registerObject works out of the box", async () => {
    harness = await loadPluginInHarness(makeFakePlugin());
    expect(harness.manager.plugins.has("registry")).toBe(true);
    expect(harness.manager.plugins.has("renderer")).toBe(true);
    expect(harness.manager.plugins.has("core:app-registry")).toBe(true);
  });

  describe("expectActivated", () => {
    it("passes when the plugin registered successfully", async () => {
      harness = await loadPluginInHarness(makeFakePlugin());
      expect(() => harness!.expectActivated()).not.toThrow();
    });
  });

  describe("expectRegistered", () => {
    it("passes when each listed extension point has at least one entry", async () => {
      harness = await loadPluginInHarness(makeFakePlugin());
      expect(() => harness!.expectRegistered(["apps:definitions"])).not.toThrow();
    });

    it("throws when an extension point is empty", async () => {
      harness = await loadPluginInHarness(makeFakePlugin());
      expect(() => harness!.expectRegistered(["sidebar:nav-items"])).toThrow(
        /did not register.*sidebar:nav-items/,
      );
    });

    it("throws on empty input so silent typos cannot mask bugs", async () => {
      harness = await loadPluginInHarness(makeFakePlugin());
      expect(() => harness!.expectRegistered([])).toThrow(/non-empty array/);
    });
  });

  describe("expectAllManifestRegistrationsSucceed", () => {
    it("passes when every manifest-declared extension point is populated", async () => {
      harness = await loadPluginInHarness(makeFakePlugin(), {
        manifest: makeFakeManifest({ extensionPoints: ["apps:definitions"] }),
      });
      expect(() => harness!.expectAllManifestRegistrationsSucceed()).not.toThrow();
    });

    it("fails when a manifest-declared extension point is not populated", async () => {
      harness = await loadPluginInHarness(makeFakePlugin(), {
        manifest: makeFakeManifest({
          extensionPoints: ["apps:definitions", "sidebar:nav-items"],
        }),
      });
      expect(() => harness!.expectAllManifestRegistrationsSucceed()).toThrow(
        /sidebar:nav-items/,
      );
    });

    it("fails loudly when the manifest omits extensionPoints", async () => {
      harness = await loadPluginInHarness(makeFakePlugin(), {
        manifest: makeFakeManifest(),
      });
      expect(() => harness!.expectAllManifestRegistrationsSucceed()).toThrow(
        /does not declare extensionPoints/,
      );
    });

    it("fails when no manifest was passed at all", async () => {
      harness = await loadPluginInHarness(makeFakePlugin());
      expect(() => harness!.expectAllManifestRegistrationsSucceed()).toThrow(
        /requires options.manifest/,
      );
    });
  });

  describe("expectCleanRender", () => {
    it("passes when the plugin activates quietly (no render)", async () => {
      harness = await loadPluginInHarness(makeFakePlugin());
      await expect(harness.expectCleanRender()).resolves.toBeUndefined();
    });

    it("fails when activation logs a console.error", async () => {
      const noisy = makeFakePlugin({
        activate() {
           
          console.error("loud plugin is loud");
        },
      });
      harness = await loadPluginInHarness(noisy);
      await expect(harness.expectCleanRender()).rejects.toThrow(/loud plugin is loud/);
    });

    it("captures console output even when no render tree is supplied", async () => {
      harness = await loadPluginInHarness(makeFakePlugin());
       
      console.warn("quiet warning slipped through");
      await expect(harness.expectCleanRender()).rejects.toThrow(/quiet warning slipped through/);
    });
  });

  describe("expectI18nKeyParity", () => {
    let pluginDir: string;
    beforeEach(async () => {
      pluginDir = await mkdtemp(join(tmpdir(), "plugin-testing-i18n-"));
      await mkdir(join(pluginDir, "locales", "fake"), { recursive: true });
    });

    it("passes when every locale exposes the same key set", async () => {
      await writeFile(
        join(pluginDir, "locales", "fake", "en.json"),
        JSON.stringify({ hello: "Hello", nested: { a: "A" } }),
      );
      await writeFile(
        join(pluginDir, "locales", "fake", "de.json"),
        JSON.stringify({ hello: "Hallo", nested: { a: "A" } }),
      );

      harness = await loadPluginInHarness(makeFakePlugin(), {
        manifest: makeFakeManifest({ i18nNamespaces: ["fake"], locales: "locales" }),
        pluginDir,
      });
      await expect(harness.expectI18nKeyParity()).resolves.toBeUndefined();
    });

    it("fails when locales drift out of sync", async () => {
      await writeFile(
        join(pluginDir, "locales", "fake", "en.json"),
        JSON.stringify({ hello: "Hello", farewell: "Bye" }),
      );
      await writeFile(
        join(pluginDir, "locales", "fake", "de.json"),
        JSON.stringify({ hello: "Hallo" }),
      );

      harness = await loadPluginInHarness(makeFakePlugin(), {
        manifest: makeFakeManifest({ i18nNamespaces: ["fake"], locales: "locales" }),
        pluginDir,
      });
      // Locale files are compared in alphabetical order, so "de" is the
      // reference and "en" reports the extra key relative to it.
      await expect(harness.expectI18nKeyParity()).rejects.toThrow(/extra=\[farewell\]/);
    });

    it("is a no-op when the manifest declares no i18n namespaces", async () => {
      harness = await loadPluginInHarness(makeFakePlugin(), {
        manifest: makeFakeManifest(),
        pluginDir,
      });
      await expect(harness.expectI18nKeyParity()).resolves.toBeUndefined();
    });
  });
});
