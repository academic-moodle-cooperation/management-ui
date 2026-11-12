import * as React from "react";

import { cn } from "../../lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-[var(--control-height)] w-full min-w-0 rounded-[var(--control-radius)] border-[length:var(--control-border-width)] bg-transparent px-[var(--input-padding-x)] py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-[length:var(--control-font-size)] md:leading-[var(--control-line-height)]",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[length:var(--focus-ring-width)]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
