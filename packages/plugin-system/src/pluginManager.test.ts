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

    it("should return undefined if function not found", () => {
      const result = manager.executeFunction("nonexistent:function");
      expect(result).toBeUndefined();
    });

    it("should warn when overwriting existing function", () => {
      const fn1 = vi.fn();
      const fn2 = vi.fn();

      manager.addFunction("test:function", fn1);
      manager.addFunction("test:function", fn2);

      expect(manager.functions.get("test:function")).toBe(fn2);
    });

    it("should remove functions", () => {
      const testFn = vi.fn();
      manager.addFunction("test:function", testFn);
      manager.removeFunction("test:function");

      expect(manager.functions.has("test:function")).toBe(false);
    });
  });

  describe("checkDependencies", () => {
    it("should return true if plugin has no dependencies", () => {
      const plugin: Plugin = {
        name: "test:plugin",
        version: "1.0.0",
        activate: vi.fn(),
        deactivate: vi.fn(),
      };

      const result = manager.checkDependencies(plugin);
      expect(result).toBe(true);
    });

    it("should return true if all dependencies are registered", () => {
      const depPlugin: Plugin = {
        name: "dep:plugin",
        version: "1.0.0",
        activate: vi.fn(),
        deactivate: vi.fn(),
      };

      const plugin: Plugin = {
        name: "test:plugin",
        version: "1.0.0",
        activate: vi.fn(),
        deactivate: vi.fn(),
        dependencies: ["dep:plugin"],
      };

      manager.register(depPlugin);
      const result = manager.checkDependencies(plugin);
      expect(result).toBe(true);
    });

    it("should return false if dependencies are missing", () => {
      const plugin: Plugin = {
        name: "test:plugin",
        version: "1.0.0",
        activate: vi.fn(),
        deactivate: vi.fn(),
        dependencies: ["missing:plugin"],
      };

      const result = manager.checkDependencies(plugin);
      expect(result).toBe(false);
    });

    it("should handle dependencies with version specifiers", () => {
      const depPlugin: Plugin = {
        name: "dep:plugin",
        version: "1.0.0",
        activate: vi.fn(),
        deactivate: vi.fn(),
      };

      const plugin: Plugin = {
        name: "test:plugin",
        version: "1.0.0",
        activate: vi.fn(),
        deactivate: vi.fn(),
        dependencies: ["dep:plugin@1.0.0"],
      };

      manager.register(depPlugin);
      const result = manager.checkDependencies(plugin);
      expect(result).toBe(true);
    });
  });

  describe("arePluginsReady", () => {
    it("should be false initially", () => {
      expect(manager.arePluginsReady).toBe(false);
    });

    it("should be true after markPluginsAsReady", () => {
      manager.markPluginsAsReady();
      expect(manager.arePluginsReady).toBe(true);
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
      if (registryPlugin?.initialize) {
        registryPlugin.initialize(manager);
      }
      if (registryPlugin?.activate) {
        registryPlugin.activate();
      }
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
      if (rendererPlugin?.initialize) {
        rendererPlugin.initialize(manager);
      }
      if (rendererPlugin?.activate) {
        rendererPlugin.activate();
      }
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

      const components = manager.executeFunction<unknown[]>("renderer.getComponents", "test:position");
      expect(components).toBeDefined();
      expect(Array.isArray(components) && components.length).toBeGreaterThan(0);
    });
  });
});
