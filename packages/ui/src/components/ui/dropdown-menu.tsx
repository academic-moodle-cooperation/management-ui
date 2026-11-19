"use client";

import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react";
import * as React from "react";

import { cn } from "../../lib/utils";

function DropdownMenu({ ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

function DropdownMenuPortal({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Portal>) {
  return <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />;
}

function DropdownMenuTrigger({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
  return <DropdownMenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />;
}

function DropdownMenuContent({
  className,
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        className={cn(
          "bg-[color:var(--dropdown-menu-content-bg,var(--popover))] text-[color:var(--dropdown-menu-content-color,var(--popover-foreground))] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-(--radix-dropdown-menu-content-available-height) min-w-[var(--dropdown-menu-content-min-width,8rem)] origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-[var(--dropdown-menu-content-radius,calc(var(--radius)_-_2px))] border-[length:var(--dropdown-menu-content-border-width,1px)] p-[var(--dropdown-menu-content-padding,0.25rem)] shadow-md",
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

function DropdownMenuGroup({ ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Group>) {
  return <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />;
}

function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
  inset?: boolean;
  variant?: "default" | "destructive";
}) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "focus:bg-[color:var(--dropdown-menu-item-bg-focus,var(--accent))] focus:text-[color:var(--dropdown-menu-item-color-focus,var(--accent-foreground))] data-[variant=destructive]:text-[color:var(--dropdown-menu-item-color-destructive,var(--destructive))] data-[variant=destructive]:focus:bg-[color:var(--dropdown-menu-item-bg-destructive-focus,color-mix(in_oklab,var(--destructive)_10%,transparent))] dark:data-[variant=destructive]:focus:bg-[color:var(--dropdown-menu-item-bg-destructive-focus,color-mix(in_oklab,var(--destructive)_20%,transparent))] data-[variant=destructive]:focus:text-[color:var(--dropdown-menu-item-color-destructive-focus,var(--destructive))] data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-[color:var(--dropdown-menu-item-icon-color,var(--muted-foreground))] relative flex cursor-default items-center gap-[var(--dropdown-menu-item-gap,0.5rem)] rounded-[var(--dropdown-menu-item-radius,calc(var(--radius)_-_4px))] px-[var(--dropdown-menu-item-padding-x,0.5rem)] py-[var(--dropdown-menu-item-padding-y,0.375rem)] text-[length:var(--dropdown-menu-item-font-size,0.875rem)]/[var(--dropdown-menu-item-line-height,calc(1.25/0.875))] outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-[var(--dropdown-menu-item-opacity-disabled,var(--control-opacity-disabled,0.5))] data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[var(--dropdown-menu-item-icon-size,1rem)]",
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      className={cn(
        "focus:bg-[color:var(--dropdown-menu-checkbox-item-bg-focus,var(--accent))] focus:text-[color:var(--dropdown-menu-checkbox-item-color-focus,var(--accent-foreground))] relative flex cursor-default items-center gap-[var(--dropdown-menu-checkbox-item-gap,0.5rem)] rounded-[var(--dropdown-menu-checkbox-item-radius,calc(var(--radius)_-_4px))] py-[var(--dropdown-menu-checkbox-item-padding-y,0.375rem)] pr-[var(--dropdown-menu-checkbox-item-padding-right,0.5rem)] pl-[var(--dropdown-menu-checkbox-item-padding-left,2rem)] text-[length:var(--dropdown-menu-checkbox-item-font-size,0.875rem)]/[var(--dropdown-menu-checkbox-item-line-height,calc(1.25/0.875))] outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-[var(--dropdown-menu-checkbox-item-opacity-disabled,var(--control-opacity-disabled,0.5))] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[var(--dropdown-menu-checkbox-item-icon-size,1rem)]",
        className,
      )}
      {...(checked !== undefined && { checked })}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  );
}

function DropdownMenuRadioGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>) {
  return <DropdownMenuPrimitive.RadioGroup data-slot="dropdown-menu-radio-group" {...props} />;
}

function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
  return (
    <DropdownMenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      className={cn(
        "focus:bg-[color:var(--dropdown-menu-radio-item-bg-focus,var(--accent))] focus:text-[color:var(--dropdown-menu-radio-item-color-focus,var(--accent-foreground))] relative flex cursor-default items-center gap-[var(--dropdown-menu-radio-item-gap,0.5rem)] rounded-[var(--dropdown-menu-radio-item-radius,calc(var(--radius)_-_4px))] py-[var(--dropdown-menu-radio-item-padding-y,0.375rem)] pr-[var(--dropdown-menu-radio-item-padding-right,0.5rem)] pl-[var(--dropdown-menu-radio-item-padding-left,2rem)] text-[length:var(--dropdown-menu-radio-item-font-size,0.875rem)]/[var(--dropdown-menu-radio-item-line-height,calc(1.25/0.875))] outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-[var(--dropdown-menu-radio-item-opacity-disabled,var(--control-opacity-disabled,0.5))] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[var(--dropdown-menu-radio-item-icon-size,1rem)]",
        className,
      )}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CircleIcon className="size-2 fill-current" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  );
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
  inset?: boolean;
}) {
  return (
    <DropdownMenuPrimitive.Label
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(
        "px-[var(--dropdown-menu-label-padding-x,0.5rem)] py-[var(--dropdown-menu-label-padding-y,0.375rem)] text-[length:var(--dropdown-menu-label-font-size,0.875rem)]/[var(--dropdown-menu-label-line-height,calc(1.25/0.875))] font-[number:var(--dropdown-menu-label-font-weight,500)] data-[inset]:pl-8",
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn(
        "bg-[color:var(--dropdown-menu-separator-bg,var(--border))] -mx-1 my-1 h-px",
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuShortcut({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(
        "text-[color:var(--dropdown-menu-shortcut-color,var(--muted-foreground))] ml-auto text-[length:var(--dropdown-menu-shortcut-font-size,0.75rem)]/[var(--dropdown-menu-shortcut-line-height,calc(1/0.75))] tracking-widest",
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuSub({ ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Sub>) {
  return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />;
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
  inset?: boolean;
}) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        "focus:bg-[color:var(--dropdown-menu-sub-trigger-bg-focus,var(--accent))] focus:text-[color:var(--dropdown-menu-sub-trigger-color-focus,var(--accent-foreground))] data-[state=open]:bg-[color:var(--dropdown-menu-sub-trigger-bg-open,var(--accent))] data-[state=open]:text-[color:var(--dropdown-menu-sub-trigger-color-open,var(--accent-foreground))] flex cursor-default items-center rounded-[var(--dropdown-menu-sub-trigger-radius,calc(var(--radius)_-_4px))] px-[var(--dropdown-menu-sub-trigger-padding-x,0.5rem)] py-[var(--dropdown-menu-sub-trigger-padding-y,0.375rem)] text-[length:var(--dropdown-menu-sub-trigger-font-size,0.875rem)]/[var(--dropdown-menu-sub-trigger-line-height,calc(1.25/0.875))] outline-hidden select-none data-[inset]:pl-8",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto size-4" />
    </DropdownMenuPrimitive.SubTrigger>
  );
}

function DropdownMenuSubContent({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>) {
  return (
    <DropdownMenuPrimitive.SubContent
      data-slot="dropdown-menu-sub-content"
      className={cn(
        "bg-[color:var(--dropdown-menu-sub-content-bg,var(--popover))] text-[color:var(--dropdown-menu-sub-content-color,var(--popover-foreground))] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[var(--dropdown-menu-sub-content-min-width,8rem)] origin-(--radix-dropdown-menu-content-transform-origin) overflow-hidden rounded-[var(--dropdown-menu-sub-content-radius,calc(var(--radius)_-_2px))] border-[length:var(--dropdown-menu-sub-content-border-width,1px)] p-[var(--dropdown-menu-sub-content-padding,0.25rem)] shadow-lg",
        className,
      )}
      {...props}
    />
  );
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
};
