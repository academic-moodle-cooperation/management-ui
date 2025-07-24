import { useAppConfig } from '@workspace/ui-config';
import { useCallback } from 'react';

export interface AuthActions {
  login: (redirectTo?: string) => void;
  logout: () => void;
  isLoading: boolean;
  isError: boolean;
}

/**
 * Hook that provides login/logout actions using URLs directly from app config.
 * This allows you to bypass the /login and /logout routes and use the 
 * configured authentication URLs directly.
 */
export const useAuthActions = (): AuthActions => {
  const { config, isLoading, isError } = useAppConfig();

  const login = useCallback((redirectTo?: string) => {
    if (!config?.auth) {
      return;
    }

    // Choose the appropriate login URL based on environment
    const loginUrl = (import.meta.env.DEV && config.auth.loginUrlDev)
      ? config.auth.loginUrlDev
      : config.auth.loginUrl;

    // Determine redirect URL
    const redirect = redirectTo || window.location.pathname;
    const fullRedirectUrl = `${window.location.origin}${redirect}`;

    // Redirect to the configured login URL with redirect parameter
    const finalLoginUrl = `${loginUrl}?redirect=${encodeURIComponent(fullRedirectUrl)}`;

    window.location.href = finalLoginUrl;
  }, [config]);

  const logout = useCallback(() => {
    if (!config?.auth) {
      return;
    }

    // Choose the appropriate logout URL based on environment
    const logoutUrl = (import.meta.env.DEV && config.auth.logoutUrlDev)
      ? config.auth.logoutUrlDev
      : config.auth.logoutUrl;

    window.location.href = logoutUrl;
  }, [config]);

  return {
    login,
    logout,
    isLoading,
    isError
  };
}; 