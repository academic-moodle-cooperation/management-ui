import React, { useState } from "react";

import { useI18n } from "@workspace/i18n";
import { SwitchHeadlessUI } from "@workspace/ui/components";
import { cn } from "@workspace/ui/lib/utils";

import LTLogo from "./LTLogo";

/**
 * TU Wien Sidebar Header Component
 * Features LectureTube branding and language switcher
 */
export const SidebarHeader = ({ collapsed }: { collapsed: boolean }) => {
  const { i18n } = useI18n();
  const [enabled, setEnabled] = useState(i18n.language === "de");

  return (
    <>
      <div
        className={cn(
          "flex items-center flex-shrink-0 px-4 text-lg h-16 w-full",
          !collapsed ? "justify-between " : "justify-center",
        )}
        style={{ backgroundColor: "var(--color-header)" }} // Use TU Wien theme color
      >
        <a className="text-white " rel="" href="/management-ui" target="_self">
          <>
            {!collapsed ? (
              <span
                className={cn(
                  "flex transition-[width] transition-opacity ease-in-out duration-600 overflow-hidden text-nowrap ",
                  "opacity-100 w-full",
                )}
              >
                LectureTube
              </span>
            ) : (
              <LTLogo className="text-white transition-opacity ease-in-out duration-0 opacity-100 w-[36px] h-auto" />
            )}
          </>
        </a>
        {!collapsed && (
          <SwitchHeadlessUI
            checked={enabled}
            onChange={() => {
              setEnabled(!enabled);
              enabled
                ? i18n.changeLanguage("en")
                : i18n.changeLanguage("de").then(() => (i18n.options.lng = "de"));
            }}
            className={cn(
              "relative inline-flex h-6 w-11 items-center flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ring-0 justify-around",
              "bg-black/20 hover:bg-black/30", // Use relative colors instead of hardcoded values
            )}
          >
            <span className="sr-only">Switch Language </span>
            {enabled && <span className="text-xs font-light text-white ">DE</span>}
            <span
              aria-hidden="true"
              className={cn(
                "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out justify-center items-center",
              )}
            />
            {!enabled && <span className="text-xs font-light text-white">EN</span>}
          </SwitchHeadlessUI>
        )}
      </div>
    </>
  );
};
