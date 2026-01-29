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

import { loadAndRegister } from "@workspace/remote-plugin-loader";
import { loadAllAvailablePlugins } from "../loadPlugins";
import { loadJarPlugins } from "../services/jarPluginLoader";
import {
  loadLocalPluginsManifest,
  getLocalPluginFullUrl,
} from "../services/localPluginsManifest";

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

const initPromiseRef = { current: null as Promise<void> | null };

export const PluginInitializer: React.FC<PluginInitializerProps> = ({ children, config }) => {
  const manager = usePluginManager();
  const [pluginsReady, setPluginsReady] = useState(false);
  const initializingRef = useRef(false);

  useEffect(() => {
    // If plugins are already ready, just sync local state
    if (manager.arePluginsReady) {
      setPluginsReady(true);
      return;
    }

    // React Strict Mode: second mount may run while first init is still in progress.
    // Wait for the in-flight init to finish so we get pluginsReady set.
    if (initializingRef.current && initPromiseRef.current) {
      void initPromiseRef.current.then(() => {
        setPluginsReady(true);
      });
      return;
    }
    initializingRef.current = true;

    let didUnmount = false;
    const registeredPluginNames: string[] = [];

    const initializePlugins = async () => {
      if (didUnmount) return;
      // Guard: another run may have already finished (e.g. Strict Mode race)
      if (manager.arePluginsReady) return;

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

        for (const plugin of configPlugins) {
          if (plugin && plugin.name) {
            if (!manager.plugins.has(plugin.name)) {
              const reg = manager.register(plugin);
              registeredPluginNames.push(plugin.name);
              if (reg != null && typeof (reg as Promise<unknown>)?.then === "function") {
                await reg;
              }
            }
            // Do not re-call initialize() when already registered (avoids duplicate state in Strict Mode)
          }
        }

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

        for (const plugin of remainingPlugins) {
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
              continue;
            }

            // If there's an explicit override, use it
            if (override !== undefined) {
              if (override.enabled) {
                // Explicitly enabled via override
                if (!manager.plugins.has(plugin.name)) {
                  const reg = manager.register(plugin);
                  registeredPluginNames.push(plugin.name);
                  if (reg != null && typeof (reg as Promise<unknown>)?.then === "function") {
                    await reg;
                  }
                  logger.info(`PluginInitializer: Loaded "${plugin.name}" via override (${override.mode} mode)`);
                }
              } else {
                // Explicitly disabled via override - skip
                logger.info(`PluginInitializer: Skipping "${plugin.name}" - disabled by override`);
              }
              continue;
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
                const reg = manager.register(plugin);
                registeredPluginNames.push(plugin.name);
                if (reg != null && typeof (reg as Promise<unknown>)?.then === "function") {
                  await reg;
                }
              }
              // Do not re-call initialize() when already registered (avoids duplicate
              // app/sidebar registration and re-loading remote plugins in Strict Mode)
            }
          }
        }

        // 7. Load JAR plugins from backend (same-origin / backend-derived URLs)
        try {
          const jarPlugins = await loadJarPlugins();
          if (jarPlugins.length > 0) {
            logger.info("PluginInitializer: Loading JAR plugin(s) from backend", {
              count: jarPlugins.length,
            });
            const jarLoadResults = await Promise.allSettled(
              jarPlugins.map((jarPlugin) =>
                loadAndRegister(jarPlugin.url, manager, { skipUrlValidation: true }),
              ),
            );
            jarLoadResults.forEach((result, index) => {
              const jarPlugin = jarPlugins[index];
              if (!jarPlugin) return;
              if (result.status === "rejected") {
                logger.error(
                  `PluginInitializer: Failed to load JAR plugin "${jarPlugin.name}" from ${jarPlugin.url}`,
                  result.reason instanceof Error ? result.reason : new Error(String(result.reason)),
                );
              } else if (result.status === "fulfilled" && !result.value.success) {
                logger.warn(
                  `PluginInitializer: JAR plugin "${jarPlugin.name}" failed to load`,
                  { error: result.value.error },
                );
              }
            });
          }
        } catch (error) {
          logger.debug("PluginInitializer: JAR plugins not available or failed", {
            error: error instanceof Error ? error.message : String(error),
          });
        }

        // 8. Load .local-plugins/ from dev server manifest (dev only, no Marketplace required)
        try {
          const localManifest = await loadLocalPluginsManifest();
          if (localManifest.length > 0) {
            logger.info("PluginInitializer: Loading .local-plugins plugin(s)", {
              count: localManifest.length,
            });
            const localLoadResults = await Promise.allSettled(
              localManifest.map((entry) =>
                loadAndRegister(getLocalPluginFullUrl(entry), manager, {
                  skipUrlValidation: true,
                }),
              ),
            );
            localLoadResults.forEach((result, index) => {
              const entry = localManifest[index];
              if (!entry) return;
              if (result.status === "rejected") {
                logger.error(
                  `PluginInitializer: Failed to load .local-plugins "${entry.name}" from ${entry.url}`,
                  result.reason instanceof Error ? result.reason : new Error(String(result.reason)),
                );
              }
            });
          }
        } catch (error) {
          logger.debug("PluginInitializer: .local-plugins manifest not available or failed", {
            error: error instanceof Error ? error.message : String(error),
          });
        }

        // 9. Mark plugins as ready in the manager
        manager.markPluginsAsReady();

        // 10. Update local state to render children
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

    const promise = initializePlugins();
    initPromiseRef.current = promise;
    void promise;

    return () => {
      didUnmount = true;
      // Reset only after a delay so React Strict Mode's second effect run still
      // sees initializingRef.current === true and skips (avoids duplicate routes/plugins)
      const resetDelayMs = 150;
      setTimeout(() => {
        initializingRef.current = false;
      }, resetDelayMs);
    };
  }, [manager, config]); // Removed pluginsReady to prevent dependency loop

  if (!pluginsReady) {
    return <AppLoader />;
  }

  return <>{children}</>;
};
