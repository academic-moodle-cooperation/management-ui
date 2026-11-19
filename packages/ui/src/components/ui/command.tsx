"use client";

import { Command as CommandPrimitive } from "cmdk";
import { SearchIcon } from "lucide-react";
import * as React from "react";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./dialog";
import { cn } from "../../lib/utils";

function Command({ className, ...props }: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn(
        "bg-[color:var(--command-bg,var(--popover))] text-[color:var(--command-color,var(--popover-foreground))] flex h-full w-full flex-col overflow-hidden rounded-[var(--command-radius,calc(var(--radius)_-_2px))]",
        className,
      )}
      {...props}
    />
  );
}

function CommandDialog({
  title = "Command Palette",
  description = "Search for a command to run...",
  children,
  className,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof Dialog> & {
  title?: string;
  description?: string;
  className?: string;
  showCloseButton?: boolean;
}) {
  return (
    <Dialog {...props}>
      <DialogHeader className="sr-only">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogContent
        className={cn("overflow-hidden p-0", className)}
        showCloseButton={showCloseButton}
      >
        <Command className="[&_[cmdk-group-heading]]:text-muted-foreground **:data-[slot=command-input-wrapper]:h-12 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group]]:px-2 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  );
}

function CommandInput({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div
      data-slot="command-input-wrapper"
      className="flex h-[var(--command-input-wrapper-height,2.25rem)] items-center gap-[var(--command-input-wrapper-gap,0.5rem)] border-b px-[var(--command-input-wrapper-padding-x,0.75rem)]"
    >
      <SearchIcon className="size-4 shrink-0 opacity-50" />
      <CommandPrimitive.Input
        data-slot="command-input"
        className={cn(
          "placeholder:text-[color:var(--command-input-color-placeholder,var(--muted-foreground))] flex h-[var(--command-input-height,2.5rem)] w-full rounded-[var(--command-input-radius,calc(var(--radius)_-_2px))] bg-[color:var(--command-input-bg,transparent)] py-[var(--command-input-padding-y,0.75rem)] text-[length:var(--command-input-font-size,0.875rem)]/[var(--command-input-line-height,calc(1.25/0.875))] outline-hidden disabled:cursor-not-allowed disabled:opacity-[var(--command-input-opacity-disabled,var(--control-opacity-disabled,0.5))]",
          className,
        )}
        {...props}
      />
    </div>
  );
}

function CommandList({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn("max-h-[300px] scroll-py-1 overflow-x-hidden overflow-y-auto", className)}
      {...props}
    />
  );
}

function CommandEmpty({ ...props }: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className="py-[var(--command-empty-padding-y,1.5rem)] text-center text-[length:var(--command-empty-font-size,0.875rem)]/[var(--command-empty-line-height,calc(1.25/0.875))]"
      {...props}
    />
  );
}

function CommandGroup({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        "text-[color:var(--command-group-color,var(--foreground))] [&_[cmdk-group-heading]]:text-muted-foreground overflow-hidden p-[var(--command-group-padding,0.25rem)] [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium",
        className,
      )}
      {...props}
    />
  );
}

function CommandSeparator({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn("bg-[color:var(--command-separator-bg,var(--border))] -mx-1 h-px", className)}
      {...props}
    />
  );
}

function CommandItem({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        "data-[selected=true]:bg-[color:var(--command-item-bg-selected,var(--accent))] data-[selected=true]:text-[color:var(--command-item-color-selected,var(--accent-foreground))] [&_svg:not([class*='text-'])]:text-[color:var(--command-item-icon-color,var(--muted-foreground))] relative flex cursor-default items-center gap-[var(--command-item-gap,0.5rem)] rounded-[var(--command-item-radius,calc(var(--radius)_-_4px))] px-[var(--command-item-padding-x,0.5rem)] py-[var(--command-item-padding-y,0.375rem)] text-[length:var(--command-item-font-size,0.875rem)]/[var(--command-item-line-height,calc(1.25/0.875))] outline-hidden select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-[var(--command-item-opacity-disabled,var(--control-opacity-disabled,0.5))] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[var(--command-item-icon-size,1rem)]",
        className,
      )}
      {...props}
    />
  );
}

function CommandShortcut({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn(
        "text-[color:var(--command-shortcut-color,var(--muted-foreground))] ml-auto text-[length:var(--command-shortcut-font-size,0.75rem)]/[var(--command-shortcut-line-height,calc(1/0.75))] tracking-widest",
        className,
      )}
      {...props}
    />
  );
}

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
};
