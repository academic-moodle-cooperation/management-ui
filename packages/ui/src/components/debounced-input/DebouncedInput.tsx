import React, { useState, useEffect, useRef, type InputHTMLAttributes } from "react";

import { cn } from "../../lib/utils"; // Adjusted path
import { Input } from "../ui/input"; // Adjusted path

export interface DebouncedInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string | number;
  onChange: (value: string | number) => void;
  debounce?: number;
}

export const DebouncedInput = ({
  value: initialValue,
  onChange,
  debounce = 500,
  className,
  ...props
}: DebouncedInputProps) => {
  const [value, setValue] = useState<string | number>(initialValue);
  const isTypingRef = useRef(false);

  useEffect(() => {
    // Only sync external changes when user is not actively typing
    // This prevents the input from resetting while user is typing on tablets
    if (!isTypingRef.current && value !== initialValue) {
      setValue(initialValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValue]); // Intentionally excluding value to avoid infinite loop

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value);
      // After debounce completes, mark that we're no longer typing
      isTypingRef.current = false;
    }, debounce);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, debounce]); // Intentionally excluding onChange to prevent infinite re-renders

  return (
    <Input
      {...props}
      value={value}
      onChange={(e) => {
        isTypingRef.current = true;
        setValue(e.target.value);
      }}
      className={cn(className)}
    />
  );
};
