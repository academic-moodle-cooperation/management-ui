import type { AnyRouter } from "@oc-mui/router";

// Re-export AppDefinition from plugin-system to avoid circular dependencies
export type { AppDefinition } from "@oc-mui/plugin-system";

/**
 * Runtime configuration for apps
 */
export interface AppRuntimeConfig {
  /** Whether the app is running standalone (true) or within core shell (false) */
  isStandalone: boolean;
  /** Base URL for the app */
  baseUrl?: string;
  /** App name */
  appName?: string;
  /** Router instance (if available) */
  router?: AnyRouter;
  /** App-specific configuration */
  config?: Record<string, unknown>;
}

/**
 * Runtime context for apps
 */
export interface AppRuntimeContext {
  config: AppRuntimeConfig;
  /** Function to register an app (only available when running in core) */
  registerApp?: (app: import("@oc-mui/plugin-system").AppDefinition) => void;
  /** Function to get all registered apps */
  getApps?: () => import("@oc-mui/plugin-system").AppDefinition[];
}
