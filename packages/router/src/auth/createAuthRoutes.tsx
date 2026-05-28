import { createRoute, useRouterState, type AnyRoute } from "@tanstack/react-router";
import React from "react";

import { useAppConfig } from "@oc-mui/query";

/**
 * Props passed to a consumer-supplied login form component (see
 * `AuthRouteOptions.formComponent`).
 */
export interface LoginFormComponentProps {
  /**
   * Where to send the user after a successful login — a path relative to
   * the app origin (e.g. `/management-ui/episodes`), taken from the
   * `?redirect=` query param. The form is responsible for navigating
   * there once authentication succeeds.
   */
  redirect: string;
}

/**
 * Configuration options for creating auth routes
 */
export interface AuthRouteOptions {
  /** Custom loading component to use (e.g., AppLoader from @oc-mui/ui) */
  loadingComponent?: React.ComponentType;
  /**
   * Login form rendered for password (Spring `j_spring_security_*`)
   * backends. Injected by the consumer because the form needs
   * `@oc-mui/ui` components, and this package can't import `@oc-mui/ui`
   * (that package already depends on `@oc-mui/router`, so importing back
   * would create a cycle). When omitted, or when the configured login
   * URL points at an external IdP (SSO), the route falls back to a
   * full-page redirect to that URL instead.
   */
  formComponent?: React.ComponentType<LoginFormComponentProps>;
}

/**
 * A login URL is a Spring Security form-login endpoint when it targets
 * the well-known `j_spring_security_*` paths. Those backends accept a
 * username/password POST to `/j_spring_security_check`, so we can render
 * a native in-app form. Anything else (Shibboleth, OIDC, CAS, …) is an
 * external IdP we have to hand off to via a full-page redirect.
 */
const isFormLoginUrl = (loginUrl: string | undefined): boolean =>
  !!loginUrl && loginUrl.includes("j_spring_security");

/**
 * Creates standardized login and logout routes that handle:
 * - Development vs production URL selection
 * - Redirect parameter handling
 * - Loading states and error handling
 *
 * Pass AppLoader as loadingComponent to maintain consistency across the app.
 *
 * For password backends, pass `formComponent` to render an in-app login
 * form (best UX, and the only way to reliably return the user to where
 * they started — see the comment in that component). For SSO backends
 * the route redirects out to the configured IdP.
 *
 * These routes should be used consistently across all router configurations
 * to centralize authentication logic.
 */

export const createLoginRoute = (parentRoute: AnyRoute, options: AuthRouteOptions = {}) => {
  const LoadingComponent = options.loadingComponent || (() => <div>Loading...</div>);
  const FormComponent = options.formComponent;

  return createRoute({
    getParentRoute: () => parentRoute,
    path: "/login",
    component: function LoginComponent() {
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
      const redirectParam = String(
        (routerState.location.search as Record<string, unknown>)["redirect"] || "/",
      );

      // Password backend + an injected form → render the in-app login
      // form. It owns the POST to /j_spring_security_check and the
      // post-login navigation, so the user lands back where they started
      // instead of on the backend's role-based welcome page.
      if (isFormLoginUrl(loginUrl) && FormComponent) {
        return <FormComponent redirect={redirectParam} />;
      }

      // External IdP (SSO, e.g. Shibboleth / OIDC / CAS). Hand off with a
      // full-page redirect to the configured URL *verbatim* — the org
      // encodes the post-login return target inside it (Shibboleth's
      // `target=`, OIDC's `redirect_uri`, …). We deliberately don't
      // append our own `?redirect=`: the param name is IdP-specific, and
      // blindly appending corrupts a login URL that already carries a
      // query string (the shipped default ends in `?target=/management-ui`).
      // Returning the user to the *exact* deep route after SSO would need
      // per-IdP return-param support — tracked as a follow-up.
      if (loginUrl) {
        window.location.href = loginUrl;
        return <LoadingComponent />;
      }

      // No login URL configured and no form to fall back to.
      return <div>No login method is configured for this deployment.</div>;
    },
  });
};

export const createLogoutRoute = (parentRoute: AnyRoute, options: AuthRouteOptions = {}) => {
  const LoadingComponent = options.loadingComponent || (() => <div>Loading...</div>);

  return createRoute({
    getParentRoute: () => parentRoute,
    path: "/logout",
    component: function LogoutComponent() {
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
