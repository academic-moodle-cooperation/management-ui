import { beforeEach, describe, expect, it } from "vitest";

import {
  addPluginPreview,
  PLUGIN_PREVIEWS_STORAGE_KEY,
  readPluginPreviews,
  removePluginPreview,
  writePluginPreviews,
} from "./pluginPreviews";

describe("plugin previews (sessionStorage contract)", () => {
  beforeEach(() => sessionStorage.clear());

  it("is empty when nothing is stored", () => {
    expect(readPluginPreviews()).toEqual([]);
  });

  it("round-trips, deduplicates, and drops empty names", () => {
    writePluginPreviews(["support-ui", "reports", "support-ui", ""]);
    expect(readPluginPreviews()).toEqual(["support-ui", "reports"]);
  });

  it("adds and removes single namespaces", () => {
    addPluginPreview("a");
    addPluginPreview("b");
    expect(readPluginPreviews()).toEqual(["a", "b"]);
    removePluginPreview("a");
    expect(readPluginPreviews()).toEqual(["b"]);
  });

  it("clears the key entirely when the list becomes empty", () => {
    addPluginPreview("a");
    removePluginPreview("a");
    expect(sessionStorage.getItem(PLUGIN_PREVIEWS_STORAGE_KEY)).toBeNull();
  });

  it("fails closed on malformed or foreign-version data", () => {
    sessionStorage.setItem(PLUGIN_PREVIEWS_STORAGE_KEY, "not json");
    expect(readPluginPreviews()).toEqual([]);
    sessionStorage.setItem(PLUGIN_PREVIEWS_STORAGE_KEY, JSON.stringify({ version: 2, namespaces: ["x"] }));
    expect(readPluginPreviews()).toEqual([]);
    sessionStorage.setItem(PLUGIN_PREVIEWS_STORAGE_KEY, JSON.stringify({ version: 1, namespaces: [1, null, "ok"] }));
    expect(readPluginPreviews()).toEqual(["ok"]);
  });
});
