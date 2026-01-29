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

    // Construct URL to plugins.json endpoint
    const pluginsJsonUrl = isDev
      ? `${baseUrl.replace(/\/$/, "")}/management-tool/ui/config/plugins.json`
      : `${productionAppPluginUrl?.replace(/\/$/, "") || baseUrl}/management-tool/ui/config/plugins.json`;

    const response = await fetch(pluginsJsonUrl);
    if (!response.ok) {
      // Silently fail - backend might not be available or no JAR plugins deployed
      return [];
    }

    const data = (await response.json()) as PluginsJsonResponse;
    if (!data.plugins || !Array.isArray(data.plugins)) {
      return [];
    }

    // Convert backend plugin config to JarPluginInfo
    // The plugin .mjs file is typically at {path}/{plugin-name}.mjs
    return data.plugins.map((plugin) => {
      // Derive plugin filename from name (e.g., "quiz-plugin-backend" -> "quiz-plugin.mjs")
      // Or use a convention: if path ends with plugin name, use that
      const pathParts = plugin.path.split("/").filter(Boolean);
      const pluginDir = pathParts[pathParts.length - 1] || plugin.name.replace(/^.*-/, "");
      const pluginFile = `${pluginDir}.mjs`;

      // Construct full URL to the plugin module
      const base = baseUrl.replace(/\/$/, "");
      const url = `${base}${plugin.path}/${pluginFile}`;

      return {
        name: plugin.name,
        path: plugin.path,
        scope: plugin.scope,
        url,
      };
    });
  } catch (error) {
    // Silently fail - backend might not be available
    console.warn("Failed to load JAR plugins from backend:", error);
    return [];
  }
}
