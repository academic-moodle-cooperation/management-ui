import { QueryClient, QueryClientProvider, type QueryClientConfig } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import React from "react";

interface AppQueryProviderProps {
  children: React.ReactNode;
  clientConfig?: QueryClientConfig;
}

// Create a new QueryClient instance here, or allow it to be passed in for more flexibility.
// For simplicity, we'll create one internally for now.
const defaultQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false, // Adjust as needed
      retry: 1, // Adjust as needed
    },
  },
});

export const QueryProvider: React.FC<AppQueryProviderProps> = ({ children, clientConfig }) => {
  // Allow providing a custom clientConfig to override defaults or the entire client
  const queryClient = clientConfig ? new QueryClient(clientConfig) : defaultQueryClient;

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};
