import { renderHook, act } from "@testing-library/react";
import { createRef } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { useClickOutside } from "./useClickOutside";

describe("useClickOutside", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call handler when clicking outside refs", () => {
    const handler = vi.fn();
    const ref1 = createRef<HTMLDivElement>();
    const ref2 = createRef<HTMLDivElement>();

    // Create mock elements
    const element1 = document.createElement("div");
    const element2 = document.createElement("div");
    ref1.current = element1;
    ref2.current = element2;
    document.body.appendChild(element1);
    document.body.appendChild(element2);

    renderHook(() => useClickOutside([ref1, ref2], handler));

    // Simulate click outside
    const outsideElement = document.createElement("div");
    document.body.appendChild(outsideElement);

    act(() => {
      const clickEvent = new MouseEvent("mousedown", { bubbles: true });
      outsideElement.dispatchEvent(clickEvent);
    });

    expect(handler).toHaveBeenCalled();
  });

  it("should not call handler when clicking inside refs", () => {
    const handler = vi.fn();
    const ref = createRef<HTMLDivElement>();

    // Create mock element
    const element = document.createElement("div");
    ref.current = element;
    document.body.appendChild(element);

    renderHook(() => useClickOutside([ref], handler));

    // Simulate click inside
    act(() => {
      const clickEvent = new MouseEvent("mousedown", { bubbles: true });
      element.dispatchEvent(clickEvent);
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it("should handle empty refs array", () => {
    const handler = vi.fn();

    renderHook(() => useClickOutside([], handler));

    // Click anywhere
    act(() => {
      const clickEvent = new MouseEvent("mousedown", { bubbles: true });
      document.body.dispatchEvent(clickEvent);
    });

    // Should still call handler if no refs to check
    expect(handler).toHaveBeenCalled();
  });

  it("should handle null refs", () => {
    const handler = vi.fn();
    const ref = createRef<HTMLDivElement>();
    ref.current = null;

    renderHook(() => useClickOutside([ref], handler));

    // Click anywhere
    act(() => {
      const clickEvent = new MouseEvent("mousedown", { bubbles: true });
      document.body.dispatchEvent(clickEvent);
    });

    // Should call handler when ref is null
    expect(handler).toHaveBeenCalled();
  });
});
