import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSidebarContent } from "./useSidebarContent";

describe("useSidebarContent", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("should initialize with default values", () => {
    const { result } = renderHook(() => useSidebarContent());

    expect(result.current.textCopied).toBe(false);
    expect(result.current.updateField).toBe("");
  });

  it("should set textCopied to true when handleTextCopied is called", () => {
    const { result } = renderHook(() => useSidebarContent());

    act(() => {
      result.current.setTextCopied();
    });

    expect(result.current.textCopied).toBe(true);
  });

  it("should reset textCopied after 5 seconds", () => {
    const { result } = renderHook(() => useSidebarContent());

    act(() => {
      result.current.setTextCopied();
    });

    expect(result.current.textCopied).toBe(true);

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.textCopied).toBe(false);
  });

  it("should update updateField", () => {
    const { result } = renderHook(() => useSidebarContent());

    act(() => {
      result.current.setUpdateField("test-field");
    });

    expect(result.current.updateField).toBe("test-field");
  });

  it("should clear timeout when textCopied changes before timeout", () => {
    const { result } = renderHook(() => useSidebarContent());

    act(() => {
      result.current.setTextCopied();
    });

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Set again before timeout completes
    act(() => {
      result.current.setTextCopied();
    });

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Should still be true (new timeout started)
    expect(result.current.textCopied).toBe(true);

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // Now should be false
    expect(result.current.textCopied).toBe(false);
  });
});
