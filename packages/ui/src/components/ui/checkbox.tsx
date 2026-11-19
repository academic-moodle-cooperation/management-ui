import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { CheckIcon } from "lucide-react";
import * as React from "react";

import { cn } from "../../lib/utils";

function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      // Component variables, see "Component variables" in `styles/globals.css`.
      // Each fallback is the value the checkbox has always had.
      className={cn(
        "peer shrink-0 shadow-xs transition-shadow outline-none disabled:cursor-not-allowed",
        "size-[var(--checkbox-size,1rem)]",
        "rounded-[var(--checkbox-radius,4px)]",
        "border-[length:var(--checkbox-border-width,1px)]",
        "border-[color:var(--checkbox-border-color,var(--input))]",
        "bg-[color:var(--checkbox-bg,transparent)]",
        "dark:bg-[color:var(--checkbox-bg,color-mix(in_oklab,var(--input)_30%,transparent))]",
        "data-[state=checked]:bg-[color:var(--checkbox-bg-checked,var(--primary))]",
        "dark:data-[state=checked]:bg-[color:var(--checkbox-bg-checked,var(--primary))]",
        "data-[state=checked]:text-[color:var(--checkbox-color-checked,var(--primary-foreground))]",
        "data-[state=checked]:border-[color:var(--checkbox-border-color-checked,var(--primary))]",
        "disabled:opacity-[var(--checkbox-opacity-disabled,var(--control-opacity-disabled,0.5))]",
        "focus-visible:border-[color:var(--checkbox-border-color-focus,var(--ring))]",
        "focus-visible:ring-[color:var(--checkbox-ring-color-focus,var(--focus-ring-color,color-mix(in_oklab,var(--ring)_50%,transparent)))]",
        "focus-visible:ring-[length:var(--checkbox-ring-width-focus,var(--focus-ring-width))]",
        "aria-invalid:border-[color:var(--checkbox-border-color-invalid,var(--destructive))]",
        "aria-invalid:ring-[color:var(--checkbox-ring-color-invalid,color-mix(in_oklab,var(--destructive)_20%,transparent))]",
        "dark:aria-invalid:ring-[color:var(--checkbox-ring-color-invalid,color-mix(in_oklab,var(--destructive)_40%,transparent))]",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current transition-none"
      >
        <CheckIcon className="size-[var(--checkbox-indicator-size,0.875rem)]" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
