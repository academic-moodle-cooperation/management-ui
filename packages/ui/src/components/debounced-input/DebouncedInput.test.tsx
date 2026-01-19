import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";

import { DebouncedInput } from "./DebouncedInput";

describe("DebouncedInput", () => {
  it("should render with initial value", () => {
    const onChange = vi.fn();
    render(<DebouncedInput value="test" onChange={onChange} />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("test");
  });

  it("should debounce onChange calls", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<DebouncedInput value="" onChange={onChange} debounce={300} />);

    const input = screen.getByRole("textbox");

    await user.type(input, "hello");

    // onChange should not be called immediately
    expect(onChange).not.toHaveBeenCalled();

    // Wait for debounce delay
    await waitFor(
      () => {
        expect(onChange).toHaveBeenCalled();
      },
      { timeout: 500 },
    );
  });

  it("should not reset input value while user is typing", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    const { rerender } = render(<DebouncedInput value="" onChange={onChange} debounce={200} />);

    const input = screen.getByRole("textbox");

    // Simulate user typing
    await user.type(input, "test");

    // Simulate parent component re-rendering with the same value
    // This should NOT reset the input value while user is typing
    rerender(<DebouncedInput value="" onChange={onChange} debounce={200} />);

    // Input should still have the typed value
    expect(input).toHaveValue("test");
  });

  it("should update when external value prop changes", async () => {
    const onChange = vi.fn();

    const { rerender } = render(<DebouncedInput value="initial" onChange={onChange} />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("initial");

    // External value change (e.g., from reset button)
    rerender(<DebouncedInput value="external change" onChange={onChange} />);

    // Input should update to external value after user is not typing
    await waitFor(() => {
      expect(input).toHaveValue("external change");
    });
  });

  it("should handle rapid typing without resetting", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<DebouncedInput value="" onChange={onChange} debounce={300} />);

    const input = screen.getByRole("textbox");

    // Simulate rapid typing (common on mobile keyboards)
    await user.type(input, "h");
    await user.type(input, "e");
    await user.type(input, "l");
    await user.type(input, "l");
    await user.type(input, "o");

    // Input should have all typed characters
    expect(input).toHaveValue("hello");

    // Wait for debounce
    await waitFor(
      () => {
        expect(onChange).toHaveBeenCalledWith("hello");
      },
      { timeout: 500 },
    );
  });
});
