#!/usr/bin/env node
/**
 * Shows that theme CSS written against the fixed marks reaches what it should
 * and nothing else. It loads the gallery with the `stress` theme and reads
 * computed values; the report goes to stdout as JSON, exit 1 when a claim
 * does not hold.
 *
 *   1. Every button is uppercase, also one a wrapper relabelled through
 *      `asChild` (its `data-slot` is the wrapper's, `data-ui-button` stays).
 *   2. The calendar's day cells are not reached by the button rule.
 *   3. A variant can be addressed: only the link button is underlined.
 *   4. Each toast part is reached by its own rule, and only by that one.
 *
 *   node apps/playground/scripts/check-theme-marks.mjs --url http://127.0.0.1:3001
 */
import { parseArgs } from "node:util";

import { chromium } from "@playwright/test";

const { values } = parseArgs({
  options: {
    url: { type: "string", default: "http://127.0.0.1:3001" },
    theme: { type: "string", default: "stress" },
  },
});

const OVERLAYS = [
  null,
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

/** Toast part → the one property the stress theme sets on it, and the value. */
const TOAST_RULES = {
  "sonner-title": ["text-transform", "uppercase"],
  "sonner-description": ["font-style", "italic"],
  "sonner-icon": ["opacity", "0.6"],
  // 0.08em of the action button's 12px.
  "sonner-action": ["letter-spacing", "0.96px"],
  "sonner-cancel": ["text-decoration-line", "underline"],
  "sonner-close": ["outline-style", "solid"],
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.clock.setFixedTime(new Date("2026-01-08T12:00:00Z"));

const report = {
  buttons: { total: 0, uppercase: 0, bySlot: {} },
  dayCells: { total: 0, uppercase: 0, tracked: 0 },
  linkVariant: { underlined: 0, total: 0, otherVariantsUnderlined: 0 },
  toast: {},
  problems: [],
};

for (const overlay of OVERLAYS) {
  const query = new URLSearchParams({ chrome: "0", theme: values.theme });
  if (overlay) {
    query.set("only", overlay);
    query.set("open", overlay);
  }
  await page.goto(`${values.url}/?${query}`, { waitUntil: "networkidle" });

  const found = await page.evaluate((toastRules) => {
    const css = (el, property) => getComputedStyle(el).getPropertyValue(property);
    return {
      buttons: [...document.querySelectorAll("[data-ui-button]")].map((el) => ({
        slot: el.dataset.slot ?? "(none)",
        variant: el.dataset.variant,
        transform: css(el, "text-transform"),
        underline: css(el, "text-decoration-line"),
      })),
      dayCells: [...document.querySelectorAll('[data-slot="calendar-day-button"]')].map((el) => ({
        transform: css(el, "text-transform"),
        spacing: css(el, "letter-spacing"),
      })),
      toast: Object.fromEntries(
        Object.keys(toastRules).map((part) => {
          const el = document.querySelector(`.${part}`);
          return [
            part,
            el &&
              Object.fromEntries(
                Object.entries(toastRules).map(([owner, [property]]) => [owner, css(el, property)]),
              ),
          ];
        }),
      ),
    };
  }, TOAST_RULES);

  for (const button of found.buttons) {
    report.buttons.total += 1;
    const entry = (report.buttons.bySlot[button.slot] ??= { total: 0, uppercase: 0 });
    entry.total += 1;
    if (button.transform === "uppercase") {
      report.buttons.uppercase += 1;
      entry.uppercase += 1;
    }
    const underlined = button.underline.includes("underline");
    if (button.variant === "link") {
      report.linkVariant.total += 1;
      if (underlined) report.linkVariant.underlined += 1;
    } else if (underlined) {
      report.linkVariant.otherVariantsUnderlined += 1;
    }
  }
  for (const cell of found.dayCells) {
    report.dayCells.total += 1;
    if (cell.transform !== "none") report.dayCells.uppercase += 1;
    if (cell.spacing !== "normal") report.dayCells.tracked += 1;
  }
  if (overlay === "sonner") report.toast = found.toast;
}
await browser.close();

const { buttons, dayCells, linkVariant, toast, problems } = report;
if (buttons.uppercase !== buttons.total) problems.push("a button is not uppercase");
if (!Object.keys(buttons.bySlot).some((slot) => slot !== "button")) {
  problems.push("no relabelled (asChild) button in the gallery, claim 1 is untested");
}
if (dayCells.total === 0) problems.push("no calendar day cell found");
if (dayCells.uppercase + dayCells.tracked > 0) problems.push("the button rule reaches day cells");
if (linkVariant.total === 0 || linkVariant.underlined !== linkVariant.total) {
  problems.push("the link variant is not underlined");
}
if (linkVariant.otherVariantsUnderlined > 0) problems.push("another variant is underlined");
for (const [part, [property, wanted]] of Object.entries(TOAST_RULES)) {
  const values = toast[part];
  if (!values) {
    problems.push(`toast part missing: ${part}`);
    continue;
  }
  if (values[part] !== wanted) {
    problems.push(`${part}: ${property} is ${values[part]}, wanted ${wanted}`);
  }
}

console.log(JSON.stringify(report, null, 2));
if (problems.length > 0) process.exitCode = 1;
