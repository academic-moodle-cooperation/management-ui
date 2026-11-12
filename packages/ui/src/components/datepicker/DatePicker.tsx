import { CalendarIcon } from "lucide-react";
import React, { type FC } from "react";

import { formatDate } from "@oc-mui/i18n";

import { cn } from "../../lib";
import { Button, Popover, PopoverContent, PopoverTrigger, Calendar } from "../ui";

/**
 * Props of {@link DatePicker}.
 */
export interface DatePickerProps {
  /** The selected date. While it is `undefined`, the trigger shows `children`. */
  date: Date | undefined;
  /**
   * Called when the user picks a date. Receives `undefined` when the user
   * picks the selected date again, which clears it.
   */
  onDateChange: ((date: Date | undefined) => void) | undefined;
  /** Placeholder shown in the trigger while no date is selected. */
  children?: React.ReactNode;
}

/**
 * A button that shows a date and opens a {@link Calendar} to change it.
 */
const DatePicker: FC<DatePickerProps> = ({ date, onDateChange, children }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn("w-[240px] pl-3 text-left font-normal", !date && "text-muted-foreground")}
        >
          {/* Numeric day/month/year — `Intl`'s own default, i.e. exactly what
              the previous hardcoded `de-DE` formatter rendered. Only the
              locale changes; the trigger keeps its short numeric date. */}
          {date
            ? formatDate(date, { year: "numeric", month: "numeric", day: "numeric" })
            : children}
          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="sidebar-portal-inside w-auto p-0" align="start">
        <Calendar
          selected={date}
          onSelect={onDateChange}
          disabled={(day) => day < new Date("1900-01-01")}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
};

export { DatePicker };
