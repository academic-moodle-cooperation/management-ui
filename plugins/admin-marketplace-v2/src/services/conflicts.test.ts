import { describe, expect, it } from "vitest";

import { exclusiveSlots, findConflicts } from "./conflicts";

import type { InventoryItem } from "./inventory";

const item = (over: Partial<InventoryItem> & Pick<InventoryItem, "namespace">): InventoryItem => ({
  key: `jar:${over.namespace}`,
  displayName: over.namespace,
  types: [],
  origin: "jar",
  status: "active",
  ...over,
});

describe("exclusiveSlots", () => {
  it("names the single-slot types and points, ignoring the rest", () => {
    expect(
      exclusiveSlots({ namespace: "x", types: ["app", "footer", "landing-page"], extensionPoints: ["app:footer", "sidebar:nav-items"] }),
    ).toEqual(["footer", "landing page"]);
    expect(exclusiveSlots({ namespace: "x", types: ["app"] })).toEqual([]);
  });
});

describe("findConflicts", () => {
  const inventory = [
    item({ namespace: "univie", displayName: "Univie", types: ["app", "sidebar", "footer", "landing-page"] }),
    item({ namespace: "core", origin: "builtin", types: ["header", "footer", "sidebar"] }),
    item({ namespace: "episodes", origin: "builtin", types: ["app"] }),
    item({ namespace: "off", types: ["footer"], status: "disabled" }),
    item({ namespace: "registry", origin: "shell", types: ["footer"] }),
  ];

  it("reports active plugins sharing an exclusive slot, naming the slots", () => {
    const conflicts = findConflicts(
      { namespace: "tuwien", types: ["app", "footer", "header", "landing-page", "sidebar"] },
      inventory,
    );
    expect(conflicts).toEqual([
      { namespace: "univie", displayName: "Univie", slots: ["footer", "landing page", "sidebar"] },
    ]);
  });

  it("ignores defaults, the shell, disabled plugins, and the candidate itself", () => {
    expect(findConflicts({ namespace: "univie", types: ["footer"] }, inventory)).toEqual([]);
    expect(findConflicts({ namespace: "x", types: ["header"] }, inventory)).toEqual([]);
  });

  it("is empty for plugins without exclusive slots", () => {
    expect(findConflicts({ namespace: "x", types: ["app"], extensionPoints: ["apps:definitions"] }, inventory)).toEqual([]);
  });
});
