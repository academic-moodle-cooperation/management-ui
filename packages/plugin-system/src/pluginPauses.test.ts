// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";

import {
  addPluginPause,
  PLUGIN_PAUSES_STORAGE_KEY,
  PLUGIN_PREVIEWS_STORAGE_KEY,
  readPluginPauses,
  readPluginPreviews,
  removePluginPause,
  writePluginPauses,
} from "./pluginPreviews";

describe("plugin pauses (tab-scoped)", () => {
  beforeEach(() => sessionStorage.clear());

  it("round-trips a deduplicated list and clears the key when empty", () => {
    expect(readPluginPauses()).toEqual([]);
    addPluginPause("acme");
    addPluginPause("acme");
    addPluginPause("other-org-theme");
    expect(readPluginPauses()).toEqual(["acme", "other-org-theme"]);
    removePluginPause("acme");
    expect(readPluginPauses()).toEqual(["other-org-theme"]);
    writePluginPauses([]);
    expect(sessionStorage.getItem(PLUGIN_PAUSES_STORAGE_KEY)).toBeNull();
  });

  it("keeps pauses and previews apart", () => {
    addPluginPause("acme");
    expect(readPluginPreviews()).toEqual([]);
    expect(sessionStorage.getItem(PLUGIN_PREVIEWS_STORAGE_KEY)).toBeNull();
  });

  it("ignores malformed storage", () => {
    sessionStorage.setItem(PLUGIN_PAUSES_STORAGE_KEY, "{not json");
    expect(readPluginPauses()).toEqual([]);
    sessionStorage.setItem(PLUGIN_PAUSES_STORAGE_KEY, JSON.stringify({ version: 2, namespaces: ["x"] }));
    expect(readPluginPauses()).toEqual([]);
  });
});
