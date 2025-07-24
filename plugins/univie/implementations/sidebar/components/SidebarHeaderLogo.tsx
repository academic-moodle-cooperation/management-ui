import React from 'react';
import { Home } from '@workspace/ui/components/icons';
import { cn } from "@workspace/ui/lib/utils";
import { useAppConfig } from "@workspace/ui-config";

/**
 * University of Vienna Sidebar Header Logo Component
 * Migrated from migrate/extensions/src/univie/src/plugins/appshell-sidebar/components/Logo.tsx
 * 
 * Provides custom logo display behavior for University of Vienna sidebar header
 */

type SidebarHeaderLogoProps = {
  collapsed: boolean;
};

export const SidebarHeaderLogo = ({ collapsed }: SidebarHeaderLogoProps) => {
  const { config } = useAppConfig();

  return (
    <div
      className={cn(
        "flex items-center flex-shrink-0 text-lg h-full w-full justify-center"
      )}
    >
      <a
        className="text-sidebar"
        rel=""
        href={import.meta.env.BASE_URL}
        target="_self"
      >
        <>
          <span
            className={cn(
              "flex transition-[width] transition-opacity ease-in-out duration-600 overflow-hidden text-nowrap",
              !collapsed ? "opacity-100 w-full" : "opacity-0 w-[0%] h-0"
            )}
          >
            {config.app.appTitle.length > 0 ? (
              config.app.appTitle
            ) : (
              <img
                src={config.app.logoUrl}
                alt="Logo"
                className="mx-auto h-10 w-auto"
              />
            )}
          </span>
          <Home
            className={cn(
              "transition-all ease-in-out duration-600",
              collapsed ? "opacity-100 w-full" : "opacity-0 w-[0%] h-0"
            )}
          />
        </>
      </a>
    </div>
  );
}; 