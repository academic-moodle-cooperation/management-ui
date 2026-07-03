/**
 * Security Service for Community Plugins
 *
 * Provides URL allowlisting, version compatibility checks, and other
 * security features for loading remote plugins safely.
 *
 * Security Features:
 * - URL domain allowlist (configurable)
 * - HTTPS enforcement in production
 * - Version constraint validation
 * - Plugin metadata validation
 */

import { checkSharedDependencyCompatibility } from "@oc-mui/plugin-system";

/**
 * Plugin metadata for version compatibility checking
 */
export interface PluginVersionConstraints {
  /** Minimum required version of @oc-mui/plugin-system */
  "@oc-mui/plugin-system"?: string;
  /** Minimum required version of @oc-mui/ui */
  "@oc-mui/ui"?: string;
  /** Minimum required version of @oc-mui/query */
  "@oc-mui/query"?: string;
  /** Other workspace packages */
  [key: string]: string | undefined;
}

/**
 * Result of a security validation
 */
export interface SecurityValidationResult {
  /** Whether the validation passed */
  valid: boolean;
  /** Error message if validation failed */
  error?: string;
  /** Warnings that don't block loading */
  warnings: string[];
}

/**
 * Configuration for the security service
 */
export interface SecurityConfig {
  /**
   * Whether loading and executing remote plugin code is permitted at all.
   * Off by default — a deployment must opt in via
   * `plugins.admin-marketplace.remotePlugins.enabled` in config.json. When
   * false, every remote plugin load (community, developer URL, and the
   * boot-time auto-load of persisted plugins) is refused.
   */
  remotePluginsEnabled: boolean;
  /** List of allowed domains (hostname only, no protocol) */
  allowedDomains: string[];
  /** Whether to enforce HTTPS in production */
  enforceHttpsInProduction: boolean;
  /** Whether to allow localhost in development */
  allowLocalhostInDev: boolean;
  /** Current core version for compatibility checks */
  coreVersion: string;
}

/**
 * Default allowed domains for community plugins. Exported so the plugin's
 * config slice can seed the same defaults a deployment may override.
 */
export const DEFAULT_ALLOWED_DOMAINS = [
  // jsDelivr CDN - primary hosting for community plugins
  "cdn.jsdelivr.net",
  // GitHub raw content (for development/testing)
  "raw.githubusercontent.com",
  // GitHub Pages
  "github.io",
];

/**
 * Development-only domains
 */
const DEV_ONLY_DOMAINS = [
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
];

/**
 * Default security configuration
 */
const DEFAULT_CONFIG: SecurityConfig = {
  remotePluginsEnabled: false,
  allowedDomains: DEFAULT_ALLOWED_DOMAINS,
  enforceHttpsInProduction: true,
  allowLocalhostInDev: true,
  coreVersion: "1.0.0",
};

/**
 * Security Service class
 */
class SecurityService {
  private config: SecurityConfig;

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Check if running in development mode
   */
  private isDevelopment(): boolean {
    // Check various ways to detect dev mode
    if (typeof import.meta !== "undefined" && import.meta.env) {
      return import.meta.env.DEV === true || import.meta.env.MODE === "development";
    }
    if (typeof process !== "undefined" && process.env) {
      return process.env["NODE_ENV"] === "development";
    }
    // Default to false (production) for safety
    return false;
  }

  /**
   * Get all currently allowed domains (including dev-only if applicable)
   */
  getAllowedDomains(): string[] {
    const domains = [...this.config.allowedDomains];

    if (this.isDevelopment() && this.config.allowLocalhostInDev) {
      domains.push(...DEV_ONLY_DOMAINS);
    }

    return domains;
  }

  /**
   * Check if a URL's domain is allowed
   *
   * @param url - The URL to check
   * @returns true if the domain is allowed
   */
  isUrlAllowed(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      const hostname = parsedUrl.hostname;
      const allowedDomains = this.getAllowedDomains();

      // Check exact match or subdomain match
      return allowedDomains.some((domain) => {
        // Exact match
        if (hostname === domain) return true;
        // Subdomain match (e.g., "sub.example.com" matches "example.com")
        if (hostname.endsWith(`.${domain}`)) return true;
        return false;
      });
    } catch {
      return false;
    }
  }

  /**
   * Validate a plugin URL for security
   *
   * @param url - The URL to validate
   * @returns Validation result with errors and warnings
   */
  validateUrl(url: string): SecurityValidationResult {
    const warnings: string[] = [];

    // Parse URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return {
        valid: false,
        error: `Invalid URL format: ${url}`,
        warnings,
      };
    }

    // Check protocol
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return {
        valid: false,
        error: `Invalid protocol "${parsedUrl.protocol}". Only http: and https: are allowed.`,
        warnings,
      };
    }

    // Enforce HTTPS in production
    if (
      !this.isDevelopment() &&
      this.config.enforceHttpsInProduction &&
      parsedUrl.protocol === "http:"
    ) {
      // Allow plaintext HTTP only for localhost hosts AND only in development.
      // In a production build even localhost must use HTTPS, so a process bound
      // to localhost can't serve plaintext plugin code past this gate.
      if (!(this.isDevelopment() && DEV_ONLY_DOMAINS.includes(parsedUrl.hostname))) {
        return {
          valid: false,
          error: "HTTPS is required in production. HTTP URLs are not allowed.",
          warnings,
        };
      }
    }

    // Check domain allowlist
    if (!this.isUrlAllowed(url)) {
      return {
        valid: false,
        error: `Domain "${parsedUrl.hostname}" is not in the allowed list. Allowed domains: ${this.getAllowedDomains().join(", ")}`,
        warnings,
      };
    }

    // Warn about HTTP in development
    if (this.isDevelopment() && parsedUrl.protocol === "http:") {
      warnings.push("Using HTTP in development. Remember to use HTTPS for production deployments.");
    }

    // Warn about localhost
    if (DEV_ONLY_DOMAINS.includes(parsedUrl.hostname)) {
      warnings.push(
        `Loading from "${parsedUrl.hostname}" which is only allowed in development mode.`,
      );
    }

    return {
      valid: true,
      warnings,
    };
  }

  /**
   * Check whether a plugin's declared `workspaceDependencies` are compatible
   * with the host's shared runtime majors.
   *
   * Delegates to {@link checkSharedDependencyCompatibility} — the single source
   * of truth in `@oc-mui/plugin-system`, shared with the JAR and .local-plugins
   * loaders — and adapts its result to {@link SecurityValidationResult}: a major
   * mismatch (or an unparseable range) blocks (`valid: false`); deps the host
   * doesn't provide are reported as non-blocking warnings.
   *
   * @param pluginConstraints - Version constraints from the plugin manifest.
   * @returns Validation result.
   */
  checkVersionCompatibility(
    pluginConstraints: PluginVersionConstraints,
  ): SecurityValidationResult {
    // Drop undefined-valued entries before the canonical check, which treats a
    // non-string range as an unparseable (blocking) declaration.
    const declared: Record<string, string> = {};
    for (const [name, range] of Object.entries(pluginConstraints ?? {})) {
      if (typeof range === "string") declared[name] = range;
    }

    const result = checkSharedDependencyCompatibility(declared);

    const warnings: string[] = [];
    if (result.unknown?.length) {
      warnings.push(
        `Cannot verify compatibility for ${result.unknown.join(", ")}: not part of the host's shared runtime.`,
      );
    }

    if (!result.compatible) {
      return {
        valid: false,
        error: (result.incompatibilities ?? []).map((i) => i.reason).join(" "),
        warnings,
      };
    }

    return { valid: true, warnings };
  }

  /**
   * Add a domain to the allowlist
   *
   * @param domain - Domain to add
   */
  addAllowedDomain(domain: string): void {
    if (!this.config.allowedDomains.includes(domain)) {
      this.config.allowedDomains.push(domain);
    }
  }

  /**
   * Remove a domain from the allowlist
   *
   * @param domain - Domain to remove
   */
  removeAllowedDomain(domain: string): void {
    this.config.allowedDomains = this.config.allowedDomains.filter((d) => d !== domain);
  }

  /**
   * Update the security configuration
   *
   * @param config - Partial configuration to merge
   */
  updateConfig(config: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get the current configuration (read-only)
   */
  getConfig(): Readonly<SecurityConfig> {
    return { ...this.config };
  }

  /**
   * Whether remote plugin loading is currently permitted. Off unless a
   * deployment opts in (see {@link SecurityConfig.remotePluginsEnabled}). The
   * marketplace's loader checks this before fetching or executing any remote
   * plugin, so the whole feature is fail-closed by default.
   */
  isRemotePluginsEnabled(): boolean {
    return this.config.remotePluginsEnabled;
  }
}

/**
 * Singleton instance of the Security Service
 */
export const securityService = new SecurityService();

/**
 * Export the class for creating custom instances
 */
export { SecurityService };

/**
 * Convenience function to validate a URL
 */
export function isUrlAllowed(url: string): boolean {
  return securityService.isUrlAllowed(url);
}

/**
 * Convenience function to validate a URL with full details
 */
export function validatePluginUrl(url: string): SecurityValidationResult {
  return securityService.validateUrl(url);
}

export default securityService;
