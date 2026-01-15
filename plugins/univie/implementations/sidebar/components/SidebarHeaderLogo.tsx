import React from "react";

import { useAppConfig } from "@workspace/query";
import { Home } from "@workspace/ui/components/icons";
import { resolveFirstAssetUrl } from "@workspace/ui/lib";
import { cn } from "@workspace/ui/lib/utils";

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

  const preferredSrc = resolveFirstAssetUrl(
    [config.app.orgLogoUrl, config.app.logoUrl],
    "assets/favicon/favicon.svg",
  );

  return (
    <div className={cn("flex items-center flex-shrink-0 text-lg h-full w-full justify-center")}>
      <a className="text-sidebar" rel="" href={import.meta.env.BASE_URL} target="_self">
        <>
          <span
            className={cn(
              "flex transition-[width] transition-opacity ease-in-out duration-600 overflow-hidden text-nowrap",
              !collapsed ? "opacity-100 w-full" : "opacity-0 w-[0%] h-0",
            )}
          >
            {config.app.appTitle.length > 0 ? (
              config.app.appTitle
            ) : (
              <img
                src={preferredSrc}
                alt="Logo"
                className="mx-auto h-10 w-auto"
                onError={(e) => {
                  // Prevent infinite loop by tracking if we've already tried fallback
                  if (e.currentTarget.dataset["errorHandled"] === "true") {
                    return; // Already tried fallback, don't retry
                  }
                  e.currentTarget.dataset["errorHandled"] = "true";

                  // Try favicon as fallback
                  const favicon = resolveFirstAssetUrl([], "assets/favicon/favicon.svg");
                  e.currentTarget.src = favicon;
                }}
              />
            )}
          </span>
          <Home
            className={cn(
              "transition-all ease-in-out duration-600",
              collapsed ? "opacity-100 w-full" : "opacity-0 w-[0%] h-0",
            )}
          />
        </>
      </a>
    </div>
  );
};
