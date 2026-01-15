import { describe, it, expect, vi, beforeEach } from "vitest";

import { fetchData } from "./fetcher";

// Mock global fetch
global.fetch = vi.fn();

describe("fetcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchData", () => {
    it("should fetch data successfully", async () => {
      const mockData = { test: "data" };
      const mockResponse = {
        json: vi.fn().mockResolvedValue({ data: mockData }),
      };

      vi.mocked(global.fetch).mockResolvedValue(mockResponse as unknown as Response);

      const queryFn = fetchData<typeof mockData, unknown>("query { test }");
      const result = await queryFn();

      expect(global.fetch).toHaveBeenCalledWith("/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: "query { test }",
          variables: undefined,
          options: undefined,
        }),
      });

      expect(result).toEqual(mockData);
    });

    it("should handle GraphQL errors", async () => {
      const mockErrors = [{ message: "GraphQL error" }];
      const mockResponse = {
        json: vi.fn().mockResolvedValue({
          errors: mockErrors,
          data: null,
        }),
      };

      vi.mocked(global.fetch).mockResolvedValue(mockResponse as unknown as Response);

      const queryFn = fetchData("query { test }");

      await expect(queryFn()).rejects.toThrow("GraphQL error");
    });

    it("should pass variables to request", async () => {
      const mockData = { test: "data" };
      const variables = { id: "123" };
      const mockResponse = {
        json: vi.fn().mockResolvedValue({ data: mockData }),
      };

      vi.mocked(global.fetch).mockResolvedValue(mockResponse as unknown as Response);

      const queryFn = fetchData<typeof mockData, typeof variables>("query { test }", variables);
      await queryFn();

      expect(global.fetch).toHaveBeenCalledWith(
        "/graphql",
        expect.objectContaining({
          body: JSON.stringify({
            query: "query { test }",
            variables,
            options: undefined,
          }),
        }),
      );
    });

    it("should pass options/headers to request", async () => {
      const mockData = { test: "data" };
      const options = { Authorization: "Bearer token" };
      const mockResponse = {
        json: vi.fn().mockResolvedValue({ data: mockData }),
      };

      vi.mocked(global.fetch).mockResolvedValue(mockResponse as unknown as Response);

      const queryFn = fetchData<typeof mockData, unknown>("query { test }", undefined, options);
      await queryFn();

      expect(global.fetch).toHaveBeenCalledWith(
        "/graphql",
        expect.objectContaining({
          body: JSON.stringify({
            query: "query { test }",
            variables: undefined,
            options,
          }),
        }),
      );
    });
  });
});
