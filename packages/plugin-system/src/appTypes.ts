import React from "react";

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
  loader?: () => Promise<unknown>;
  /**
   * Roles required to access this app's route. When set, the shell only mounts
   * the app for a user who holds one of these roles; every other user (including
   * other authenticated users) gets an access-denied screen. Omit for an app any
   * authenticated user may open. Matched against the user's *granted* roles (the
   * `roles` array from Opencast's `/info/me.json`), not the per-user
   * `ROLE_USER_<username>` identity role. The default Opencast admin role is
   * `ROLE_ADMIN`; a deployment with a different admin role can override per app
   * via `config.plugins[<id>].protection.requiredRoles`.
   */
  requiredRoles?: string[];
  /** App version */
  version?: string;
  /** App description */
  description?: string;
}
