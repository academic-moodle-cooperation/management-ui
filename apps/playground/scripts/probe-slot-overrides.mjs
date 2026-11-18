#!/usr/bin/env node
/**
 * Answers: which properties can theme CSS set on a base component through its
 * `data-slot` attribute, depending on the cascade layer the theme rule is in?
 *
 * For every `data-slot` value found in the gallery (including the opened
 * overlays) the script injects `[data-slot="x"] { <property>: <sentinel> }`
 * three times — unlayered, in `@layer components`, in `@layer plugins` — and
 * reads back the computed value. A property the component already sets with a
 * utility class is "blocked" for a layered rule, because `utilities` is the
 * top layer; an unlayered rule beats every layer.
 *
 * The script also checks the fixed marks theme CSS relies on, prints that
 * report to stderr and exits with 1 when one is missing:
 *
 *   - every element with the button look carries `data-ui-button`, also when a
 *     wrapper replaced its `data-slot` through `asChild`;
 *   - every such element and every badge carries a known `data-variant`
 *     (buttons also `data-size`);
 *   - the Calendar exposes its slots, and the toast its class names. The
 *     toast is the one exception to "handles are `data-slot`": sonner takes
 *     class names for its parts, no attributes. Those handles are probed like
 *     slots and appear in the output under their selector (`.sonner-toast`).
 *
 *   node apps/playground/scripts/probe-slot-overrides.mjs --url http://127.0.0.1:3001 > probe.json
 */
import { parseArgs } from "node:util";

import { chromium } from "@playwright/test";

const { values } = parseArgs({
  options: { url: { type: "string", default: "http://127.0.0.1:3001" } },
});

const OVERLAYS = [
  null,
  "select",
  "dialog",
  "alert-dialog",
  "sheet",
  "drawer",
  "dropdown-menu",
  "popover",
  "hover-card",
  "tooltip",
  "sonner",
];

/** Property → value no component uses. Longhands only, so each stands alone. */
const SENTINELS = {
  height: "77px",
  "padding-left": "33px",
  "padding-top": "31px",
  "border-top-left-radius": "13px",
  "border-top-width": "5px",
  "box-shadow": "rgb(1, 2, 3) 0px 0px 0px 7px",
  "font-size": "23px",
  "font-weight": "800",
  "font-family": "probe-font",
  "letter-spacing": "3px",
  "text-transform": "uppercase",
  "background-color": "rgb(1, 2, 3)",
  color: "rgb(3, 2, 1)",
  "row-gap": "19px",
};

/** Values the marks may take; keep in sync with `ButtonVariant`, `ButtonSize`, `BadgeVariant`. */
const BUTTON_VARIANTS = ["default", "destructive", "outline", "secondary", "ghost", "link"];
const BUTTON_SIZES = ["default", "sm", "lg", "icon"];
const BADGE_VARIANTS = ["default", "secondary", "destructive", "outline"];

/** A class only `buttonVariants` emits: finds button-looking elements without the mark. */
const BUTTON_LOOK_CLASS = "font-[number:var(--button-font-weight)]";

/** Slots that must exist somewhere in the gallery (overlays included). */
const REQUIRED_SLOTS = [
  "calendar",
  "calendar-months",
  "calendar-month",
  "calendar-nav",
  "calendar-nav-button",
  "calendar-caption",
  "calendar-caption-label",
  "calendar-grid",
  "calendar-weekdays",
  "calendar-weekday",
  "calendar-weeks",
  "calendar-week",
  "calendar-day",
  "calendar-day-button",
];

/** Class-name handles (the toast). Probed like slots; all must exist. */
const CLASS_HANDLES = [
  "sonner-toaster",
  "sonner-toast",
  "sonner-icon",
  "sonner-content",
  "sonner-title",
  "sonner-description",
  "sonner-action",
  "sonner-cancel",
  "sonner-close",
];

/**
 * Slots that use the button look without being a button of the interface, so
 * they must NOT carry `data-ui-button`: a theme rule for buttons would
 * otherwise reach them.
 */
const BUTTON_LOOK_ONLY = ["calendar-day-button"];

const MODES = {
  unlayered: (rule) => rule,
  components: (rule) => `@layer components { ${rule} }`,
  plugins: (rule) => `@layer plugins { ${rule} }`,
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const result = {};
const marks = {
  buttons: 0,
  buttonsRelabelled: {},
  buttonVariants: {},
  buttonSizes: {},
  badges: 0,
  badgeVariants: {},
  problems: [],
};

for (const overlay of OVERLAYS) {
  const query = new URLSearchParams({ chrome: "0" });
  if (overlay) {
    query.set("only", overlay);
    query.set("open", overlay);
  }
  await page.goto(`${values.url}/?${query}`, { waitUntil: "networkidle" });
  await page.addStyleTag({
    content: "* { transition: none !important; animation: none !important; }",
  });

  // Handle → selector. A slot keeps its bare name as the key; a class-name
  // handle is keyed by its selector.
  const handles = await page.evaluate(
    (classes) => [
      ...[
        ...new Set([...document.querySelectorAll("[data-slot]")].map((el) => el.dataset.slot)),
      ].map((slot) => [slot, `[data-slot="${slot}"]`]),
      ...classes
        .filter((name) => document.querySelector(`.${name}`))
        .map((name) => [`.${name}`, `.${name}`]),
    ],
    CLASS_HANDLES,
  );

  const found = await page.evaluate(
    ({ buttonLook, lookOnly }) => {
      const describe = (el) =>
        `<${el.tagName.toLowerCase()} data-slot="${el.dataset.slot ?? ""}"> "${(el.textContent ?? "").trim().slice(0, 30)}"`;
      return {
        buttons: [...document.querySelectorAll("[data-ui-button]")].map((el) => ({
          slot: el.dataset.slot ?? "(none)",
          variant: el.dataset.variant ?? null,
          size: el.dataset.size ?? null,
          text: describe(el),
        })),
        unmarked: [...document.querySelectorAll("*")]
          .filter(
            (el) =>
              el.classList.contains(buttonLook) &&
              !el.hasAttribute("data-ui-button") &&
              !lookOnly.includes(el.dataset.slot),
          )
          .map(describe),
        wronglyMarked: lookOnly.flatMap((slot) =>
          [...document.querySelectorAll(`[data-slot="${slot}"][data-ui-button]`)].map(describe),
        ),
        badges: [...document.querySelectorAll('[data-slot="badge"]')].map((el) => ({
          variant: el.dataset.variant ?? null,
          text: describe(el),
        })),
      };
    },
    { buttonLook: BUTTON_LOOK_CLASS, lookOnly: BUTTON_LOOK_ONLY },
  );
  const where = overlay ? `open=${overlay}` : "page";
  const tally = (bucket, key) => (bucket[key] = (bucket[key] ?? 0) + 1);
  for (const button of found.buttons) {
    marks.buttons += 1;
    if (button.slot !== "button") tally(marks.buttonsRelabelled, button.slot);
    tally(marks.buttonVariants, String(button.variant));
    tally(marks.buttonSizes, String(button.size));
    // A wrapper with its own variant or size may own these two marks; only a
    // missing or unknown value on a plain button is a defect.
    if (button.slot !== "button" && button.variant !== null && button.size !== null) continue;
    if (!BUTTON_VARIANTS.includes(button.variant)) {
      marks.problems.push(`${where}: button without known data-variant (${button.variant}): ${button.text}`);
    }
    if (!BUTTON_SIZES.includes(button.size)) {
      marks.problems.push(`${where}: button without known data-size (${button.size}): ${button.text}`);
    }
  }
  for (const text of found.unmarked) {
    marks.problems.push(`${where}: button look without data-ui-button: ${text}`);
  }
  for (const text of found.wronglyMarked) {
    marks.problems.push(`${where}: data-ui-button on a part that only borrows the button look: ${text}`);
  }
  for (const badge of found.badges) {
    marks.badges += 1;
    tally(marks.badgeVariants, String(badge.variant));
    if (!BADGE_VARIANTS.includes(badge.variant)) {
      marks.problems.push(`${where}: badge without known data-variant (${badge.variant}): ${badge.text}`);
    }
  }

  for (const [slot, selector] of handles) {
    if (result[slot]) continue;
    const entry = {};
    for (const [mode, wrap] of Object.entries(MODES)) {
      entry[mode] = await page.evaluate(
        ({ selector, sentinels, css }) => {
          const element = document.querySelector(selector);
          const style = document.createElement("style");
          style.textContent = css;
          document.head.appendChild(style);
          const computed = getComputedStyle(element);
          const reached = Object.fromEntries(
            Object.entries(sentinels).map(([property, sentinel]) => [
              property,
              computed.getPropertyValue(property).replace(/"/g, "") === sentinel,
            ]),
          );
          style.remove();
          return reached;
        },
        {
          selector,
          sentinels: SENTINELS,
          css: wrap(
            `${selector} { ${Object.entries(SENTINELS)
              .map(([property, sentinel]) => `${property}: ${sentinel};`)
              .join(" ")} }`,
          ),
        },
      );
    }
    result[slot] = entry;
  }
}

await browser.close();

for (const slot of REQUIRED_SLOTS) {
  if (!result[slot]) marks.problems.push(`required slot missing: ${slot}`);
}
for (const name of CLASS_HANDLES) {
  if (!result[`.${name}`]) marks.problems.push(`required class name missing: .${name}`);
}

console.log(JSON.stringify(result, null, 2));
console.error(JSON.stringify({ marks }, null, 2));
if (marks.problems.length > 0) process.exitCode = 1;
