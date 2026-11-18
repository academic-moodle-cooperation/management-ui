import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { gql, GraphQLClient } from "graphql-request";

import { sessionCheckFetch } from "../sessionCheckFetch";

import { useAppConfig } from "./useAppConfig";

import type { MuiUserQuery } from "../gql-generated";

export function useGetCurrentUser(): UseQueryResult<MuiUserQuery, Error> {
  const { config, isLoading: isConfigLoading, isError: isConfigError } = useAppConfig();

  return useQuery<MuiUserQuery, Error, MuiUserQuery, [string, string | undefined]>({
    queryKey: ["currentUser", config?.api.graphqlEndpoint], // Include endpoint in queryKey
    queryFn: async () => {
      if (isConfigError) {
        throw new Error("GraphQL endpoint configuration error.");
      }
      if (!config?.api.graphqlEndpoint) {
        throw new Error("GraphQL endpoint is not configured.");
      }

      // The session check gets its own client: `sessionCheckFetch` reports a
      // redirect to a login page (SSO backends) as a 401 instead of letting the
      // browser follow it into a CORS failure that looks like an outage.
      const graphQLClient = new GraphQLClient(
        new URL(config.api.graphqlEndpoint, window.location.origin).href,
        { fetch: sessionCheckFetch },
      );
      return graphQLClient.request<MuiUserQuery>(gql`
        query MuiGetCurrentUser {
          currentUser {
            __typename
            email
            name
            username
            userRole
          }
        }
      `);
    },
    enabled: !isConfigLoading && !isConfigError && !!config?.api.graphqlEndpoint, // Only run query if config is loaded and endpoint exists
    // Auth state can change outside the SPA via server-side logout, SSO timeout,
    // or another tab, so always revalidate on mount.
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
  });
}

// It seems UseQueryResult is already imported, so re-exporting it might not be necessary
// unless specifically needed for other modules consuming this package.
export type { UseQueryResult };
