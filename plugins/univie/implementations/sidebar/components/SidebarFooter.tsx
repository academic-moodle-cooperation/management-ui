import React from "react";

import { useGetCurrentUser } from "@workspace/query";
import { useSidebar, Avatar, AvatarImage, AvatarFallback } from "@workspace/ui/components";
import { cn } from "@workspace/ui/lib/utils";
import { sha256 } from "@workspace/utils";

/**
 * University of Vienna Sidebar Footer Component
 *
 * Displays the current user's information with avatar in the sidebar footer
 * Migrated from the old extension system
 */

export const SidebarFooter = () => {
  const { data, isLoading } = useGetCurrentUser();
  const { open: sidebarOpen } = useSidebar();

  return (
    <>
      {!isLoading && data?.currentUser?.username !== "anonymous" && (
        <span
          className={cn(
            "px-6 py-4 text-sidebar-foreground ",
            !sidebarOpen && "[&>svg]:hidden flex justify-center px-4",
          )}
        >
          <div
            className={cn(
              "flex items-center text-sm font-semibold leading-6 gap-x-4 text-sidebar-foreground",
              !sidebarOpen && "mr-1",
            )}
          >
            <Avatar className="w-8 h-8">
              <AvatarImage
                className="w-auto h-auto rounded-full"
                src={`https://www.gravatar.com/avatar/${sha256(
                  `${data?.currentUser.email}`.toLowerCase()?.trim(),
                )}?s=32&d=404`}
                alt={`Avatar of ${data?.currentUser.name}`}
              />
              <AvatarFallback className="text-sm font-semibold text-sidebar-foreground">
                {data?.currentUser.name?.split(" ").map((n) => {
                  return `${n[0]}`;
                })}
              </AvatarFallback>
            </Avatar>

            <span className="sr-only">Your profile</span>
            {sidebarOpen && (
              <span aria-hidden="true" className="text-sidebar-foreground whitespace-nowrap">
                {data?.currentUser.name}
              </span>
            )}
          </div>
        </span>
      )}
    </>
  );
};
