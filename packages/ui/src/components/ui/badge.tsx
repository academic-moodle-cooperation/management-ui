import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ClassProp } from "class-variance-authority/types";
import * as React from "react";

import { cn } from "../../lib/utils";

export type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

/** The variant axis `badgeVariants` and `Badge` accept. */
export type BadgeVariantProps = {
  variant?: BadgeVariant | null | undefined;
};

// Typed explicitly for the same reason as `buttonVariants` (see button.tsx):
// an inferred literal union prints in machine-dependent member order and
// makes the API report drift between local and CI runs.
const badgeVariants: (props?: BadgeVariantProps & ClassProp) => string = cva(
  [
    "inline-flex items-center justify-center w-fit whitespace-nowrap shrink-0 [&>svg]:pointer-events-none transition-[color,box-shadow] overflow-hidden",
    "rounded-[var(--badge-radius,calc(var(--radius)_-_2px))]",
    "border-[length:var(--badge-border-width,1px)]",
    "px-[var(--badge-padding-x,0.5rem)]",
    "py-[var(--badge-padding-y,0.125rem)]",
    "text-[length:var(--badge-font-size,0.75rem)]/[var(--badge-line-height,calc(1/0.75))]",
    "font-[number:var(--badge-font-weight,500)]",
    "gap-[var(--badge-gap,0.25rem)]",
    "[&>svg]:size-[var(--badge-icon-size,0.75rem)]",
    "focus-visible:border-[color:var(--badge-border-color-focus,var(--ring))]",
    "focus-visible:ring-[color:var(--badge-ring-color-focus,var(--focus-ring-color,color-mix(in_oklab,var(--ring)_50%,transparent)))]",
    "focus-visible:ring-[length:var(--badge-ring-width-focus,3px)]",
    "aria-invalid:border-[color:var(--badge-border-color-invalid,var(--destructive))]",
    "aria-invalid:ring-[color:var(--badge-ring-color-invalid,color-mix(in_oklab,var(--destructive)_20%,transparent))]",
    "dark:aria-invalid:ring-[color:var(--badge-ring-color-invalid,color-mix(in_oklab,var(--destructive)_40%,transparent))]",
  ],
  {
    variants: {
      variant: {
        default: [
          "border-[color:var(--badge-border-color-default,transparent)]",
          "bg-[color:var(--badge-bg-default,var(--primary))]",
          "text-[color:var(--badge-color-default,var(--primary-foreground))]",
          "[a&]:hover:bg-[color:var(--badge-bg-default-hover,color-mix(in_oklab,var(--badge-bg-default,var(--primary))_90%,transparent))]",
        ],
        secondary: [
          "border-[color:var(--badge-border-color-secondary,transparent)]",
          "bg-[color:var(--badge-bg-secondary,var(--secondary))]",
          "text-[color:var(--badge-color-secondary,var(--secondary-foreground))]",
          "[a&]:hover:bg-[color:var(--badge-bg-secondary-hover,color-mix(in_oklab,var(--badge-bg-secondary,var(--secondary))_90%,transparent))]",
        ],
        destructive: [
          "border-[color:var(--badge-border-color-destructive,transparent)]",
          "bg-[color:var(--badge-bg-destructive,var(--destructive))]",
          "dark:bg-[color:var(--badge-bg-destructive,color-mix(in_oklab,var(--destructive)_60%,transparent))]",
          "text-[color:var(--badge-color-destructive,white)]",
          "[a&]:hover:bg-[color:var(--badge-bg-destructive-hover,color-mix(in_oklab,var(--badge-bg-destructive,var(--destructive))_90%,transparent))]",
          "focus-visible:ring-[color:var(--badge-ring-color-destructive-focus,color-mix(in_oklab,var(--destructive)_20%,transparent))]",
          "dark:focus-visible:ring-[color:var(--badge-ring-color-destructive-focus,color-mix(in_oklab,var(--destructive)_40%,transparent))]",
        ],
        outline: [
          "text-[color:var(--badge-color-outline,var(--foreground))]",
          "[a&]:hover:bg-[color:var(--badge-bg-outline-hover,var(--accent))]",
          "[a&]:hover:text-[color:var(--badge-color-outline-hover,var(--accent-foreground))]",
        ],
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      data-variant={variant ?? "default"}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
