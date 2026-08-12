import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  discoverLocalPluginRootLocaleTargets,
  discoverPluginLocaleNamespaceDirs,
  resolveRootLocalesDir,
} from "./local-plugin-locales.js";
import { discoverLocalPluginLocales, discoverLocalPlugins } from "./local-plugins-dev.js";

let monorepoRoot: string;

/** Create a file (and its parent dirs) relative to the temp monorepo root. */
function write(relPath: string, content = "{}"): string {
  const abs = path.join(monorepoRoot, relPath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content);
  return abs;
}

function pluginDir(name: string): string {
  return path.join(monorepoRoot, ".local-plugins", name);
}

beforeEach(() => {
  monorepoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "local-plugin-locales-"));
});

afterEach(() => {
  fs.rmSync(monorepoRoot, { recursive: true, force: true });
});

describe("resolveRootLocalesDir", () => {
  it("defaults to <plugin>/locales", () => {
    write(".local-plugins/hello/locales/hello/en.json");
    expect(resolveRootLocalesDir(pluginDir("hello"))).toBe(
      path.join(pluginDir("hello"), "locales"),
    );
  });

  it("honors plugin.json's `locales` field", () => {
    write(".local-plugins/hello/plugin.json", JSON.stringify({ locales: "i18n/translations" }));
    write(".local-plugins/hello/i18n/translations/hello/en.json");
    expect(resolveRootLocalesDir(pluginDir("hello"))).toBe(
      path.join(pluginDir("hello"), "i18n", "translations"),
    );
  });

  it("rejects a `locales` field pointing outside the plugin dir", () => {
    write(".local-plugins/hello/plugin.json", JSON.stringify({ locales: "../other/locales" }));
    write(".local-plugins/other/locales/hello/en.json");
    expect(resolveRootLocalesDir(pluginDir("hello"))).toBeNull();
  });

  it("returns null when the dir does not exist", () => {
    write(".local-plugins/hello/plugin.json", JSON.stringify({ id: "hello" }));
    expect(resolveRootLocalesDir(pluginDir("hello"))).toBeNull();
  });
});

describe("discoverPluginLocaleNamespaceDirs", () => {
  it("finds root-level namespaces", () => {
    write(".local-plugins/hello/locales/hello/en.json");
    write(".local-plugins/hello/locales/hello-extra/en.json");
    const dirs = discoverPluginLocaleNamespaceDirs(pluginDir("hello"));
    expect(dirs.map((d) => d.namespace).sort()).toEqual(["hello", "hello-extra"]);
  });

  it("finds modules-layout namespaces", () => {
    write(".local-plugins/acme/modules/app/locales/acme-app/en.json");
    write(".local-plugins/acme/modules/sidebar/locales/acme-sidebar/en.json");
    const dirs = discoverPluginLocaleNamespaceDirs(pluginDir("acme"));
    expect(dirs.map((d) => d.namespace).sort()).toEqual(["acme-app", "acme-sidebar"]);
  });

  it("lists root-level namespaces before modules-layout ones", () => {
    write(".local-plugins/mixed/locales/shared/en.json");
    write(".local-plugins/mixed/modules/app/locales/shared/en.json");
    write(".local-plugins/mixed/modules/app/locales/app-only/en.json");
    const dirs = discoverPluginLocaleNamespaceDirs(pluginDir("mixed"));
    expect(dirs[0]).toEqual({
      namespace: "shared",
      dir: path.join(pluginDir("mixed"), "locales", "shared"),
    });
    expect(dirs.map((d) => d.namespace)).toContain("app-only");
  });
});

describe("discoverLocalPluginLocales", () => {
  it("maps namespaces from both layouts", () => {
    write(".local-plugins/hello/locales/hello/en.json");
    write(".local-plugins/acme/modules/app/locales/acme-app/en.json");
    const map = discoverLocalPluginLocales(monorepoRoot);
    expect(map.get("hello")).toBe(path.join(pluginDir("hello"), "locales", "hello"));
    expect(map.get("acme-app")).toBe(
      path.join(pluginDir("acme"), "modules", "app", "locales", "acme-app"),
    );
  });

  it("prefers the root-level dir when both layouts ship the same namespace", () => {
    write(".local-plugins/mixed/locales/shared/en.json");
    write(".local-plugins/mixed/modules/app/locales/shared/en.json");
    const map = discoverLocalPluginLocales(monorepoRoot);
    expect(map.get("shared")).toBe(path.join(pluginDir("mixed"), "locales", "shared"));
  });

  it("honors plugin.json's `locales` field", () => {
    write(".local-plugins/hello/plugin.json", JSON.stringify({ locales: "translations" }));
    write(".local-plugins/hello/translations/hello/en.json");
    const map = discoverLocalPluginLocales(monorepoRoot);
    expect(map.get("hello")).toBe(path.join(pluginDir("hello"), "translations", "hello"));
  });

  it("returns an empty map without .local-plugins", () => {
    expect(discoverLocalPluginLocales(monorepoRoot).size).toBe(0);
  });
});

describe("discoverLocalPlugins manifest entries", () => {
  it("announces i18nNamespaces + localesUrl for the root-level layout", () => {
    write(".local-plugins/hello/dist/plugin-hello.mjs", "export default {}");
    write(".local-plugins/hello/locales/hello/en.json");
    const [entry] = discoverLocalPlugins(monorepoRoot, "/management-ui");
    expect(entry?.i18nNamespaces).toEqual(["hello"]);
    expect(entry?.localesUrl).toBe("/management-ui/dist/locales");
  });

  it("still announces i18nNamespaces for the modules layout", () => {
    write(".local-plugins/acme/dist/plugin-acme.mjs", "export default {}");
    write(".local-plugins/acme/modules/app/locales/acme-app/en.json");
    const [entry] = discoverLocalPlugins(monorepoRoot, "");
    expect(entry?.i18nNamespaces).toEqual(["acme-app"]);
    expect(entry?.localesUrl).toBe("/dist/locales");
  });

  it("omits locale fields when a plugin ships no locales", () => {
    write(".local-plugins/bare/dist/plugin-bare.mjs", "export default {}");
    const [entry] = discoverLocalPlugins(monorepoRoot, "");
    expect(entry?.i18nNamespaces).toBeUndefined();
    expect(entry?.localesUrl).toBeUndefined();
  });
});

describe("discoverLocalPluginRootLocaleTargets", () => {
  it("emits one target per root-level namespace dir with JSON files", () => {
    write(".local-plugins/hello/locales/hello/en.json");
    write(".local-plugins/hello/locales/hello-extra/de.json");
    const targets = discoverLocalPluginRootLocaleTargets(monorepoRoot);
    expect(targets.map((t) => t.src).sort()).toEqual([
      path.join(pluginDir("hello"), "locales", "hello"),
      path.join(pluginDir("hello"), "locales", "hello-extra"),
    ]);
    expect(targets.every((t) => t.dest === "locales")).toBe(true);
  });

  it("skips namespace dirs without JSON files", () => {
    fs.mkdirSync(path.join(pluginDir("hello"), "locales", "empty"), { recursive: true });
    write(".local-plugins/hello/locales/hello/en.json");
    const targets = discoverLocalPluginRootLocaleTargets(monorepoRoot);
    expect(targets.map((t) => t.src)).toEqual([path.join(pluginDir("hello"), "locales", "hello")]);
  });

  it("honors plugin.json's `locales` field", () => {
    write(".local-plugins/hello/plugin.json", JSON.stringify({ locales: "translations" }));
    write(".local-plugins/hello/translations/hello/en.json");
    const targets = discoverLocalPluginRootLocaleTargets(monorepoRoot);
    expect(targets.map((t) => t.src)).toEqual([
      path.join(pluginDir("hello"), "translations", "hello"),
    ]);
  });

  it("returns no targets without .local-plugins", () => {
    expect(discoverLocalPluginRootLocaleTargets(monorepoRoot)).toEqual([]);
  });
});
