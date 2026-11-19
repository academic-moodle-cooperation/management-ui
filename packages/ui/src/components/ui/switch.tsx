import * as SwitchPrimitive from "@radix-ui/react-switch";
import * as React from "react";

import { cn } from "../../lib/utils";

function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer data-[state=checked]:bg-[color:var(--switch-bg-checked,var(--primary))] data-[state=unchecked]:bg-[color:var(--switch-bg-unchecked,var(--input))] focus-visible:border-[color:var(--switch-border-color-focus,var(--ring))] focus-visible:ring-[color:var(--switch-ring-color-focus,var(--focus-ring-color,color-mix(in_oklab,var(--ring)_50%,transparent)))] dark:data-[state=unchecked]:bg-[color:var(--switch-bg-unchecked,color-mix(in_oklab,var(--input)_80%,transparent))] inline-flex h-[var(--switch-height,1.15rem)] w-[var(--switch-width,2rem)] shrink-0 items-center rounded-[var(--switch-radius,calc(infinity*1px))] border-[length:var(--switch-border-width,1px)] border-[color:var(--switch-border-color,transparent)] shadow-xs transition-all outline-none focus-visible:ring-[length:var(--switch-ring-width-focus,3px)] disabled:cursor-not-allowed disabled:opacity-[var(--switch-opacity-disabled,var(--control-opacity-disabled,0.5))]",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "bg-[color:var(--switch-thumb-bg,var(--background))] dark:data-[state=unchecked]:bg-[color:var(--switch-thumb-bg-unchecked,var(--switch-thumb-bg,var(--foreground)))] dark:data-[state=checked]:bg-[color:var(--switch-thumb-bg-checked,var(--switch-thumb-bg,var(--primary-foreground)))] pointer-events-none block size-[var(--switch-thumb-size,1rem)] rounded-[var(--switch-thumb-radius,calc(infinity*1px))] ring-[length:var(--switch-thumb-ring-width,0px)] ring-[color:var(--switch-thumb-ring-color,currentcolor)] shadow-[var(--switch-thumb-shadow,0_0_#0000)] transition-transform data-[state=checked]:translate-x-[var(--switch-thumb-offset-checked,calc(100%-2px))] data-[state=unchecked]:translate-x-0",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
