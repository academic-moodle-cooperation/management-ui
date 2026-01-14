import { logger } from "@workspace/utils";

import type { Plugin } from "./IPlugin";
import type { RegistryObject } from "./plugins/objectRegistry/index";
import type { PluginFunction, EventCallback, PluginComponent, RegistryMetadata } from "./types";

type PluginRegistry = Map<string, Plugin>;
type FunctionRegistry = Map<string, PluginFunction>;

/**
 * Validates if a plugin name follows the recommended format: 'namespace:plugin-type'
 * @param name The plugin name to validate
 * @returns True if the name is valid, false otherwise
 */
const isValidPluginName = (name: string): boolean => {
  // Allow legacy names for backward compatibility, but log a warning
  if (!name.includes(":")) {
    logger.warn(
      `Plugin name "${name}" doesn't follow the recommended 'namespace:plugin-type' format`,
      { pluginName: name },
    );
    return true; // Still allow it for backward compatibility
  }

  // Validate format: namespace:plugin-type
  const parts = name.split(":");
  if (parts.length !== 2) {
    return false; // Should have exactly one colon
  }

  const [namespace, pluginType] = parts;
  return !!namespace && namespace.length > 0 && !!pluginType && pluginType.length > 0;
};

/**
 * Validates if a component key follows the recommended format: 'namespace:plugin-type:component'
 * @param key The component key to validate
 * @returns True if the key is valid, false otherwise
 */
const isValidComponentKey = (key: string): boolean => {
  // Allow legacy keys for backward compatibility
  if (!key.includes(":")) {
    return true;
  }

  // Validate format: namespace:plugin-type:component
  const parts = key.split(":");
  return parts.length >= 2 && parts.every((part) => part.length > 0);
};

export interface PluginManager {
  plugins: PluginRegistry;
  functions: FunctionRegistry;
  eventListeners: Map<string, EventCallback<unknown>[]>;
  register(plugin: Plugin): void;
  deregister(pluginName: string): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  executeFunction<T>(key: string, ...args: any[]): T | undefined;
  addFunction(key: string, func: PluginFunction): void;
  removeFunction(key: string): void;
  addEventListener<T = unknown>(eventName: string, callback: EventCallback<T>): void;
  removeEventListener<T = unknown>(eventName: string, callback: EventCallback<T>): void;
  dispatchEvent<T = unknown>(eventName: string, payload: T): void;
  checkDependencies(plugin: Plugin): boolean;
  currentPlugin?: Plugin | undefined; // Track the current plugin for context in helper methods
  registerComponent(
    extensionPoint: string,
    component: PluginComponent,
    options?: { key?: string; order?: number },
  ): void;
  registerObject<T = unknown>(
    type: string,
    objectId: string,
    data: T,
    metadata?: RegistryMetadata,
  ): void;
  getObjects<T = unknown>(type: string): T[];
  getObject<T = unknown>(type: string, objectId: string): T | null;
  removeObject(type: string, objectId: string): boolean;
  arePluginsReady: boolean;
  markPluginsAsReady(): void;
}

export const createPluginManager = (): PluginManager => {
  const plugins: PluginRegistry = new Map();
  const functions: FunctionRegistry = new Map();
  const eventListeners: Map<string, EventCallback<unknown>[]> = new Map();
  let currentPlugin: Plugin | undefined = undefined;
  let pluginsReady = false;

  const register = (plugin: Plugin) => {
    // Validate plugin name format
    if (!isValidPluginName(plugin.name)) {
      logger.error(
        `Invalid plugin name format: ${plugin.name}. Expected format: "namespace:plugin-type"`,
        { pluginName: plugin.name },
      );
      return;
    }

    if (plugins.has(plugin.name)) {
      logger.warn(`Plugin "${plugin.name}" is already registered.`, { pluginName: plugin.name });
      return;
    }

    if (plugin.dependencies && !checkDependencies(plugin)) {
      logger.error(`Failed to register plugin "${plugin.name}" due to missing dependencies.`, {
        pluginName: plugin.name,
        dependencies: plugin.dependencies,
      });
      return;
    }

    currentPlugin = plugin; // Set current plugin for context
    plugin.initialize?.(manager);
    plugins.set(plugin.name, plugin);
    plugin.activate();
    currentPlugin = undefined; // Clear current plugin

    logger.info(`Plugin "${plugin.name}" registered successfully.`, { pluginName: plugin.name });

    // Dispatch an event to notify that a plugin has been registered
    dispatchEvent("plugin:registered", { pluginName: plugin.name, plugin });
  };

  const deregister = (pluginName: string) => {
    const plugin = plugins.get(pluginName);
    if (!plugin) {
      logger.warn(`Plugin "${pluginName}" is not registered.`, { pluginName });
      return;
    }

    plugin.deactivate();
    plugins.delete(pluginName);
    logger.info(`Plugin "${pluginName}" deregistered.`, { pluginName });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const executeFunction = <T>(key: string, ...args: any[]): T | undefined => {
    const func = functions.get(key);
    if (!func) {
      logger.error(`Function "${key}" is not registered.`, { functionKey: key });
      return undefined;
    }
    // Type assertion needed because PluginFunction has flexible signature
    // The generic return type T provides type safety for callers
    return func(...args) as T;
  };

  const addFunction = (key: string, func: PluginFunction) => {
    if (functions.has(key)) {
      logger.warn(`Function "${key}" is already registered. Overwriting.`, { functionKey: key });
    }
    functions.set(key, func);
  };

  const removeFunction = (key: string) => {
    functions.delete(key);
  };

  // Event System

  const addEventListener = <T = unknown>(eventName: string, callback: EventCallback<T>) => {
    const listeners = eventListeners.get(eventName) || [];
    eventListeners.set(eventName, [...listeners, callback as EventCallback<unknown>]);
  };

  const removeEventListener = <T = unknown>(eventName: string, callback: EventCallback<T>) => {
    const listeners = eventListeners.get(eventName) || [];
    eventListeners.set(
      eventName,
      listeners.filter((listener) => listener !== (callback as EventCallback<unknown>)),
    );
  };

  const dispatchEvent = <T = unknown>(eventName: string, payload: T) => {
    const listeners = eventListeners.get(eventName) || [];
    listeners.forEach((callback) => callback(payload));
  };

  const checkDependencies = (plugin: Plugin): boolean => {
    return (
      plugin.dependencies?.every((dep) => {
        const depParts = dep.split("@");
        const depName = depParts[0];
        if (!depName) return false; // Ensure depName is defined
        return plugins.has(depName);
      }) ?? true
    );
  };

  /**
   * Helper method to register a component with an extension point
   * Uses the current plugin context for namespacing
   */
  const registerComponent = (
    extensionPoint: string,
    component: PluginComponent,
    options: { key?: string; order?: number } = {},
  ) => {
    const { key = crypto.randomUUID(), order = 100 } = options;
    const pluginName = currentPlugin?.name || "unknown";

    // Create a namespaced key if the provided key doesn't already have namespacing
    const componentKey = key.includes(":") ? key : `${pluginName}:${key}`;

    // Validate component key
    if (!isValidComponentKey(componentKey)) {
      logger.warn(
        `Component key "${componentKey}" doesn't follow the recommended format. Consider using 'namespace:plugin-type:component'`,
        { componentKey, extensionPoint },
      );
    }

    // Register the component using the renderer plugin
    executeFunction("renderer.add", extensionPoint, component, componentKey, order);
  };

  // Add implementations to createPluginManager
  const registerObject = <T = unknown>(
    type: string,
    objectId: string,
    data: T,
    metadata?: RegistryMetadata,
  ) => {
    const pluginName = currentPlugin?.name || "unknown";

    // Create a namespaced ID if the provided ID doesn't already have namespacing
    const namespacedId = objectId.includes(":") ? objectId : `${pluginName}:${objectId}`;

    executeFunction("registry.addObject", type, namespacedId, data, metadata);
  };

  const getObjects = <T = unknown>(type: string): T[] => {
    const objects = executeFunction<RegistryObject[]>("registry.getObjects", type) || [];
    return objects.map((obj) => obj.data) as T[];
  };

  const getObject = <T = unknown>(type: string, objectId: string): T | null => {
    const pluginName = currentPlugin?.name || "unknown";

    // Create a namespaced ID if the provided ID doesn't already have namespacing
    // This should match the logic in registerObject
    const namespacedId = objectId.includes(":") ? objectId : `${pluginName}:${objectId}`;

    const object = executeFunction<RegistryObject | null>("registry.getObject", type, namespacedId);
    return object ? (object.data as T) : null;
  };

  const removeObject = (type: string, objectId: string): boolean => {
    const pluginName = currentPlugin?.name || "unknown";

    // Create a namespaced ID if the provided ID doesn't already have namespacing
    // This should match the logic in registerObject
    const namespacedId = objectId.includes(":") ? objectId : `${pluginName}:${objectId}`;

    return executeFunction<boolean>("registry.removeObject", type, namespacedId) || false;
  };

  const markPluginsAsReady = () => {
    pluginsReady = true;
    dispatchEvent("plugins:ready", { timestamp: Date.now() });
  };

  // Expose public API
  const manager = {
    plugins,
    functions,
    eventListeners,
    register,
    deregister,
    executeFunction,
    addFunction,
    removeFunction,
    addEventListener,
    removeEventListener,
    dispatchEvent,
    checkDependencies,
    get currentPlugin() {
      return currentPlugin;
    },
    registerComponent,
    registerObject,
    getObjects,
    getObject,
    removeObject,
    get arePluginsReady() {
      return pluginsReady;
    },
    markPluginsAsReady,
  };

  return manager;
};
