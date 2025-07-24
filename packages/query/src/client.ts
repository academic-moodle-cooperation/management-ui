import { QueryClient } from '@tanstack/react-query';
import { GraphQLClient } from 'graphql-request';

let graphQLClient: GraphQLClient | null = null;

export const initializeGraphQLClient = (url: string): GraphQLClient => {
  if (!graphQLClient) {
    graphQLClient = new GraphQLClient(url);
  }
  return graphQLClient;
};

export const getGraphQLClient = (): GraphQLClient => {
  if (!graphQLClient) {
    throw new Error('GraphQL client not initialized. Call initializeGraphQLClient first.');
  }
  return graphQLClient;
};

// Export a factory function instead of a singleton
export const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      // custom configurations (e.g., staleTime, cacheTime, refetchOnWindowFocus, etc.)
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

// Keep the old export for backward compatibility
export const queryClient = createQueryClient();

// Export a function that creates a new GraphQL client with the provided URL
export const createGraphQLClient = (url: string): GraphQLClient => {
  if (!url || typeof url !== 'string') {
    throw new Error(`Invalid GraphQL endpoint: expected a string, got ${typeof url}: ${url}`);
  }

  let absoluteUrl = url;

  // If the URL is relative, make it absolute
  if (url.startsWith('/')) {
    // Use current window location to build absolute URL
    if (typeof window !== 'undefined') {
      absoluteUrl = `${window.location.origin}${url}`;
    } else {
      // In server-side environments, you might need a different approach
      throw new Error(`Relative URL "${url}" cannot be resolved in server-side context. Please provide an absolute URL.`);
    }
  }

  // Validate the final URL
  try {
    new URL(absoluteUrl);
  } catch (error) {
    throw new Error(`Failed to create GraphQL client: Invalid URL "${absoluteUrl}". Original URL: "${url}". ${error instanceof Error ? error.message : String(error)}`);
  }

  try {
    return new GraphQLClient(absoluteUrl);
  } catch (error) {
    throw new Error(`Failed to create GraphQL client with URL "${absoluteUrl}": ${error instanceof Error ? error.message : String(error)}`);
  }
}; 