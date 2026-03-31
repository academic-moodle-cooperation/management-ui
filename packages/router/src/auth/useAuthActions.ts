import { useCallback } from "react";

import { useAppConfig } from "@workspace/query";

export interface AuthActions {
  login: (redirectTo?: string) => void;
  logout: () => void;
  isLoading: boolean;
  isError: boolean;
}

/**
 * Hook that provides login/logout actions using standardized routes.
 * Uses /login and /logout routes which handle environment selection,
 * redirect parameters, and error handling consistently.
 */
export const useAuthActions = (): AuthActions => {
  const { config, isLoading, isError } = useAppConfig();

  const getAppRoute = useCallback((route: string) => {
    const baseUrl = import.meta.env.BASE_URL || "/";
    const normalizedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    return `${normalizedBase}/${route.replace(/^\/+/, "")}`;
  }, []);

  const login = useCallback(
    (redirectTo?: string) => {
      const redirect = redirectTo || window.location.pathname;
      const loginUrl = `${getAppRoute("login")}?redirect=${encodeURIComponent(redirect)}`;
      window.location.assign(loginUrl);
    },
    [getAppRoute],
  );

  const logout = useCallback(() => {
    if (isLoading || isError || !config) {
      return;
    }

    const logoutUrl =
      import.meta.env.DEV && config.auth.logoutUrlDev
        ? config.auth.logoutUrlDev
        : config.auth.logoutUrl;

    window.location.assign(logoutUrl);
  }, [config, isError, isLoading]);

  return {
    login,
    logout,
    isLoading,
    isError,
  };
};
