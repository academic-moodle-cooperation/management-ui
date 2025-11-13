import React from 'react';
import { Home } from '@workspace/ui/components/icons';
import { cn } from "@workspace/ui/lib/utils";
import { useAppConfig } from "@workspace/query";
import { resolveFirstAssetUrl } from "@workspace/ui/lib";

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
    'assets/favicon/favicon.svg'
  );

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
                src={preferredSrc}
                alt="Logo"
                className="mx-auto h-10 w-auto"
                onError={(e) => {
                  // Fallback: if dev serves assets under /dist/, try inserting /dist/ before assets/locales
                  try {
                    const current = e.currentTarget.src;
                    const url = new URL(current, window.location.origin);
                    if (!/\/dist\/(assets|locales)\//.test(url.pathname) && /\/(assets|locales)\//.test(url.pathname)) {
                      url.pathname = url.pathname.replace(/\/(assets|locales)\//, '/dist/$1/');
                      const candidate = url.toString();
                      if (candidate !== current) {
                        e.currentTarget.src = candidate;
                        return;
                      }
                    }
                  } catch {
                    // ignore and fall through to favicon fallback
                  }
                  const favicon = resolveFirstAssetUrl([], 'assets/favicon/favicon.svg');
                  if (e.currentTarget.src !== favicon) {
                    e.currentTarget.src = favicon;
                  }
                }}
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