import { describe, it, expect, beforeEach, vi } from "vitest";
import { createPluginManager } from "./pluginManager";
import { createObjectRegistryPlugin } from "./plugins/objectRegistry";
import { createRendererPlugin } from "./plugins/renderer";
import type { Plugin } from "./IPlugin";

describe("PluginManager", () => {
  let manager: ReturnType<typeof createPluginManager>;

  beforeEach(() => {
    manager = createPluginManager();
  });

  describe("register", () => {
    it("should register a plugin successfully", () => {
      const plugin: Plugin = {
        name: "test:plugin",
        version: "1.0.0",
        activate: vi.fn(),
        deactivate: vi.fn(),
      };

      manager.register(plugin);

      expect(manager.plugins.has("test:plugin")).toBe(true);
      expect(plugin.activate).toHaveBeenCalled();
    });

    it("should warn but still register plugin with legacy name format (backward compatibility)", () => {
      const plugin: Plugin = {
        name: "legacy-plugin-name",
        version: "1.0.0",
        activate: vi.fn(),
        deactivate: vi.fn(),
      };

      manager.register(plugin);

      // Legacy names are still registered for backward compatibility
      expect(manager.plugins.has("legacy-plugin-name")).toBe(true);
    });

    it("should not register plugin with completely invalid name format", () => {
      const plugin: Plugin = {
        name: "invalid:name:with:too:many:colons",
        version: "1.0.0",
        activate: vi.fn(),
        deactivate: vi.fn(),
      };

      manager.register(plugin);

      // Invalid format (too many colons) should not be registered
      expect(manager.plugins.has("invalid:name:with:too:many:colons")).toBe(false);
    });

    it("should not register duplicate plugins", () => {
      const plugin: Plugin = {
        name: "test:plugin",
        version: "1.0.0",
        activate: vi.fn(),
        deactivate: vi.fn(),
      };

      manager.register(plugin);
      manager.register(plugin);

      expect(manager.plugins.size).toBe(1);
    });
  });

  describe("deregister", () => {
    it("should deregister a plugin", () => {
      const plugin: Plugin = {
        name: "test:plugin",
        version: "1.0.0",
        activate: vi.fn(),
        deactivate: vi.fn(),
      };

      manager.register(plugin);
      manager.deregister("test:plugin");

      expect(manager.plugins.has("test:plugin")).toBe(false);
      expect(plugin.deactivate).toHaveBeenCalled();
    });
  });

  describe("functions", () => {
    it("should add and execute functions", () => {
      const testFn = vi.fn((x: number) => x * 2);
      manager.addFunction("test:multiply", testFn);

      const result = manager.executeFunction<number>("test:multiply", 5);

      expect(result).toBe(10);
      expect(testFn).toHaveBeenCalledWith(5);
    });
  });

  describe("events", () => {
    it("should dispatch and listen to events", () => {
      const callback = vi.fn();
      manager.addEventListener("test:event", callback);

      manager.dispatchEvent("test:event", { data: "test" });

      expect(callback).toHaveBeenCalledWith({ data: "test" });
    });

    it("should support multiple listeners for the same event", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      manager.addEventListener("test:event", callback1);
      manager.addEventListener("test:event", callback2);

      manager.dispatchEvent("test:event", { data: "test" });

      expect(callback1).toHaveBeenCalledWith({ data: "test" });
      expect(callback2).toHaveBeenCalledWith({ data: "test" });
    });

    it("should remove event listeners", () => {
      const callback = vi.fn();
      manager.addEventListener("test:event", callback);
      manager.removeEventListener("test:event", callback);

      manager.dispatchEvent("test:event", { data: "test" });

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("object registry integration", () => {
    beforeEach(() => {
      // Initialize object registry plugin
      const registryPlugin = createObjectRegistryPlugin();
      registryPlugin.initialize(manager);
      registryPlugin.activate();
    });

    it("should register and retrieve objects", () => {
      const testData = { name: "test" };
      manager.registerObject("test:type", "test-id", testData);

      const result = manager.getObject("test:type", "test-id");
      expect(result).toEqual(testData);
    });

    it("should get all objects of a type", () => {
      manager.registerObject("test:type", "id1", { value: 1 });
      manager.registerObject("test:type", "id2", { value: 2 });

      const objects = manager.getObjects("test:type");
      expect(objects).toHaveLength(2);
    });

    it("should remove objects", () => {
      manager.registerObject("test:type", "test-id", { value: 1 });
      const removed = manager.removeObject("test:type", "test-id");

      expect(removed).toBe(true);
      expect(manager.getObject("test:type", "test-id")).toBeNull();
    });
  });

  describe("component registration", () => {
    beforeEach(() => {
      // Initialize renderer plugin
      const rendererPlugin = createRendererPlugin();
      rendererPlugin.initialize(manager);
      rendererPlugin.activate();
    });

    it("should register components with extension points", () => {
      const TestComponent = () => null;
      const plugin: Plugin = {
        name: "test:plugin",
        version: "1.0.0",
        activate: vi.fn(),
        deactivate: vi.fn(),
      };

      manager.register(plugin);
      manager.registerComponent("test:position", TestComponent, { key: "test-key" });

      const components = manager.executeFunction("renderer.getComponents", "test:position");
      expect(components).toBeDefined();
      expect(components.length).toBeGreaterThan(0);
    });
  });
});
