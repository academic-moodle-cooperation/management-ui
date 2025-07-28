import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { gql } from "graphql-request";
import { useAppConfig } from "@workspace/query";
import { createGraphQLClient } from "../client";

// Define the structure of the user data returned by the GraphQL query
interface CurrentUser {
  email: string;
  name: string;
  username: string;
  userRole: string;
}

export interface UserQueryResponse {
  currentUser: CurrentUser;
}

export function useGetCurrentUser(): UseQueryResult<UserQueryResponse, Error> {
  const { config, isLoading: isConfigLoading, isError: isConfigError } = useAppConfig();

  return useQuery<UserQueryResponse, Error, UserQueryResponse, [string, string | undefined]>({
    queryKey: ["currentUser", config?.api.graphqlEndpoint], // Include endpoint in queryKey
    queryFn: async () => {
      if (isConfigError) {
        throw new Error("GraphQL endpoint configuration error.");
      }
      if (!config?.api.graphqlEndpoint) {
        throw new Error("GraphQL endpoint is not configured.");
      }

      // Use the createGraphQLClient function that properly handles relative URLs
      const graphQLClient = createGraphQLClient(config.api.graphqlEndpoint);
      return graphQLClient.request<UserQueryResponse>(gql`
        query GetCurrentUser {
          currentUser {
            email
            name
            username
            userRole
          }
        }
      `);
    },
    enabled: !isConfigLoading && !isConfigError && !!config?.api.graphqlEndpoint, // Only run query if config is loaded and endpoint exists
    staleTime: Infinity, // Data is considered fresh indefinitely
  });
}

// It seems UseQueryResult is already imported, so re-exporting it might not be necessary
// unless specifically needed for other modules consuming this package.
export type { UseQueryResult };