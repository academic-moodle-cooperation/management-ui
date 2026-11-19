import * as React from "react";

import { cn } from "../../lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-[color:var(--textarea-border-color,var(--input))] placeholder:text-[color:var(--textarea-color-placeholder,var(--muted-foreground))] focus-visible:border-[color:var(--textarea-border-color-focus,var(--ring))] focus-visible:ring-[color:var(--textarea-ring-color-focus,var(--focus-ring-color,color-mix(in_oklab,var(--ring)_50%,transparent)))] aria-invalid:ring-[color:var(--textarea-ring-color-invalid,color-mix(in_oklab,var(--destructive)_20%,transparent))] dark:aria-invalid:ring-[color:var(--textarea-ring-color-invalid,color-mix(in_oklab,var(--destructive)_40%,transparent))] aria-invalid:border-[color:var(--textarea-border-color-invalid,var(--destructive))] dark:bg-[color:var(--textarea-bg,color-mix(in_oklab,var(--input)_30%,transparent))] flex field-sizing-content min-h-[var(--textarea-min-height,4rem)] w-full rounded-[var(--textarea-radius,calc(var(--radius)_-_2px))] border-[length:var(--textarea-border-width,1px)] bg-[color:var(--textarea-bg,transparent)] px-[var(--textarea-padding-x,0.75rem)] py-[var(--textarea-padding-y,0.5rem)] text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[length:var(--textarea-ring-width-focus,var(--focus-ring-width,3px))] disabled:cursor-not-allowed disabled:opacity-[var(--textarea-opacity-disabled,var(--control-opacity-disabled,0.5))] md:text-[length:var(--textarea-font-size,0.875rem)]/[var(--textarea-line-height,calc(1.25/0.875))]",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
