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

        // 5. Filter and load remaining plugins with the merged configuration
        const remainingPlugins = allAvailablePlugins.filter(
          (plugin) => !plugin.name.endsWith(":config"),
        );

        remainingPlugins.forEach((plugin) => {
          if (plugin && plugin.name) {
            // Re-evaluate if plugin should be loaded with merged config
            const [pluginNamespace, pluginType] = plugin.name.split(":");
            const pluginConfig = mergedConfig?.app?.pluginNamespace || [];

            // Parse config to check if plugin should be loaded
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

        // 6. Mark plugins as ready in the manager
        manager.markPluginsAsReady();

        // 7. Update local state to render children
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
