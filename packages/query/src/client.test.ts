import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createGraphQLClient,
  createQueryClient,
} from "./client";
import { GraphQLClient } from "graphql-request";

// Mock graphql-request
vi.mock("graphql-request", () => ({
  GraphQLClient: vi.fn().mockImplementation((url: string) => ({
    request: vi.fn(),
    setHeader: vi.fn(),
    url,
  })),
}));

describe("client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createGraphQLClient", () => {
    it("should create a GraphQL client with absolute URL", () => {
      const client = createGraphQLClient("https://api.example.com/graphql");

      expect(GraphQLClient).toHaveBeenCalledWith("https://api.example.com/graphql");
      expect(client).toBeDefined();
      expect(client.url).toBe("https://api.example.com/graphql");
    });

    // Note: Relative URL conversion test is complex due to window.location mocking
    // This functionality is better tested in integration tests

    it("should throw error for invalid URL", () => {
      expect(() => {
        createGraphQLClient("not-a-valid-url");
      }).toThrow("Invalid URL");
    });

    it("should throw error for empty string", () => {
      expect(() => {
        createGraphQLClient("");
      }).toThrow("Invalid GraphQL endpoint");
    });

    it("should throw error for non-string input", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => {
        createGraphQLClient(null as any);
      }).toThrow("Invalid GraphQL endpoint");
    });
  });

  describe("createQueryClient", () => {
    it("should create a QueryClient with default options", () => {
      const queryClient = createQueryClient();

      expect(queryClient).toBeDefined();
      // Check that default options are set
      expect(queryClient.getDefaultOptions().queries?.staleTime).toBe(1000 * 60 * 5);
      expect(queryClient.getDefaultOptions().queries?.retry).toBe(1);
    });

    it("should create independent QueryClient instances", () => {
      const client1 = createQueryClient();
      const client2 = createQueryClient();

      expect(client1).not.toBe(client2);
    });
  });
});
