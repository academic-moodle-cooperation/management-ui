/**
 * JAR Plugin Loader (simplified, server-driven list)
 *
 * Fetches the plugin list from the backend's plugins.json (path from config).
 * Builds plugin script URLs using the app base from config (config.api.baseUrl)
 * so the same deployed config drives both the UI and plugin URLs — no extra
 * config fetch and no dependence on build-time BASE_URL.
 *
 * Plugins are served as static files via Http-Alias/Http-Classpath; each
 * plugin is loaded individually (failed loads don't block others).
 */

import { getCachedAppConfig } from "@workspace/query";
import type { AppConfig } from "@workspace/ui-config";

export interface JarPluginInfo {
  /** Plugin name (from backend) */
  name: string;
  /** Path where the plugin is served (e.g. /static/plugins/univie) */
  path: string;
  /** Module scope (for SystemJS compatibility, if used) */
  scope: string;
  /** URL to the plugin .mjs file */
  url: string;
  /** Optional base URL for plugin locales */
  localesUrl?: string;
  /** Optional i18n namespaces served from localesUrl */
  i18nNamespaces?: string[];
}

interface PluginsJsonResponse {
  plugins: Array<{
    name: string;
    path: string;
    scope: string;
    scriptUrl?: string;
    localesUrl?: string;
    i18nNamespaces?: string[];
  }>;
}

const PLUGINS_JSON_PATH = "/management-tool/ui/config/plugins.json";

/**
 * App base path for plugin static URLs (no trailing slash).
 * Prefer config.api.baseUrl so deployed config drives the path.
 */
function getAppBase(config?: AppConfig | null): string {
  const raw =
    config?.api?.baseUrl ??
    (typeof import.meta !== "undefined" && import.meta.env?.BASE_URL) ??
    "/";
  const base = typeof raw === "string" ? raw : "/";
  return base.replace(/\/$/, "");
}

/**
 * URL for plugins.json. Prefer config.productionAppPluginUrl when it points at plugins.json.
 */
function getPluginsJsonUrl(config?: AppConfig | null): string {
  const productionUrl = config?.productionAppPluginUrl;
  if (productionUrl?.includes("plugins.json")) {
    return productionUrl.replace(/\/$/, "");
  }
  const base = getAppBase(config);
  return `${base}${PLUGINS_JSON_PATH}`;
}

/**
 * Fetch the JAR plugin list from the backend and build script URLs.
 *
 * @param config - Merged app config (from PluginInitializer). Used for
 *   productionAppPluginUrl and api.baseUrl so the same config drives plugin list
 *   and URLs. If omitted, falls back to getCachedAppConfig() and build-time base.
 */
export async function loadJarPlugins(config?: AppConfig | null): Promise<JarPluginInfo[]> {
  try {
    let effectiveConfig = config;
    if (effectiveConfig == null && typeof window !== "undefined") {
      try {
        effectiveConfig = await getCachedAppConfig();
      } catch {
        // ignore
      }
    }

    const pluginsJsonUrl = getPluginsJsonUrl(effectiveConfig);
    const response = await fetch(pluginsJsonUrl);
    if (!response.ok) return [];
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) return [];

    let data: PluginsJsonResponse;
    try {
      data = (await response.json()) as PluginsJsonResponse;
    } catch {
      return [];
    }
    if (!data.plugins || !Array.isArray(data.plugins)) return [];

    const base = getAppBase(effectiveConfig);

    return data.plugins.map((plugin) => {
      const pathParts = plugin.path.split("/").filter(Boolean);
      const pluginDir = pathParts[pathParts.length - 1] || plugin.name.replace(/^.*-/, "");
      const pluginFile = `${pluginDir}.mjs`;
      const url = plugin.scriptUrl?.length ? plugin.scriptUrl : `${base}${plugin.path}/${pluginFile}`;
      return {
        name: plugin.name,
        path: plugin.path,
        scope: plugin.scope,
        url,
        ...(plugin.localesUrl ? { localesUrl: plugin.localesUrl } : {}),
        ...(Array.isArray(plugin.i18nNamespaces) && plugin.i18nNamespaces.length > 0
          ? { i18nNamespaces: plugin.i18nNamespaces }
          : {}),
      };
    });
  } catch (error) {
    if (typeof console !== "undefined") {
      console.warn("Failed to load JAR plugins from backend:", error);
    }
    return [];
  }
}
