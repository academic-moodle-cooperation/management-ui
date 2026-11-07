import { describe, expect, it } from "vitest";

import { createPluginManager } from "../../pluginManager";

import { createObjectRegistryPlugin } from "./index";

describe("registry.getTypes", () => {
  it("lists every extension point that received a registration", async () => {
    const manager = createPluginManager();
    await manager.register(createObjectRegistryPlugin());
    expect(manager.executeFunction<string[]>("registry.getTypes")).toEqual([]);

    manager.executeFunction("registry.addObject", "apps:definitions", "demo:app:main", {});
    manager.executeFunction("registry.addObject", "sidebar:nav-items", "demo:app:nav", {});
    manager.executeFunction("registry.addObject", "apps:definitions", "other:app:main", {});

    expect(manager.executeFunction<string[]>("registry.getTypes")).toEqual([
      "apps:definitions",
      "sidebar:nav-items",
    ]);
  });
});
