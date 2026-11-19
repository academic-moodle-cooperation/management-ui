import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as React from "react";

import { cn } from "../../lib/utils";

function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-[var(--tabs-gap,0.5rem)]", className)}
      {...props}
    />
  );
}

function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "bg-[color:var(--tabs-list-bg,var(--muted))] text-[color:var(--tabs-list-color,var(--muted-foreground))] inline-flex h-[var(--tabs-list-height,2.25rem)] w-fit items-center justify-center rounded-[var(--tabs-list-radius,var(--radius))] p-[var(--tabs-list-padding,3px)]",
        className,
      )}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "data-[state=active]:bg-[color:var(--tabs-trigger-bg-active,var(--background))] dark:data-[state=active]:text-[color:var(--tabs-trigger-color-active,var(--foreground))] focus-visible:border-[color:var(--tabs-trigger-border-color-focus,var(--ring))] focus-visible:ring-[color:var(--tabs-trigger-ring-color-focus,var(--focus-ring-color,color-mix(in_oklab,var(--ring)_50%,transparent)))] focus-visible:outline-ring dark:data-[state=active]:border-[color:var(--tabs-trigger-border-color-active,var(--input))] dark:data-[state=active]:bg-[color:var(--tabs-trigger-bg-active,color-mix(in_oklab,var(--input)_30%,transparent))] text-[color:var(--tabs-trigger-color,var(--foreground))] dark:text-[color:var(--tabs-trigger-color,var(--muted-foreground))] inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-[var(--tabs-trigger-gap,0.375rem)] rounded-[var(--tabs-trigger-radius,calc(var(--radius)_-_2px))] border-[length:var(--tabs-trigger-border-width,1px)] border-[color:var(--tabs-trigger-border-color,transparent)] px-[var(--tabs-trigger-padding-x,0.5rem)] py-[var(--tabs-trigger-padding-y,0.25rem)] text-[length:var(--tabs-trigger-font-size,0.875rem)]/[var(--tabs-trigger-line-height,calc(1.25/0.875))] font-[number:var(--tabs-trigger-font-weight,500)] whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[length:var(--tabs-trigger-ring-width-focus,var(--focus-ring-width,3px))] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-[var(--tabs-trigger-opacity-disabled,var(--control-opacity-disabled,0.5))] data-[state=active]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[var(--tabs-trigger-icon-size,1rem)]",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
