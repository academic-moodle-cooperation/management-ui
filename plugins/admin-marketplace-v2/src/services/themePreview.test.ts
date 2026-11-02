// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  endThemePreview,
  getThemePreview,
  restoreThemePreview,
  startThemePreview,
  subscribeThemePreview,
} from "./themePreview";

const linkEl = () => document.getElementById("mui-marketplace-v2-theme-preview") as HTMLLinkElement | null;

describe("theme preview", () => {
  beforeEach(() => {
    sessionStorage.clear();
    endThemePreview();
  });

  it("applies immediately: injects a link, records the marker, notifies subscribers", () => {
    const spy = vi.fn();
    const unsubscribe = subscribeThemePreview(spy);
    startThemePreview({ id: "shipped:ember", name: "Ember", url: "/plugins/themes/ember.css", source: "shipped" });
    expect(linkEl()?.getAttribute("href")).toBe("/plugins/themes/ember.css");
    expect(getThemePreview()).toMatchObject({ id: "shipped:ember", name: "Ember" });
    expect(spy).toHaveBeenCalled();
    unsubscribe();
  });

  it("is exclusive: a second preview replaces the first", () => {
    startThemePreview({ id: "shipped:a", name: "A", url: "/a.css", source: "shipped" });
    startThemePreview({ id: "shipped:b", name: "B", url: "/b.css", source: "shipped" });
    expect(document.querySelectorAll("link[data-theme-preview]")).toHaveLength(1);
    expect(linkEl()?.getAttribute("href")).toBe("/b.css");
  });

  it("ends without a reload: link and marker gone", () => {
    startThemePreview({ id: "shipped:a", name: "A", url: "/a.css", source: "shipped" });
    endThemePreview();
    expect(linkEl()).toBeNull();
    expect(getThemePreview()).toBeNull();
  });

  it("restores a recorded preview at boot only when still allowed", () => {
    startThemePreview({ id: "registry:x", name: "X", url: "https://cdn.example/x.css", source: "registry" });
    document.getElementById("mui-marketplace-v2-theme-preview")?.remove(); // simulate a fresh page
    restoreThemePreview(() => false);
    expect(linkEl()).toBeNull();
    expect(getThemePreview()).toBeNull();

    startThemePreview({ id: "shipped:a", name: "A", url: "/a.css", source: "shipped" });
    document.getElementById("mui-marketplace-v2-theme-preview")?.remove();
    restoreThemePreview(() => true);
    expect(linkEl()?.getAttribute("href")).toBe("/a.css");
  });

  it("fails closed on a malformed marker", () => {
    sessionStorage.setItem("mui.marketplace-v2.theme-preview", "{nope");
    expect(getThemePreview()).toBeNull();
  });
});
