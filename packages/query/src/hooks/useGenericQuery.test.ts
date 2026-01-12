import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useGenericQuery } from "./useGenericQuery";

describe("useGenericQuery", () => {
  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  it("should work as a wrapper around useQuery", async () => {
    const { result } = renderHook(
      () =>
        useGenericQuery({
          queryKey: ["test"],
          queryFn: async () => {
            return { data: "test" };
          },
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({ data: "test" });
  });

  it("should handle errors", async () => {
    const { result } = renderHook(
      () =>
        useGenericQuery({
          queryKey: ["error"],
          queryFn: async () => {
            throw new Error("Test error");
          },
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeInstanceOf(Error);
  });

  it("should support loading state", () => {
    const { result } = renderHook(
      () =>
        useGenericQuery({
          queryKey: ["loading"],
          queryFn: async () => {
            await new Promise((resolve) => setTimeout(resolve, 100));
            return { data: "test" };
          },
        }),
      { wrapper: createWrapper() }
    );

    expect(result.current.isLoading).toBe(true);
  });
});
