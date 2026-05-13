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
 * Default allowed domains for community plugins
 */
const DEFAULT_ALLOWED_DOMAINS = [
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
      // Allow localhost even in production for edge cases
      if (!DEV_ONLY_DOMAINS.includes(parsedUrl.hostname)) {
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
   * Parse a semver version string into components
   * Simple implementation - for production, consider using a proper semver library
   */
  private parseSemver(version: string): { major: number; minor: number; patch: number } | null {
    // Remove 'v' prefix if present
    const cleanVersion = version.replace(/^v/, "");
    const match = cleanVersion.match(/^(\d+)\.(\d+)\.(\d+)/);

    if (!match || !match[1] || !match[2] || !match[3]) return null;

    return {
      major: parseInt(match[1], 10),
      minor: parseInt(match[2], 10),
      patch: parseInt(match[3], 10),
    };
  }

  /**
   * Check if a version satisfies a constraint
   * Supports: ">=X.Y.Z", "^X.Y.Z", "~X.Y.Z", "X.Y.Z"
   */
  private satisfiesConstraint(version: string, constraint: string): boolean {
    const parsed = this.parseSemver(version);
    if (!parsed) return false;

    // Handle >= constraint
    if (constraint.startsWith(">=")) {
      const constraintParsed = this.parseSemver(constraint.substring(2));
      if (!constraintParsed) return false;

      if (parsed.major > constraintParsed.major) return true;
      if (parsed.major < constraintParsed.major) return false;
      if (parsed.minor > constraintParsed.minor) return true;
      if (parsed.minor < constraintParsed.minor) return false;
      return parsed.patch >= constraintParsed.patch;
    }

    // Handle ^ constraint (compatible with major version)
    if (constraint.startsWith("^")) {
      const constraintParsed = this.parseSemver(constraint.substring(1));
      if (!constraintParsed) return false;

      if (parsed.major !== constraintParsed.major) return false;
      if (parsed.minor > constraintParsed.minor) return true;
      if (parsed.minor < constraintParsed.minor) return false;
      return parsed.patch >= constraintParsed.patch;
    }

    // Handle ~ constraint (compatible with minor version)
    if (constraint.startsWith("~")) {
      const constraintParsed = this.parseSemver(constraint.substring(1));
      if (!constraintParsed) return false;

      if (parsed.major !== constraintParsed.major) return false;
      if (parsed.minor !== constraintParsed.minor) return false;
      return parsed.patch >= constraintParsed.patch;
    }

    // Handle * constraint (any version)
    if (constraint === "*") return true;

    // Exact version match
    const constraintParsed = this.parseSemver(constraint);
    if (!constraintParsed) return false;

    return (
      parsed.major === constraintParsed.major &&
      parsed.minor === constraintParsed.minor &&
      parsed.patch === constraintParsed.patch
    );
  }

  /**
   * Check version compatibility of a plugin
   *
   * @param pluginConstraints - Version constraints from the plugin
   * @param installedVersions - Currently installed versions of packages
   * @returns Validation result
   */
  checkVersionCompatibility(
    pluginConstraints: PluginVersionConstraints,
    installedVersions: Record<string, string> = {},
  ): SecurityValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Use core version if no installed versions provided
    const versions: Record<string, string> = {
      "@oc-mui/plugin-system": this.config.coreVersion,
      ...installedVersions,
    };

    for (const [pkg, constraint] of Object.entries(pluginConstraints)) {
      if (!constraint) continue;

      const installedVersion = versions[pkg];

      if (!installedVersion) {
        warnings.push(`Cannot verify compatibility: ${pkg} version is unknown.`);
        continue;
      }

      if (!this.satisfiesConstraint(installedVersion, constraint)) {
        errors.push(
          `Incompatible ${pkg}: requires ${constraint}, but ${installedVersion} is installed.`,
        );
      }
    }

    if (errors.length > 0) {
      return {
        valid: false,
        error: errors.join(" "),
        warnings,
      };
    }

    return {
      valid: true,
      warnings,
    };
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
