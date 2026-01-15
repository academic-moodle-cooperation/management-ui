import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import { useTableNavigation } from "./useTableNavigation";

describe("useTableNavigation", () => {
  it("should calculate correct navigation state", () => {
    const setPageIndex = vi.fn();
    const { result } = renderHook(() => useTableNavigation(0, 10, setPageIndex, 100));

    expect(result.current.canPreviousPage).toBe(false);
    expect(result.current.canNextPage).toBe(true);
    expect(result.current.totalRows).toBe(100);
  });

  it("should handle first page correctly", () => {
    const setPageIndex = vi.fn();
    const { result } = renderHook(() => useTableNavigation(0, 10, setPageIndex, 100));

    expect(result.current.canPreviousPage).toBe(false);
    expect(result.current.canNextPage).toBe(true);
  });

  it("should handle last page correctly", () => {
    const setPageIndex = vi.fn();
    const { result } = renderHook(() => useTableNavigation(9, 10, setPageIndex, 100));

    expect(result.current.canPreviousPage).toBe(true);
    expect(result.current.canNextPage).toBe(false);
  });

  it("should handle middle page correctly", () => {
    const setPageIndex = vi.fn();
    const { result } = renderHook(() => useTableNavigation(4, 10, setPageIndex, 100));

    expect(result.current.canPreviousPage).toBe(true);
    expect(result.current.canNextPage).toBe(true);
  });

  it("should handle single page", () => {
    const setPageIndex = vi.fn();
    const { result } = renderHook(() => useTableNavigation(0, 1, setPageIndex, 10));

    expect(result.current.canPreviousPage).toBe(false);
    expect(result.current.canNextPage).toBe(false);
  });

  it("should handle empty table", () => {
    const setPageIndex = vi.fn();
    const { result } = renderHook(() => useTableNavigation(0, 1, setPageIndex, 0));

    expect(result.current.totalRows).toBe(0);
    expect(result.current.canPreviousPage).toBe(false);
    expect(result.current.canNextPage).toBe(false);
  });

  it("should provide goToFirstPage function", () => {
    const setPageIndex = vi.fn();
    const { result } = renderHook(() => useTableNavigation(5, 10, setPageIndex, 100));

    act(() => {
      result.current.goToFirstPage();
    });

    expect(setPageIndex).toHaveBeenCalledWith(0);
  });

  it("should provide goToLastPage function", () => {
    const setPageIndex = vi.fn();
    const { result } = renderHook(() => useTableNavigation(0, 10, setPageIndex, 100));

    act(() => {
      result.current.goToLastPage();
    });

    expect(setPageIndex).toHaveBeenCalledWith(9); // 0-indexed
  });

  it("should provide goToNextPage function", () => {
    const setPageIndex = vi.fn();
    const { result } = renderHook(() => useTableNavigation(0, 10, setPageIndex, 100));

    act(() => {
      result.current.goToNextPage();
    });

    expect(setPageIndex).toHaveBeenCalledWith(1);
  });

  it("should provide goToPreviousPage function", () => {
    const setPageIndex = vi.fn();
    const { result } = renderHook(() => useTableNavigation(5, 10, setPageIndex, 100));

    act(() => {
      result.current.goToPreviousPage();
    });

    expect(setPageIndex).toHaveBeenCalledWith(4);
  });

  it("should not go to previous page when on first page", () => {
    const setPageIndex = vi.fn();
    const { result } = renderHook(() => useTableNavigation(0, 10, setPageIndex, 100));

    act(() => {
      result.current.goToPreviousPage();
    });

    expect(setPageIndex).not.toHaveBeenCalled();
  });

  it("should not go to next page when on last page", () => {
    const setPageIndex = vi.fn();
    const { result } = renderHook(() => useTableNavigation(9, 10, setPageIndex, 100));

    act(() => {
      result.current.goToNextPage();
    });

    expect(setPageIndex).not.toHaveBeenCalled();
  });
});
