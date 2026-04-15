import React from "react";

import { SidebarTrigger } from "@workspace/ui/components";

import { LangSwitcher } from "./LangSwitcher";
import { LoginButton } from "./LoginButton";

/**
 * Default Header Component
 * Self-contained header with sidebar trigger, language switcher, and login button
 * No extension points - provides complete functionality out of the box
 */
const DefaultHeader: React.FC = () => {
  return (
    <div className="flex items-center justify-between gap-4 px-4 w-full">
      {/* Left side - Sidebar trigger */}
      <div className="flex items-center gap-3">
        <SidebarTrigger className="-ml-1" />
      </div>

      {/* Right side - Language switcher and login button */}
      <div className="flex items-center gap-6">
        <LangSwitcher />
        <LoginButton />
      </div>
    </div>
  );
};

export default DefaultHeader;
