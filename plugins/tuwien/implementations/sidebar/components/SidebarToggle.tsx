import React from "react";

import { Button, useSidebar } from "@workspace/ui/components";
import { ChevronsRight } from "@workspace/ui/components/icons";
import { cn } from "@workspace/ui/lib/utils";

/**
 * TU Wien Sidebar Toggle Component
 * Toggle button for expanding/collapsing the sidebar
 */
export const SidebarToggle = () => {
  const { open, setOpen } = useSidebar();

  return (
    <div className={cn("hidden md:flex", open ? "justify-end" : "flex justify-center")}>
      <Button
        size="icon"
        className={cn("rounded-none  h-14 bg-sidebar hover:bg-sidebar border-none")}
        variant="outline"
        onClick={() => {
          setOpen(!open);
        }}
      >
        <ChevronsRight
          className={cn(
            "!w-9 !h-9 transition ease-in-out duration-300 text-sidebar-foreground hover:text-background",
            open ? "rotate-[-180deg]" : "rotate-0",
          )}
          aria-hidden="true"
        />
        <span className="sr-only">Toggle sidebar</span>
      </Button>
    </div>
  );
};
