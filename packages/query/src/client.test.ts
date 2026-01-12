import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createGraphQLClient,
  initializeGraphQLClient,
  getGraphQLClient,
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
    // Reset module state
    vi.resetModules();
  });

  describe("createGraphQLClient", () => {
    it("should create a GraphQL client with absolute URL", () => {
      const client = createGraphQLClient("https://api.example.com/graphql");

      expect(GraphQLClient).toHaveBeenCalledWith("https://api.example.com/graphql");
      expect(client).toBeDefined();
    });

    it("should convert relative URL to absolute URL in browser", () => {
      // Mock window.location
      Object.defineProperty(window, "location", {
        value: {
          origin: "https://example.com",
        },
        writable: true,
        configurable: true,
      });

      const client = createGraphQLClient("/graphql");

      expect(GraphQLClient).toHaveBeenCalledWith("https://example.com/graphql");
      expect(client).toBeDefined();
    });

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

  describe("initializeGraphQLClient", () => {
    it("should initialize GraphQL client", () => {
      const client = initializeGraphQLClient("https://api.example.com/graphql");

      expect(GraphQLClient).toHaveBeenCalledWith("https://api.example.com/graphql");
      expect(client).toBeDefined();
    });

    it("should return same client on subsequent calls (singleton behavior)", () => {
      const client1 = initializeGraphQLClient("https://api.example.com/graphql");
      const client2 = initializeGraphQLClient("https://api.example.com/graphql");

      // Both should be the same instance (singleton)
      expect(client1).toBe(client2);
    });
  });

  describe("getGraphQLClient", () => {
    it("should return initialized client", () => {
      const initialized = initializeGraphQLClient("https://api.example.com/graphql");
      const retrieved = getGraphQLClient();

      expect(retrieved).toBe(initialized);
    });

    it("should throw error if client not initialized", () => {
      // Reset module to clear initialized client
      vi.resetModules();

      expect(() => {
        getGraphQLClient();
      }).toThrow("GraphQL client not initialized");
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
