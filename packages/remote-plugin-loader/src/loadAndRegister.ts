/**
 * Load a remote ES module by URL and register it with the PluginManager.
 *
 * Fetches the module, transforms bare imports to use window.__SHARED_MODULES__,
 * imports via blob URL, injects CSS if present, registers GraphQL fragments, and
 * registers the plugin. Used by the core for JAR plugins and by the marketplace
 * for registry/local plugins (caller must validate URL and version when required).
 */

import {
  fragmentRegistry,
  type Plugin,
  type PluginManager,
  type RegisteredFragment,
} from "@workspace/plugin-system";
import { logger } from "@workspace/utils";

import { transformModuleSource } from "./transform";

const remoteLoaderLogger = logger.child({ component: "RemotePluginLoader" });

/** Options for loadAndRegister. */
export interface LoadOptions {
  /** When true, bypass HTTP and module cache (e.g. for dev). */
  forceReload?: boolean;
  /** Optional explicit CSS URL when the stylesheet name does not match the module name. */
  cssUrl?: string;
  /**
   * When true, caller has already validated the URL (e.g. core for JAR URLs).
   * The package does not perform URL validation; this is for API clarity.
   */
  skipUrlValidation?: boolean;
}

/** Result of loading a plugin. */
export interface LoadResult {
  success: boolean;
  pluginId?: string;
  error?: string;
  warnings: string[];
}

/** Loaded module shape: default plugin and optional injected fragments. */
interface LoadedModule {
  default: Plugin;
  __injected_fragments__?: Array<Omit<RegisteredFragment, "pluginId">>;
}

/**
 * Load an ES module from a URL with import transformation.
 */
async function loadWithTransformation(
  url: string,
  forceReload: boolean,
): Promise<LoadedModule> {
  const sharedModules = (window as unknown as { __SHARED_MODULES__?: Record<string, unknown> })
    .__SHARED_MODULES__;
  if (!sharedModules) {
    remoteLoaderLogger.error(
      "window.__SHARED_MODULES__ is not available. Call exposeSharedModules() in the host app.",
    );
    throw new Error(
      "Shared modules not available. The host app must call exposeSharedModules() first.",
    );
  }

  const isDev =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

  let response: Response;
  try {
    if (forceReload || isDev) {
      const cacheBustUrl = url.includes("?") ? `${url}&_t=${Date.now()}` : `${url}?_t=${Date.now()}`;
      response = await fetch(cacheBustUrl, { cache: "no-store" });
    } else {
      response = await fetch(url, { cache: "default" });
    }
  } catch (error) {
    remoteLoaderLogger.error("Fetch error", error instanceof Error ? error : new Error(String(error)));
    try {
      response = await fetch(url);
    } catch (retryError) {
      throw new Error(
        `Failed to fetch plugin: ${retryError instanceof Error ? retryError.message : String(retryError)}`,
      );
    }
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch plugin: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("text/html")) {
    throw new Error(
      "Plugin URL returned HTML (404 or SPA fallback). Ensure the plugin .mjs is served at this path.",
    );
  }

  const source = await response.text();
  const transformed = transformModuleSource(source, url);

  const isDevForBlob =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
  const uniqueMarker =
    forceReload || isDevForBlob
      ? `\n// Module loaded at ${Date.now()}-${Math.random().toString(36).slice(7)}\n`
      : `\n// Module version: ${url}\n`;
  const blob = new Blob([transformed + uniqueMarker], { type: "application/javascript" });
  const blobUrl = URL.createObjectURL(blob);

  try {
    const module = await import(/* @vite-ignore */ blobUrl);
    return module as LoadedModule;
  } catch (error) {
    remoteLoaderLogger.error("Import failed", error instanceof Error ? error : new Error(String(error)));
    throw error;
  } finally {
    setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
  }
}

/**
 * Load a remote plugin by URL and register it with the manager.
 *
 * Caller is responsible for URL validation and version checks when required
 * (e.g. marketplace validates registry/local URLs before calling).
 *
 * @param url - URL to the plugin .mjs file
 * @param manager - PluginManager to register the plugin with
 * @param options - Optional forceReload and skipUrlValidation (validation is caller's responsibility)
 * @returns LoadResult with success status and any errors/warnings
 */
export async function loadAndRegister(
  url: string,
  manager: PluginManager,
  options?: LoadOptions,
): Promise<LoadResult> {
  const warnings: string[] = [];
  const forceReload = options?.forceReload ?? false;

  try {
    remoteLoaderLogger.debug(`Loading plugin from ${url}`, { forceReload });
    const module = await loadWithTransformation(url, forceReload);

    const remotePlugin: Plugin = module.default;
    if (!remotePlugin || typeof remotePlugin.initialize !== "function") {
      return {
        success: false,
        error:
          "Invalid plugin format: must export a default plugin object with initialize method",
        warnings,
      };
    }

    const fragments = module.__injected_fragments__;
    if (fragments && Array.isArray(fragments) && fragments.length > 0) {
      remoteLoaderLogger.debug(`Registering ${fragments.length} GraphQL fragment(s) from plugin`);
      fragmentRegistry.registerAll(fragments, remotePlugin.name);
    }

    try {
      const cssPath = options?.cssUrl ?? url.replace(/\.mjs$/, ".css");
      if (cssPath !== url) {
        const baseUrl =
          typeof window !== "undefined"
            ? new URL(url, window.location.href).href
            : url;
        const cssUrl = new URL(cssPath, baseUrl).href;
        const linkId = `plugin-css-${remotePlugin.name.replace(/[^a-z0-9]/gi, "-")}`;
        const existingLink = document.getElementById(linkId);
        if (existingLink) existingLink.remove();
        const link = document.createElement("link");
        link.id = linkId;
        link.rel = "stylesheet";
        link.href = cssUrl;
        link.onerror = () =>
          remoteLoaderLogger.warn(`Failed to load CSS for plugin "${remotePlugin.name}" from ${cssUrl}`);
        link.onload = () =>
          remoteLoaderLogger.debug(`Loaded CSS for plugin "${remotePlugin.name}" from ${cssUrl}`);
        document.head.appendChild(link);
      }
    } catch (cssError) {
      const err = cssError instanceof Error ? cssError : new Error(String(cssError));
      remoteLoaderLogger.debug(`CSS not available for plugin "${remotePlugin.name}": ${err.message}`);
    }

    manager.register(remotePlugin);
    remoteLoaderLogger.info(`Successfully loaded plugin "${remotePlugin.name}"`, {
      url,
      pluginId: remotePlugin.name,
    });

    return { success: true, pluginId: remotePlugin.name, warnings };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    remoteLoaderLogger.error(`Failed to load plugin from ${url}`, error instanceof Error ? error : new Error(errorMessage), { url });

    let helpfulError = errorMessage;
    if (errorMessage.includes("Failed to resolve module specifier")) {
      const moduleMatch = errorMessage.match(/module specifier "([^"]+)"/);
      if (moduleMatch?.[1]) {
        const moduleName = moduleMatch[1];
        const available = [
          "react",
          "react-dom",
          "react/jsx-runtime",
          "lucide-react",
          "@workspace/plugin-system",
          "@workspace/ui/components",
          "@workspace/ui/components/icons",
          "@workspace/ui/lib",
          "@workspace/ui/lib/utils",
          "@workspace/query",
          "@workspace/router",
          "@workspace/utils",
          "@workspace/i18n",
        ];
        if (!available.some((m) => moduleName === m || moduleName.startsWith(m + "/"))) {
          helpfulError = `Module "${moduleName}" is not available. Available: ${available.join(", ")}. Add it to your plugin's dependencies to bundle it.`;
        } else {
          helpfulError = `Module "${moduleName}" should be available. Restart the Management UI after updates.`;
        }
      }
    }

    return {
      success: false,
      error: `Failed to load plugin: ${helpfulError}`,
      warnings,
    };
  }
}

/**
 * Check if a URL is same-origin (for JAR/backend-derived URLs).
 * Can be used by the core when skipUrlValidation is true to ensure URLs are trusted.
 */
export function isSameOriginUrl(url: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const parsed = new URL(url, window.location.href);
    return parsed.origin === window.location.origin;
  } catch {
    return false;
  }
}
