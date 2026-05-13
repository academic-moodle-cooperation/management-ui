import React, { useEffect } from "react";

import { useGetCurrentUser } from "@oc-mui/query";

import { useAuth } from "./AuthContext";

interface GraphQLError {
  extensions?: {
    code?: string;
  };
  message?: string;
}

interface ErrorWithGraphQL extends Error {
  graphQLErrors?: GraphQLError[];
  response?: {
    status?: number;
  };
}

/**
 * Determines if an error is an authentication error that should clear user data.
 * Only authentication errors (401, 403) should log users out.
 * Network errors, server errors, etc. should preserve user state.
 */
const isAuthenticationError = (error: Error): boolean => {
  // Check for HTTP status codes in error message or properties
  const errorMessage = error.message?.toLowerCase() || "";

  // GraphQL-request errors often include HTTP status codes
  if (errorMessage.includes("401") || errorMessage.includes("403")) {
    return true;
  }

  // Check for common authentication error messages
  if (errorMessage.includes("unauthorized") || errorMessage.includes("forbidden")) {
    return true;
  }

  // Check for GraphQL error codes (if error has graphQLErrors property)
  const graphQLErrors = (error as ErrorWithGraphQL)?.graphQLErrors;
  if (graphQLErrors && Array.isArray(graphQLErrors)) {
    return graphQLErrors.some(
      (gqlError: GraphQLError) =>
        gqlError?.extensions?.code === "UNAUTHENTICATED" ||
        gqlError?.extensions?.code === "FORBIDDEN" ||
        gqlError?.message?.toLowerCase().includes("unauthorized") ||
        gqlError?.message?.toLowerCase().includes("forbidden"),
    );
  }

  // Check error response status (for HTTP errors)
  const response = (error as ErrorWithGraphQL)?.response;
  if (response?.status === 401 || response?.status === 403) {
    return true;
  }

  // Not an authentication error - could be network, server, etc.
  return false;
};

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
