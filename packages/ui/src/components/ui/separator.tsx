import * as SeparatorPrimitive from "@radix-ui/react-separator";
import * as React from "react";

import { cn } from "../../lib/utils";

function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "bg-[color:var(--separator-bg,var(--border))] my-[var(--separator-margin-y,0px)] mx-[var(--separator-margin-x,0px)] shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
        className,
      )}
      {...props}
    />
  );
}

export { Separator };
