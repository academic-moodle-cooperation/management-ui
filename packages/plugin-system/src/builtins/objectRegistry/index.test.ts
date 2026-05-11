import { describe, it, expect, beforeEach } from "vitest";

import { createPluginManager } from "../../pluginManager";

import { createObjectRegistryPlugin, type RegistryObject } from "./index";

import type { PluginManager } from "../../pluginManager";

describe("ObjectRegistryPlugin", () => {
  let manager: PluginManager;
  let registryPlugin: ReturnType<typeof createObjectRegistryPlugin>;

  beforeEach(() => {
    manager = createPluginManager();
    registryPlugin = createObjectRegistryPlugin();
    if (registryPlugin?.initialize) {
      registryPlugin.initialize(manager);
    }
    if (registryPlugin?.activate) {
      registryPlugin.activate();
    }
  });

  describe("registerObject", () => {
    it("should register an object with a type and id", () => {
      const testData = { name: "test", value: 123 };
      manager.executeFunction("registry.addObject", "test:type", "test-id", testData);

      const result = manager.executeFunction<RegistryObject | null>(
        "registry.getObject",
        "test:type",
        "test-id",
      );
      expect(result).toBeDefined();
      expect(result?.data).toEqual(testData);
    });

    it("should allow multiple objects of the same type", () => {
      manager.executeFunction("registry.addObject", "test:type", "id1", { value: 1 });
      manager.executeFunction("registry.addObject", "test:type", "id2", { value: 2 });

      const objects = manager.executeFunction<RegistryObject[]>("registry.getObjects", "test:type");
      expect(objects).toHaveLength(2);
    });

    it("should overwrite existing object with same type and id", () => {
      manager.executeFunction("registry.addObject", "test:type", "test-id", { value: 1 });
      manager.executeFunction("registry.addObject", "test:type", "test-id", { value: 2 });

      const result = manager.executeFunction<RegistryObject | null>(
        "registry.getObject",
        "test:type",
        "test-id",
      );
      expect(result?.data).toEqual({ value: 2 });
    });

    it("should store metadata with object", () => {
      const metadata = { created: "2024-01-01", author: "test" };
      manager.executeFunction("registry.addObject", "test:type", "test-id", { value: 1 }, metadata);

      const result = manager.executeFunction<RegistryObject | null>(
        "registry.getObject",
        "test:type",
        "test-id",
      );
      expect(result?.metadata).toEqual(metadata);
    });
  });

  describe("getObject", () => {
    it("should return null for non-existent object", () => {
      const result = manager.executeFunction<RegistryObject | null>(
        "registry.getObject",
        "test:type",
        "non-existent",
      );
      expect(result).toBeNull();
    });

    it("should return the correct object", () => {
      const testData = { name: "test" };
      manager.executeFunction("registry.addObject", "test:type", "test-id", testData);

      const result = manager.executeFunction<RegistryObject | null>(
        "registry.getObject",
        "test:type",
        "test-id",
      );
      expect(result?.data).toEqual(testData);
    });
  });

  describe("getObjects", () => {
    it("should return empty array for non-existent type", () => {
      const result = manager.executeFunction<RegistryObject[]>(
        "registry.getObjects",
        "non-existent:type",
      );
      expect(result).toEqual([]);
    });

    it("should return all objects of a specific type", () => {
      manager.executeFunction("registry.addObject", "test:type", "id1", { value: 1 });
      manager.executeFunction("registry.addObject", "test:type", "id2", { value: 2 });
      manager.executeFunction("registry.addObject", "other:type", "id3", { value: 3 });

      const result = manager.executeFunction<RegistryObject[]>("registry.getObjects", "test:type");
      expect(result).toHaveLength(2);
      expect(result?.map((r) => r.data as { value: number }).map((r) => r.value)).toEqual([1, 2]);
    });
  });

  describe("removeObject", () => {
    it("should return false for non-existent object", () => {
      const result = manager.executeFunction<boolean>(
        "registry.removeObject",
        "test:type",
        "non-existent",
      );
      expect(result).toBe(false);
    });

    it("should remove an object and return true", () => {
      manager.executeFunction("registry.addObject", "test:type", "test-id", { value: 1 });

      const result = manager.executeFunction<boolean>(
        "registry.removeObject",
        "test:type",
        "test-id",
      );
      expect(result).toBe(true);

      const getResult = manager.executeFunction<RegistryObject | null>(
        "registry.getObject",
        "test:type",
        "test-id",
      );
      expect(getResult).toBeNull();
    });

    it("should not affect other objects of the same type", () => {
      manager.executeFunction("registry.addObject", "test:type", "id1", { value: 1 });
      manager.executeFunction("registry.addObject", "test:type", "id2", { value: 2 });

      manager.executeFunction("registry.removeObject", "test:type", "id1");

      const remaining = manager.executeFunction<RegistryObject[]>(
        "registry.getObjects",
        "test:type",
      );
      expect(remaining).toHaveLength(1);
      expect((remaining?.[0]?.data as { value: number })?.value).toBe(2);
    });
  });
});
