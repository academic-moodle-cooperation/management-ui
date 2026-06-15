import React, { useEffect, useRef, useState } from "react";

import { registerPluginI18nNamespaces } from "@opencast-mui/i18n";
import {
  createAppRegistryPlugin,
  createObjectRegistryPlugin,
  createRendererPlugin,
  usePluginManager,
  type Plugin,
} from "@opencast-mui/plugin-system";
import type { AppConfig } from "@opencast-mui/query";
import { getAppConfigSync } from "@opencast-mui/query";
import { loadAndRegister } from "@opencast-mui/remote-plugin-loader";
import { AppLoader } from "@opencast-mui/ui/components";
import { deepMerge, logger } from "@opencast-mui/utils";

import {
  loadAllAvailablePlugins,
  getEnabledPluginNamespaces,
  isPluginEnabledAtRuntime,
} from "../loadPlugins";
import { loadJarPlugins } from "../services/jarPluginLoader";
import {
  loadLocalPluginsManifest,
  getLocalPluginFullUrl,
} from "../services/localPluginsManifest";
import { passesSharedDependencyGate } from "../services/sharedDepsGate";

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

const matchesEnabledNamespace = (
  entry: { namespace?: string | undefined },
  enabledNamespaces: Set<string>,
): boolean => {
  if (enabledNamespaces.size === 0) return true;
  if (entry.namespace === undefined) return true;
  return enabledNamespaces.has(entry.namespace);
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
    const disabledByOverride: Plugin[] = [];

    const registerPluginLocales = (
      entries: Array<{ localesUrl?: string; i18nNamespaces?: string[] }>,
    ) => {
      entries.forEach((entry) => {
        if (entry.localesUrl && Array.isArray(entry.i18nNamespaces) && entry.i18nNamespaces.length > 0) {
          registerPluginI18nNamespaces(entry.i18nNamespaces, entry.localesUrl);
        }
      });
    };

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

        // 4. Get merged config from registry (now includes config plugin
        //    contributions). Uses the same layered merge order as
        //    `useAppConfig`: plugin defaults → shell base (fetched config.json)
        //    → runtime overlays. Keeping both sides in lockstep is what lets
        //    `config` pick up deployment-specific values even before the
        //    individual feature plugins get to run.
        const configDefaults = manager.getObjects<Partial<AppConfig>>("app:config:defaults");
        const configOverlays = manager.getObjects<Partial<AppConfig>>("app:config");
        const mergedConfig = deepMerge<AppConfig>(
          {} as AppConfig,
          ...configDefaults,
          { ...(config || {}) } as AppConfig,
          ...configOverlays,
        ) as AppConfig;

        // Make the effective runtime config visible via app:config so plugins
        // initialized later (e.g. navigation plugins) can read production JSON
        // values even when no dedicated config plugin contributes them.
        manager.registerObject("app:config", "runtime-config", mergedConfig);

        // 5. Get localStorage overrides for plugin enable/disable
        const overrides = getPluginOverrides();
        const hasOverrides = Object.keys(overrides.overrides).length > 0;
        if (hasOverrides) {
          logger.info("PluginInitializer: Applying plugin overrides from localStorage", {
            overrideCount: Object.keys(overrides.overrides).length,
          });
        }

        // Build set of plugin names explicitly disabled by the user
        const disabledNames = new Set<string>();
        for (const [name, override] of Object.entries(overrides.overrides)) {
          if (!override.enabled) disabledNames.add(name);
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

        const mergedEnabledNamespaces = getEnabledPluginNamespaces(mergedConfig);

        for (const plugin of remainingPlugins) {
          if (plugin && plugin.name) {
            const [pluginNamespace] = plugin.name.split(":");

            // Check for localStorage override first
            const override = overrides.overrides[plugin.name];

            // Check if this plugin should be disabled due to replacement mode
            if (pluginsToDisable.has(plugin.name)) {
              logger.info(`PluginInitializer: Skipping "${plugin.name}" - disabled by replacement mode`);
              continue;
            }

            // If there's an explicit override, use it
            if (override !== undefined) {
              if (override.enabled) {
                if (!manager.plugins.has(plugin.name)) {
                  const reg = manager.register(plugin);
                  registeredPluginNames.push(plugin.name);
                  if (reg != null && typeof (reg as Promise<unknown>)?.then === "function") {
                    await reg;
                  }
                  logger.info(`PluginInitializer: Loaded "${plugin.name}" via override (${override.mode} mode)`);
                }
              } else {
                logger.info(`PluginInitializer: Skipping "${plugin.name}" - disabled by override`);
              }
              continue;
            }

            // No override - apply the two-level config gate:
            //   1. Namespace must be in `app.enabledPlugins` (ship filter).
            //   2. Plugin slice must not be disabled via
            //      `config.plugins[<ns>].enabled === false` (runtime switch).
            const namespaceEnabled = matchesEnabledNamespace(
              { namespace: pluginNamespace },
              mergedEnabledNamespaces,
            );
            if (!namespaceEnabled) continue;

            if (pluginNamespace && !isPluginEnabledAtRuntime(mergedConfig, pluginNamespace)) {
              logger.info(
                `PluginInitializer: Skipping "${plugin.name}" - disabled via config.plugins.${pluginNamespace}.enabled`,
              );
              continue;
            }

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

        // 7. Load JAR plugins from backend (same config drives plugins.json URL and script base)
        // In dev, skip JAR plugins whose scope is replaced by a .local-plugins manifest entry (replacesJarScopes)
        try {
          const localManifestForDedup =
            typeof import.meta !== "undefined" && import.meta.env.DEV
              ? await loadLocalPluginsManifest()
              : [];
          const replacedJarScopes = new Set(
            localManifestForDedup.flatMap((e) => e.replacesJarScopes ?? []),
          );
          const jarPlugins = await loadJarPlugins(mergedConfig);
          manager.addFunction("marketplace.getJarPlugins", () => jarPlugins);
          const jarPluginsToConsider =
            replacedJarScopes.size > 0
              ? jarPlugins.filter((p) => !replacedJarScopes.has(p.scope))
              : jarPlugins;
          if (jarPluginsToConsider.length > 0) {
            if (jarPluginsToConsider.length < jarPlugins.length) {
              logger.info("PluginInitializer: Skipping JAR plugin(s) replaced by .local-plugins", {
                skipped: jarPlugins.length - jarPluginsToConsider.length,
                replacedScopes: [...replacedJarScopes],
              });
            }

            const loadBatch = async (
              entries: typeof jarPluginsToConsider,
              phase: 1 | 2,
            ) => {
              if (entries.length === 0) return;
              // Shared-runtime gate: refuse JAR plugins that target an
              // incompatible shared-dependency major (see sharedDepsGate).
              const loadable = entries.filter(passesSharedDependencyGate);
              if (loadable.length === 0) return;
              registerPluginLocales(loadable);
              logger.info(`PluginInitializer: Loading JAR plugin(s) from backend (phase ${phase})`, {
                count: loadable.length,
              });
              const results = await Promise.allSettled(
                loadable.map((jarPlugin) =>
                  loadAndRegister(jarPlugin.url, manager, {
                    ...(jarPlugin.cssUrl ? { cssUrl: jarPlugin.cssUrl } : {}),
                    skipUrlValidation: true,
                    skipPluginNames: disabledNames,
                  }),
                ),
              );
              results.forEach((result, index) => {
                const jarPlugin = loadable[index];
                if (!jarPlugin) return;
                if (result.status === "rejected") {
                  logger.error(
                    `PluginInitializer: Failed to load JAR plugin "${jarPlugin.name}" from ${jarPlugin.url}`,
                    result.reason instanceof Error
                      ? result.reason
                      : new Error(String(result.reason)),
                  );
                } else if (result.status === "fulfilled" && result.value.skipped && result.value.plugin) {
                  disabledByOverride.push(result.value.plugin);
                } else if (result.status === "fulfilled" && !result.value.success) {
                  logger.warn(
                    `PluginInitializer: JAR plugin "${jarPlugin.name}" failed to load`,
                    { error: result.value.error },
                  );
                }
              });
            };

            const enabled1 = getEnabledPluginNamespaces(config);
            const toLoad1 =
              enabled1.size === 0
                ? jarPluginsToConsider
                : jarPluginsToConsider.filter((entry) =>
                    matchesEnabledNamespace(entry, enabled1),
                  );
            await loadBatch(toLoad1, 1);

            const mergedJarConfig = getAppConfigSync(manager, config);
            const enabled2 = getEnabledPluginNamespaces(mergedJarConfig);
            const loadedUrls = new Set(toLoad1.map((entry) => entry.url));
            const toLoad2 = jarPluginsToConsider.filter(
              (entry) =>
                !loadedUrls.has(entry.url) && matchesEnabledNamespace(entry, enabled2),
            );
            await loadBatch(toLoad2, 2);
          }
        } catch (error) {
          logger.debug("PluginInitializer: JAR plugins not available or failed", {
            error: error instanceof Error ? error.message : String(error),
          });
        }

        // 8. Load .local-plugins/ from dev server manifest (dev only, no Marketplace required)
        // Two-phase load: first load entries matching current config (e.g. "config" namespace);
        // then re-merge config from manager (config plugin may have registered app:config with
        // more namespaces) and load remaining .local-plugins (e.g. org-a, org-b).
        try {
          const localManifest = await loadLocalPluginsManifest();
          if (localManifest.length === 0) {
            // skip
          } else {
            const loadBatch = async (entries: typeof localManifest) => {
              if (entries.length === 0) return;
              // Shared-runtime gate (mirrors the JAR + marketplace paths).
              const loadable = entries.filter(passesSharedDependencyGate);
              if (loadable.length === 0) return;
              const results = await Promise.allSettled(
                loadable.map((entry) =>
                  loadAndRegister(getLocalPluginFullUrl(entry), manager, {
                    ...(entry.cssUrl ? { cssUrl: entry.cssUrl } : {}),
                    skipUrlValidation: true,
                    skipPluginNames: disabledNames,
                  }),
                ),
              );
              results.forEach((result, index) => {
                const entry = loadable[index];
                if (!entry) return;
                if (result.status === "rejected") {
                  logger.error(
                    `PluginInitializer: Failed to load .local-plugins "${entry.name}" from ${entry.url}`,
                    result.reason instanceof Error
                      ? result.reason
                      : new Error(String(result.reason)),
                  );
                } else if (result.status === "fulfilled" && result.value.skipped && result.value.plugin) {
                  disabledByOverride.push(result.value.plugin);
                } else if (result.status === "fulfilled" && !result.value.success) {
                  // The plugin was fetched but loadAndRegister rejected it
                  // (e.g. no default export). Surface it — otherwise the
                  // plugin silently never registers and "why won't my plugin
                  // load?" is impossible to debug.
                  logger.warn(
                    `PluginInitializer: .local-plugins "${entry.name}" failed to load`,
                    { url: entry.url, error: result.value.error },
                  );
                }
              });
            };

            // Phase 1: load entries that match current config (e.g. .local-plugins/config/)
            const enabled1 = getEnabledPluginNamespaces(config);
            const toLoad1 =
              enabled1.size === 0
                ? localManifest
                : localManifest.filter((entry) => matchesEnabledNamespace(entry, enabled1));
            if (toLoad1.length > 0) {
              registerPluginLocales(toLoad1);
              logger.info("PluginInitializer: Loading .local-plugins (phase 1)", {
                count: toLoad1.length,
              });
              await loadBatch(toLoad1);
            }

            // Phase 2: re-merge config from manager (config plugin may have added namespaces),
            // then load remaining .local-plugins that now match (e.g. org-a, org-b) and types
            const mergedLocalConfig = getAppConfigSync(manager, config);
            const enabled2 = getEnabledPluginNamespaces(mergedLocalConfig);
            const loadedUrls = new Set(toLoad1.map((e) => e.url));
            const toLoad2 = localManifest.filter(
              (entry) =>
                !loadedUrls.has(entry.url) && matchesEnabledNamespace(entry, enabled2),
            );
            if (toLoad2.length > 0) {
              registerPluginLocales(toLoad2);
              logger.info("PluginInitializer: Loading .local-plugins (phase 2)", {
                count: toLoad2.length,
              });
              await loadBatch(toLoad2);
            }
          }
        } catch (error) {
          logger.debug("PluginInitializer: .local-plugins manifest not available or failed", {
            error: error instanceof Error ? error.message : String(error),
          });
        }

        // 9. Expose disabled plugins so the marketplace can still list them
        if (disabledByOverride.length > 0) {
          manager.addFunction("marketplace.getDisabledPlugins", () => disabledByOverride);
        }

        // 10. Mark plugins as ready in the manager
        manager.markPluginsAsReady();

        // 11. Update local state to render children
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
