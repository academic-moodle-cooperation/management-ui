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
// Every value of the look is read from a component variable (naming scheme
// and fallback rule: "Component variables" in `styles/globals.css`). The
// fallback inside each `var()` is the value the button has always had, so
// nothing changes while no theme sets the variable. Bracket syntax with a type
// hint (`[color:…]`, `[length:…]`), because the installed tailwind-merge
// resolves that form against a caller's plain utility; the short form
// `h-(--x)` it does not. Every class is written out in full: Tailwind finds
// class names by scanning this text and cannot see a composed one.
const buttonVariants: (props?: ButtonVariantProps & ClassProp) => string = cva(
  [
    "inline-flex items-center justify-center whitespace-nowrap transition-all shrink-0 outline-none",
    "disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0",
    "gap-[var(--button-gap)]",
    "rounded-[var(--button-radius,var(--control-radius))]",
    "text-[length:var(--button-font-size,var(--control-font-size))]",
    "leading-[var(--button-line-height,var(--control-line-height))]",
    "font-[number:var(--button-font-weight)]",
    "[&_svg:not([class*='size-'])]:size-[var(--button-icon-size,1rem)]",
    "disabled:opacity-[var(--button-opacity-disabled,var(--control-opacity-disabled,0.5))]",
    "focus-visible:border-[color:var(--button-border-color-focus,var(--ring))]",
    "focus-visible:ring-[color:var(--button-ring-color-focus,var(--focus-ring-color,color-mix(in_oklab,var(--ring)_50%,transparent)))]",
    "focus-visible:ring-[length:var(--button-ring-width-focus,var(--focus-ring-width))]",
    "aria-invalid:border-[color:var(--button-border-color-invalid,var(--destructive))]",
    "aria-invalid:ring-[color:var(--button-ring-color-invalid,color-mix(in_oklab,var(--destructive)_20%,transparent))]",
    "dark:aria-invalid:ring-[color:var(--button-ring-color-invalid,color-mix(in_oklab,var(--destructive)_40%,transparent))]",
  ],
  {
    variants: {
      variant: {
        default: [
          "shadow-xs",
          "bg-[color:var(--button-bg-default,var(--primary))]",
          "text-[color:var(--button-color-default,var(--primary-foreground))]",
          "hover:bg-[color:var(--button-bg-default-hover,color-mix(in_oklab,var(--button-bg-default,var(--primary))_90%,transparent))]",
        ],
        destructive: [
          "shadow-xs",
          "bg-[color:var(--button-bg-destructive,var(--destructive))]",
          "dark:bg-[color:var(--button-bg-destructive,color-mix(in_oklab,var(--destructive)_60%,transparent))]",
          "text-[color:var(--button-color-destructive,white)]",
          "hover:bg-[color:var(--button-bg-destructive-hover,color-mix(in_oklab,var(--button-bg-destructive,var(--destructive))_90%,transparent))]",
          "focus-visible:ring-[color:var(--button-ring-color-destructive-focus,color-mix(in_oklab,var(--destructive)_20%,transparent))]",
          "dark:focus-visible:ring-[color:var(--button-ring-color-destructive-focus,color-mix(in_oklab,var(--destructive)_40%,transparent))]",
        ],
        outline: [
          "shadow-xs",
          "border-[length:var(--button-border-width-outline,var(--control-border-width))]",
          "border-[color:var(--button-border-color-outline,var(--border))]",
          "dark:border-[color:var(--button-border-color-outline,var(--input))]",
          "bg-[color:var(--button-bg-outline,var(--background))]",
          "dark:bg-[color:var(--button-bg-outline,color-mix(in_oklab,var(--input)_30%,transparent))]",
          "hover:bg-[color:var(--button-bg-outline-hover,var(--accent))]",
          "dark:hover:bg-[color:var(--button-bg-outline-hover,color-mix(in_oklab,var(--input)_50%,transparent))]",
          "hover:text-[color:var(--button-color-outline-hover,var(--accent-foreground))]",
        ],
        secondary: [
          "shadow-xs",
          "bg-[color:var(--button-bg-secondary,var(--secondary))]",
          "text-[color:var(--button-color-secondary,var(--secondary-foreground))]",
          "hover:bg-[color:var(--button-bg-secondary-hover,color-mix(in_oklab,var(--button-bg-secondary,var(--secondary))_80%,transparent))]",
        ],
        ghost: [
          "hover:bg-[color:var(--button-bg-ghost-hover,var(--accent))]",
          "dark:hover:bg-[color:var(--button-bg-ghost-hover,color-mix(in_oklab,var(--accent)_50%,transparent))]",
          "hover:text-[color:var(--button-color-ghost-hover,var(--accent-foreground))]",
        ],
        link: [
          "underline-offset-4 hover:underline",
          "text-[color:var(--button-color-link,var(--primary))]",
          "[text-decoration-line:var(--button-text-decoration-link,none)]",
        ],
      },
      size: {
        default: [
          "h-[var(--button-height,var(--control-height))]",
          "px-[var(--button-padding-x)]",
          "py-[var(--button-padding-y,0.5rem)]",
          "has-[>svg]:px-[var(--button-padding-x-icon)]",
        ],
        sm: [
          "h-[var(--button-height-sm,var(--control-height-sm))]",
          "rounded-[var(--button-radius-sm,var(--button-radius,var(--control-radius)))]",
          "gap-[var(--button-gap-sm)]",
          "px-[var(--button-padding-x-sm)]",
          "has-[>svg]:px-[var(--button-padding-x-sm-icon)]",
          "[&_svg:not([class*='size-'])]:size-[var(--button-icon-size-sm,var(--button-icon-size,1rem))]",
        ],
        lg: [
          "h-[var(--button-height-lg,var(--control-height-lg))]",
          "rounded-[var(--button-radius-lg,var(--button-radius,var(--control-radius)))]",
          "px-[var(--button-padding-x-lg)]",
          "has-[>svg]:px-[var(--button-padding-x-lg-icon)]",
          "[&_svg:not([class*='size-'])]:size-[var(--button-icon-size-lg,var(--button-icon-size,1rem))]",
        ],
        icon: "size-[var(--button-height-icon,var(--control-height))]",
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

  // Fixed marks for theme CSS. `data-slot` is lost when a wrapper renders the
  // button through `asChild` (`<DialogTrigger asChild><Button />`): the
  // wrapper's own `data-slot` arrives in `props` and replaces it. No wrapper
  // sets `data-ui-button`, so that mark stays on every element that is a
  // button. A wrapper with its own variant or size (a dropdown menu item, a
  // sidebar menu button) still wins `data-variant` / `data-size`, as before.
  return (
    <Comp
      data-slot="button"
      data-ui-button=""
      data-variant={variant ?? "default"}
      data-size={size ?? "default"}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
