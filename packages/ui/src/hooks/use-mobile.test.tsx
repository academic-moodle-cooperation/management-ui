import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { useIsMobile } from "./use-mobile";

describe("useIsMobile", () => {
  let matchMediaMock: (query: string) => MediaQueryList;

  beforeEach(() => {
    // Mock window.innerWidth
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024, // Desktop width
    });

    matchMediaMock = vi.fn((query: string) => {
      const matches = query === "(max-width: 767px)";
      return {
        matches,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn((event: string, callback: () => void) => {
          if (event === "change") {
            // Store callback for later
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (matchMediaMock as any)._changeCallback = callback;
          }
        }),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      } as MediaQueryList;
    });

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: matchMediaMock,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return false for desktop width", async () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });

    const { result } = renderHook(() => useIsMobile());

    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });

  it("should return true for mobile width", async () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 500,
    });

    matchMediaMock = vi.fn((query: string) => {
      const matches = query === "(max-width: 767px)";
      return {
        matches,
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
      configurable: true,
      value: matchMediaMock,
    });

    const { result } = renderHook(() => useIsMobile());

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });
});
