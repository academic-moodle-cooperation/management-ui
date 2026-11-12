import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ClassProp } from "class-variance-authority/types";
import * as React from "react";

import { cn } from "../../lib/utils";

export type ButtonVariant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
export type ButtonSize = "default" | "sm" | "lg" | "icon";

/** The variant axes `buttonVariants` and `Button` accept. */
export type ButtonVariantProps = {
  variant?: ButtonVariant | null | undefined;
  size?: ButtonSize | null | undefined;
};

// Typed explicitly, not inferred from `cva`: TypeScript orders the members of
// an inferred literal union by internal type id (creation order), which varies
// between machines, and API Extractor compares the printed text — the inferred
// signature made `etc/ui-components.api.md` drift between local and CI runs.
// Structure stays here as utilities; the look comes from the active style
// sheet (`styles/component-styles/<style>.css`) through the `cn-*` classes.
const buttonVariants: (props?: ButtonVariantProps & ClassProp) => string = cva(
  "cn-button inline-flex items-center justify-center whitespace-nowrap disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none",
  {
    variants: {
      variant: {
        default: "cn-button-variant-default",
        destructive: "cn-button-variant-destructive",
        outline: "cn-button-variant-outline",
        secondary: "cn-button-variant-secondary",
        ghost: "cn-button-variant-ghost",
        link: "cn-button-variant-link",
      },
      size: {
        default: "cn-button-size-default",
        sm: "cn-button-size-sm",
        lg: "cn-button-size-lg",
        icon: "cn-button-size-icon",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
