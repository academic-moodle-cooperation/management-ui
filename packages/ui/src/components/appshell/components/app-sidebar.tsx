import * as React from "react";

import { useRegistry, ComponentResolver } from "@oc-mui/plugin-system";

import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, useSidebar } from "../../ui";

import { Logo } from "./logo";
import { MobileCloseButton } from "./mobile-closebutton";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";

import type { LucideIcon } from "lucide-react";

interface SidebarConfig {
  title: string;
  path: string;
  target?: string;
  icon: LucideIcon;
  order?: number;
  permissions?: string[];
  featureFlags?: string[];
  items?: {
    title: string;
    path: string;
    target?: string;
  }[];
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
    return sidebarNavItems.map((config) => ({
      title: config.title,
      url: config.path,
      ...(config.icon !== undefined && { icon: config.icon }),
      isExternal: config.path?.startsWith("http://") || config.path?.startsWith("https://"),
      ...(config.target !== undefined && { target: config.target }),
      ...(config.items !== undefined &&
        config.items.length > 0 && {
          items: config.items.map((item) => ({
            title: item.title,
            url: item.path,
            ...(item.target !== undefined && { target: item.target }),
          })),
        }),
    }));
  }, [sidebarNavItems]);
};

export function AppSidebar({
  sidebarProps,
  headerProps,
  contentProps,
  footerProps,
}: {
  sidebarProps?: React.ComponentProps<typeof Sidebar>;
  headerProps?: React.ComponentProps<typeof SidebarHeader>;
  contentProps?: React.ComponentProps<typeof SidebarContent>;
  footerProps?: React.ComponentProps<typeof SidebarFooter>;
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
            className: "max-w-full text-primary",
          }}
          loadingBehavior="none"
        />
      </SidebarHeader>
      <SidebarContent {...contentProps}>
        <ComponentResolver
          componentType="appshell:sidebar:content"
          defaultComponent={NavMain}
          componentProps={{ items: navItems, ...(open !== undefined && { open }) }}
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

      {/* Disable sidebar rail for now because of glitchy behavior 
        <SidebarRail /> 
      */}
    </Sidebar>
  );
}
