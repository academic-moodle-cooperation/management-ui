#!/usr/bin/env node
/**
 * Prints the computed box values of the gallery's precedence fixture
 * (`?only=precedence`), as JSON. Run it before and after a change to the base
 * components' styling and diff the two outputs: every value must be the same.
 *
 * Each element is measured at rest and under the pointer, in light and dark:
 * a caller's class competes not only with the component's resting look but
 * also with its `hover:` and `dark:` rules.
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

const read = (element) => {
  const style = getComputedStyle(element);
  return {
    height: style.height,
    paddingLeft: style.paddingLeft,
    paddingTop: style.paddingTop,
    borderRadius: style.borderRadius,
    gap: style.gap,
    backgroundColor: style.backgroundColor,
  };
};

const result = {};
for (const mode of ["light", "dark"]) {
  const query = new URLSearchParams({ only: "precedence", chrome: "0" });
  if (values.style !== "default") query.set("style", values.style);
  if (mode === "dark") query.set("mode", "dark");
  await page.goto(`${values.url}/?${query}`, { waitUntil: "networkidle" });
  await page.waitForSelector("style[data-precedence-fixture]", { state: "attached" });
  await page.waitForTimeout(300); // the fixture sheet is an @import of a blob URL
  // Colours animate; measure the end state.
  await page.addStyleTag({ content: "* { transition: none !important; }" });

  const elements = page.locator("[data-precedence]");
  for (let index = 0; index < (await elements.count()); index += 1) {
    const element = elements.nth(index);
    const name = await element.getAttribute("data-precedence");
    await page.mouse.move(0, 0);
    result[`${name} (${mode})`] = await element.evaluate(read);
    await element.hover();
    const hovered = await element.evaluate(read);
    result[`${name} (${mode}, hover)`] = { backgroundColor: hovered.backgroundColor };
  }
}

await browser.close();
console.log(JSON.stringify(result, null, 2));
