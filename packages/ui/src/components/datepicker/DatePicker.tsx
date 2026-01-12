import React, { FC } from "react";
import { CalendarIcon } from "lucide-react";
import { cn } from "@workspace/ui/lib";
import { Button } from "@workspace/ui/components";
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components";
import { Calendar } from "@workspace/ui/components";
import { SelectSingleEventHandler } from "react-day-picker";

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
          {date ? new Intl.DateTimeFormat("de-DE").format(new Date(date)) : children}
          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="sidebar-portal-inside w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onDateChange}
          disabled={(date) => date < new Date("1900-01-01")}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
};

export { DatePicker };
