import React from "react";

import { useAppConfig, useGetCurrentUser, useGetUserInfo } from "@oc-mui/query";

import { useAuth } from "../auth/AuthContext";
import { isAuthenticationError } from "../auth/isAuthenticationError";

interface AppProtectionProps {
  appName: string;
  children: React.ReactNode;
  /**
   * Roles allowed to open this app. When set (non-empty), an authenticated user
   * is let through only if they hold at least one of these roles. This is
   * checked against the user's granted roles (Opencast's `/info/me.json`
   * `roles`), NOT the per-user `userRole` (which is the individual
   * `ROLE_USER_<username>` identity role and cannot express a privilege level).
   * The default Opencast admin role is `ROLE_ADMIN`; a deployment with a
   * different admin role can override via
   * `config.plugins[appName].protection.requiredRoles`. Omit to allow any
   * authenticated user.
   */
  requiredRoles?: string[] | undefined;
  loadingComponent?: React.ComponentType<{ children?: React.ReactNode }>;
  /**
   * Rendered when the user is authenticated but lacks a required role. Injected
   * by the shell so this package needn't import `@oc-mui/ui`. Receives the roles
   * that would grant access and the user's granted roles. Optional — falls back
   * to a minimal inline message.
   */
  accessDeniedComponent?: React.ComponentType<{ requiredRoles: string[]; userRoles: string[] }>;
  /**
   * Rendered while the auth state is still being resolved *and* while the
   * redirect to the login route is in flight. Lets the consumer inject a
   * branded loader (e.g. the shell's `<AppLoader>`) instead of the bare
   * inline fallback. Optional — falls back to a minimal themed placeholder.
   */
  redirectingComponent?: React.ReactNode;
  /**
   * Rendered when the auth check fails with a non-auth (e.g. backend 5xx /
   * network) error and no user could be resolved — instead of the infinite
   * "Checking authentication…" spinner. Receives the error and a retry
   * callback (re-runs the `currentUser` fetch). Injected by the shell so this
   * package needn't import `@oc-mui/ui`. Optional — falls back to a minimal
   * inline message with a Retry button.
   */
  errorComponent?: React.ComponentType<{ error: unknown; onRetry: () => void }>;
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
  requiredRoles,
  loadingComponent: LoadingComponent,
  redirectingComponent,
  errorComponent: ErrorComponent,
  accessDeniedComponent: AccessDeniedComponent,
}) => {
  const { config } = useAppConfig();
  const { user, isAuthenticated } = useAuth();
  // Subscribe to the same `currentUser` query AuthInitializer drives (TanStack
  // dedupes by queryKey — no extra request) so we can tell "still loading" from
  // "errored with no user" and avoid an indefinite spinner on a backend outage.
  const { isError, error, refetch } = useGetCurrentUser();
  // The user's granted roles (from /info/me.json). Only consulted when the app
  // declares required roles; deduped by queryKey so it costs nothing otherwise.
  const { data: userInfo, isPending: isUserInfoPending } = useGetUserInfo();

  // Get app protection config
  const appProtection = (
    config?.plugins?.[appName] as {
      protection?: { public?: boolean; requiredRoles?: string[] };
    }
  )?.protection;

  // If marked as public, allow access
  if (appProtection?.public === true) {
    return <>{children}</>;
  }

  // The auth check finished with an error and no user was resolved. A 401/403
  // means the session is invalid → fall through to the login redirect below.
  // Anything else (backend 5xx, network) is a real outage → show an error
  // screen with Retry instead of spinning on "Checking authentication…".
  if (user === undefined && isError && error && !isAuthenticationError(error)) {
    const onRetry = () => void refetch();
    if (ErrorComponent) {
      return <ErrorComponent error={error} onRetry={onRetry} />;
    }
    return (
      <div className="p-8 text-center text-muted-foreground space-y-3">
        <p>Couldn&rsquo;t verify your session — the server didn&rsquo;t respond.</p>
        <button type="button" className="underline" onClick={onRetry}>
          Retry
        </button>
      </div>
    );
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

  // Authenticated — now enforce role requirements, if any. A deployment override
  // in config wins over the app's own declaration so operators can adjust the
  // gate (e.g. a non-default admin role) without a code change.
  const effectiveRequiredRoles = appProtection?.requiredRoles ?? requiredRoles ?? [];

  if (effectiveRequiredRoles.length > 0) {
    // Wait for the granted roles to load before deciding, so an admin doesn't
    // flash the access-denied screen on first paint.
    if (isUserInfoPending) {
      const checkingMessage = (
        <div className="p-8 text-center text-muted-foreground">Checking permissions…</div>
      );
      return LoadingComponent ? <LoadingComponent>{checkingMessage}</LoadingComponent> : checkingMessage;
    }

    // Authorize against the user's *granted* roles, not the per-user identity
    // role: Opencast's `userRole` is `ROLE_USER_<username>`, so a privilege gate
    // has to look at the `roles` array (which carries `ROLE_ADMIN` etc.).
    const userRoles = userInfo?.roles ?? [];
    const isAuthorized = effectiveRequiredRoles.some((role) => userRoles.includes(role));

    if (!isAuthorized) {
      if (AccessDeniedComponent) {
        return <AccessDeniedComponent requiredRoles={effectiveRequiredRoles} userRoles={userRoles} />;
      }
      return (
        <div className="p-8 text-center text-muted-foreground space-y-2">
          <p>You don&rsquo;t have permission to view this page.</p>
          <p className="text-sm">It requires the role {effectiveRequiredRoles.join(" or ")}.</p>
        </div>
      );
    }
  }

  // Authenticated and authorized - allow access
  return <>{children}</>;
};
