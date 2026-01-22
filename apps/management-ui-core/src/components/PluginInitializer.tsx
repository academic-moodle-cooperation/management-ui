import React, { useState, useEffect, useRef } from "react";

import {
  createObjectRegistryPlugin,
  createRendererPlugin,
  usePluginManager,
  type Plugin,
  createAppRegistryPlugin,
} from "@workspace/plugin-system";
import type { AppConfig } from "@workspace/query";
import { AppLoader } from "@workspace/ui/components";
import { logger } from "@workspace/utils";

import { loadAllAvailablePlugins } from "../loadPlugins";

// ─────────────────────────────────────────────────────────────────────────────
// Plugin Override Types & Helpers
// ─────────────────────────────────────────────────────────────────────────────

interface PluginOverride {
  enabled: boolean;
  mode: "additive" | "replacement";
}

interface PluginOverrides {
  version: 1;
  overrides: Record<string, PluginOverride>;
}

const OVERRIDE_STORAGE_KEY = "plugin_overrides";

/**
 * Read plugin overrides from localStorage
 */
const getPluginOverrides = (): PluginOverrides => {
  try {
    const data = localStorage.getItem(OVERRIDE_STORAGE_KEY);
    if (!data) {
      return { version: 1, overrides: {} };
    }
    const parsed = JSON.parse(data) as PluginOverrides;
    if (parsed.version !== 1) {
      return { version: 1, overrides: {} };
    }
    return parsed;
  } catch {
    return { version: 1, overrides: {} };
  }
};

/**
 * Parse plugin name into namespace and type
 */
const parsePluginName = (name: string): { namespace: string; type: string } => {
  const [namespace, type] = name.split(":");
  return { namespace: namespace || "unknown", type: type || "unknown" };
};

interface PluginInitializerProps {
  children: React.ReactNode;
  config?: AppConfig; // Add config prop
}

export const PluginInitializer: React.FC<PluginInitializerProps> = ({ children, config }) => {
  const manager = usePluginManager();
  const [pluginsReady, setPluginsReady] = useState(false);
  const initializationStarted = useRef(false);

  useEffect(() => {
    // Prevent multiple initializations in React Strict Mode
    if (initializationStarted.current) {
      return;
    }

    // If plugins are already ready, just sync local state
    if (manager.arePluginsReady) {
      setPluginsReady(true);
      return;
    }

    initializationStarted.current = true;
    let didUnmount = false;
    const registeredPluginNames: string[] = [];

    const initializePlugins = async () => {
      if (didUnmount) return;

      try {
        // 1. Create and register core plugins
        const objectRegistryPlugin = createObjectRegistryPlugin();
        const rendererPlugin = createRendererPlugin();
        const appRegistryPlugin = createAppRegistryPlugin();

        if (!manager.plugins.has(objectRegistryPlugin.name)) {
          manager.register(objectRegistryPlugin);
          registeredPluginNames.push(objectRegistryPlugin.name);
        }

        if (!manager.plugins.has(rendererPlugin.name)) {
          manager.register(rendererPlugin);
          registeredPluginNames.push(rendererPlugin.name);
        }

        if (!manager.plugins.has(appRegistryPlugin.name)) {
          manager.register(appRegistryPlugin);
          registeredPluginNames.push(appRegistryPlugin.name);
        }

        // 2. Load ALL available plugins without filtering first
        const allAvailablePlugins: Plugin[] = await loadAllAvailablePlugins();

        // 2b. Expose the full list for the Admin Marketplace's plugin explorer
        manager.addFunction("marketplace.getAllPlugins", () => allAvailablePlugins);

        // 3. Register config plugins first to establish configuration
        const configPlugins = allAvailablePlugins.filter((plugin) =>
          plugin.name.endsWith(":config"),
        );

        configPlugins.forEach((plugin) => {
          if (plugin && plugin.name) {
            if (!manager.plugins.has(plugin.name)) {
              manager.register(plugin);
              registeredPluginNames.push(plugin.name);
            } else {
              // Re-initialize if already registered (React Strict Mode)
              try {
                plugin.initialize?.(manager);
              } catch (error) {
                logger.error(
                  `PluginInitializer: Failed to re-initialize config plugin ${plugin.name}`,
                  error instanceof Error ? error : new Error(String(error)),
                  { pluginName: plugin.name },
                );
              }
            }
          }
        });

        // 4. Get merged config from registry (now includes config plugin contributions)
        const configObjects = manager.getObjects<AppConfig>("app:config");
        const mergedConfig = configObjects.reduce(
          (acc: AppConfig, obj: AppConfig) => {
            return { ...acc, ...obj };
          },
          config || ({} as AppConfig),
        );

        // 5. Get localStorage overrides for plugin enable/disable
        const overrides = getPluginOverrides();
        const hasOverrides = Object.keys(overrides.overrides).length > 0;
        if (hasOverrides) {
          logger.info("PluginInitializer: Applying plugin overrides from localStorage", {
            overrideCount: Object.keys(overrides.overrides).length,
          });
        }

        // 6. Filter and load remaining plugins with the merged configuration + overrides
        const remainingPlugins = allAvailablePlugins.filter(
          (plugin) => !plugin.name.endsWith(":config"),
        );

        // Build a map of plugins by type for replacement mode conflict handling
        const pluginsByType = new Map<string, Plugin[]>();
        remainingPlugins.forEach((plugin) => {
          const { type } = parsePluginName(plugin.name);
          const existing = pluginsByType.get(type) || [];
          pluginsByType.set(type, [...existing, plugin]);
        });

        // Track which plugins to disable for replacement mode
        const pluginsToDisable = new Set<string>();

        // First pass: identify plugins to disable in replacement mode
        for (const [pluginName, override] of Object.entries(overrides.overrides)) {
          if (override.enabled && override.mode === "replacement") {
            const { type: enableType, namespace: enableNamespace } = parsePluginName(pluginName);
            
            // Find conflicting plugins (same type, different namespace)
            const sameTypePlugins = pluginsByType.get(enableType) || [];
            for (const conflict of sameTypePlugins) {
              const { namespace: conflictNamespace } = parsePluginName(conflict.name);
              if (conflictNamespace !== enableNamespace) {
                pluginsToDisable.add(conflict.name);
                logger.info(
                  `PluginInitializer: Replacement mode - will disable "${conflict.name}" for "${pluginName}"`,
                );
              }
            }
          }
        }

        remainingPlugins.forEach((plugin) => {
          if (plugin && plugin.name) {
            // Re-evaluate if plugin should be loaded with merged config
            const [pluginNamespace, pluginType] = plugin.name.split(":");
            const pluginConfig = mergedConfig?.app?.pluginNamespace || [];

            // Check for override first
            const override = overrides.overrides[plugin.name];
            
            // Check if this plugin should be disabled due to replacement mode
            if (pluginsToDisable.has(plugin.name)) {
              // Skip this plugin - it's being replaced
              logger.info(`PluginInitializer: Skipping "${plugin.name}" - disabled by replacement mode`);
              return;
            }

            // If there's an explicit override, use it
            if (override !== undefined) {
              if (override.enabled) {
                // Explicitly enabled via override
                if (!manager.plugins.has(plugin.name)) {
                  manager.register(plugin);
                  registeredPluginNames.push(plugin.name);
                  logger.info(`PluginInitializer: Loaded "${plugin.name}" via override (${override.mode} mode)`);
                }
              } else {
                // Explicitly disabled via override - skip
                logger.info(`PluginInitializer: Skipping "${plugin.name}" - disabled by override`);
              }
              return;
            }

            // No override - use config-based loading
            let shouldLoad = false;
            for (const item of pluginConfig) {
              if (typeof item === "string" && item === pluginNamespace) {
                shouldLoad = true;
                break;
              } else if (typeof item === "object" && pluginNamespace && item[pluginNamespace]) {
                const types = item[pluginNamespace]?.types || [];
                shouldLoad = pluginType
                  ? types.includes(pluginType) || types.includes("all")
                  : false;
                if (shouldLoad) break;
              }
            }

            if (shouldLoad) {
              if (!manager.plugins.has(plugin.name)) {
                manager.register(plugin);
                registeredPluginNames.push(plugin.name);
              } else {
                // Re-initialize if already registered (React Strict Mode)
                try {
                  plugin.initialize?.(manager);
                } catch (error) {
                  logger.error(
                    `PluginInitializer: Failed to re-initialize plugin ${plugin.name}`,
                    error instanceof Error ? error : new Error(String(error)),
                    { pluginName: plugin.name },
                  );
                }
              }
            }
          } else {
            // Skip invalid plugin structure
          }
        });

        // 8. Mark plugins as ready in the manager
        manager.markPluginsAsReady();

        // 9. Update local state to render children
        if (!didUnmount) {
          setPluginsReady(true);
        }
      } catch (error) {
        logger.error(
          "PluginInitializer: Failed to initialize plugins",
          error instanceof Error ? error : new Error(String(error)),
        );
        if (!didUnmount) {
          setPluginsReady(true); // Still set to true to avoid an infinite loading state on error
        }
      }
    };

    initializePlugins();

    return () => {
      didUnmount = true;
      // Only reset initialization flag if we're actually unmounting
      setTimeout(() => {
        if (didUnmount) {
          initializationStarted.current = false;
        }
      }, 0);
    };
  }, [manager, config]); // Removed pluginsReady to prevent dependency loop

  if (!pluginsReady) {
    return <AppLoader />;
  }

  return <>{children}</>;
};
