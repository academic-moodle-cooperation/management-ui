import React from "react";
import { createRoute, useRouterState, type AnyRoute } from "@tanstack/react-router";
import { useAppConfig } from "@workspace/query";

/**
 * Configuration options for creating auth routes
 */
export interface AuthRouteOptions {
  /** Custom loading component to use (e.g., AppLoader from @workspace/ui) */
  loadingComponent?: React.ComponentType;
}

/**
 * Creates standardized login and logout routes that handle:
 * - Development vs production URL selection
 * - Redirect parameter handling
 * - Loading states and error handling
 *
 * Pass AppLoader as loadingComponent to maintain consistency across the app.
 *
 * These routes should be used consistently across all router configurations
 * to centralize authentication logic.
 */

export const createLoginRoute = (parentRoute: AnyRoute, options: AuthRouteOptions = {}) => {
  const LoadingComponent = options.loadingComponent || (() => <div>Loading...</div>);

  return createRoute({
    getParentRoute: () => parentRoute,
    path: "/login",
    component: () => {
      const { config, isLoading, isError } = useAppConfig();
      const routerState = useRouterState();

      if (isLoading) return <LoadingComponent />;
      if (isError || !config) return <div>Error loading login configuration.</div>;

      // Choose the appropriate login URL based on environment
      const loginUrl =
        import.meta.env.DEV && config.auth.loginUrlDev
          ? config.auth.loginUrlDev
          : config.auth.loginUrl;

      // Handle redirect parameter from query string or default to home
      const redirectParam =
        (routerState.location.search as Record<string, unknown>)["redirect"] || "/";

      // Build the final login URL with redirect parameter
      const finalLoginUrl = `${loginUrl}?redirect=${encodeURIComponent(window.location.origin + redirectParam)}`;

      // Perform the redirect
      window.location.href = finalLoginUrl;
      return <LoadingComponent />;
    },
  });
};

export const createLogoutRoute = (parentRoute: AnyRoute, options: AuthRouteOptions = {}) => {
  const LoadingComponent = options.loadingComponent || (() => <div>Loading...</div>);

  return createRoute({
    getParentRoute: () => parentRoute,
    path: "/logout",
    component: () => {
      const { config, isLoading, isError } = useAppConfig();

      if (isLoading) return <LoadingComponent />;
      if (isError || !config) return <div>Error loading logout configuration.</div>;

      // Choose the appropriate logout URL based on environment
      const logoutUrl =
        import.meta.env.DEV && config.auth.logoutUrlDev
          ? config.auth.logoutUrlDev
          : config.auth.logoutUrl;

      // For logout, redirect directly to the logout URL
      // The server-side logout handler should handle post-logout redirection
      window.location.href = logoutUrl;
      return <LoadingComponent />;
    },
  });
};
