import * as React from "react";

import { cn } from "../../lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      // Component variables, see "Component variables" in `styles/globals.css`.
      // Each fallback is the value the field has always had.
      className={cn(
        "flex w-full min-w-0 text-base shadow-xs transition-[color,box-shadow] outline-none",
        "file:text-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "selection:bg-primary selection:text-primary-foreground",
        "disabled:pointer-events-none disabled:cursor-not-allowed",
        "h-[var(--input-height,var(--control-height))]",
        "rounded-[var(--input-radius,var(--control-radius))]",
        "border-[length:var(--input-border-width,var(--control-border-width))]",
        "border-[color:var(--input-border-color,var(--input))]",
        "bg-[color:var(--input-bg,transparent)]",
        "dark:bg-[color:var(--input-bg,color-mix(in_oklab,var(--input)_30%,transparent))]",
        "px-[var(--input-padding-x)]",
        "py-[var(--input-padding-y,0.25rem)]",
        "md:text-[length:var(--input-font-size,var(--control-font-size))]",
        "md:leading-[var(--input-line-height,var(--control-line-height))]",
        "placeholder:text-[color:var(--input-color-placeholder,var(--muted-foreground))]",
        "disabled:opacity-[var(--input-opacity-disabled,var(--control-opacity-disabled,0.5))]",
        "focus-visible:border-[color:var(--input-border-color-focus,var(--ring))]",
        "focus-visible:ring-[color:var(--input-ring-color-focus,var(--focus-ring-color,color-mix(in_oklab,var(--ring)_50%,transparent)))]",
        "focus-visible:ring-[length:var(--input-ring-width-focus,var(--focus-ring-width))]",
        "aria-invalid:border-[color:var(--input-border-color-invalid,var(--destructive))]",
        "aria-invalid:ring-[color:var(--input-ring-color-invalid,color-mix(in_oklab,var(--destructive)_20%,transparent))]",
        "dark:aria-invalid:ring-[color:var(--input-ring-color-invalid,color-mix(in_oklab,var(--destructive)_40%,transparent))]",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
