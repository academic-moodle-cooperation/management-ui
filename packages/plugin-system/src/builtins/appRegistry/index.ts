import { logger } from "@oc-mui/utils";

import type { AppDefinition } from "../../appTypes";
import type { Plugin } from "../../IPlugin";
import type { PluginManager } from "../../pluginManager";

/**
 * App registry plugin for managing registered apps
 */
export interface AppRegistryPlugin {
  name: string;
  version: string;
  initialize(manager: PluginManager): void;
  activate(): void;
  deactivate(): void;
}

/**
 * Creates the app registry plugin that manages app definitions
 */
export const createAppRegistryPlugin = (): AppRegistryPlugin => {
  return {
    name: "core:app-registry",
    version: "1.0.0",

    initialize(manager: PluginManager) {
      // Register functions for app management
      manager.addFunction("apps.register", (appDefinition: AppDefinition) => {
        manager.registerObject("apps:definitions", appDefinition.id, appDefinition);
      });

      manager.addFunction("apps.getAll", (): AppDefinition[] => {
        return manager.getObjects<AppDefinition>("apps:definitions");
      });

      manager.addFunction("apps.getById", (id: string): AppDefinition | null => {
        return manager.getObject<AppDefinition>("apps:definitions", id);
      });

      manager.addFunction("apps.remove", (id: string): boolean => {
        return manager.removeObject("apps:definitions", id);
      });

      // Listen for plugin registration events to auto-discover apps
      manager.addEventListener<{ pluginName: string; plugin: Plugin }>(
        "plugin:registered",
        (payload) => {
          const { pluginName } = payload;
          logger.debug(`Checking plugin ${pluginName} for app definitions...`, { pluginName });
        },
      );

      logger.debug("App registry plugin initialized");
    },

    activate() {
      logger.debug("App registry plugin activated");
    },

    deactivate() {
      logger.debug("App registry plugin deactivated");
    },
  };
};

/**
 * Helper function to register an app through the plugin system
 */
export const registerApp = (manager: PluginManager, appDefinition: AppDefinition): void => {
  manager.executeFunction("apps.register", appDefinition);
};

/**
 * Helper function to get all registered apps
 */
export const getAllApps = (manager: PluginManager): AppDefinition[] => {
  return manager.executeFunction<AppDefinition[]>("apps.getAll") || [];
};

/**
 * Helper function to get a specific app by ID
 */
export const getAppById = (manager: PluginManager, id: string): AppDefinition | null => {
  return manager.executeFunction<AppDefinition | null>("apps.getById", id) || null;
};
