import * as React from "react"
import { LucideIcon } from "lucide-react"

import { NavMain } from "./nav-main"
import { NavUser } from "./nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@workspace/ui/components"
import { useRegistry } from "@workspace/plugin-system"
import { Logo } from "./logo"
import { ComponentResolver } from "@workspace/plugin-system";
import { MobileCloseButton } from "./mobile-closebutton"

interface SidebarConfig {
  title: string;
  path: string;
  icon: LucideIcon;
  order?: number;
  permissions?: string[];
  featureFlags?: string[];
}

const useSidebarNavItems = () => {
  const { items } = useRegistry<SidebarConfig>("sidebar:nav-items");

  // Sort nav items by order (lower numbers first)
  const sortedNavItems = React.useMemo(() => {
    return [...items].sort((a, b) => (a.order || 100) - (b.order || 100));
  }, [items]);

  return sortedNavItems;
};

const useSidebarItems = () => {
  const sidebarNavItems = useSidebarNavItems();

  // Transform sidebar nav items into NavMain items format as a pure function
  return React.useMemo(() => {
    return sidebarNavItems.map(config => ({
      title: config.title,
      url: config.path,
      icon: config.icon,
    }));
  }, [sidebarNavItems]);
};

export function AppSidebar({
  sidebarProps,
  headerProps,
  contentProps,
  footerProps
}: {
  sidebarProps?: React.ComponentProps<typeof Sidebar>
  headerProps?: React.ComponentProps<typeof SidebarHeader>
  contentProps?: React.ComponentProps<typeof SidebarContent>
  footerProps?: React.ComponentProps<typeof SidebarFooter>
}) {
  const navItems = useSidebarItems();
  const { open } = useSidebar();

  return (
    <Sidebar collapsible="icon" {...sidebarProps}>
      <SidebarHeader {...headerProps}>
        <ComponentResolver
          componentType="appshell:sidebar:header"
          defaultComponent={Logo}
          componentProps={{
            color: "#0066cc",
            fontFamily: "Georgia, Times New Roman, serif",
            collapsed: !open,
            className: "max-w-full text-primary"
          }}
          loadingBehavior="none"
        />
      </SidebarHeader>
      <SidebarContent {...contentProps}>
        <ComponentResolver
          componentType="appshell:sidebar:content"
          defaultComponent={NavMain}
          componentProps={{ items: navItems, open }}
          loadingBehavior="none"
        />
      </SidebarContent>
      <SidebarFooter {...footerProps}>
        <ComponentResolver
          componentType="appshell:sidebar:footer"
          defaultComponent={NavUser}
          componentProps={{}}
          loadingBehavior="none"
        />
      </SidebarFooter>
      <MobileCloseButton />

      <SidebarRail />
    </Sidebar>
  )
} 