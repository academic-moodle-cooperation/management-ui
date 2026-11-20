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
 * it also carries `data-ui-button="<variant>"` and
 * `data-ui-button-size="<size>"`.
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

  // Fixed marks; the stylesheet and a theme select on them.
  //
  // `data-ui-button` carries the variant and `data-ui-button-size` the size.
  // They are the button's own: no wrapper sets them, so they survive
  // `asChild`. `data-slot`, `data-variant` and `data-size` do not: a wrapper's
  // values arrive in `props` and replace them (`<DialogTrigger asChild>`
  // replaces the slot, a dropdown menu item or a sidebar menu button also
  // variant and size, and their own rules depend on that). Those three stay
  // for whoever reads them, but the look hangs on the button's own marks only.
  return (
    <Comp
      data-slot="button"
      data-ui-button={variant ?? "default"}
      data-ui-button-size={size ?? "default"}
      data-variant={variant ?? "default"}
      data-size={size ?? "default"}
      className={buttonVariants({ className })}
      {...props}
    />
  );
}

export { Button, buttonVariants };
