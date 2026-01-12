import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import {
  loadNamespace,
  usePluginTranslation,
  createNamespacedKey,
  createOrganizationNamespace,
} from "./translationLoader";
import * as i18nIndex from "./index";

// Mock i18next methods
const mockHasResourceBundle = vi.fn();
const mockLoadNamespaces = vi.fn();

vi.mock("./index", async () => {
  const actual = await vi.importActual<typeof i18nIndex>("./index");
  return {
    ...actual,
    i18next: {
      ...actual.i18next,
      hasResourceBundle: mockHasResourceBundle,
      loadNamespaces: mockLoadNamespaces,
      language: "en",
    },
  };
});

describe("translationLoader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("loadNamespace", () => {
    it("should load namespace if not already loaded", async () => {
      mockHasResourceBundle.mockReturnValue(false);
      mockLoadNamespaces.mockResolvedValue(undefined);

      await loadNamespace("test-namespace");

      expect(mockLoadNamespaces).toHaveBeenCalledWith(["test-namespace"]);
    });

    it("should not load namespace if already loaded", async () => {
      mockHasResourceBundle.mockReturnValue(true);

      await loadNamespace("test-namespace");

      expect(mockLoadNamespaces).not.toHaveBeenCalled();
    });

    it("should handle load errors gracefully", async () => {
      mockHasResourceBundle.mockReturnValue(false);
      mockLoadNamespaces.mockRejectedValue(new Error("Load failed"));

      // Should not throw
      await expect(loadNamespace("test-namespace")).resolves.not.toThrow();
    });

    it("should use provided language", async () => {
      mockHasResourceBundle.mockReturnValue(false);
      mockLoadNamespaces.mockResolvedValue(undefined);

      await loadNamespace("test-namespace", "de");

      expect(mockLoadNamespaces).toHaveBeenCalledWith(["test-namespace"]);
    });
  });

  describe("usePluginTranslation", () => {
    it("should return translation hook", () => {
      const { result } = renderHook(() => usePluginTranslation(["test-namespace"]));

      expect(result.current.t).toBeDefined();
      expect(result.current.i18n).toBeDefined();
    });

    it("should auto-load namespaces when autoLoad is true", async () => {
      mockHasResourceBundle.mockReturnValue(false);
      mockLoadNamespaces.mockResolvedValue(undefined);

      renderHook(() => usePluginTranslation(["test-namespace"], true));

      await waitFor(() => {
        expect(mockLoadNamespaces).toHaveBeenCalled();
      });
    });

    it("should not auto-load namespaces when autoLoad is false", () => {
      renderHook(() => usePluginTranslation(["test-namespace"], false));

      expect(mockLoadNamespaces).not.toHaveBeenCalled();
    });
  });

  describe("createNamespacedKey", () => {
    it("should create namespaced key", () => {
      const result = createNamespacedKey("test", "key");
      expect(result).toBe("test:key");
    });

    it("should handle nested keys", () => {
      const result = createNamespacedKey("test", "nested.key");
      expect(result).toBe("test:nested.key");
    });
  });

  describe("createOrganizationNamespace", () => {
    it("should create organization namespace", () => {
      const result = createOrganizationNamespace("tuwien", "footer");
      expect(result).toBe("tuwien-footer");
    });

    it("should handle different organizations", () => {
      const result = createOrganizationNamespace("univie", "header");
      expect(result).toBe("univie-header");
    });
  });
});
