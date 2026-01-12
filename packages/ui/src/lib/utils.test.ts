import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { cn, useMediaQuery } from "./utils";

describe("utils", () => {
  describe("cn", () => {
    it("should merge class names", () => {
      expect(cn("foo", "bar")).toBe("foo bar");
    });

    it("should handle conditional classes", () => {
      expect(cn("foo", false && "bar", "baz")).toBe("foo baz");
    });

    it("should merge Tailwind classes correctly", () => {
      // twMerge should handle conflicting classes
      expect(cn("p-4", "p-2")).toBe("p-2");
    });

    it("should handle empty inputs", () => {
      expect(cn()).toBe("");
      expect(cn("")).toBe("");
    });

    it("should handle arrays", () => {
      expect(cn(["foo", "bar"])).toBe("foo bar");
    });

    it("should handle objects", () => {
      expect(cn({ foo: true, bar: false, baz: true })).toBe("foo baz");
    });
  });

  describe("useMediaQuery", () => {
    let matchMediaMock: (query: string) => MediaQueryList;

    beforeEach(() => {
      matchMediaMock = vi.fn((query: string) => {
        return {
          matches: false,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        } as MediaQueryList;
      });

      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: matchMediaMock,
      });
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it("should return false initially when media query doesn't match", () => {
      const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));

      expect(result.current).toBe(false);
      expect(matchMediaMock).toHaveBeenCalledWith("(min-width: 768px)");
    });

    it("should return true when media query matches", () => {
      matchMediaMock = vi.fn((query: string) => {
        return {
          matches: true,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        } as MediaQueryList;
      });

      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: matchMediaMock,
      });

      const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));

      expect(result.current).toBe(true);
    });

    it("should update when media query changes", () => {
      let matches = false;
      let onChangeCallback: ((event: MediaQueryListEvent) => void) | null = null;

      matchMediaMock = vi.fn((query: string) => {
        const mql = {
          get matches() {
            return matches;
          },
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn((event: string, callback: (event: MediaQueryListEvent) => void) => {
            if (event === "change") {
              onChangeCallback = callback;
            }
          }),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        } as MediaQueryList;

        return mql;
      });

      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: matchMediaMock,
      });

      const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));

      expect(result.current).toBe(false);

      // Simulate media query change
      matches = true;
      if (onChangeCallback) {
        act(() => {
          (onChangeCallback as (event: MediaQueryListEvent) => void)({
            matches: true,
            media: "(min-width: 768px)",
          } as MediaQueryListEvent);
        });
      }

      expect(result.current).toBe(true);
    });
  });
});
