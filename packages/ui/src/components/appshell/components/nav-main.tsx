"use client";

import { ChevronRight, type LucideIcon } from "lucide-react";
import * as React from "react";

import { useExtensionLabels } from "@oc-mui/i18n";

import { cn } from "../../../lib/utils";
import { useUiRouter } from "../../router-context";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "../../ui";

export type NavMainProps = {
  groupClassName?: string;
  grouplabel?: string;
  menuClassName?: string;
  menuItemClassName?: string;
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    isExternal?: boolean;
    target?: string;
    items?: {
      title: string;
      url: string;
      target?: string;
    }[];
  }[];
  open?: boolean;
  renderItemIcon?: (icon: LucideIcon | undefined) => React.ReactNode;
  renderActiveIndicator?: (isActive: boolean, open: boolean) => React.ReactNode;
  customItemStyles?: string;
  customActiveStyles?: string;
};

export function NavMain({
  items,
  grouplabel,
  groupClassName,
  menuClassName,
  menuItemClassName,
  open,
  renderItemIcon = (Icon) => Icon && <Icon />,
  renderActiveIndicator = (isActive, open) =>
    isActive && open && <div className="absolute inset-y-0 left-0 w-1 bg-primary rounded-s-md" />,
  customItemStyles,
  customActiveStyles,
}: NavMainProps) {
  const { Link, usePathname } = useUiRouter();
  const pathname = usePathname();

  // A title containing ":" is a translation key registered by a plugin
  // (`title: "common:episodes"`); anything else is a literal. The shared
  // resolver replaces the inline `i18n.exists ? t : raw` this component used
  // to carry — with one improvement: it also loads the key's namespace, so an
  // org plugin's nav item no longer flashes its raw key until some component
  // of that plugin happens to mount. Sub-item titles stay untranslated, as
  // before.
  const keyedItems = items.filter((item) => item.title.includes(":"));
  const labelFor = useExtensionLabels(
    keyedItems.map((item) => ({ key: item.title, label: item.title })),
  );
  const translatedItems = items.map((item) =>
    item.title.includes(":")
      ? { ...item, title: labelFor({ key: item.title, label: item.title }) }
      : item,
  );

  return (
    <SidebarGroup className={groupClassName}>
      {grouplabel && <SidebarGroupLabel>{grouplabel}</SidebarGroupLabel>}
      <SidebarMenu className={menuClassName}>
        {translatedItems.map((item) => {
          const parentIsActive =
            item.items &&
            (pathname === item.url ||
              item.items.some((sub) => pathname === sub.url || pathname.startsWith(sub.url + "/")));
          const defaultOpen = item.isActive !== undefined ? item.isActive : !!parentIsActive;
          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={defaultOpen}
              className="group/collapsible"
            >
              <SidebarMenuItem className={menuItemClassName}>
                {item.items ? (
                  <>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip={item.title}
                        isActive={!!parentIsActive}
                        className={cn(
                          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          parentIsActive && !open
                            ? "outline-1 outline-primary outline-offset-0"
                            : "",
                          customItemStyles,
                          customActiveStyles,
                        )}
                      >
                        <>
                          {renderActiveIndicator(!!parentIsActive, !!open)}
                          {item.icon && <item.icon />}
                          <span>{item.title}</span>
                          <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </>
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton asChild>
                              <Link
                                to={subItem.url}
                                {...(subItem.target !== undefined && { target: subItem.target })}
                              >
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </>
                ) : item.isExternal ? (
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    className={cn(
                      "hover:bg-sidebar-accent hover:text-sidebar-accent-forground",
                      customItemStyles,
                    )}
                  >
                    <a href={item.url} target={item.target || "_blank"} rel="noopener noreferrer">
                      {renderItemIcon(item.icon)}
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                ) : (
                  <Link
                    to={item.url}
                    activeOptions={{
                      exact: item.url === "/" ? true : false,
                    }}
                  >
                    {({ isActive }) => (
                      <SidebarMenuButton
                        tooltip={item.title}
                        isActive={isActive}
                        className={cn(
                          "hover:bg-sidebar-accent hover:text-sidebar-accent-forground",
                          isActive && !open ? "outline-1 outline-primary outline-offset-0" : "",
                          customItemStyles,
                          customActiveStyles,
                        )}
                      >
                        <>
                          {renderActiveIndicator(isActive, !!open)}
                          {renderItemIcon(item.icon)}
                          <span>{item.title}</span>
                        </>
                      </SidebarMenuButton>
                    )}
                  </Link>
                )}
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
