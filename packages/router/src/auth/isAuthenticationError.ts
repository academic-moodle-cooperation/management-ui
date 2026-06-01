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
 * Determines if an error from the `currentUser` fetch is an *authentication*
 * error (the session is invalid → the user should be sent to login) versus a
 * *server / network* error (the backend is unreachable or 5xx → the session
 * may still be valid; show an error screen, don't log the user out).
 *
 * Only 401 / 403 (or UNAUTHENTICATED / FORBIDDEN GraphQL codes) count as
 * authentication errors. Everything else (500, 502, ECONNREFUSED, parse
 * failures, …) is treated as a transient server/network error.
 *
 * Shared by `AuthInitializer` (decides whether to clear the cached user) and
 * the route-protection components (decide between a login redirect and the
 * "couldn't verify your session" error screen).
 */
export const isAuthenticationError = (error: Error): boolean => {
  const errorMessage = error.message?.toLowerCase() || "";

  // graphql-request errors often embed the HTTP status in the message.
  if (errorMessage.includes("401") || errorMessage.includes("403")) {
    return true;
  }

  if (errorMessage.includes("unauthorized") || errorMessage.includes("forbidden")) {
    return true;
  }

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

  const response = (error as ErrorWithGraphQL)?.response;
  if (response?.status === 401 || response?.status === 403) {
    return true;
  }

  // Not an authentication error — network, server (5xx), parse, etc.
  return false;
};
