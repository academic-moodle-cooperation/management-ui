import React from "react";
import {
  Avatar,
  AvatarFallback,
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Container,
  SidebarMenuButton
} from "@workspace/ui/components";
import { useGetCurrentUser } from "@workspace/query";
import { LogIn, LogOut } from "@workspace/ui/components/icons";
import { cn } from "@workspace/ui/lib/utils";
import { useAppConfig } from "@workspace/query";
import { Link } from "@workspace/router";
import { NavMain } from "@workspace/ui/components/appshell/components/nav-main";

/**
 * TU Wien Sidebar User Menu Component
 * User profile menu with avatar, login/logout functionality
 */
const SidebarUserMenu = ({ open }: { open: boolean }) => {
  const { data, isLoading } = useGetCurrentUser();
  const { config } = useAppConfig();

  const loginUrlDev = config.auth.loginUrlDev;
  const logoutUrlDev = config.auth.logoutUrlDev;
  const loginUrl = config.auth.loginUrl;
  const logoutUrl = config.auth.logoutUrl;

  return (
    <>
      {!isLoading && data?.currentUser?.userRole !== "ROLE_USER_ANONYMOUS" ? (
        <Accordion type="single" collapsible>
          <AccordionItem
            value="profile"
            className={"border-foreground/80 mb-4 border-b last:border-b"}
          >
            <AccordionTrigger
              className={cn(
                "px-6 py-4 text-sidebar-foreground flex items-center",
                !open && "[&>svg]:hidden flex justify-center px-4"
              )}
            >
              <div
                className={cn(
                  "flex items-center text-sm font-semibold leading-6 gap-x-4 text-sidebar-foreground",
                  !open && "mr-1"
                )}
              >
                <Avatar className="w-8 h-8 bg-foreground/90 ">
                  <AvatarFallback className="text-sm font-semibold text-sidebar-foreground bg-foreground/80">
                    {data?.currentUser.name?.split(" ").map((n) => {
                      return `${n[0]}`;
                    })}
                  </AvatarFallback>
                </Avatar>

                <span className="sr-only">Your profile</span>
                {open && (
                  <span
                    aria-hidden="true"
                    className="text-sidebar-foreground whitespace-nowrap"
                  >
                    {data?.currentUser.name}
                  </span>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              {/* <SidebarMenuButton asChild className="justify-center">
                <a href={logoutUrlDev || logoutUrl}>
                  <LogOut className="w-6 h-6" />
                  {open && <span>Logout</span>}
                </a>
              </SidebarMenuButton> */}
              <NavMain

                customItemStyles={cn(
                  "flex gap-4 px-4"
                )} items={[{
                  title: "Logout",
                  url: logoutUrlDev || logoutUrl,
                  icon: LogOut
                }]}
                menuItemClassName={cn(!open && 'flex justify-center')}

              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      ) : (
        <Container className="py-2 border-b border-foreground">
          <div className="flex items-center text-sm font-semibold leading-6 gap-x-4 text-sidebar-foreground">
            <SidebarMenuButton asChild className="justify-center">
              <a href={loginUrlDev || loginUrl}>
                <LogIn className="w-6 h-6" />
                {open && <span>Login</span>}
              </a>
            </SidebarMenuButton>
          </div>
        </Container>
      )}
    </>
  );
};

export { SidebarUserMenu }; 