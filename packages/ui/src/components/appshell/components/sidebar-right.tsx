import * as React from "react";

import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from "@workspace/ui/components";

export function SidebarRight({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" className="absolute h-full w-full p-8 flex-col" {...props}>
      <SidebarHeader className="h-16 border-b border-sidebar-border flex-shrink-0 p-0">
        header
      </SidebarHeader>
      <SidebarContent className="flex-grow overflow-y-auto min-h-0">content</SidebarContent>
      <SidebarFooter className="flex-shrink-0 mt-auto p-0">footer</SidebarFooter>
    </Sidebar>
  );
}
