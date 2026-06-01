import { Navigate } from "@tanstack/react-router";
import React from "react";

import { useGetCurrentUser } from "@oc-mui/query";

import { useAuth } from "../auth/AuthContext";
import { isAuthenticationError } from "../auth/isAuthenticationError";

interface ProtectedRouteProps {
  children: React.ReactNode;
  loadingComponent?: React.ComponentType<{ children?: React.ReactNode }>;
  /**
   * Rendered when the auth check fails with a non-auth (e.g. backend 5xx /
   * network) error and no user could be resolved — instead of an indefinite
   * "Checking authentication…" spinner. Receives the error and a retry
   * callback. Injected so this package needn't import `@oc-mui/ui`. Optional —
   * falls back to a minimal inline message with a Retry button.
   */
  errorComponent?: React.ComponentType<{ error: unknown; onRetry: () => void }>;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  loadingComponent: LoadingComponent,
  errorComponent: ErrorComponent,
}) => {
  const { user } = useAuth();
  // Subscribe to the same `currentUser` query AuthInitializer drives (deduped
  // by queryKey) so we can distinguish "still loading" from "errored, no user".
  const { isError, error, refetch } = useGetCurrentUser();

  // Check authentication directly from user data (avoid timing issues with derived state)
  const userRole = user?.currentUser?.userRole;
  const isUserAuthenticated = Boolean(user && userRole !== "ROLE_USER_ANONYMOUS");

  // Auth check finished with an error and no user resolved. 401/403 → the
  // session is invalid, send to login. Anything else (backend 5xx, network) is
  // a real outage → show an error screen with Retry, not an infinite spinner.
  if (user === undefined && isError && error) {
    if (isAuthenticationError(error)) {
      return <Navigate to="/login" />;
    }
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
    if (LoadingComponent) {
      return (
        <LoadingComponent>
          <div className="p-8 text-center">
            <div className="text-muted-foreground">Checking authentication...</div>
          </div>
        </LoadingComponent>
      );
    }
    return (
      <div className="p-8 text-center">
        <div className="text-muted-foreground">Checking authentication...</div>
      </div>
    );
  }

  if (!isUserAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};
