import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { DebouncedInput } from "./DebouncedInput";

describe("DebouncedInput", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("does not emit onChange on initial render", () => {
    const onChange = vi.fn();

    render(<DebouncedInput value="" onChange={onChange} />);

    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  it("debounces user-entered changes", () => {
    const onChange = vi.fn();

    render(<DebouncedInput value="" onChange={onChange} debounce={300} />);

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "page 2" } });

    act(() => {
      vi.advanceTimersByTime(299);
    });

    expect(onChange).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(onChange).toHaveBeenCalledWith("page 2");
  });

  it("does not emit when rerendered from an external value sync", () => {
    const onChange = vi.fn();
    const { rerender } = render(<DebouncedInput value="" onChange={onChange} />);

    rerender(<DebouncedInput value="persisted query" onChange={onChange} />);

    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(onChange).not.toHaveBeenCalled();
  });
});
