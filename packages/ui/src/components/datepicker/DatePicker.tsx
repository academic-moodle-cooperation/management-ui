import { CalendarIcon } from "lucide-react";
import React, { type FC } from "react";

import { formatDate } from "@oc-mui/i18n";

import { cn } from "../../lib";
import { Button, Popover, PopoverContent, PopoverTrigger, Calendar } from "../ui";

import type { SelectSingleEventHandler } from "react-day-picker";

interface DatePickerProps {
  date: Date | undefined;
  onDateChange: SelectSingleEventHandler | undefined;
  children?: React.ReactNode;
}

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
          mode="single"
          {...(date !== undefined && { selected: date })}
          {...(onDateChange !== undefined && { onSelect: onDateChange })}
          disabled={(date) => date < new Date("1900-01-01")}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
};

export { DatePicker };
