import React from "react";

import { useAppConfig } from "@oc-mui/query";

import { useAuth } from "../auth/AuthContext";

interface AppProtectionProps {
  appName: string;
  children: React.ReactNode;
  loadingComponent?: React.ComponentType<{ children?: React.ReactNode }>;
  /**
   * Rendered while the auth state is still being resolved *and* while a
   * login redirect is in flight. Lets the consumer inject a branded
   * loader (e.g. the shell's `<AppLoader>`) instead of the bare inline
   * fallback. Optional — falls back to a minimal themed placeholder.
   */
  redirectingComponent?: React.ReactNode;
  /**
   * Rendered when the user is anonymous and there is no `loginUrl` to
   * redirect to (so we can't bounce them to a login form). The shell
   * injects a full `<ErrorPage code="401">` here. Kept as a prop rather
   * than imported from `@oc-mui/ui` so the router package doesn't take a
   * dependency on the UI package (which already depends on the router —
   * importing back would create a cycle). Optional — falls back to a
   * minimal themed message.
   */
  unauthenticatedFallback?: React.ReactNode;
}

/**
 * Simple app-level protection component.
 *
 * - If app is marked as public in config, allows access
 * - If app is protected (default), requires authentication
 * - Redirects to login URL from config if not authenticated
 *
 * The UI shown for the loading / redirecting / unauthenticated states is
 * injectable via props so this component stays UI-light: the router
 * package can't import `@oc-mui/ui` (that package already depends on the
 * router, so importing back would form a cycle). Consumers pass the
 * branded components in; sensible themed fallbacks are used otherwise.
 *
 * Usage:
 * ```tsx
 * <AppProtection appName="series">
 *   <YourAppContent />
 * </AppProtection>
 * ```
 */
export const AppProtection: React.FC<AppProtectionProps> = ({
  appName,
  children,
  loadingComponent: LoadingComponent,
  redirectingComponent,
  unauthenticatedFallback,
}) => {
  const { config } = useAppConfig();
  const { user, isAuthenticated } = useAuth();

  // Get app protection config
  const appProtection = (config?.plugins?.[appName] as { protection?: { public?: boolean } })
    ?.protection;

  // If marked as public, allow access
  if (appProtection?.public === true) {
    return <>{children}</>;
  }

  // Wait for auth state to be determined before making decisions.
  // user === undefined means AuthInitializer is still loading auth data.
  if (user === undefined) {
    const checkingMessage = (
      <div className="p-8 text-center text-muted-foreground">Checking authentication…</div>
    );
    if (LoadingComponent) {
      return <LoadingComponent>{checkingMessage}</LoadingComponent>;
    }
    return checkingMessage;
  }

  // Default is protected - check authentication
  const userRole = user?.currentUser?.userRole;
  const isAnonymous = !isAuthenticated || userRole === "ROLE_USER_ANONYMOUS";

  if (isAnonymous) {
    // User not authenticated - redirect to login
    const loginUrl = import.meta.env.DEV
      ? config?.auth?.loginUrlDev || config?.auth?.loginUrl
      : config?.auth?.loginUrl;

    if (loginUrl && typeof window !== "undefined") {
      window.location.href = loginUrl;
      // Brief flash while the browser navigates to the login form.
      return (
        <>
          {redirectingComponent ?? (
            <div className="p-8 text-center text-muted-foreground">Redirecting to login…</div>
          )}
        </>
      );
    }

    // No login URL configured — we can't bounce the user anywhere, so
    // show the injected error screen (or a minimal themed fallback).
    if (unauthenticatedFallback !== undefined) {
      return <>{unauthenticatedFallback}</>;
    }

    return (
      <div className="p-8 text-center">
        <h2 className="mb-2 text-xl font-semibold text-foreground">Authentication Required</h2>
        <p className="text-muted-foreground">Please log in to access this application.</p>
      </div>
    );
  }

  // User is authenticated - allow access
  return <>{children}</>;
};
