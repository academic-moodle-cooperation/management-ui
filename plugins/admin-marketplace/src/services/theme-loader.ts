/**
 * ThemeLoader Service
 *
 * Handles dynamic loading and application of CSS themes.
 * Supports temporary theme preview ("Try") and persistent theme installation ("Install").
 */

import { logger } from "@oc-mui/utils";

import { isUrlAllowed } from "./security";

const log = logger.child({ component: "ThemeLoader" });

const STORAGE_KEY = "installed_theme_url";
const THEME_LINK_ID = "marketplace-dynamic-theme";
const ALLOWED_THEME_PREFIX = "/management-ui/plugins/themes/";
/** JAR plugin themes are served at /management-ui/static/plugins/<name>/<name>.css */
const ALLOWED_JAR_THEME_PREFIX = "/management-ui/static/plugins/";
/** Local dev themes from .local-plugins/<name>/themes/<name>.css */
const ALLOWED_LOCAL_PLUGINS_PREFIX = "/management-ui/local-plugins/";
const ALLOWED_LOCAL_PLUGINS_PREFIX_NO_BASE = "/local-plugins/";

/**
 * Ensure the marketplace theme link stays at the end of all stylesheets
 * This maintains CSS cascade priority (last loaded wins)
 */
const ensureThemeLinkIsLast = (): void => {
  const themeLink = document.getElementById(THEME_LINK_ID);
  if (!themeLink) return;

  const allStylesheets = Array.from(document.head.querySelectorAll('link[rel="stylesheet"]'));
  if (allStylesheets.length <= 1) return; // Only our theme or no stylesheets

  const lastStylesheet = allStylesheets[allStylesheets.length - 1];
  if (lastStylesheet && lastStylesheet !== themeLink) {
    // Move our theme link to the end
    themeLink.remove();
    lastStylesheet.insertAdjacentElement('afterend', themeLink);
  }
};

/**
 * ThemeLoader Service
 *
 * Manages dynamic theme loading, application, and persistence.
 * 
 * SECURITY: This service loads CSS from URLs. Relative URLs are restricted to
 * known theme path prefixes; absolute URLs are protocol-checked and run through
 * the marketplace domain allowlist (see ./security), matching the plugin loader.
 */
export const ThemeLoader = {
  /**
   * Apply a theme by injecting a <link> element into the DOM
   * Replaces any previously applied theme
   * 
   * @param url - URL to the CSS file
   * @returns Promise that resolves when theme loads successfully, rejects on error
   * @throws Error if URL is invalid or has unsupported protocol
   */
  async apply(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Determine if this is a relative or absolute URL
        const isRelative = url.startsWith("/") || !url.includes("://");

        // Basic URL validation - check for valid protocol
        const parsedUrl = new URL(url, window.location.origin);

        // Security: Validate relative URLs to prevent directory traversal
        if (isRelative) {
          const pathname = parsedUrl.pathname;
          const allowed =
            pathname.startsWith(ALLOWED_THEME_PREFIX) ||
            pathname.startsWith(ALLOWED_JAR_THEME_PREFIX) ||
            pathname.startsWith(ALLOWED_LOCAL_PLUGINS_PREFIX) ||
            pathname.startsWith(ALLOWED_LOCAL_PLUGINS_PREFIX_NO_BASE);
          if (!allowed) {
            throw new Error(
              `Invalid theme path: ${pathname}. Theme URLs must start with ${ALLOWED_THEME_PREFIX}, ${ALLOWED_JAR_THEME_PREFIX}, or local-plugins path`
            );
          }
        } else {
          // Absolute URL — enforce protocol AND the shared domain allowlist
          // (parity with remote plugin loading; see ./security).
          if (!["http:", "https:"].includes(parsedUrl.protocol)) {
            throw new Error(`Invalid protocol: ${parsedUrl.protocol}. Only http: and https: are allowed.`);
          }
          if (!isUrlAllowed(parsedUrl.href)) {
            throw new Error(`Theme domain "${parsedUrl.hostname}" is not in the allowed list.`);
          }
        }

        // Remove existing theme link if present
        const existingLink = document.getElementById(THEME_LINK_ID);
        if (existingLink) {
          existingLink.remove();
        }

        // Create and inject new theme link
        const link = document.createElement("link");
        link.id = THEME_LINK_ID;
        link.rel = "stylesheet";
        link.href = parsedUrl.href;

        // Add success handler
        link.onload = () => {
          log.debug(`applied theme from ${url}`);
          // Ensure our theme stays at the end after it loads
          ensureThemeLinkIsLast();
          resolve();
        };

        // Add error handler for failed loads
        link.onerror = () => {
          const error = new Error(`Failed to load theme from ${url}`);
          log.error(error.message, error);
          // Remove the failed link element
          link.remove();
          reject(error);
        };

        // Append to document head AFTER all existing stylesheets to ensure it has highest priority
        // This ensures marketplace themes override config-based themes
        const existingStylesheets = document.head.querySelectorAll('link[rel="stylesheet"]');
        if (existingStylesheets.length > 0) {
          // Insert after the last stylesheet
          const lastStylesheet = existingStylesheets[existingStylesheets.length - 1];
          if (lastStylesheet) {
            lastStylesheet.insertAdjacentElement('afterend', link);
          } else {
            document.head.appendChild(link);
          }
        } else {
          // No stylesheets yet, just append to head
          document.head.appendChild(link);
        }
      } catch (error) {
        log.error(`failed to apply theme from ${url}`, error instanceof Error ? error : new Error(String(error)));
        reject(error);
      }
    });
  },

  /**
   * Remove the currently applied theme
   */
  remove(): void {
    const existingLink = document.getElementById(THEME_LINK_ID);
    if (existingLink) {
      existingLink.remove();
      log.debug("removed active theme");
    }
  },

  /**
   * Persist a theme URL to localStorage for automatic loading on next page load
   * 
   * @param url - URL to persist
   */
  persist(url: string): void {
    try {
      localStorage.setItem(STORAGE_KEY, url);
      log.debug(`persisted theme URL: ${url}`);
    } catch (error) {
      log.error("failed to persist theme", error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  },

  /**
   * Remove the persisted theme URL from localStorage
   */
  unpersist(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      log.debug("removed persisted theme");
    } catch (error) {
      log.error("failed to remove persisted theme", error instanceof Error ? error : new Error(String(error)));
    }
  },

  /**
   * Get the installed theme URL from localStorage
   * 
   * @returns The installed theme URL, or null if none is installed
   */
  getInstalledUrl(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      log.error("failed to read installed theme", error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  },

  /**
   * Check if a specific theme URL is currently installed
   * 
   * @param url - URL to check
   * @returns true if the theme is installed, false otherwise
   */
  isInstalled(url: string): boolean {
    return this.getInstalledUrl() === url;
  },

  /**
   * Initialize theme loading on application startup
   * Loads and applies the installed theme if one exists
   * Uses a small delay to ensure it loads after config-based themes
   */
  async initialize(): Promise<void> {
    const installedUrl = this.getInstalledUrl();
    if (installedUrl) {
      log.debug(`loading installed theme: ${installedUrl}`);
      try {
        // Small delay to ensure config-based themes (from main.tsx) load first
        // This ensures marketplace themes override config themes
        await new Promise((resolve) => setTimeout(resolve, 100));
        await this.apply(installedUrl);

        // Additional delay to catch any late-loading stylesheets, then re-position
        await new Promise((resolve) => setTimeout(resolve, 200));
        ensureThemeLinkIsLast();
      } catch (error) {
        log.error("failed to load installed theme", error instanceof Error ? error : new Error(String(error)));
        // Clear the corrupted/invalid theme URL
        this.unpersist();
      }
    }
  },

  /**
   * Try a theme temporarily without persisting it
   * This is useful for previewing themes before installation
   * 
   * @param url - URL to the CSS file
   * @returns Promise that resolves when theme loads successfully
   */
  async tryTheme(url: string): Promise<void> {
    return this.apply(url);
  },

  /**
   * Install a theme - apply it and persist for future page loads
   * 
   * @param url - URL to the CSS file
   * @returns Promise that resolves when theme loads successfully
   */
  async installTheme(url: string): Promise<void> {
    await this.apply(url);
    this.persist(url);
  },

  /**
   * Uninstall the current theme - remove from DOM and localStorage
   */
  uninstallTheme(): void {
    this.remove();
    this.unpersist();
  },
};
