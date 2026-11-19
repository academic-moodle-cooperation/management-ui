import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDownIcon } from "lucide-react";
import * as React from "react";

import { cn } from "../../lib/utils";

function Accordion({ ...props }: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />;
}

function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("border-b last:border-b-0", className)}
      {...props}
    />
  );
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "focus-visible:border-[color:var(--accordion-trigger-border-color-focus,var(--ring))] focus-visible:ring-[color:var(--accordion-trigger-ring-color-focus,var(--focus-ring-color,color-mix(in_oklab,var(--ring)_50%,transparent)))] flex flex-1 items-start justify-between gap-[var(--accordion-trigger-gap,1rem)] rounded-[var(--accordion-trigger-radius,calc(var(--radius)_-_2px))] py-[var(--accordion-trigger-padding-y,1rem)] text-left text-[length:var(--accordion-trigger-font-size,0.875rem)]/[var(--accordion-trigger-line-height,calc(1.25/0.875))] font-[number:var(--accordion-trigger-font-weight,500)] transition-all outline-none hover:underline focus-visible:ring-[length:var(--accordion-trigger-ring-width-focus,3px)] disabled:pointer-events-none disabled:opacity-[var(--accordion-trigger-opacity-disabled,var(--control-opacity-disabled,0.5))] [&[data-state=open]>svg]:rotate-180",
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon className="text-muted-foreground pointer-events-none size-4 shrink-0 translate-y-0.5 transition-transform duration-200" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden text-[length:var(--accordion-content-font-size,0.875rem)]/[var(--accordion-content-line-height,calc(1.25/0.875))]"
      {...props}
    >
      <div className={cn("pt-0 pb-4", className)}>{children}</div>
    </AccordionPrimitive.Content>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
