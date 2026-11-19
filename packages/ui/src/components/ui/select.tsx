"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import * as React from "react";

import { cn } from "../../lib/utils";

function Select({ ...props }: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />;
}

function SelectGroup({ ...props }: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />;
}

function SelectValue({ ...props }: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />;
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: "sm" | "default";
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "border-[color:var(--select-trigger-border-color,var(--input))] data-[placeholder]:text-[color:var(--select-trigger-color-placeholder,var(--muted-foreground))] [&_svg:not([class*='text-'])]:text-[color:var(--select-trigger-icon-color,var(--muted-foreground))] focus-visible:border-[color:var(--select-trigger-border-color-focus,var(--ring))] focus-visible:ring-[color:var(--select-trigger-ring-color-focus,var(--focus-ring-color,color-mix(in_oklab,var(--ring)_50%,transparent)))] aria-invalid:ring-[color:var(--select-trigger-ring-color-invalid,color-mix(in_oklab,var(--destructive)_20%,transparent))] dark:aria-invalid:ring-[color:var(--select-trigger-ring-color-invalid,color-mix(in_oklab,var(--destructive)_40%,transparent))] aria-invalid:border-[color:var(--select-trigger-border-color-invalid,var(--destructive))] dark:bg-[color:var(--select-trigger-bg,color-mix(in_oklab,var(--input)_30%,transparent))] dark:hover:bg-[color:var(--select-trigger-bg-hover,color-mix(in_oklab,var(--input)_50%,transparent))] flex w-fit items-center justify-between gap-[var(--select-trigger-gap,0.5rem)] rounded-[var(--select-trigger-radius,calc(var(--radius)_-_2px))] border-[length:var(--select-trigger-border-width,1px)] bg-[color:var(--select-trigger-bg,transparent)] px-[var(--select-trigger-padding-x,0.75rem)] py-[var(--select-trigger-padding-y,0.5rem)] text-[length:var(--select-trigger-font-size,0.875rem)]/[var(--select-trigger-line-height,calc(1.25/0.875))] whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[length:var(--select-trigger-ring-width-focus,3px)] disabled:cursor-not-allowed disabled:opacity-[var(--select-trigger-opacity-disabled,var(--control-opacity-disabled,0.5))] data-[size=default]:h-[var(--select-trigger-height,2.25rem)] data-[size=sm]:h-[var(--select-trigger-height-sm,2rem)] *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[var(--select-trigger-icon-size,1rem)]",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="size-4 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({
  className,
  children,
  position = "popper",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        className={cn(
          "bg-[color:var(--select-content-bg,var(--popover))] text-[color:var(--select-content-color,var(--popover-foreground))] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-(--radix-select-content-available-height) min-w-[var(--select-content-min-width,8rem)] origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-[var(--select-content-radius,calc(var(--radius)_-_2px))] border-[length:var(--select-content-border-width,1px)] shadow-md",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className,
        )}
        position={position}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            "p-[var(--select-content-padding,0.25rem)]",
            position === "popper" &&
              "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1",
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

function SelectLabel({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn(
        "text-[color:var(--select-label-color,var(--muted-foreground))] px-[var(--select-label-padding-x,0.5rem)] py-[var(--select-label-padding-y,0.375rem)] text-[length:var(--select-label-font-size,0.75rem)]/[var(--select-label-line-height,calc(1/0.75))]",
        className,
      )}
      {...props}
    />
  );
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "focus:bg-[color:var(--select-item-bg-focus,var(--accent))] focus:text-[color:var(--select-item-color-focus,var(--accent-foreground))] [&_svg:not([class*='text-'])]:text-[color:var(--select-item-icon-color,var(--muted-foreground))] relative flex w-full cursor-default items-center gap-[var(--select-item-gap,0.5rem)] rounded-[var(--select-item-radius,calc(var(--radius)_-_4px))] py-[var(--select-item-padding-y,0.375rem)] pr-[var(--select-item-padding-right,2rem)] pl-[var(--select-item-padding-left,0.5rem)] text-[length:var(--select-item-font-size,0.875rem)]/[var(--select-item-line-height,calc(1.25/0.875))] outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-[var(--select-item-opacity-disabled,var(--control-opacity-disabled,0.5))] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[var(--select-item-icon-size,1rem)] *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className,
      )}
      {...props}
    >
      <span className="absolute right-2 flex size-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn(
        "bg-[color:var(--select-separator-bg,var(--border))] pointer-events-none -mx-1 my-1 h-px",
        className,
      )}
      {...props}
    />
  );
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(
        "flex cursor-default items-center justify-center py-[var(--select-scroll-up-button-padding-y,0.25rem)]",
        className,
      )}
      {...props}
    >
      <ChevronUpIcon className="size-4" />
    </SelectPrimitive.ScrollUpButton>
  );
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(
        "flex cursor-default items-center justify-center py-[var(--select-scroll-down-button-padding-y,0.25rem)]",
        className,
      )}
      {...props}
    >
      <ChevronDownIcon className="size-4" />
    </SelectPrimitive.ScrollDownButton>
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
