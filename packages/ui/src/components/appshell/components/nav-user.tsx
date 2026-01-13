"use client";

import { ChevronsUpDown, LogOut } from "lucide-react";
import React from "react";

import { useGetCurrentUser } from "@workspace/query";
import { Avatar, AvatarFallback, AvatarImage ,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar} from "@workspace/ui/components";
import { sha256 } from "@workspace/utils";


// Separate data concerns from presentation
type UserData = {
  name: string;
  email: string;
  avatarUrl?: string;
  role?: string;
};

// Pure presentation component that receives data as props
export function NavUser({
  userData,
  isLoading,
  onLogout,
  renderAvatar,
}: {
  userData?: UserData;
  isLoading?: boolean;
  onLogout?: () => void;
  renderAvatar?: (userData: UserData) => React.ReactNode;
  customMenuItems?: React.ReactNode;
}) {
  const { isMobile } = useSidebar();

  if (isLoading || !userData) {
    return null;
  }

  const defaultAvatar = (
    <Avatar className="h-8 w-8 rounded-lg">
      <AvatarImage src={userData.avatarUrl} alt={`Avatar of ${userData.name}`} />
      <AvatarFallback className="rounded-lg">
        {userData.name?.split(" ").map((n) => n[0])}
      </AvatarFallback>
    </Avatar>
  );

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                {renderAvatar ? renderAvatar(userData) : defaultAvatar}
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{userData.name}</span>
                <span className="truncate text-xs">{userData.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                {renderAvatar ? renderAvatar(userData) : defaultAvatar}
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{userData.name}</span>
                  <span className="truncate text-xs">{userData.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout}>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

// Hook for data fetching (separate from presentation)
export const useUserData = (): {
  userData: UserData | undefined;
  isLoading: boolean;
  logout: () => void;
} => {
  const { data, isLoading } = useGetCurrentUser();

  const userData = React.useMemo(() => {
    if (!data?.currentUser) return undefined;

    return {
      name: data.currentUser.name,
      email: data.currentUser.email,
      avatarUrl: `https://www.gravatar.com/avatar/${sha256(
        `${data.currentUser.email}`.toLowerCase()?.trim()
      )}?s=64&d=404`,
      role: data.currentUser.userRole,
    };
  }, [data]);

  const logout = React.useCallback(() => {
    // Implement logout functionality
  }, []);

  return { userData, isLoading, logout };
};

// Connected component that uses hooks and passes data to presentation component
export function NavUserConnected(props: {
  renderAvatar?: (userData: UserData) => React.ReactNode;
  customMenuItems?: React.ReactNode;
}) {
  const { userData, isLoading, logout } = useUserData();

  return (
    <NavUser
      {...(userData !== undefined && { userData })}
      {...(isLoading !== undefined && { isLoading })}
      {...(logout !== undefined && { onLogout: logout })}
      {...props}
    />
  );
}
