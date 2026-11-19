import { useEffect, type ReactNode } from "react";

import {
  Button,
  buttonVariants,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  type ButtonVariant,
} from "@oc-mui/ui/components";

import { PlusIcon } from "../icons";
import { Row, Section } from "../Section";

/**
 * Not a component: the cascade fixture for the "look in a stylesheet" variant
 * (component < theme < caller). `scripts/check-layer-b.mjs` reads it.
 *
 * Every contender uses values nothing else uses, so the computed value names
 * the winner:
 *
 *   caller   a class of the host build (`bg-[rgb(1,2,3)]`), written out below
 *   plugin   a class that exists only in a plugin stylesheet (cascade layer
 *            `plugins`), a scoped rule in that sheet, and both with `!`
 *   theme    rules on the fixed marks, scoped to `[data-fx-theme]`
 *
 * Each case names what its caller wants in `data-want`; the script forces
 * every state on it and reports who won. Each case is rendered three times:
 * plain, disabled and invalid.
 */

declare global {
  interface Window {
    /** Set by the measuring script before the page loads. */
    __layerB?: {
      /** Cascade layer for the fixture theme; `null` loads it unlayered, as themes are today. */
      themeLayer?: string | null;
      /** Extra text at the top of the fixture's plugin sheet (a preflight, a copy of the library's sheet). */
      pluginExtraCss?: string;
    };
  }
}

const VARIANTS: ButtonVariant[] = ["default", "secondary", "outline", "ghost", "destructive", "link"];

/* ------------------------------------------------------------------ */
/* Theme contender                                                     */
/* ------------------------------------------------------------------ */

export const THEME_REST = {
  "background-color": "rgb(10, 20, 30)",
  color: "rgb(11, 21, 31)",
  "border-top-color": "rgb(12, 22, 32)",
  height: "44px",
  "padding-left": "22px",
  "border-top-left-radius": "11px",
  "column-gap": "13px",
  "font-size": "17px",
  "font-weight": "600",
  opacity: "0.9",
  "box-shadow": "rgb(13, 23, 33) 0px 0px 0px 1px",
};

const THEME_CSS = `
[data-fx-theme="rest"] [data-ui-button] {
  background-color: rgb(10, 20, 30);
  color: rgb(11, 21, 31);
  border-color: rgb(12, 22, 32);
  height: 44px;
  padding-inline: 22px;
  border-radius: 11px;
  gap: 13px;
  font-size: 17px;
  font-weight: 600;
  opacity: 0.9;
  box-shadow: 0 0 0 1px rgb(13, 23, 33);
}
[data-fx-theme="states"] [data-ui-button] {
  background-color: rgb(10, 20, 30);
  color: rgb(11, 21, 31);
  border-color: rgb(12, 22, 32);
}
[data-fx-theme="states"] [data-ui-button]:hover {
  background-color: rgb(40, 50, 60);
  color: rgb(41, 51, 61);
}
[data-fx-theme="states"] [data-ui-button]:focus-visible {
  border-color: rgb(42, 52, 62);
  box-shadow: 0 0 0 2px rgb(43, 53, 63);
}
[data-fx-theme="states"] [data-ui-button]:active {
  background-color: rgb(44, 54, 64);
}
[data-fx-theme="states"] [data-ui-button]:disabled {
  opacity: 0.7;
  background-color: rgb(45, 55, 65);
}
[data-fx-theme="states"] [data-ui-button][aria-invalid="true"] {
  border-color: rgb(46, 56, 66);
}
`;

/* ------------------------------------------------------------------ */
/* Plugin contender                                                    */
/* ------------------------------------------------------------------ */

// Class names a remote plugin's own Tailwind build would emit. Assembled at
// runtime: the host's Tailwind scan must not see them, or the host would
// generate the same rules in its `utilities` layer.
const arbitrary = (utility: string, value: string, important = false) =>
  `${utility}-[${value}]${important ? "!" : ""}`;
const escaped = (className: string) => className.replace(/[[\](),.!]/g, "\\$&");

const P = {
  bg: arbitrary("bg", "rgb(101,102,103)"),
  text: arbitrary("text", "rgb(104,105,106)"),
  border: arbitrary("border", "rgb(107,108,109)"),
  h: arbitrary("h", "51px"),
  px: arbitrary("px", "37px"),
  rounded: arbitrary("rounded", "3px"),
  opacity: arbitrary("opacity", "0.83"),
  bgImportant: arbitrary("bg", "rgb(111,112,113)", true),
  hImportant: arbitrary("h", "53px", true),
};

const PLUGIN_RULES: [selector: string, declarations: string][] = [
  [`.${escaped(P.bg)}`, "background-color: rgb(101, 102, 103)"],
  [`.${escaped(P.text)}`, "color: rgb(104, 105, 106)"],
  [`.${escaped(P.border)}`, "border-color: rgb(107, 108, 109)"],
  [`.${escaped(P.h)}`, "height: 51px"],
  [`.${escaped(P.px)}`, "padding-inline: 37px"],
  [`.${escaped(P.rounded)}`, "border-radius: 3px"],
  [`.${escaped(P.opacity)}`, "opacity: 0.83"],
  [`.${escaped(P.bgImportant)}`, "background-color: rgb(111, 112, 113) !important"],
  [`.${escaped(P.hImportant)}`, "height: 53px !important"],
];

// What a plugin sheet is: its own layer statement, utilities, and scoped
// overrides of host components (docs/extend/styling.md, "Overrides").
const pluginSheet = () => `
@layer theme, base, components, utilities, plugin-overrides;
${window.__layerB?.pluginExtraCss ?? ""}
@layer utilities {
${PLUGIN_RULES.map(([selector, declarations]) => `  ${selector} { ${declarations} }`).join("\n")}
}
@layer plugin-overrides {
  .fx-plugin-scope [data-ui-button] {
    background-color: rgb(121, 122, 123);
    height: 55px;
  }
  .fx-plugin-scope [data-ui-button]:hover {
    background-color: rgb(124, 125, 126);
  }
  .fx-plugin-scope-important [data-ui-button] {
    background-color: rgb(131, 132, 133) !important;
    height: 57px !important;
  }
}
`;

function useFixtureSheets() {
  useEffect(() => {
    const url = URL.createObjectURL(new Blob([pluginSheet()], { type: "text/css" }));
    const plugin = document.createElement("style");
    plugin.dataset["layerBFixture"] = "plugin";
    // Exactly how the remote plugin loader loads a plugin's sheet.
    plugin.textContent = `@import url(${JSON.stringify(url)}) layer(plugins);`;
    document.head.appendChild(plugin);

    const themeLayer =
      window.__layerB && "themeLayer" in window.__layerB ? window.__layerB.themeLayer : "ui-theme";
    const theme = document.createElement("style");
    theme.dataset["layerBFixture"] = "theme";
    theme.textContent = themeLayer ? `@layer ${themeLayer} {${THEME_CSS}}` : THEME_CSS;
    document.head.appendChild(theme);

    return () => {
      plugin.remove();
      theme.remove();
      URL.revokeObjectURL(url);
    };
  }, []);
}

/* ------------------------------------------------------------------ */
/* Cases                                                               */
/* ------------------------------------------------------------------ */

type Want = Record<string, string>;

/**
 * One case, three times: plain, disabled, invalid. `want` is what the caller
 * asked for (computed property → value); `who` names the contender whose
 * values these are.
 */
function Case({
  id,
  who,
  want,
  variant,
  size,
  className,
  icon,
  iconClassName,
}: {
  id: string;
  who: "caller" | "plugin" | "none";
  want?: Want;
  variant?: ButtonVariant;
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  icon?: boolean;
  iconClassName?: string;
}) {
  const render = (suffix: string, extra: Record<string, unknown>): ReactNode => (
    <Button
      key={suffix}
      data-case={`${id}${suffix}`}
      data-who={who}
      data-want={JSON.stringify(want ?? {})}
      variant={variant}
      size={size}
      className={className}
      {...extra}
    >
      {icon ? <PlusIcon className={iconClassName} /> : null}
      {id}
    </Button>
  );
  return (
    <>
      {render("", {})}
      {render("|disabled", { disabled: true })}
      {render("|invalid", { "aria-invalid": true })}
    </>
  );
}

function CallerCases({ prefix }: { prefix: string }) {
  return (
    <>
      <Row label="Caller: background, per variant">
        {VARIANTS.map((variant) => (
          <Case
            key={variant}
            id={`${prefix}caller-bg-${variant}`}
            who="caller"
            variant={variant}
            className="bg-[rgb(1,2,3)]"
            want={{ "background-color": "rgb(1, 2, 3)" }}
          />
        ))}
      </Row>
      <Row label="Caller: text colour, per variant">
        {VARIANTS.map((variant) => (
          <Case
            key={variant}
            id={`${prefix}caller-color-${variant}`}
            who="caller"
            variant={variant}
            className="text-[rgb(2,3,4)]"
            want={{ color: "rgb(2, 3, 4)" }}
          />
        ))}
      </Row>
      <Row label="Caller: border colour">
        <Case
          id={`${prefix}caller-border-outline`}
          who="caller"
          variant="outline"
          className="border-[rgb(3,4,5)]"
          want={{ "border-top-color": "rgb(3, 4, 5)" }}
        />
        <Case
          id={`${prefix}caller-border-default`}
          who="caller"
          className="border border-[rgb(3,4,5)]"
          want={{ "border-top-color": "rgb(3, 4, 5)" }}
        />
      </Row>
      <Row label="Caller: padding with an icon, per size">
        <Case
          id={`${prefix}caller-px-icon`}
          who="caller"
          icon
          className="px-[31px]"
          want={{ "padding-left": "31px" }}
        />
        <Case
          id={`${prefix}caller-px-icon-sm`}
          who="caller"
          size="sm"
          icon
          className="px-[31px]"
          want={{ "padding-left": "31px" }}
        />
        <Case
          id={`${prefix}caller-px-icon-lg`}
          who="caller"
          size="lg"
          icon
          className="px-[31px]"
          want={{ "padding-left": "31px" }}
        />
      </Row>
      <Row label="Caller: opacity, shadow, ring, underline">
        <Case
          id={`${prefix}caller-opacity`}
          who="caller"
          className="opacity-[0.93]"
          want={{ opacity: "0.93" }}
        />
        <Case id={`${prefix}caller-shadow-none`} who="caller" className="shadow-none" />
        <Case
          id={`${prefix}caller-ring`}
          who="caller"
          className="ring-2 ring-[rgb(4,5,6)]"
          want={{ "box-shadow": "CONTAINS rgb(4, 5, 6) 0px 0px 0px 2px" }}
        />
        <Case
          id={`${prefix}caller-underline-link`}
          who="caller"
          variant="link"
          className="underline"
          want={{ "text-decoration-line": "underline" }}
        />
        <Case
          id={`${prefix}caller-no-underline-link`}
          who="caller"
          variant="link"
          className="no-underline"
          want={{ "text-decoration-line": "none" }}
        />
      </Row>
      <Row label="Caller: metrics without a state rule">
        <Case
          id={`${prefix}caller-metrics`}
          who="caller"
          className="h-[41px] gap-[11px] rounded-[9px] text-[19px] font-[650]"
          want={{
            height: "41px",
            "column-gap": "11px",
            "border-top-left-radius": "9px",
            "font-size": "19px",
            "font-weight": "650",
          }}
        />
        <Case
          id={`${prefix}caller-metrics-sm`}
          who="caller"
          size="sm"
          className="h-[41px] gap-[11px] rounded-[9px]"
          want={{ height: "41px", "column-gap": "11px", "border-top-left-radius": "9px" }}
        />
      </Row>
      <Row label="Caller: icon size on the icon itself">
        <Case
          id={`${prefix}caller-icon-wh`}
          who="caller"
          icon
          iconClassName="h-[23px] w-[23px]"
          want={{ "svg:width": "23px" }}
        />
        <Case
          id={`${prefix}caller-icon-size`}
          who="caller"
          icon
          iconClassName="size-[23px]"
          want={{ "svg:width": "23px" }}
        />
      </Row>
      <Row label="Caller: a class for one state only">
        <Case
          id={`${prefix}caller-own-hover`}
          who="caller"
          className="hover:bg-[rgb(5,6,7)]"
          want={{ "background-color@hover": "rgb(5, 6, 7)" }}
        />
        <Case
          id={`${prefix}caller-own-disabled`}
          who="caller"
          className="disabled:opacity-[0.81]"
          want={{ "opacity@disabled": "0.81" }}
        />
        <Case
          id={`${prefix}caller-own-focus`}
          who="caller"
          variant="outline"
          className="focus-visible:border-[rgb(6,7,8)]"
          want={{ "border-top-color@focus-visible": "rgb(6, 7, 8)" }}
        />
        <Case
          id={`${prefix}caller-own-dark`}
          who="caller"
          variant="outline"
          className="dark:bg-[rgb(7,8,9)]"
          want={{ "background-color@dark": "rgb(7, 8, 9)" }}
        />
      </Row>
    </>
  );
}

function PluginCases({ prefix }: { prefix: string }) {
  return (
    <>
      <Row label="Plugin sheet: classes only the plugin's build has">
        {VARIANTS.map((variant) => (
          <Case
            key={variant}
            id={`${prefix}plugin-bg-${variant}`}
            who="plugin"
            variant={variant}
            className={P.bg}
            want={{ "background-color": "rgb(101, 102, 103)" }}
          />
        ))}
        <Case
          id={`${prefix}plugin-color-outline`}
          who="plugin"
          variant="outline"
          className={P.text}
          want={{ color: "rgb(104, 105, 106)" }}
        />
        <Case
          id={`${prefix}plugin-border-outline`}
          who="plugin"
          variant="outline"
          className={P.border}
          want={{ "border-top-color": "rgb(107, 108, 109)" }}
        />
        <Case
          id={`${prefix}plugin-metrics`}
          who="plugin"
          icon
          className={`${P.h} ${P.px} ${P.rounded}`}
          want={{ height: "51px", "padding-left": "37px", "border-top-left-radius": "3px" }}
        />
        <Case
          id={`${prefix}plugin-opacity`}
          who="plugin"
          className={P.opacity}
          want={{ opacity: "0.83" }}
        />
      </Row>
      <Row label="Plugin sheet: classes with the important modifier">
        <Case
          id={`${prefix}plugin-important`}
          who="plugin"
          className={`${P.bgImportant} ${P.hImportant}`}
          want={{ "background-color": "rgb(111, 112, 113)", height: "53px" }}
        />
        <Case
          id={`${prefix}plugin-important-outline`}
          who="plugin"
          variant="outline"
          className={`${P.bgImportant} ${P.hImportant}`}
          want={{ "background-color": "rgb(111, 112, 113)", height: "53px" }}
        />
      </Row>
      <Row label="Plugin sheet: a scoped rule on the button's mark">
        <span className="fx-plugin-scope contents">
          <Case
            id={`${prefix}plugin-rule`}
            who="plugin"
            want={{
              "background-color": "rgb(121, 122, 123)",
              "background-color@hover": "rgb(124, 125, 126)",
              height: "55px",
            }}
          />
          <Case
            id={`${prefix}plugin-rule-outline`}
            who="plugin"
            variant="outline"
            want={{
              "background-color": "rgb(121, 122, 123)",
              "background-color@hover": "rgb(124, 125, 126)",
              height: "55px",
            }}
          />
        </span>
        <span className="fx-plugin-scope-important contents">
          <Case
            id={`${prefix}plugin-rule-important`}
            who="plugin"
            want={{ "background-color": "rgb(131, 132, 133)", height: "57px" }}
          />
        </span>
      </Row>
    </>
  );
}

function PlainCases({ prefix }: { prefix: string }) {
  return (
    <Row label="No class from anyone">
      {VARIANTS.map((variant) => (
        <Case key={variant} id={`${prefix}plain-${variant}`} who="none" variant={variant} />
      ))}
      <Case id={`${prefix}plain-sm`} who="none" size="sm" />
      <Case id={`${prefix}plain-lg`} who="none" size="lg" />
      <Case id={`${prefix}plain-icon`} who="none" icon />
    </Row>
  );
}

/**
 * Where the marks decide the look, a wrong or a missing mark is a wrong look.
 * Two known ways to get one: a wrapper with its own `data-variant` renders a
 * button through `asChild` and its value replaces the button's; and
 * `buttonVariants()` on an element that carries no marks.
 */
function MarkCases() {
  return (
    <Row label="Marks: a button relabelled by a wrapper, and buttonVariants() on a bare element">
      <DropdownMenu open modal={false}>
        <DropdownMenuTrigger asChild>
          <Button data-case="marks-trigger" data-who="none" data-want="{}" variant="outline">
            menu
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem asChild>
            <Button data-case="marks-item-ghost" data-who="none" data-want="{}" variant="ghost">
              ghost button as a menu item
            </Button>
          </DropdownMenuItem>
          <DropdownMenuItem asChild variant="destructive">
            <Button data-case="marks-item-outline" data-who="none" data-want="{}" variant="outline">
              outline button as a destructive menu item
            </Button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <a
        href="#layer-b"
        data-case="marks-direct"
        data-who="none"
        data-want="{}"
        className={buttonVariants({ variant: "outline" })}
      >
        buttonVariants() on a link
      </a>
    </Row>
  );
}

export function LayerBSection() {
  useFixtureSheets();

  return (
    <Section id="layer-b" title="Component, theme, caller (fixture)">
      <h3 className="text-sm font-medium">Without a theme rule</h3>
      <PlainCases prefix="" />
      <CallerCases prefix="" />
      <PluginCases prefix="" />
      <MarkCases />

      <h3 className="text-sm font-medium">Theme sets the resting look only</h3>
      <div data-fx-theme="rest" className="flex flex-col gap-6">
        <PlainCases prefix="rest/" />
        <CallerCases prefix="rest/" />
        <PluginCases prefix="rest/" />
      </div>

      <h3 className="text-sm font-medium">Theme sets the resting look and every state</h3>
      <div data-fx-theme="states" className="flex flex-col gap-6">
        <PlainCases prefix="states/" />
        <CallerCases prefix="states/" />
        <PluginCases prefix="states/" />
      </div>
    </Section>
  );
}
