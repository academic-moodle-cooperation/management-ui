import React from "react";

import { useAppConfig } from "@oc-mui/query";

import { useAuth } from "../auth/AuthContext";

interface AppProtectionProps {
  appName: string;
  children: React.ReactNode;
  loadingComponent?: React.ComponentType<{ children?: React.ReactNode }>;
  /**
   * Rendered while the auth state is still being resolved *and* while the
   * redirect to the login route is in flight. Lets the consumer inject a
   * branded loader (e.g. the shell's `<AppLoader>`) instead of the bare
   * inline fallback. Optional — falls back to a minimal themed placeholder.
   */
  redirectingComponent?: React.ReactNode;
}

/**
 * Builds the shell's `/login` route URL, preserving where the user was
 * trying to go via a `?redirect=` param so the login form can send them
 * back there afterwards. Uses `BASE_URL` (e.g. `/management-ui/`) so the
 * path is correct under the app's base.
 */
const buildLoginRedirectUrl = (): string => {
  const base = import.meta.env.BASE_URL || "/";
  const loginPath = `${base.replace(/\/$/, "")}/login`;
  const here = window.location.pathname + window.location.search;
  return `${loginPath}?redirect=${encodeURIComponent(here)}`;
};

/**
 * Simple app-level protection component.
 *
 * - If app is marked as public in config, allows access
 * - If app is protected (default), requires authentication
 * - Redirects anonymous users to the shell's `/login` route, which owns
 *   the actual login UX (native form for password backends, or a
 *   redirect to an external IdP for SSO). The originally-requested path
 *   is preserved in the login route's `?redirect=` param.
 *
 * The loading / redirecting UI is injectable via `loadingComponent` /
 * `redirectingComponent` so this component stays UI-light: the router
 * package can't import `@oc-mui/ui` (that package already depends on the
 * router, so importing back would form a cycle).
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
    // Send anonymous users to the shell's /login route (single login
    // entry point), preserving where they wanted to go. The /login route
    // decides between the native form and an external-IdP redirect.
    if (typeof window !== "undefined") {
      window.location.href = buildLoginRedirectUrl();
    }
    // Brief flash while the browser navigates to /login.
    return (
      <>
        {redirectingComponent ?? (
          <div className="p-8 text-center text-muted-foreground">Redirecting to login…</div>
        )}
      </>
    );
  }

  // User is authenticated - allow access
  return <>{children}</>;
};
