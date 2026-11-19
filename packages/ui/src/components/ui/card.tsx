import * as React from "react";

import { cn } from "../../lib/utils";

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-[color:var(--card-bg,var(--card))] text-[color:var(--card-color,var(--card-foreground))] flex flex-col gap-[var(--card-gap,var(--card-spacing,1.5rem))] rounded-[var(--card-radius,calc(var(--radius)_+_4px))] border-[length:var(--card-border-width,1px)] py-[var(--card-padding-y,var(--card-spacing,1.5rem))] shadow-sm",
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-[var(--card-header-gap,0.375rem)] px-[var(--card-header-padding-x,var(--card-spacing,1.5rem))] has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-[var(--card-header-padding-bottom,var(--card-spacing,1.5rem))]",
        className,
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "leading-[var(--card-title-line-height,1)] font-[number:var(--card-title-font-weight,600)]",
        className,
      )}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn(
        "text-[color:var(--card-description-color,var(--muted-foreground))] text-[length:var(--card-description-font-size,0.875rem)]/[var(--card-description-line-height,calc(1.25/0.875))]",
        className,
      )}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-[var(--card-content-padding-x,var(--card-spacing,1.5rem))]", className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center px-[var(--card-footer-padding-x,var(--card-spacing,1.5rem))] [.border-t]:pt-[var(--card-footer-padding-top,var(--card-spacing,1.5rem))]",
        className,
      )}
      {...props}
    />
  );
}

export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent };
