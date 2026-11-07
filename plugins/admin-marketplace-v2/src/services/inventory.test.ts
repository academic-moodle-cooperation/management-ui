import { describe, expect, it } from "vitest";

import type { Plugin } from "@oc-mui/plugin-system";

import {
  buildInventory,
  disabledReasonFor,
  humanize,
  isNewerVersion,
  pointsByNamespace,
  splitName,
  type InventorySources,
} from "./inventory";

import type { RegistryPlugin } from "./registry";

const plugin = (name: string, version = "1.0.0"): Plugin => ({
  name,
  version,
  activate() {},
  deactivate() {},
});

const registryEntry = (id: string, version: string, name = id): RegistryPlugin => ({
  id,
  name,
  description: "",
  version,
  author: { name: "Someone" },
  url: `https://cdn.jsdelivr.net/${id}.mjs`,
  category: "feature",
});

const sources = (over: Partial<InventorySources> = {}): InventorySources => ({
  registered: new Map(),
  bundled: [],
  jars: [],
  locals: [],
  trials: [],
  catalog: [],
  config: undefined,
  ...over,
});

describe("helpers", () => {
  it("splits plugin names into namespace and type", () => {
    expect(splitName("episodes:app")).toEqual({ namespace: "episodes", type: "app" });
    expect(splitName("bare")).toEqual({ namespace: "bare" });
  });

  it("humanizes namespaces", () => {
    expect(humanize("live-polls")).toBe("Live Polls");
    expect(humanize("admin_marketplace-v2")).toBe("Admin Marketplace V2");
  });

  it("compares semver", () => {
    expect(isNewerVersion("4.2.0", "4.1.2")).toBe(true);
    expect(isNewerVersion("4.1.2", "4.1.2")).toBe(false);
    expect(isNewerVersion("v5.0.0", "4.9.9")).toBe(true);
    expect(isNewerVersion("garbage", "1.0.0")).toBe(false);
  });

  it("derives the shell's two-level disabled reason", () => {
    const cfg = { app: { enabledPlugins: ["core", "episodes"] }, plugins: { episodes: { enabled: false } } };
    expect(disabledReasonFor("series", cfg)).toBe("not-in-enabledPlugins");
    expect(disabledReasonFor("episodes", cfg)).toBe("runtime-switch");
    expect(disabledReasonFor("core", cfg)).toBeUndefined();
    // An empty allowlist means "everything".
    expect(disabledReasonFor("anything", { app: { enabledPlugins: [] } })).toBeUndefined();
  });
});

describe("buildInventory", () => {
  it("collapses a namespace's modules into one row listing its types", () => {
    const mods = ["core:layout", "core:header", "core:footer"].map((n) => plugin(n));
    const items = buildInventory(
      sources({ registered: new Map(mods.map((m) => [m.name, m])), bundled: mods }),
    );
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ namespace: "core", status: "active", types: ["footer", "header", "layout"] });
  });

  it("marks bundled plugins active or disabled with the right reason", () => {
    const episodes = plugin("episodes:app");
    const series = plugin("series:app");
    const items = buildInventory(
      sources({
        registered: new Map([[episodes.name, episodes]]),
        bundled: [episodes, series],
        config: { app: { enabledPlugins: ["episodes"] } },
      }),
    );
    expect(items.map((i) => [i.namespace, i.status, i.disabledReason])).toEqual([
      ["episodes", "active", undefined],
      ["series", "disabled", "not-in-enabledPlugins"],
    ]);
    expect(items[0]?.types).toEqual(["app"]);
    expect(items.every((i) => i.origin === "builtin")).toBe(true);
  });

  it("matches JAR entries to registered plugins by namespace", () => {
    const support = plugin("support-ui:app", "2.3.0");
    const items = buildInventory(
      sources({
        registered: new Map([[support.name, support]]),
        jars: [
          { name: "support-ui", namespace: "support-ui", url: "/static/plugins/support-ui.mjs" },
          { name: "reports", namespace: "reports", url: "/static/plugins/reports.mjs" },
        ],
        config: { app: { enabledPlugins: ["support-ui"] } },
      }),
    );
    const byNs = Object.fromEntries(items.map((i) => [i.namespace, i]));
    expect(byNs["support-ui"]).toMatchObject({ origin: "jar", status: "active", version: "2.3.0" });
    expect(byNs["reports"]).toMatchObject({ origin: "jar", status: "disabled", disabledReason: "not-in-enabledPlugins" });
  });

  it("shows a local preview as a trial with the modules it registered", () => {
    const example = plugin("example:header", "1.0.0");
    const items = buildInventory(
      sources({
        registered: new Map([[example.name, example]]),
        bundled: [example],
        trials: [{ kind: "local", id: "example", name: "Example", version: "1.0.0", startedAt: "" }],
        config: { app: { enabledPlugins: ["core"] } },
      }),
    );
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ origin: "trial", status: "trial", trialKind: "local", types: ["header"] });
  });

  it("groups trials separately and never duplicates them as bundled/jar", () => {
    const items = buildInventory(
      sources({
        trials: [{ kind: "remote", id: "demo", name: "Demo", version: "1.0.0", url: "https://x/y.mjs", startedAt: "" }],
        jars: [{ name: "demo", namespace: "demo", url: "https://x/y.mjs" }],
      }),
    );
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ origin: "trial", status: "trial", namespace: "demo" });
  });

  it("surfaces a newer registry version and the registry's display name", () => {
    const captions = plugin("captions:app", "4.1.2");
    const items = buildInventory(
      sources({
        registered: new Map([[captions.name, captions]]),
        bundled: [captions],
        catalog: [registryEntry("captions", "4.2.0", "Auto Captions")],
      }),
    );
    expect(items[0]).toMatchObject({ displayName: "Auto Captions", registryNewer: "4.2.0" });
  });

  it("lists registered plugins nobody else explained, so the list never lies by omission", () => {
    const mystery = plugin("renderer:core");
    const items = buildInventory(sources({ registered: new Map([[mystery.name, mystery]]) }));
    expect(items[0]).toMatchObject({ namespace: "renderer", status: "active", origin: "shell" });
  });
});

describe("pointsByNamespace", () => {
  it("groups extension points by the id's namespace segment", () => {
    const map = pointsByNamespace([
      { type: "apps:definitions", ids: ["episodes:app:episodes", "series:app:series"] },
      { type: "sidebar:nav-items", ids: ["episodes:app:nav", "core:navigation:home"] },
      { type: "app:footer", ids: [""] },
    ]);
    expect(map.get("episodes")).toEqual(["apps:definitions", "sidebar:nav-items"]);
    expect(map.get("series")).toEqual(["apps:definitions"]);
    expect(map.get("core")).toEqual(["sidebar:nav-items"]);
    expect(map.has("")).toBe(false);
  });
});

describe("buildInventory — multi-module JARs", () => {
  it("accumulates every module type of a disabled multi-module JAR into one row", () => {
    const items = buildInventory({
      registered: new Map(),
      bundled: [],
      jars: ["app", "footer", "header", "landing-page", "sidebar"].map((type) => ({
        name: `other-org:${type}`,
        namespace: "other-org",
        type,
        url: `/static/plugins/other-org/other-org.mjs`,
      })),
      locals: [],
      trials: [],
      catalog: [],
      config: { app: { enabledPlugins: ["core"] } },
    });
    expect(items).toHaveLength(1);
    expect(items[0]?.types).toEqual(["app", "footer", "header", "landing-page", "sidebar"]);
    expect(items[0]?.status).toBe("disabled");
  });
});

describe("buildInventory — previous marketplace's browser installs", () => {
  const registered = new Map<string, Plugin>([
    ["registry", { name: "registry", version: "1.0.0", initialize() {} } as unknown as Plugin],
    ["acme-support:app", { name: "acme-support:app", version: "1.0.0", initialize() {} } as unknown as Plugin],
  ]);
  const base = { bundled: [], jars: [], locals: [], trials: [], catalog: [], config: undefined };

  it("labels a typed, unexplained plugin as a browser install when v1 recorded installs", () => {
    const items = buildInventory({ ...base, registered, browserInstalls: [{ id: "support-ui", url: "https://x/y.mjs" }] });
    const support = items.find((i) => i.namespace === "acme-support");
    expect(support?.origin).toBe("browser");
    expect(support?.browserInstallIds).toEqual(["support-ui"]);
    expect(items.find((i) => i.namespace === "registry")?.origin).toBe("shell");
  });

  it("keeps the shell label without v1 records", () => {
    const items = buildInventory({ ...base, registered });
    expect(items.find((i) => i.namespace === "acme-support")?.origin).toBe("shell");
  });
});

describe("buildInventory — modules registered under their own namespace", () => {
  it("attributes `<parent>-<x>:<type>` to the deployed parent plugin", () => {
    const registered = new Map<string, Plugin>([
      ["acme:app", { name: "acme:app", version: "1.0.0", initialize() {} } as unknown as Plugin],
      ["acme-support:app", { name: "acme-support:app", version: "1.0.0", initialize() {} } as unknown as Plugin],
    ]);
    const items = buildInventory({
      registered,
      bundled: [],
      jars: [{ name: "Acme University:app", namespace: "acme", type: "app", url: "/static/plugins/acme/plugin-acme-app.mjs" }],
      locals: [],
      trials: [],
      catalog: [],
      config: undefined,
    });
    const support = items.find((i) => i.namespace === "acme-support");
    expect(support?.origin).toBe("jar");
    expect(support?.moduleOf).toBe("acme");
    expect(support?.status).toBe("active");
  });
});
