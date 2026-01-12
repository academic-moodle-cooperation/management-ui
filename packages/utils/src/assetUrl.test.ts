import { describe, it, expect, beforeEach, vi } from "vitest";
import { resolveAssetUrl, resolveFirstAssetUrl } from "./assetUrl";

describe("assetUrl utilities", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("resolveAssetUrl", () => {
    it("should return empty string for null or undefined", () => {
      expect(resolveAssetUrl(null)).toBe("");
      expect(resolveAssetUrl(undefined)).toBe("");
    });

    it("should return empty string for empty string", () => {
      expect(resolveAssetUrl("")).toBe("");
    });

    it("should return the URL as-is if it starts with http:// or https://", () => {
      expect(resolveAssetUrl("https://example.com/image.jpg")).toBe(
        "https://example.com/image.jpg"
      );
      expect(resolveAssetUrl("http://example.com/image.jpg")).toBe("http://example.com/image.jpg");
    });

    it("should prepend base URL for relative paths", () => {
      process.env.VITE_ASSET_BASE_URL = "https://cdn.example.com";
      const result = resolveAssetUrl("/images/logo.png");
      expect(result).toContain("/images/logo.png");
    });

    it("should handle paths without leading slash", () => {
      process.env.VITE_ASSET_BASE_URL = "https://cdn.example.com";
      const result = resolveAssetUrl("images/logo.png");
      expect(result).toContain("images/logo.png");
    });
  });

  describe("resolveFirstAssetUrl", () => {
    it("should return empty string for empty array", () => {
      expect(resolveFirstAssetUrl([])).toBe("");
    });

    it("should return first valid URL from array", () => {
      const urls = ["/image1.jpg", "/image2.jpg", "/image3.jpg"];
      const result = resolveFirstAssetUrl(urls);
      expect(result).toBeTruthy();
      expect(result).toContain("image1.jpg");
    });

    it("should skip null/undefined values and return first valid URL", () => {
      const urls = [null, undefined, "/image.jpg", "/image2.jpg"];
      const result = resolveFirstAssetUrl(urls);
      expect(result).toBeTruthy();
      expect(result).toContain("image.jpg");
    });

    it("should return empty string if all values are null/undefined", () => {
      expect(resolveFirstAssetUrl([null, undefined, null])).toBe("");
    });
  });
});
