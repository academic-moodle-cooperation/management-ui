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
    // Only sync external changes, not changes that originated from user typing
    if (!isTypingRef.current) {
      setValue(initialValue);
    }
    isTypingRef.current = false;
  }, [initialValue]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value);
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
