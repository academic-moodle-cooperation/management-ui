import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { PanelLeftIcon } from "lucide-react";
import * as React from "react";

import { useTranslation } from "@oc-mui/i18n";
import { Button } from "./button";
import { Input } from "./input";
import { Separator } from "./separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "./sheet";
import { Skeleton } from "./skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";
import { useIsMobile } from "../../hooks/use-mobile";
import { cn } from "../../lib/utils";

import type { VariantProps } from "class-variance-authority";

const SIDEBAR_COOKIE_NAME = "sidebar_state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
// The widths are set on the wrapper as before; a theme reaches them through
// the component variables named here.
const SIDEBAR_WIDTH = "var(--sidebar-wrapper-width,16rem)";
const SIDEBAR_WIDTH_MOBILE = "var(--sidebar-wrapper-width-mobile,18rem)";
const SIDEBAR_WIDTH_ICON = "var(--sidebar-wrapper-width-icon,3rem)";
const SIDEBAR_KEYBOARD_SHORTCUT = "b";

type SidebarContextProps = {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContextProps | null>(null);

function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }

  return context;
}

function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  className,
  style,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const isMobile = useIsMobile();
  const [openMobile, setOpenMobile] = React.useState(false);

  // This is the internal state of the sidebar.
  // We use openProp and setOpenProp for control from outside the component.
  const [_open, _setOpen] = React.useState(defaultOpen);
  const open = openProp ?? _open;
  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === "function" ? value(open) : value;
      if (setOpenProp) {
        setOpenProp(openState);
      } else {
        _setOpen(openState);
      }

      // This sets the cookie to keep the sidebar state.
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
    },
    [setOpenProp, open],
  );

  // Helper to toggle the sidebar.
  const toggleSidebar = React.useCallback(() => {
    return isMobile ? setOpenMobile((open) => !open) : setOpen((open) => !open);
  }, [isMobile, setOpen, setOpenMobile]);

  // Adds a keyboard shortcut to toggle the sidebar.
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar]);

  // We add a state so that we can do data-state="expanded" or "collapsed".
  // This makes it easier to style the sidebar with Tailwind classes.
  const state = open ? "expanded" : "collapsed";

  const contextValue = React.useMemo<SidebarContextProps>(
    () => ({
      state,
      open,
      setOpen,
      isMobile,
      openMobile,
      setOpenMobile,
      toggleSidebar,
    }),
    [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar],
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      <TooltipProvider delayDuration={0}>
        <div
          data-slot="sidebar-wrapper"
          style={
            {
              "--sidebar-width": SIDEBAR_WIDTH,
              "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
              ...style,
            } as React.CSSProperties
          }
          className={cn(
            "group/sidebar-wrapper has-data-[variant=inset]:bg-sidebar flex min-h-svh w-full",
            className,
          )}
          {...props}
        >
          {children}
        </div>
      </TooltipProvider>
    </SidebarContext.Provider>
  );
}

function Sidebar({
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  side?: "left" | "right";
  variant?: "sidebar" | "floating" | "inset";
  collapsible?: "offcanvas" | "icon" | "none";
}) {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar();
  const { t } = useTranslation();

  if (collapsible === "none") {
    return (
      <div
        data-slot="sidebar"
        className={cn(
          "bg-[color:var(--sidebar-bg,var(--sidebar))] text-[color:var(--sidebar-color,var(--sidebar-foreground))] flex h-full w-(--sidebar-width) flex-col",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  }

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
        <SheetContent
          data-sidebar="sidebar"
          data-slot="sidebar"
          data-mobile="true"
          className="bg-[color:var(--sidebar-bg,var(--sidebar))] text-[color:var(--sidebar-color,var(--sidebar-foreground))] w-(--sidebar-width) p-[var(--sidebar-padding,0px)] [&>button]:hidden"
          style={
            {
              "--sidebar-width": SIDEBAR_WIDTH_MOBILE,
            } as React.CSSProperties
          }
          side={side}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>{t("a11y.sidebar")}</SheetTitle>
            <SheetDescription>{t("a11y.sidebarDescription")}</SheetDescription>
          </SheetHeader>
          <div className="flex h-full w-full flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div
      className="group peer text-sidebar-foreground hidden md:block"
      data-state={state}
      data-collapsible={state === "collapsed" ? collapsible : ""}
      data-variant={variant}
      data-side={side}
      data-slot="sidebar"
    >
      {/* This is what handles the sidebar gap on desktop */}
      <div
        data-slot="sidebar-gap"
        className={cn(
          "relative w-(--sidebar-width) bg-[color:var(--sidebar-gap-bg,transparent)] transition-[width] duration-200 ease-linear",
          "group-data-[collapsible=offcanvas]:w-0",
          "group-data-[side=right]:rotate-180",
          variant === "floating" || variant === "inset"
            ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]"
            : "group-data-[collapsible=icon]:w-(--sidebar-width-icon)",
        )}
      />
      <div
        data-slot="sidebar-container"
        className={cn(
          "fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-200 ease-linear md:flex",
          side === "left"
            ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]"
            : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
          // Adjust the padding for floating and inset variants.
          variant === "floating" || variant === "inset"
            ? "p-[var(--sidebar-container-padding,0.5rem)] group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]"
            : "group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-r group-data-[side=right]:border-l",
          className,
        )}
        {...props}
      >
        <div
          data-sidebar="sidebar"
          data-slot="sidebar-inner"
          className="bg-[color:var(--sidebar-inner-bg,var(--sidebar))] group-data-[variant=floating]:border-sidebar-border flex h-full w-full flex-col group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:shadow-sm"
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function SidebarTrigger({ className, onClick, ...props }: React.ComponentProps<typeof Button>) {
  const { toggleSidebar } = useSidebar();
  const { t } = useTranslation();

  return (
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      variant="ghost"
      size="icon"
      className={cn("size-[var(--sidebar-trigger-size,1.75rem)]", className)}
      onClick={(event) => {
        onClick?.(event);
        toggleSidebar();
      }}
      {...props}
    >
      <PanelLeftIcon />
      <span className="sr-only">{t("a11y.toggleSidebar")}</span>
    </Button>
  );
}

function SidebarRail({ className, ...props }: React.ComponentProps<"button">) {
  const { toggleSidebar } = useSidebar();
  const { t } = useTranslation();

  return (
    <button
      data-sidebar="rail"
      data-slot="sidebar-rail"
      aria-label={t("a11y.toggleSidebar")}
      tabIndex={-1}
      onClick={toggleSidebar}
      title={t("a11y.toggleSidebar")}
      className={cn(
        "hover:after:bg-sidebar-border absolute inset-y-0 z-20 hidden w-[var(--sidebar-rail-width,1rem)] -translate-x-1/2 transition-all ease-linear group-data-[side=left]:-right-4 group-data-[side=right]:left-0 after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] sm:flex",
        "in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize",
        "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
        "hover:group-data-[collapsible=offcanvas]:bg-sidebar group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full",
        "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
        "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
        className,
      )}
      {...props}
    />
  );
}

function SidebarInset({ className, ...props }: React.ComponentProps<"main">) {
  return (
    <main
      data-slot="sidebar-inset"
      className={cn(
        "bg-[color:var(--sidebar-inset-bg,var(--background))] relative flex w-full flex-1 flex-col",
        "md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2",
        className,
      )}
      {...props}
    />
  );
}

function SidebarInput({ className, ...props }: React.ComponentProps<typeof Input>) {
  return (
    <Input
      data-slot="sidebar-input"
      data-sidebar="input"
      className={cn(
        "bg-[color:var(--sidebar-input-bg,var(--background))] h-[var(--sidebar-input-height,2rem)] w-full shadow-none",
        className,
      )}
      {...props}
    />
  );
}

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-header"
      data-sidebar="header"
      className={cn(
        "flex flex-col gap-[var(--sidebar-header-gap,0.5rem)] p-[var(--sidebar-header-padding,0.5rem)]",
        className,
      )}
      {...props}
    />
  );
}

function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-footer"
      data-sidebar="footer"
      className={cn(
        "flex flex-col gap-[var(--sidebar-footer-gap,0.5rem)] p-[var(--sidebar-footer-padding,0.5rem)]",
        className,
      )}
      {...props}
    />
  );
}

function SidebarSeparator({ className, ...props }: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="sidebar-separator"
      data-sidebar="separator"
      className={cn(
        "bg-[color:var(--sidebar-separator-bg,var(--sidebar-border))] mx-2 w-auto",
        className,
      )}
      {...props}
    />
  );
}

function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-content"
      data-sidebar="content"
      className={cn(
        "flex min-h-[var(--sidebar-content-min-height,0px)] flex-1 flex-col gap-[var(--sidebar-content-gap,0.5rem)] overflow-auto group-data-[collapsible=icon]:overflow-hidden",
        className,
      )}
      {...props}
    />
  );
}

function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group"
      data-sidebar="group"
      className={cn(
        "relative flex w-full min-w-[var(--sidebar-group-min-width,0px)] flex-col p-[var(--sidebar-group-padding,0.5rem)]",
        className,
      )}
      {...props}
    />
  );
}

function SidebarGroupLabel({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"div"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "div";

  return (
    <Comp
      data-slot="sidebar-group-label"
      data-sidebar="group-label"
      className={cn(
        "text-[color:var(--sidebar-group-label-color,color-mix(in_oklab,var(--sidebar-foreground)_70%,transparent))] ring-[color:var(--sidebar-group-label-ring-color,var(--sidebar-ring))] flex h-[var(--sidebar-group-label-height,2rem)] shrink-0 items-center rounded-[var(--sidebar-group-label-radius,calc(var(--radius)_-_2px))] px-[var(--sidebar-group-label-padding-x,0.5rem)] text-[length:var(--sidebar-group-label-font-size,0.75rem)]/[var(--sidebar-group-label-line-height,calc(1/0.75))] font-[number:var(--sidebar-group-label-font-weight,500)] outline-hidden transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-[length:var(--sidebar-group-label-ring-width-focus,var(--focus-ring-width,2px))] [&>svg]:size-[var(--sidebar-group-label-icon-size,1rem)] [&>svg]:shrink-0",
        "group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0",
        className,
      )}
      {...props}
    />
  );
}

function SidebarGroupAction({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="sidebar-group-action"
      data-sidebar="group-action"
      className={cn(
        "text-[color:var(--sidebar-group-action-color,var(--sidebar-foreground))] ring-[color:var(--sidebar-group-action-ring-color,var(--sidebar-ring))] hover:bg-[color:var(--sidebar-group-action-bg-hover,var(--sidebar-accent))] hover:text-[color:var(--sidebar-group-action-color-hover,var(--sidebar-accent-foreground))] absolute top-3.5 right-3 flex aspect-square w-[var(--sidebar-group-action-width,1.25rem)] items-center justify-center rounded-[var(--sidebar-group-action-radius,calc(var(--radius)_-_2px))] p-[var(--sidebar-group-action-padding,0px)] outline-hidden transition-transform focus-visible:ring-[length:var(--sidebar-group-action-ring-width-focus,var(--focus-ring-width,2px))] [&>svg]:size-[var(--sidebar-group-action-icon-size,1rem)] [&>svg]:shrink-0",
        // Increases the hit area of the button on mobile.
        "after:absolute after:-inset-2 md:after:hidden",
        "group-data-[collapsible=icon]:hidden",
        className,
      )}
      {...props}
    />
  );
}

function SidebarGroupContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group-content"
      data-sidebar="group-content"
      className={cn(
        "w-full text-[length:var(--sidebar-group-content-font-size,0.875rem)]/[var(--sidebar-group-content-line-height,calc(1.25/0.875))]",
        className,
      )}
      {...props}
    />
  );
}

function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu"
      data-sidebar="menu"
      className={cn(
        "flex w-full min-w-[var(--sidebar-menu-min-width,0px)] flex-col gap-[var(--sidebar-menu-gap,0.25rem)]",
        className,
      )}
      {...props}
    />
  );
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-item"
      data-sidebar="menu-item"
      className={cn("group/menu-item relative", className)}
      {...props}
    />
  );
}

const sidebarMenuButtonVariants = cva(
  [
    "peer/menu-button flex w-full items-center overflow-hidden text-left outline-hidden transition-[width,height,padding]",
    "disabled:pointer-events-none aria-disabled:pointer-events-none [&>span:last-child]:truncate [&>svg]:shrink-0",
    "group-has-data-[sidebar=menu-action]/menu-item:pr-8 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2!",
    "gap-[var(--sidebar-menu-button-gap,0.5rem)]",
    "rounded-[var(--sidebar-menu-button-radius,calc(var(--radius)_-_2px))]",
    "p-[var(--sidebar-menu-button-padding,0.5rem)]",
    "[&>svg]:size-[var(--sidebar-menu-button-icon-size,1rem)]",
    "ring-[color:var(--sidebar-menu-button-ring-color,var(--sidebar-ring))]",
    "focus-visible:ring-[length:var(--sidebar-menu-button-ring-width-focus,var(--focus-ring-width,2px))]",
    "hover:bg-[color:var(--sidebar-menu-button-bg-hover,var(--sidebar-accent))]",
    "hover:text-[color:var(--sidebar-menu-button-color-hover,var(--sidebar-accent-foreground))]",
    "data-[state=open]:hover:bg-[color:var(--sidebar-menu-button-bg-hover,var(--sidebar-accent))]",
    "data-[state=open]:hover:text-[color:var(--sidebar-menu-button-color-hover,var(--sidebar-accent-foreground))]",
    "active:bg-[color:var(--sidebar-menu-button-bg-pressed,var(--sidebar-accent))]",
    "active:text-[color:var(--sidebar-menu-button-color-pressed,var(--sidebar-accent-foreground))]",
    "disabled:opacity-[var(--sidebar-menu-button-opacity-disabled,var(--control-opacity-disabled,0.5))]",
    "aria-disabled:opacity-[var(--sidebar-menu-button-opacity-disabled,var(--control-opacity-disabled,0.5))]",
    "data-[active=true]:bg-[color:var(--sidebar-menu-button-bg-active,var(--sidebar-accent))]",
    "data-[active=true]:text-[color:var(--sidebar-menu-button-color-active,var(--sidebar-accent-foreground))]",
    "data-[active=true]:font-[number:var(--sidebar-menu-button-font-weight-active,500)]",
  ],
  {
    variants: {
      variant: {
        default:
          "hover:bg-[color:var(--sidebar-menu-button-bg-hover,var(--sidebar-accent))] hover:text-[color:var(--sidebar-menu-button-color-hover,var(--sidebar-accent-foreground))]",
        outline: [
          "bg-[color:var(--sidebar-menu-button-bg-outline,var(--background))]",
          "shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]",
          "hover:bg-[color:var(--sidebar-menu-button-bg-hover,var(--sidebar-accent))] hover:text-[color:var(--sidebar-menu-button-color-hover,var(--sidebar-accent-foreground))]",
        ],
      },
      size: {
        default:
          "h-[var(--sidebar-menu-button-height,2rem)] text-[length:var(--sidebar-menu-button-font-size,0.875rem)]/[var(--sidebar-menu-button-line-height,calc(1.25/0.875))]",
        sm: "h-[var(--sidebar-menu-button-height-sm,1.75rem)] text-[length:var(--sidebar-menu-button-font-size-sm,0.75rem)]/[var(--sidebar-menu-button-line-height-sm,calc(1/0.75))]",
        lg: "h-[var(--sidebar-menu-button-height-lg,3rem)] text-[length:var(--sidebar-menu-button-font-size-lg,var(--sidebar-menu-button-font-size,0.875rem))]/[var(--sidebar-menu-button-line-height-lg,var(--sidebar-menu-button-line-height,calc(1.25/0.875)))] group-data-[collapsible=icon]:p-0!",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function SidebarMenuButton({
  asChild = false,
  isActive = false,
  variant = "default",
  size = "default",
  tooltip,
  className,
  ...props
}: React.ComponentProps<"button"> & {
  asChild?: boolean;
  isActive?: boolean;
  tooltip?: string | React.ComponentProps<typeof TooltipContent>;
} & VariantProps<typeof sidebarMenuButtonVariants>) {
  const Comp = asChild ? Slot : "button";
  const { isMobile, state } = useSidebar();

  const button = (
    <Comp
      data-slot="sidebar-menu-button"
      data-sidebar="menu-button"
      data-variant={variant ?? "default"}
      data-size={size ?? "default"}
      data-active={isActive}
      className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
      {...props}
    />
  );

  if (!tooltip) {
    return button;
  }

  if (typeof tooltip === "string") {
    tooltip = {
      children: tooltip,
    };
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent
        side="right"
        align="center"
        hidden={state !== "collapsed" || isMobile}
        {...tooltip}
      />
    </Tooltip>
  );
}

function SidebarMenuAction({
  className,
  asChild = false,
  showOnHover = false,
  ...props
}: React.ComponentProps<"button"> & {
  asChild?: boolean;
  showOnHover?: boolean;
}) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="sidebar-menu-action"
      data-sidebar="menu-action"
      className={cn(
        "text-[color:var(--sidebar-menu-action-color,var(--sidebar-foreground))] ring-[color:var(--sidebar-menu-action-ring-color,var(--sidebar-ring))] hover:bg-[color:var(--sidebar-menu-action-bg-hover,var(--sidebar-accent))] hover:text-[color:var(--sidebar-menu-action-color-hover,var(--sidebar-accent-foreground))] peer-hover/menu-button:text-sidebar-accent-foreground absolute top-1.5 right-1 flex aspect-square w-[var(--sidebar-menu-action-width,1.25rem)] items-center justify-center rounded-[var(--sidebar-menu-action-radius,calc(var(--radius)_-_2px))] p-[var(--sidebar-menu-action-padding,0px)] outline-hidden transition-transform focus-visible:ring-[length:var(--sidebar-menu-action-ring-width-focus,var(--focus-ring-width,2px))] [&>svg]:size-[var(--sidebar-menu-action-icon-size,1rem)] [&>svg]:shrink-0",
        // Increases the hit area of the button on mobile.
        "after:absolute after:-inset-2 md:after:hidden",
        "peer-data-[size=sm]/menu-button:top-1",
        "peer-data-[size=default]/menu-button:top-1.5",
        "peer-data-[size=lg]/menu-button:top-2.5",
        "group-data-[collapsible=icon]:hidden",
        showOnHover &&
          "peer-data-[active=true]/menu-button:text-sidebar-accent-foreground group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-[var(--sidebar-menu-action-opacity-open,1)] md:opacity-0",
        className,
      )}
      {...props}
    />
  );
}

function SidebarMenuBadge({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-menu-badge"
      data-sidebar="menu-badge"
      className={cn(
        "text-[color:var(--sidebar-menu-badge-color,var(--sidebar-foreground))] pointer-events-none absolute right-1 flex h-[var(--sidebar-menu-badge-height,1.25rem)] min-w-[var(--sidebar-menu-badge-min-width,1.25rem)] items-center justify-center rounded-[var(--sidebar-menu-badge-radius,calc(var(--radius)_-_2px))] px-[var(--sidebar-menu-badge-padding-x,0.25rem)] text-[length:var(--sidebar-menu-badge-font-size,0.75rem)]/[var(--sidebar-menu-badge-line-height,calc(1/0.75))] font-[number:var(--sidebar-menu-badge-font-weight,500)] tabular-nums select-none",
        "peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground",
        "peer-data-[size=sm]/menu-button:top-1",
        "peer-data-[size=default]/menu-button:top-1.5",
        "peer-data-[size=lg]/menu-button:top-2.5",
        "group-data-[collapsible=icon]:hidden",
        className,
      )}
      {...props}
    />
  );
}

function SidebarMenuSkeleton({
  className,
  showIcon = false,
  ...props
}: React.ComponentProps<"div"> & {
  showIcon?: boolean;
}) {
  // Random width between 50 to 90%.
  const width = React.useMemo(() => {
    return `${Math.floor(Math.random() * 40) + 50}%`;
  }, []);

  return (
    <div
      data-slot="sidebar-menu-skeleton"
      data-sidebar="menu-skeleton"
      className={cn(
        "flex h-[var(--sidebar-menu-skeleton-height,2rem)] items-center gap-[var(--sidebar-menu-skeleton-gap,0.5rem)] rounded-[var(--sidebar-menu-skeleton-radius,calc(var(--radius)_-_2px))] px-[var(--sidebar-menu-skeleton-padding-x,0.5rem)]",
        className,
      )}
      {...props}
    >
      {showIcon && <Skeleton className="size-4 rounded-md" data-sidebar="menu-skeleton-icon" />}
      <Skeleton
        className="h-4 max-w-(--skeleton-width) flex-1"
        data-sidebar="menu-skeleton-text"
        style={
          {
            "--skeleton-width": width,
          } as React.CSSProperties
        }
      />
    </div>
  );
}

function SidebarMenuSub({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu-sub"
      data-sidebar="menu-sub"
      className={cn(
        "border-[color:var(--sidebar-menu-sub-border-color,var(--sidebar-border))] mx-3.5 flex min-w-[var(--sidebar-menu-sub-min-width,0px)] translate-x-px flex-col gap-[var(--sidebar-menu-sub-gap,0.25rem)] border-l px-[var(--sidebar-menu-sub-padding-x,0.625rem)] py-[var(--sidebar-menu-sub-padding-y,0.125rem)]",
        "group-data-[collapsible=icon]:hidden",
        className,
      )}
      {...props}
    />
  );
}

function SidebarMenuSubItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-sub-item"
      data-sidebar="menu-sub-item"
      className={cn("group/menu-sub-item relative", className)}
      {...props}
    />
  );
}

function SidebarMenuSubButton({
  asChild = false,
  size = "md",
  isActive = false,
  className,
  ...props
}: React.ComponentProps<"a"> & {
  asChild?: boolean;
  size?: "sm" | "md";
  isActive?: boolean;
}) {
  const Comp = asChild ? Slot : "a";

  return (
    <Comp
      data-slot="sidebar-menu-sub-button"
      data-sidebar="menu-sub-button"
      data-size={size}
      data-active={isActive}
      className={cn(
        "text-[color:var(--sidebar-menu-sub-button-color,var(--sidebar-foreground))] ring-[color:var(--sidebar-menu-sub-button-ring-color,var(--sidebar-ring))] hover:bg-[color:var(--sidebar-menu-sub-button-bg-hover,var(--sidebar-accent))] hover:text-[color:var(--sidebar-menu-sub-button-color-hover,var(--sidebar-accent-foreground))] active:bg-[color:var(--sidebar-menu-sub-button-bg-pressed,var(--sidebar-accent))] active:text-[color:var(--sidebar-menu-sub-button-color-pressed,var(--sidebar-accent-foreground))] [&>svg]:text-[color:var(--sidebar-menu-sub-button-icon-color,var(--sidebar-accent-foreground))] flex h-[var(--sidebar-menu-sub-button-height,1.75rem)] min-w-[var(--sidebar-menu-sub-button-min-width,0px)] -translate-x-px items-center gap-[var(--sidebar-menu-sub-button-gap,0.5rem)] overflow-hidden rounded-[var(--sidebar-menu-sub-button-radius,calc(var(--radius)_-_2px))] px-[var(--sidebar-menu-sub-button-padding-x,0.5rem)] outline-hidden focus-visible:ring-[length:var(--sidebar-menu-sub-button-ring-width-focus,var(--focus-ring-width,2px))] disabled:pointer-events-none disabled:opacity-[var(--sidebar-menu-sub-button-opacity-disabled,var(--control-opacity-disabled,0.5))] aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-[var(--sidebar-menu-sub-button-icon-size,1rem)] [&>svg]:shrink-0",
        "data-[active=true]:bg-[color:var(--sidebar-menu-sub-button-bg-active,var(--sidebar-accent))] data-[active=true]:text-[color:var(--sidebar-menu-sub-button-color-active,var(--sidebar-accent-foreground))]",
        size === "sm" &&
          "text-[length:var(--sidebar-menu-sub-button-font-size,0.75rem)]/[var(--sidebar-menu-sub-button-line-height,calc(1/0.75))]",
        size === "md" && "text-sm",
        "group-data-[collapsible=icon]:hidden",
        className,
      )}
      {...props}
    />
  );
}

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
};
