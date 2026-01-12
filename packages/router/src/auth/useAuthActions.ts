import { useAppConfig } from "@workspace/query";
import { useCallback } from "react";

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

  const login = useCallback((redirectTo?: string) => {
    // Use standardized /login route instead of direct config URLs
    const redirect = redirectTo || window.location.pathname;
    const loginUrl = `login?redirect=${encodeURIComponent(redirect)}`;
    window.location.href = loginUrl;
  }, []);

  const logout = useCallback(() => {
    // Use standardized /logout route instead of direct config URLs
    window.location.href = "logout";
  }, []);

  return {
    login,
    logout,
    isLoading,
    isError,
  };
};
