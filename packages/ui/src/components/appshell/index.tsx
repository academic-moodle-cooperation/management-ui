import { ComponentResolver } from "@oc-mui/plugin-system";

import { SidebarProvider, SidebarTrigger, SidebarInset } from "../ui";

import { AppSidebar } from "./components/app-sidebar";

export function Appshell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar
        sidebarProps={{ className: "border-r border-sidebar-border" }}
        headerProps={{ className: "h-16 p-0 flex items-center justify-center" }}
      />

      <SidebarInset id="sidebar-inset" className="flex-auto w-[calc(100%-var(--sidebar-width))]">
        <header className="flex sticky top-0 left-0 right-0 z-40 border-b border-border bg-background shadow-sm h-16 shrink-0 justify-between items-center gap-x-6 items-center gap-2 transition-[width,height] ease-linear">
          <ComponentResolver
            componentType="appshell:header"
            defaultComponent={() => (
              <div className="flex items-center gap-2 px-4">
                <SidebarTrigger className="-ml-1" />
              </div>
            )}
            componentProps={{}}
            loadingBehavior="none"
            useOverridePrefix={false}
          />
        </header>

        <main className="flex-auto">{children}</main>

        <footer className="bg-footer flex h-16 shrink-0 items-center gap-2 border-t border-border transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4 w-full justify-between">
            {/* Default footer content that can be replaced by plugins */}
            <ComponentResolver
              componentType="appshell:footer"
              // Bare fallback — only visible when no plugin provides a
              // footer. No fake links, no hardcoded year (#299).
              defaultComponent={() => (
                <div className="flex w-full justify-between">
                  <span className="text-sm text-muted-foreground">Management UI</span>
                  <span className="text-sm text-muted-foreground">
                    © {new Date().getFullYear()}
                  </span>
                </div>
              )}
              componentProps={{}}
              loadingBehavior="none"
            />
          </div>
        </footer>
      </SidebarInset>
      {/* <Sheet modal={false}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SidebarRight collapsible={'offcanvas'} variant="inset" />
        </SheetContent>
      </Sheet> */}
    </SidebarProvider>
  );
}
