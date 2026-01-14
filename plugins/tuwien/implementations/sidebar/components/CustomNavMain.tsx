import React from "react";

import { NavMain, type NavMainProps } from "@workspace/ui/components";
import { cn } from "@workspace/ui/lib/utils";

/**
 * TU Wien Custom Navigation Main Component
 * Simplified version that extends the core NavMain with TU Wien-specific styling
 */
export const CustomNavMain = (props: NavMainProps) => {
  return (
    <NavMain
      groupClassName={cn(props.open && "p-0")}
      menuClassName={cn("flex flex-col gap-1", props.open && "gap-0")}
      menuItemClassName={cn(!props.open && "flex justify-center")}
      customItemStyles={cn("h-12 flex gap-4 px-6", props.open && "rounded-none")}
      renderActiveIndicator={(isActive, open) =>
        isActive &&
        open && (
          <div
            className="absolute inset-y-0 left-0 w-2"
            style={{ backgroundColor: "var(--color-tuwien-primary)" }}
          />
        )
      }
      customActiveStyles={"data-[active=true]:bg-sidebar-primary"}
      {...props}
    />
  );
};
