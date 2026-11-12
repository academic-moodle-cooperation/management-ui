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

const MODES = {
  unlayered: (rule) => rule,
  components: (rule) => `@layer components { ${rule} }`,
  plugins: (rule) => `@layer plugins { ${rule} }`,
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const result = {};

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

  const slots = await page.evaluate(() => [
    ...new Set([...document.querySelectorAll("[data-slot]")].map((el) => el.dataset.slot)),
  ]);

  for (const slot of slots) {
    if (result[slot]) continue;
    const entry = {};
    for (const [mode, wrap] of Object.entries(MODES)) {
      entry[mode] = await page.evaluate(
        ({ slot, sentinels, css }) => {
          const element = document.querySelector(`[data-slot="${slot}"]`);
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
          slot,
          sentinels: SENTINELS,
          css: wrap(
            `[data-slot="${slot}"] { ${Object.entries(SENTINELS)
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
console.log(JSON.stringify(result, null, 2));
