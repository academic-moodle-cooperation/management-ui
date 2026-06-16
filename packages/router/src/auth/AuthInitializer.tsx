import React, { useEffect } from "react";

import { useGetCurrentUser } from "@opencast-mui/query";

import { useAuth } from "./AuthContext";
import { isAuthenticationError } from "./isAuthenticationError";

/**
 * AuthInitializer component that automatically fetches user data
 * and updates the authentication context when the app loads.
 * This should be placed inside the AuthProvider.
 */
export const AuthInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: userData, isLoading, error } = useGetCurrentUser();
  const { setUser } = useAuth();

  useEffect(() => {
    if (!isLoading && !error && userData) {
      // Update the auth context with the fetched user data
      setUser(userData);
    } else if (!isLoading && error) {
      // Only clear user data for actual authentication errors
      // Preserve user state for network errors, server errors, etc.
      if (isAuthenticationError(error)) {
        setUser(undefined);
      }
      // Don't clear user data for network/server errors - user might still be logged in
    }
  }, [userData, isLoading, error, setUser]);

  // Render children immediately - authentication state will update asynchronously
  return <>{children}</>;
};
