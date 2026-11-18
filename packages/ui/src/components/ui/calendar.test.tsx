import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Calendar } from "./calendar";

const MARCH_2024 = new Date(2024, 2, 1);

/** The day button for `yyyy-MM-dd`, looked up by the day cell's ISO date. */
function dayButton(container: HTMLElement, isoDate: string): HTMLButtonElement {
  const button = container.querySelector<HTMLButtonElement>(`td[data-day="${isoDate}"] button`);
  if (!button) throw new Error(`no day button for ${isoDate}`);
  return button;
}

describe("Calendar", () => {
  it("opens on defaultMonth and reports a picked day as a plain Date", () => {
    const onSelect = vi.fn();
    const { container } = render(<Calendar defaultMonth={MARCH_2024} onSelect={onSelect} />);

    fireEvent.click(dayButton(container, "2024-03-15"));

    expect(onSelect).toHaveBeenCalledTimes(1);
    // Only the date crosses the boundary — no library-specific extra arguments.
    expect(onSelect.mock.calls[0]).toEqual([new Date(2024, 2, 15)]);
  });

  it("clears the selection when the selected day is picked again", () => {
    const onSelect = vi.fn();
    const { container } = render(
      <Calendar
        defaultMonth={MARCH_2024}
        selected={new Date(2024, 2, 15)}
        onSelect={onSelect}
      />,
    );

    fireEvent.click(dayButton(container, "2024-03-15"));

    expect(onSelect).toHaveBeenCalledWith(undefined);
  });

  it("does not report days that `disabled` rules out", () => {
    const onSelect = vi.fn();
    const { container } = render(
      <Calendar
        defaultMonth={MARCH_2024}
        disabled={(date) => date.getDate() === 15}
        onSelect={onSelect}
      />,
    );

    const disabledDay = dayButton(container, "2024-03-15");
    expect(disabledDay.disabled).toBe(true);
    fireEvent.click(disabledDay);

    expect(onSelect).not.toHaveBeenCalled();
  });

  it("moves between months with the navigation buttons", () => {
    const { container, getByRole } = render(<Calendar defaultMonth={MARCH_2024} />);

    fireEvent.click(getByRole("button", { name: /next month/i }));
    expect(container.querySelector('td[data-day="2024-04-15"]')).not.toBeNull();

    fireEvent.click(getByRole("button", { name: /previous month/i }));
    fireEvent.click(getByRole("button", { name: /previous month/i }));
    expect(container.querySelector('td[data-day="2024-02-15"]')).not.toBeNull();
  });

  it("focuses the selected day on mount and moves the focus with the arrow keys", () => {
    const { container } = render(
      <Calendar defaultMonth={MARCH_2024} selected={new Date(2024, 2, 15)} autoFocus />,
    );

    expect(document.activeElement).toBe(dayButton(container, "2024-03-15"));

    fireEvent.keyDown(document.activeElement as Element, { key: "ArrowRight" });
    expect(document.activeElement).toBe(dayButton(container, "2024-03-16"));

    fireEvent.keyDown(document.activeElement as Element, { key: "ArrowDown" });
    expect(document.activeElement).toBe(dayButton(container, "2024-03-23"));
  });
});
