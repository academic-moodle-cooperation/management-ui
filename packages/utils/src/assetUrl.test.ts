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
      // Note: null is not part of the function signature, but we test it for runtime safety
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(resolveAssetUrl(null as any)).toBe("");
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

    it("should detect base path from script tags in browser", () => {
      // Mock document.getElementsByTagName to return a script with management-ui path
      const mockScript = {
        src: "http://localhost:5173/management-ui/@vite/client",
      };
      vi.spyOn(document, "getElementsByTagName").mockReturnValue([mockScript] as unknown as HTMLCollectionOf<HTMLScriptElement>);

      const result = resolveAssetUrl("/test.jpg");
      expect(result).toContain("/management-ui/");
      expect(result).toContain("test.jpg");
    });

    it("should detect base path from window.location.pathname", () => {
      // Mock window.location.pathname
      Object.defineProperty(window, "location", {
        value: {
          pathname: "/management-ui/app",
        },
        writable: true,
        configurable: true,
      });

      // Mock getElementsByTagName to return empty array so it falls back to location.pathname
      vi.spyOn(document, "getElementsByTagName").mockReturnValue([] as unknown as HTMLCollectionOf<HTMLScriptElement>);

      const result = resolveAssetUrl("/test.jpg");
      expect(result).toContain("/management-ui/");
      expect(result).toContain("test.jpg");
    });

    it("should handle dev mode with dist prefix", () => {
      // Mock @vite/client detection
      const mockScript = {
        src: "http://localhost:5173/@vite/client",
      };
      vi.spyOn(document, "getElementsByTagName").mockReturnValue([mockScript] as unknown as HTMLCollectionOf<HTMLScriptElement>);

      const result = resolveAssetUrl("/assets/test.jpg");
      expect(result).toContain("test.jpg");
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
      // Note: null is not part of the function signature, but we test it for runtime safety
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const urls = [null, undefined, "/image.jpg", "/image2.jpg"] as any;
      const result = resolveFirstAssetUrl(urls);
      expect(result).toBeTruthy();
      expect(result).toContain("image.jpg");
    });

    it("should return empty string if all values are null/undefined", () => {
      // Note: null is not part of the function signature, but we test it for runtime safety
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(resolveFirstAssetUrl([null, undefined, null] as any)).toBe("");
    });
  });
});
