import { describe, expect, it } from "vitest";

import { resolveTryTarget } from "./tryTarget";

import type { InventoryItem } from "./inventory";

const item = (over: Partial<InventoryItem> & Pick<InventoryItem, "namespace" | "status">): InventoryItem => ({
  key: `jar:${over.namespace}`,
  displayName: over.namespace,
  types: ["app"],
  origin: "jar",
  ...over,
});

const inventory = [
  item({ namespace: "tuwien", status: "disabled" }),
  item({ namespace: "univie", status: "active" }),
  item({ namespace: "acl-editor", status: "trial", origin: "trial" }),
  item({ namespace: "playlists", status: "paused" }),
  item({ namespace: "univie-support", status: "active", origin: "shell" }),
];

describe("resolveTryTarget", () => {
  it("previews the local copy of a deployed-but-off plugin", () => {
    expect(resolveTryTarget({ id: "tuwien" }, inventory)).toMatchObject({ kind: "local", item: { namespace: "tuwien" } });
    expect(resolveTryTarget({ id: "playlists" }, inventory)).toMatchObject({ kind: "local" });
  });

  it("reports running or on-trial plugins as present", () => {
    expect(resolveTryTarget({ id: "univie" }, inventory)).toMatchObject({ kind: "present", status: "active" });
    expect(resolveTryTarget({ id: "acl-editor" }, inventory)).toMatchObject({ kind: "present", status: "trial" });
  });

  it("falls back to a remote trial when nothing is deployed here, honouring `namespace`", () => {
    expect(resolveTryTarget({ id: "support-ui" }, inventory)).toEqual({ kind: "remote" });
    expect(resolveTryTarget({ id: "x", namespace: "tuwien" }, inventory)).toMatchObject({ kind: "local" });
    // A shell-origin row (e.g. a v1 browser install) is not a deployed copy.
    expect(resolveTryTarget({ id: "univie-support" }, inventory)).toEqual({ kind: "remote" });
  });
});
