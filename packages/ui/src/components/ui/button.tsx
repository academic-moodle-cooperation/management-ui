import { Slot } from "@radix-ui/react-slot";
import * as React from "react";

import { cn } from "../../lib/utils";

import type { ClassProp } from "class-variance-authority/types";

export type ButtonVariant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
export type ButtonSize = "default" | "sm" | "lg" | "icon";

/** The variant axes `buttonVariants` and `Button` accept. */
export type ButtonVariantProps = {
  variant?: ButtonVariant | null | undefined;
  size?: ButtonSize | null | undefined;
};

// Layout and behaviour only. The look (sizes, colours, radius, shadow, focus
// ring, every state) is ordinary CSS on the button's marks, in
// `styles/parts/button.css`, in the cascade layer `ui`: below a theme's rules
// (`ui-theme`) and below every utility class, so a class of the caller wins.
const BUTTON_STRUCTURE =
  "inline-flex shrink-0 items-center justify-center whitespace-nowrap disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0";

/**
 * The button's layout classes. Variant and size are no longer classes: they
 * are the marks `data-variant` and `data-size`, which `Button` sets. An
 * element that uses `buttonVariants()` directly gets the button look only if
 * it also carries `data-ui-button`, `data-variant` and `data-size`.
 */
const buttonVariants: (props?: ButtonVariantProps & ClassProp) => string = (props) =>
  cn(BUTTON_STRUCTURE, props?.class, props?.className);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  ButtonVariantProps & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  // Fixed marks; the stylesheet and a theme select on them. `data-slot` is
  // lost when a wrapper renders the button through `asChild`
  // (`<DialogTrigger asChild><Button />`): the wrapper's own `data-slot`
  // arrives in `props` and replaces it. No wrapper sets `data-ui-button`, so
  // that mark stays on every element that is a button. A wrapper with its own
  // variant or size (a dropdown menu item, a sidebar menu button) still wins
  // `data-variant` / `data-size`, as before; with the look on the marks, the
  // button then takes the look of the wrapper's value.
  return (
    <Comp
      data-slot="button"
      data-ui-button=""
      data-variant={variant ?? "default"}
      data-size={size ?? "default"}
      className={buttonVariants({ className })}
      {...props}
    />
  );
}

export { Button, buttonVariants };
