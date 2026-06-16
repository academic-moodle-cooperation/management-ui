import React from "react";

import { useAppConfig, useGetCurrentUser } from "@opencast-mui/query";

import { useAuth } from "../auth/AuthContext";
import { isAuthenticationError } from "../auth/isAuthenticationError";

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
  /**
   * Rendered when the auth check fails with a non-auth (e.g. backend 5xx /
   * network) error and no user could be resolved — instead of the infinite
   * "Checking authentication…" spinner. Receives the error and a retry
   * callback (re-runs the `currentUser` fetch). Injected by the shell so this
   * package needn't import `@opencast-mui/ui`. Optional — falls back to a minimal
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
 * package can't import `@opencast-mui/ui` (that package already depends on the
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
  errorComponent: ErrorComponent,
}) => {
  const { config } = useAppConfig();
  const { user, isAuthenticated } = useAuth();
  // Subscribe to the same `currentUser` query AuthInitializer drives (TanStack
  // dedupes by queryKey — no extra request) so we can tell "still loading" from
  // "errored with no user" and avoid an indefinite spinner on a backend outage.
  const { isError, error, refetch } = useGetCurrentUser();

  // Get app protection config
  const appProtection = (config?.plugins?.[appName] as { protection?: { public?: boolean } })
    ?.protection;

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

  // User is authenticated - allow access
  return <>{children}</>;
};
