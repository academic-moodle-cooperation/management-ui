import React from 'react';
import type { AnyRouter } from '@tanstack/react-router';

// Re-export AppDefinition from plugin-system to avoid circular dependencies
export type { AppDefinition } from '@workspace/plugin-system';

/**
 * Runtime configuration for apps
 */
export interface AppRuntimeConfig {
  /** Whether the app is running standalone (true) or within core shell (false) */
  isStandalone: boolean;
  /** Base URL for the app */
  baseUrl?: string;
  /** Router instance (if available) */
  router?: AnyRouter;
  /** App-specific configuration */
  config?: Record<string, any>;
}

/**
 * Runtime context for apps
 */
export interface AppRuntimeContext {
  config: AppRuntimeConfig;
  /** Function to register an app (only available when running in core) */
  registerApp?: (app: import('@workspace/plugin-system').AppDefinition) => void;
  /** Function to get all registered apps */
  getApps?: () => import('@workspace/plugin-system').AppDefinition[];
}