import React from 'react';

/**
 * App definition interface for registering apps through plugins
 */
export interface AppDefinition {
  /** Unique identifier for the app */
  id: string;
  /** Display name of the app */
  name: string;
  /** Route path where the app will be mounted (e.g., '/episodes', '/my-app') */
  routePath: string;
  /** App component to render */
  component: React.ComponentType;
  /** Optional navigation configuration */
  navigation?: {
    /** Display title in navigation */
    title: string;
    /** Icon for navigation (optional) */
    icon?: string;
    /** Order in navigation (lower numbers appear first) */
    order?: number;
    /** Required permissions to access this app */
    permissions?: string[];
  };
  /** Optional loader function for app-specific data */
  loader?: () => Promise<any>;
  /** App version */
  version?: string;
  /** App description */
  description?: string;
}