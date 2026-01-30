/**
 * JAR Plugin Loader
 *
 * Loads plugins that are deployed as OSGi JAR bundles and exposed via
 * the backend's `/management-tool/ui/config/plugins.json` endpoint.
 *
 * These plugins are served as static files via Http-Alias/Http-Classpath
 * and can be loaded like any other remote plugin.
 */

export interface JarPluginInfo {
  /** Plugin name (from backend) */
  name: string;
  /** Path where the plugin is served (e.g., /static/plugins/quiz) */
  path: string;
  /** Module scope (for SystemJS compatibility, if used) */
  scope: string;
  /** URL to the plugin .mjs file (derived from path) */
  url: string;
}

interface PluginsJsonResponse {
  plugins: Array<{
    name: string;
    path: string;
    scope: string;
  }>;
}

/**
 * Fetch plugins from the backend's plugins.json endpoint
 */
export async function loadJarPlugins(): Promise<JarPluginInfo[]> {
  try {
    const baseUrl = import.meta.env.BASE_URL || "/";
    const isDev = import.meta.env.DEV;
    const appConfig = await import("@workspace/query").then((m) =>
      m.getCachedAppConfig(),
    );
    const productionAppPluginUrl = appConfig?.productionAppPluginUrl;
    const pluginsJsonPath = "/management-tool/ui/config/plugins.json";

    // Construct URL to plugins.json endpoint.
    // productionAppPluginUrl is the plugins.json path or full URL; do not append the path again.
    const pluginsJsonUrl = isDev
      ? `${baseUrl.replace(/\/$/, "")}${pluginsJsonPath}`
      : (productionAppPluginUrl?.includes("plugins.json")
          ? productionAppPluginUrl.replace(/\/$/, "")
          : `${(productionAppPluginUrl || baseUrl).replace(/\/$/, "")}${pluginsJsonPath}`);

    const response = await fetch(pluginsJsonUrl);
    if (!response.ok) {
      // Silently fail - backend might not be available or no JAR plugins deployed
      return [];
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      // Backend returned HTML (e.g. SPA fallback) or other non-JSON
      return [];
    }

    let data: PluginsJsonResponse;
    try {
      data = (await response.json()) as PluginsJsonResponse;
    } catch {
      return [];
    }
    if (!data.plugins || !Array.isArray(data.plugins)) {
      return [];
    }

    const base = baseUrl.replace(/\/$/, "");

    // Convert backend plugin config to JarPluginInfo
    // The plugin .mjs file is typically at {path}/{plugin-name}.mjs
    const list = data.plugins.map((plugin) => {
      const pathParts = plugin.path.split("/").filter(Boolean);
      const pluginDir = pathParts[pathParts.length - 1] || plugin.name.replace(/^.*-/, "");
      const pluginFile = `${pluginDir}.mjs`;
      const url = `${base}${plugin.path}/${pluginFile}`;
      return {
        name: plugin.name,
        path: plugin.path,
        scope: plugin.scope,
        url,
      };
    });

    // If running without backend (e.g. pnpm preview), plugin URLs return HTML (404/SPA fallback).
    // Check the first plugin URL: if it returns HTML, skip all JAR plugins to avoid "Unexpected token '<'" errors.
    if (list.length > 0) {
      try {
        const probe = await fetch(list[0].url, { method: "GET", cache: "no-store" });
        const contentType = probe.headers.get("content-type") ?? "";
        if (!probe.ok || contentType.includes("text/html")) {
          return [];
        }
      } catch {
        return [];
      }
    }

    return list;
  } catch (error) {
    // Silently fail - backend might not be available
    console.warn("Failed to load JAR plugins from backend:", error);
    return [];
  }
}
