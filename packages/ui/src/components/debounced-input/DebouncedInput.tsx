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
  const previousExternalValue = useRef(initialValue);
  const hasMounted = useRef(false);

  useEffect(() => {
    previousExternalValue.current = initialValue;
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }

    // Ignore remounts and parent-driven value sync so only user edits are debounced outward.
    if (Object.is(value, previousExternalValue.current)) {
      return;
    }

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
      onChange={(e) => setValue(e.target.value)}
      className={cn(className)}
    />
  );
};
