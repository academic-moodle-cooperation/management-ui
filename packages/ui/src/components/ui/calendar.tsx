"use client";

import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";
import {
  CaptionLabel as DayPickerCaptionLabel,
  Day as DayPickerDay,
  DayPicker,
  getDefaultClassNames,
  Month as DayPickerMonth,
  MonthCaption as DayPickerMonthCaption,
  MonthGrid as DayPickerMonthGrid,
  Months as DayPickerMonths,
  Nav as DayPickerNav,
  NextMonthButton as DayPickerNextMonthButton,
  PreviousMonthButton as DayPickerPreviousMonthButton,
  Week as DayPickerWeek,
  Weekday as DayPickerWeekday,
  Weekdays as DayPickerWeekdays,
  Weeks as DayPickerWeeks,
  type DayButton,
} from "react-day-picker";

import { cn } from "../../lib/utils";

import { buttonVariants } from "./button";

/**
 * Wraps one of react-day-picker's parts so the rendered element carries fixed
 * marks (`data-slot`, and the button marks where the part looks like a
 * button). The library's own part does the rendering, so behaviour and
 * markup stay the library's.
 */
function withMarks<P extends object>(
  Part: React.ComponentType<P>,
  marks: Record<`data-${string}`, string>,
) {
  const Marked = (props: P) => <Part {...marks} {...props} />;
  Marked.displayName = `Calendar(${marks["data-slot"]})`;
  return Marked;
}

/** The month navigation uses the outline button look, see `classNames` below. */
const NAV_BUTTON_MARKS = {
  "data-slot": "calendar-nav-button",
  "data-ui-button": "",
  "data-variant": "outline",
  "data-size": "default",
} as const;

// Module level: a stable identity per part, so a re-render of the calendar
// does not remount its cells.
const CALENDAR_PARTS = {
  Months: withMarks(DayPickerMonths, { "data-slot": "calendar-months" }),
  Month: withMarks(DayPickerMonth, { "data-slot": "calendar-month" }),
  Nav: withMarks(DayPickerNav, { "data-slot": "calendar-nav" }),
  PreviousMonthButton: withMarks(DayPickerPreviousMonthButton, NAV_BUTTON_MARKS),
  NextMonthButton: withMarks(DayPickerNextMonthButton, NAV_BUTTON_MARKS),
  MonthCaption: withMarks(DayPickerMonthCaption, { "data-slot": "calendar-caption" }),
  CaptionLabel: withMarks(DayPickerCaptionLabel, { "data-slot": "calendar-caption-label" }),
  MonthGrid: withMarks(DayPickerMonthGrid, { "data-slot": "calendar-grid" }),
  Weekdays: withMarks(DayPickerWeekdays, { "data-slot": "calendar-weekdays" }),
  Weekday: withMarks(DayPickerWeekday, { "data-slot": "calendar-weekday" }),
  Weeks: withMarks(DayPickerWeeks, { "data-slot": "calendar-weeks" }),
  Week: withMarks(DayPickerWeek, { "data-slot": "calendar-week" }),
  Day: withMarks(DayPickerDay, { "data-slot": "calendar-day" }),
};

/**
 * Props of {@link Calendar}.
 *
 * Owned by `@oc-mui/ui`: callers do not depend on the date-picker library
 * that renders the calendar, so that library can change without breaking
 * them. The calendar selects a single day.
 */
export interface CalendarProps {
  /** The selected day. */
  selected?: Date | undefined;
  /**
   * Called when the user picks a day. Receives `undefined` when the user
   * picks the selected day again, which clears the selection.
   */
  onSelect?: ((date: Date | undefined) => void) | undefined;
  /** Returns `true` for days the user must not pick. */
  disabled?: ((date: Date) => boolean) | undefined;
  /** The month shown first. Defaults to the current month. */
  defaultMonth?: Date | undefined;
  /** Show the days of the previous and next month that fill the first and last week. Defaults to `true`. */
  showOutsideDays?: boolean | undefined;
  /** Move the focus into the calendar on mount: to the selected day, else to today. */
  autoFocus?: boolean | undefined;
  /** Extra class names for the calendar's root element. */
  className?: string | undefined;
}

/**
 * A month calendar for picking one day.
 *
 * Styling follows shadcn/ui's calendar template for react-day-picker v9+,
 * trimmed to single-day selection (no range, dropdown or week-number parts,
 * because {@link CalendarProps} does not expose them). The month navigation
 * keeps the outlined buttons of the earlier calendar, so the look did not
 * change with the library upgrade.
 */
function Calendar({
  selected,
  onSelect,
  disabled,
  defaultMonth,
  showOutsideDays = true,
  autoFocus,
  className,
}: CalendarProps) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      mode="single"
      selected={selected}
      {...(onSelect !== undefined && { onSelect: (date: Date | undefined) => onSelect(date) })}
      disabled={disabled}
      {...(defaultMonth !== undefined && { defaultMonth })}
      {...(autoFocus !== undefined && { autoFocus })}
      showOutsideDays={showOutsideDays}
      // react-day-picker forwards `data-*` props to its root element.
      {...{ "data-slot": "calendar" }}
      className={cn(
        "group/calendar bg-background p-3 [--cell-size:--spacing(8)] [[data-slot=popover-content]_&]:bg-transparent",
        className,
      )}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn("relative flex flex-col gap-4 md:flex-row", defaultClassNames.months),
        month: cn("flex w-full flex-col gap-4", defaultClassNames.month),
        nav: cn(
          "absolute inset-x-0 top-0 flex h-(--cell-size) w-full items-center justify-between gap-1 px-1",
          defaultClassNames.nav,
        ),
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "size-7 bg-transparent p-0 opacity-50 select-none hover:opacity-100",
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "size-7 bg-transparent p-0 opacity-50 select-none hover:opacity-100",
          defaultClassNames.button_next,
        ),
        month_caption: cn(
          "flex h-(--cell-size) w-full items-center justify-center px-(--cell-size)",
          defaultClassNames.month_caption,
        ),
        caption_label: cn("text-sm font-medium select-none", defaultClassNames.caption_label),
        month_grid: cn("w-full border-collapse", defaultClassNames.month_grid),
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "flex-1 rounded-md text-[0.8rem] font-normal text-muted-foreground select-none",
          defaultClassNames.weekday,
        ),
        week: cn("mt-2 flex w-full", defaultClassNames.week),
        day: cn(
          "group/day relative aspect-square h-full w-full p-0 text-center select-none",
          defaultClassNames.day,
        ),
        today: cn(
          "rounded-md bg-accent text-accent-foreground",
          defaultClassNames.today,
        ),
        outside: cn(
          "text-muted-foreground aria-selected:text-muted-foreground",
          defaultClassNames.outside,
        ),
        disabled: cn("text-muted-foreground opacity-50", defaultClassNames.disabled),
        hidden: cn("invisible", defaultClassNames.hidden),
      }}
      components={{
        ...CALENDAR_PARTS,
        Chevron: ({ className, orientation, ...props }) => {
          const Icon =
            orientation === "left"
              ? ChevronLeft
              : orientation === "right"
                ? ChevronRight
                : ChevronDown;
          return <Icon className={cn("size-4", className)} {...props} />;
        },
        DayButton: CalendarDayButton,
      }}
    />
  );
}

/**
 * The button inside each day cell. Replacing react-day-picker's own day
 * button means taking over its focus handling: keyboard navigation moves the
 * `focused` modifier, and this effect moves the DOM focus along with it.
 *
 * It borrows the ghost button's look but is a calendar cell, not a button of
 * the interface: it carries its own slot and not `data-ui-button`, so a theme
 * rule for buttons does not reach the days.
 *
 * A plain `<button>` with the button styles rather than `Button`: the effect
 * needs a ref, and `Button` only receives one under React 19, while
 * `@oc-mui/ui` also supports React 18.
 */
function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames();

  const ref = React.useRef<HTMLButtonElement>(null);
  const focused = modifiers["focused"];
  React.useEffect(() => {
    if (focused) ref.current?.focus();
  }, [focused]);

  return (
    <button
      ref={ref}
      data-slot="calendar-day-button"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={modifiers["selected"]}
      className={cn(
        buttonVariants({ variant: "ghost", size: "icon" }),
        "flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-[3px] group-data-[focused=true]/day:ring-ring/50 data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground dark:hover:text-accent-foreground",
        defaultClassNames.day,
        className,
      )}
      {...props}
    />
  );
}

export { Calendar };
