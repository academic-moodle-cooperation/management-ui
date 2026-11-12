#!/usr/bin/env node
/**
 * Prints the computed box values of the gallery's precedence fixture
 * (`?only=precedence`), as JSON. Run it before and after a change to the base
 * components' styling and diff the two outputs: every value must be the same.
 *
 *   node apps/playground/scripts/check-precedence.mjs --url http://127.0.0.1:3001 [--style default]
 */
import { parseArgs } from "node:util";

import { chromium } from "@playwright/test";

const { values } = parseArgs({
  options: {
    url: { type: "string", default: "http://127.0.0.1:3001" },
    style: { type: "string", default: "default" },
  },
});

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const query = new URLSearchParams({ only: "precedence", chrome: "0" });
if (values.style !== "default") query.set("style", values.style);
await page.goto(`${values.url}/?${query}`, { waitUntil: "networkidle" });
await page.waitForSelector("style[data-precedence-fixture]", { state: "attached" });
await page.waitForTimeout(300); // the fixture sheet is an @import of a blob URL

const result = await page.locator("[data-precedence]").evaluateAll((elements) =>
  Object.fromEntries(
    elements.map((element) => {
      const style = getComputedStyle(element);
      return [
        element.dataset.precedence,
        {
          height: style.height,
          paddingLeft: style.paddingLeft,
          paddingTop: style.paddingTop,
          borderRadius: style.borderRadius,
          gap: style.gap,
          boxShadow: style.boxShadow === "none" ? "none" : "set",
        },
      ];
    }),
  ),
);

await browser.close();
console.log(JSON.stringify(result, null, 2));
