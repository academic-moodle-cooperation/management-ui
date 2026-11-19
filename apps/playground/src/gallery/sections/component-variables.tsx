/* eslint-disable react/display-name -- the helpers below build table rows of a fixture, they are not components */
import { Button, Checkbox, Input } from "@oc-mui/ui/components";

import { PlusIcon } from "../icons";
import { Section } from "../Section";

import { ROLLOUT_CASES } from "./component-variable-cases";

import type { ReactNode } from "react";

/**
 * Not a component: a fixture for the component variables. For every variable
 * it renders the part twice, once plain and once with a class of the caller
 * that sets the same property in the same state.
 *
 * `scripts/check-component-variables.mjs` sets each variable on the root and
 * reads the computed value of both: the plain part must follow the variable,
 * the caller's part must not move.
 *
 * Shown only with `?only=component-variables`, never on the full page. With
 * `&open=component-variables` it shows the cases that live in an overlay
 * instead, all overlays opened at once.
 */

type State = "rest" | "hover" | "focus";

/** Attributes for the measured element when it is not the first child. */
export type Mark = { "data-cv-id"?: string };

export type Case = {
  /** The variable under test. */
  variable: string;
  /** The computed property it must change. */
  prop: string;
  state?: State;
  /** Measure a child or a pseudo-element instead of the part itself. */
  target?: string;
  pseudo?: "::placeholder";
  dark?: boolean;
  /** The measured element carries the mark (it is portalled or nested). */
  byId?: boolean;
  /** Lives in an overlay; rendered only in the opened pass. */
  overlay?: boolean;
  /** The caller cannot pass a class to this piece; only the variable is measured. */
  plainOnly?: boolean;
  /** Renders the part; `callerClass` is empty for the plain one. */
  render: (callerClass: string | undefined, mark: Mark) => ReactNode;
  /** The caller's class for the same property and state. */
  caller: string;
};

type ButtonProps = React.ComponentProps<typeof Button>;

const button =
  (props: ButtonProps = {}, withIcon = false) =>
  (className: string | undefined) => (
    <Button {...props} className={className}>
      {withIcon ? <PlusIcon /> : null}
      Label
    </Button>
  );

/** The caller sizes the icon itself, the documented way to do it. */
const buttonWithOwnIcon =
  (props: ButtonProps = {}) =>
  (className: string | undefined) => (
    <Button {...props}>
      <PlusIcon className={className} />
      Label
    </Button>
  );

const input =
  (props: React.ComponentProps<typeof Input> = {}) =>
  (className: string | undefined) => (
    <Input {...props} className={`w-40 ${className ?? ""}`} placeholder="Placeholder" />
  );

const checkbox =
  (props: React.ComponentProps<typeof Checkbox> = {}) =>
  (className: string | undefined) => <Checkbox {...props} className={className} />;

const invalid = { "aria-invalid": true } as const;

const CASES: Case[] = [
  // ---- Button, every variant and size ----
  {
    variable: "--button-radius",
    prop: "borderTopLeftRadius",
    render: button(),
    caller: "rounded-none",
  },
  { variable: "--button-font-size", prop: "fontSize", render: button(), caller: "text-lg" },
  {
    variable: "--button-line-height",
    prop: "lineHeight",
    render: button(),
    caller: "leading-none",
  },
  {
    variable: "--button-icon-size",
    prop: "width",
    target: "svg",
    render: buttonWithOwnIcon(),
    caller: "size-6",
  },
  {
    variable: "--button-icon-size-sm",
    prop: "width",
    target: "svg",
    render: buttonWithOwnIcon({ size: "sm" }),
    caller: "size-6",
  },
  {
    variable: "--button-icon-size-lg",
    prop: "width",
    target: "svg",
    render: buttonWithOwnIcon({ size: "lg" }),
    caller: "size-6",
  },
  {
    variable: "--button-opacity-disabled",
    prop: "opacity",
    render: button({ disabled: true }),
    caller: "disabled:opacity-100",
  },
  {
    variable: "--control-opacity-disabled",
    prop: "opacity",
    render: button({ disabled: true }),
    caller: "disabled:opacity-100",
  },
  {
    variable: "--button-border-color-focus",
    prop: "borderTopColor",
    state: "focus",
    render: button({ variant: "outline" }),
    caller: "focus-visible:border-warning",
  },
  {
    variable: "--button-ring-color-focus",
    prop: "boxShadow",
    state: "focus",
    render: button(),
    caller: "focus-visible:ring-warning",
  },
  {
    variable: "--focus-ring-color",
    prop: "boxShadow",
    state: "focus",
    render: button(),
    caller: "focus-visible:ring-warning",
  },
  {
    variable: "--button-ring-width-focus",
    prop: "boxShadow",
    state: "focus",
    render: button(),
    caller: "focus-visible:ring-1",
  },
  {
    variable: "--button-border-color-invalid",
    prop: "borderTopColor",
    render: button({ variant: "outline", ...invalid }),
    caller: "aria-invalid:border-warning",
  },
  {
    variable: "--button-ring-color-invalid",
    prop: "boxShadow",
    state: "focus",
    render: button(invalid),
    caller: "aria-invalid:ring-warning",
  },
  {
    variable: "--button-ring-color-invalid",
    prop: "boxShadow",
    state: "focus",
    dark: true,
    render: button(invalid),
    caller: "dark:aria-invalid:ring-warning",
  },

  {
    variable: "--button-bg-default",
    prop: "backgroundColor",
    render: button(),
    caller: "bg-warning",
  },
  { variable: "--button-color-default", prop: "color", render: button(), caller: "text-warning" },
  {
    variable: "--button-bg-default-hover",
    prop: "backgroundColor",
    state: "hover",
    render: button(),
    caller: "hover:bg-warning",
  },

  {
    variable: "--button-bg-destructive",
    prop: "backgroundColor",
    render: button({ variant: "destructive" }),
    caller: "bg-warning",
  },
  {
    variable: "--button-bg-destructive",
    prop: "backgroundColor",
    dark: true,
    render: button({ variant: "destructive" }),
    caller: "dark:bg-warning",
  },
  {
    variable: "--button-color-destructive",
    prop: "color",
    render: button({ variant: "destructive" }),
    caller: "text-warning",
  },
  {
    variable: "--button-bg-destructive-hover",
    prop: "backgroundColor",
    state: "hover",
    render: button({ variant: "destructive" }),
    caller: "hover:bg-warning",
  },
  {
    variable: "--button-ring-color-destructive-focus",
    prop: "boxShadow",
    state: "focus",
    render: button({ variant: "destructive" }),
    caller: "focus-visible:ring-warning",
  },
  {
    variable: "--button-ring-color-destructive-focus",
    prop: "boxShadow",
    state: "focus",
    dark: true,
    render: button({ variant: "destructive" }),
    caller: "dark:focus-visible:ring-warning",
  },

  {
    variable: "--button-border-width-outline",
    prop: "borderTopWidth",
    render: button({ variant: "outline" }),
    caller: "border-4",
  },
  {
    variable: "--button-border-color-outline",
    prop: "borderTopColor",
    render: button({ variant: "outline" }),
    caller: "border-warning",
  },
  {
    variable: "--button-border-color-outline",
    prop: "borderTopColor",
    dark: true,
    render: button({ variant: "outline" }),
    caller: "dark:border-warning",
  },
  {
    variable: "--button-bg-outline",
    prop: "backgroundColor",
    render: button({ variant: "outline" }),
    caller: "bg-warning",
  },
  {
    variable: "--button-bg-outline",
    prop: "backgroundColor",
    dark: true,
    render: button({ variant: "outline" }),
    caller: "dark:bg-warning",
  },
  {
    variable: "--button-bg-outline-hover",
    prop: "backgroundColor",
    state: "hover",
    render: button({ variant: "outline" }),
    caller: "hover:bg-warning",
  },
  {
    variable: "--button-bg-outline-hover",
    prop: "backgroundColor",
    state: "hover",
    dark: true,
    render: button({ variant: "outline" }),
    caller: "dark:hover:bg-warning",
  },
  {
    variable: "--button-color-outline-hover",
    prop: "color",
    state: "hover",
    render: button({ variant: "outline" }),
    caller: "hover:text-warning",
  },

  {
    variable: "--button-bg-secondary",
    prop: "backgroundColor",
    render: button({ variant: "secondary" }),
    caller: "bg-warning",
  },
  {
    variable: "--button-color-secondary",
    prop: "color",
    render: button({ variant: "secondary" }),
    caller: "text-warning",
  },
  {
    variable: "--button-bg-secondary-hover",
    prop: "backgroundColor",
    state: "hover",
    render: button({ variant: "secondary" }),
    caller: "hover:bg-warning",
  },

  {
    variable: "--button-bg-ghost-hover",
    prop: "backgroundColor",
    state: "hover",
    render: button({ variant: "ghost" }),
    caller: "hover:bg-warning",
  },
  {
    variable: "--button-bg-ghost-hover",
    prop: "backgroundColor",
    state: "hover",
    dark: true,
    render: button({ variant: "ghost" }),
    caller: "dark:hover:bg-warning",
  },
  {
    variable: "--button-color-ghost-hover",
    prop: "color",
    state: "hover",
    render: button({ variant: "ghost" }),
    caller: "hover:text-warning",
  },

  {
    variable: "--button-color-link",
    prop: "color",
    render: button({ variant: "link" }),
    caller: "text-warning",
  },
  {
    variable: "--button-text-decoration-link",
    prop: "textDecorationLine",
    render: button({ variant: "link" }),
    caller: "no-underline",
  },

  { variable: "--button-height", prop: "height", render: button(), caller: "h-12" },
  { variable: "--button-padding-y", prop: "paddingTop", render: button(), caller: "py-3" },
  {
    variable: "--button-height-sm",
    prop: "height",
    render: button({ size: "sm" }),
    caller: "h-12",
  },
  {
    variable: "--button-radius-sm",
    prop: "borderTopLeftRadius",
    render: button({ size: "sm" }),
    caller: "rounded-none",
  },
  {
    variable: "--button-height-lg",
    prop: "height",
    render: button({ size: "lg" }),
    caller: "h-12",
  },
  {
    variable: "--button-radius-lg",
    prop: "borderTopLeftRadius",
    render: button({ size: "lg" }),
    caller: "rounded-none",
  },
  {
    variable: "--button-height-icon",
    prop: "height",
    render: button({ size: "icon" }),
    caller: "size-12",
  },

  // ---- Input ----
  { variable: "--input-height", prop: "height", render: input(), caller: "h-12" },
  {
    variable: "--input-radius",
    prop: "borderTopLeftRadius",
    render: input(),
    caller: "rounded-none",
  },
  { variable: "--input-border-width", prop: "borderTopWidth", render: input(), caller: "border-4" },
  {
    variable: "--input-border-color",
    prop: "borderTopColor",
    render: input(),
    caller: "border-warning",
  },
  { variable: "--input-bg", prop: "backgroundColor", render: input(), caller: "bg-warning" },
  {
    variable: "--input-bg",
    prop: "backgroundColor",
    dark: true,
    render: input(),
    caller: "dark:bg-warning",
  },
  { variable: "--input-padding-y", prop: "paddingTop", render: input(), caller: "py-3" },
  { variable: "--input-font-size", prop: "fontSize", render: input(), caller: "md:text-lg" },
  {
    variable: "--input-line-height",
    prop: "lineHeight",
    render: input(),
    caller: "md:leading-none",
  },
  {
    variable: "--input-color-placeholder",
    prop: "color",
    pseudo: "::placeholder",
    render: input(),
    caller: "placeholder:text-warning",
  },
  {
    variable: "--input-opacity-disabled",
    prop: "opacity",
    render: input({ disabled: true }),
    caller: "disabled:opacity-100",
  },
  {
    variable: "--input-border-color-focus",
    prop: "borderTopColor",
    state: "focus",
    render: input(),
    caller: "focus-visible:border-warning",
  },
  {
    variable: "--input-ring-color-focus",
    prop: "boxShadow",
    state: "focus",
    render: input(),
    caller: "focus-visible:ring-warning",
  },
  {
    variable: "--focus-ring-color",
    prop: "boxShadow",
    state: "focus",
    render: input(),
    caller: "focus-visible:ring-warning",
  },
  {
    variable: "--input-ring-width-focus",
    prop: "boxShadow",
    state: "focus",
    render: input(),
    caller: "focus-visible:ring-1",
  },
  {
    variable: "--input-border-color-invalid",
    prop: "borderTopColor",
    render: input(invalid),
    caller: "aria-invalid:border-warning",
  },
  {
    variable: "--input-ring-color-invalid",
    prop: "boxShadow",
    state: "focus",
    render: input(invalid),
    caller: "aria-invalid:ring-warning",
  },
  {
    variable: "--input-ring-color-invalid",
    prop: "boxShadow",
    state: "focus",
    dark: true,
    render: input(invalid),
    caller: "dark:aria-invalid:ring-warning",
  },

  // ---- Checkbox ----
  { variable: "--checkbox-size", prop: "height", render: checkbox(), caller: "size-6" },
  {
    variable: "--checkbox-radius",
    prop: "borderTopLeftRadius",
    render: checkbox(),
    caller: "rounded-none",
  },
  {
    variable: "--checkbox-border-width",
    prop: "borderTopWidth",
    render: checkbox(),
    caller: "border-4",
  },
  {
    variable: "--checkbox-border-color",
    prop: "borderTopColor",
    render: checkbox(),
    caller: "border-warning",
  },
  { variable: "--checkbox-bg", prop: "backgroundColor", render: checkbox(), caller: "bg-warning" },
  {
    variable: "--checkbox-bg",
    prop: "backgroundColor",
    dark: true,
    render: checkbox(),
    caller: "dark:bg-warning",
  },
  {
    variable: "--checkbox-bg-checked",
    prop: "backgroundColor",
    render: checkbox({ defaultChecked: true }),
    caller: "data-[state=checked]:bg-warning",
  },
  {
    variable: "--checkbox-bg-checked",
    prop: "backgroundColor",
    dark: true,
    render: checkbox({ defaultChecked: true }),
    caller: "dark:data-[state=checked]:bg-warning",
  },
  {
    variable: "--checkbox-color-checked",
    prop: "color",
    render: checkbox({ defaultChecked: true }),
    caller: "data-[state=checked]:text-warning",
  },
  {
    variable: "--checkbox-border-color-checked",
    prop: "borderTopColor",
    render: checkbox({ defaultChecked: true }),
    caller: "data-[state=checked]:border-warning",
  },
  {
    variable: "--checkbox-indicator-size",
    prop: "width",
    target: "svg",
    render: checkbox({ defaultChecked: true }),
    caller: "[&_svg]:size-2",
  },
  {
    variable: "--checkbox-opacity-disabled",
    prop: "opacity",
    render: checkbox({ disabled: true }),
    caller: "disabled:opacity-100",
  },
  {
    variable: "--checkbox-border-color-focus",
    prop: "borderTopColor",
    state: "focus",
    render: checkbox(),
    caller: "focus-visible:border-warning",
  },
  {
    variable: "--checkbox-ring-color-focus",
    prop: "boxShadow",
    state: "focus",
    render: checkbox(),
    caller: "focus-visible:ring-warning",
  },
  {
    variable: "--focus-ring-color",
    prop: "boxShadow",
    state: "focus",
    render: checkbox(),
    caller: "focus-visible:ring-warning",
  },
  {
    variable: "--checkbox-ring-width-focus",
    prop: "boxShadow",
    state: "focus",
    render: checkbox(),
    caller: "focus-visible:ring-1",
  },
  {
    variable: "--checkbox-border-color-invalid",
    prop: "borderTopColor",
    render: checkbox(invalid),
    caller: "aria-invalid:border-warning",
  },
  {
    variable: "--checkbox-ring-color-invalid",
    prop: "boxShadow",
    state: "focus",
    render: checkbox(invalid),
    caller: "aria-invalid:ring-warning",
  },
  {
    variable: "--checkbox-ring-color-invalid",
    prop: "boxShadow",
    state: "focus",
    dark: true,
    render: checkbox(invalid),
    caller: "dark:aria-invalid:ring-warning",
  },
];

function Probe({ item, role, id }: { item: Case; role: "plain" | "caller"; id: string }) {
  const mark: Mark = item.byId ? { "data-cv-id": id } : {};
  return (
    <span
      className="inline-flex"
      data-cv-role={role}
      data-cv-variable={item.variable}
      data-cv-prop={item.prop}
      data-cv-state={item.state ?? "rest"}
      data-cv-target={item.target}
      data-cv-pseudo={item.pseudo}
      data-cv-dark={item.dark ? "" : undefined}
      data-cv-el={item.byId ? id : undefined}
      data-cv-caller={role === "caller" ? item.caller : undefined}
    >
      {item.render(role === "caller" ? item.caller : undefined, mark)}
    </span>
  );
}

export function ComponentVariablesSection({ open = false }: { open?: boolean }) {
  const cases = [...CASES, ...ROLLOUT_CASES].filter((item) => Boolean(item.overlay) === open);
  return (
    <Section id="component-variables" title="Component variables (fixture)">
      <div className="grid grid-cols-[22rem_1fr_1fr] items-center gap-x-4 gap-y-2 text-xs">
        <span className="text-muted-foreground">variable</span>
        <span className="text-muted-foreground">plain</span>
        <span className="text-muted-foreground">with the caller&apos;s class</span>
        {cases.map((item, index) => (
          <div
            key={index}
            className={`col-span-3 grid grid-cols-subgrid items-center ${item.dark ? "dark bg-background text-foreground" : ""}`}
          >
            <code>
              {item.variable}
              {item.dark ? " (dark)" : ""}
              {item.state ? ` (${item.state})` : ""}
            </code>
            <Probe item={item} role="plain" id={`${index}-plain`} />
            {item.plainOnly ? (
              <code className="text-muted-foreground">
                no class of the caller reaches this piece
              </code>
            ) : (
              <span className="flex items-center gap-2">
                <Probe item={item} role="caller" id={`${index}-caller`} />
                <code className="text-muted-foreground">{item.caller}</code>
              </span>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}
