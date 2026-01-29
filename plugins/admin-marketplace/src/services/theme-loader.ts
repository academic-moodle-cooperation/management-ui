/**
 * ThemeLoader Service
 *
 * Handles dynamic loading and application of CSS themes.
 * Supports temporary theme preview ("Try") and persistent theme installation ("Install").
 */

const STORAGE_KEY = "installed_theme_url";
const THEME_LINK_ID = "marketplace-dynamic-theme";
const ALLOWED_THEME_PREFIX = "/management-ui/plugins/themes/";

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
 * SECURITY NOTE: This service loads CSS from URLs. In production:
 * - Implement URL allowlisting to only allow trusted sources
 * - Use HTTPS-only URLs
 * - Validate CSS content if loading from untrusted sources
 * - Consider implementing CSP (Content Security Policy) headers
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
          // This is a relative URL - validate it starts with the expected prefix
          if (!parsedUrl.pathname.startsWith(ALLOWED_THEME_PREFIX)) {
            throw new Error(
              `Invalid theme path: ${parsedUrl.pathname}. Theme URLs must start with ${ALLOWED_THEME_PREFIX}`
            );
          }
        } else if (!["http:", "https:"].includes(parsedUrl.protocol)) {
          // This is an absolute URL - validate protocol
          throw new Error(`Invalid protocol: ${parsedUrl.protocol}. Only http: and https: are allowed.`);
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
          console.log(`Applied theme from ${url}`);
          // Ensure our theme stays at the end after it loads
          ensureThemeLinkIsLast();
          resolve();
        };

        // Add error handler for failed loads
        link.onerror = () => {
          const error = new Error(`Failed to load theme from ${url}`);
          console.error(error.message);
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
        console.error(`Failed to apply theme from ${url}:`, error);
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
      console.log("Removed active theme");
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
      console.log(`Persisted theme URL to localStorage: ${url}`);
    } catch (error) {
      console.error("Failed to persist theme to localStorage:", error);
      throw error;
    }
  },

  /**
   * Remove the persisted theme URL from localStorage
   */
  unpersist(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      console.log("Removed persisted theme from localStorage");
    } catch (error) {
      console.error("Failed to remove persisted theme from localStorage:", error);
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
      console.error("Failed to get installed theme from localStorage:", error);
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
      console.log(`Loading installed theme from localStorage: ${installedUrl}`);
      try {
        // Small delay to ensure config-based themes (from main.tsx) load first
        // This ensures marketplace themes override config themes
        await new Promise((resolve) => setTimeout(resolve, 100));
        await this.apply(installedUrl);

        // Additional delay to catch any late-loading stylesheets, then re-position
        await new Promise((resolve) => setTimeout(resolve, 200));
        ensureThemeLinkIsLast();
      } catch (error) {
        console.error("Failed to load installed theme:", error);
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
