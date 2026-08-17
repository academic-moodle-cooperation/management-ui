// @vitest-environment jsdom
// (this package's vitest config defaults to node; renderHook needs a DOM)
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// See dateFormat.test.ts — the real modules boot i18next, which cannot run
// here. Only the resolution logic is under test.
const loadNamespace = vi.hoisted(() => vi.fn());
const known = new Set(["acme:tabs.recordings"]);

vi.mock("./translationLoader", () => ({ loadNamespace }));
vi.mock("./useTranslation", () => ({
  useI18n: () => ({
    t: (key: string) => `translated(${key})`,
    i18n: { language: "en", exists: (key: string) => known.has(key) },
  }),
}));

import { deriveLabelFromKey, useExtensionLabels } from "./extensionLabel";

describe("deriveLabelFromKey", () => {
  it("turns a registration key into the label hosts showed before `label` existed", () => {
    expect(deriveLabelFromKey("acme:exam-recordings")).toBe("Exam Recordings");
    expect(deriveLabelFromKey("statistics")).toBe("Statistics");
  });
});

describe("useExtensionLabels", () => {
  const labelsFor = (entries: Array<{ key: string; label?: string }>) =>
    renderHook(() => useExtensionLabels(entries)).result.current;

  it("translates a registered key", () => {
    const entries = [{ key: "acme:recordings", label: "acme:tabs.recordings" }];

    expect(labelsFor(entries)(entries[0]!)).toBe("translated(acme:tabs.recordings)");
  });

  it("loads the label's namespace, since the tab's own component may not have mounted", () => {
    loadNamespace.mockClear();
    labelsFor([{ key: "acme:recordings", label: "acme:tabs.recordings" }]);

    expect(loadNamespace).toHaveBeenCalledWith("acme", "en");
  });

  // Without this the UI would flash the raw key until the namespace arrives.
  it("falls back to the derived label while a translation is missing", () => {
    const entries = [{ key: "acme:exam-recordings", label: "acme:tabs.notLoadedYet" }];

    expect(labelsFor(entries)(entries[0]!)).toBe("Exam Recordings");
  });

  it("keeps a label without a namespace as the literal it is", () => {
    const entries = [{ key: "acme:exam-recordings", label: "Aufzeichnungen" }];

    expect(labelsFor(entries)(entries[0]!)).toBe("Aufzeichnungen");
  });

  it("derives the label for registrations that predate the option", () => {
    const entries = [{ key: "acme:exam-recordings" }];

    expect(labelsFor(entries)(entries[0]!)).toBe("Exam Recordings");
  });
});
