import React from "react";

import { useAppConfig } from "@workspace/query";

import { useAuth } from "../auth/AuthContext";

interface AppProtectionProps {
  appName: string;
  children: React.ReactNode;
  loadingComponent?: React.ComponentType<{ children?: React.ReactNode }>;
}

/**
 * Simple app-level protection component.
 *
 * - If app is marked as public in config, allows access
 * - If app is protected (default), requires authentication
 * - Redirects to login URL from config if not authenticated
 *
 * Usage:
 * ```tsx
 * <AppProtection appName="management-ui-series">
 *   <YourAppContent />
 * </AppProtection>
 * ```
 */
export const AppProtection: React.FC<AppProtectionProps> = ({
  appName,
  children,
  loadingComponent: LoadingComponent,
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

  // Wait for auth state to be determined before making decisions
  // user === undefined means AuthInitializer is still loading auth data
  if (user === undefined) {
    if (LoadingComponent) {
      return (
        <LoadingComponent>
          <div className="p-8 text-center">
            <div className="text-gray-600">Checking authentication...</div>
          </div>
        </LoadingComponent>
      );
    }
    return (
      <div className="p-8 text-center">
        <div className="text-gray-600">Checking authentication...</div>
      </div>
    );
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
      return <div className="p-8 text-center">Redirecting to login...</div>;
    }

    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
        <p className="text-gray-600">Please log in to access this application.</p>
        {loginUrl && (
          <a
            href={loginUrl}
            className="mt-4 inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Go to Login
          </a>
        )}
      </div>
    );
  }

  // User is authenticated - allow access
  return <>{children}</>;
};
