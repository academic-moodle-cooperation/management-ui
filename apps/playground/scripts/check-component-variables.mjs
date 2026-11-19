#!/usr/bin/env node
/**
 * Measures the component variables on the gallery's fixture
 * (`?only=component-variables`). For every variable the fixture shows the
 * part twice: plain, and with a class of the caller that sets the same
 * property in the same state. The script sets the variable on the root
 * element and reads the computed value of both:
 *
 *   - the plain part must take the value of the variable;
 *   - the part with the caller's class must not move at all.
 *
 * Prints one JSON line per case to stdout and a summary to stderr; exit 1
 * when a claim fails.
 *
 *   node apps/playground/scripts/check-component-variables.mjs --url http://127.0.0.1:3001
 */
import { parseArgs } from "node:util";

import { chromium } from "@playwright/test";

const { values } = parseArgs({
  options: { url: { type: "string", default: "http://127.0.0.1:3001" } },
});

/** What the variable is set to, and what the plain part must then show. */
function probeValue(variable, prop) {
  if (prop === "boxShadow") {
    return variable.includes("ring-width")
      ? { value: "7px", expect: (got) => got.includes(" 7px") }
      : { value: "rgb(1, 2, 3)", expect: (got) => got.includes("rgb(1, 2, 3)") };
  }
  if (/color/i.test(prop))
    return { value: "rgb(1, 2, 3)", expect: (got) => got === "rgb(1, 2, 3)" };
  if (prop === "opacity") return { value: "0.37", expect: (got) => got === "0.37" };
  if (prop === "textDecorationLine")
    return { value: "underline", expect: (got) => got === "underline" };
  // The check mark sits in a 14px box and cannot grow past it; probe smaller.
  if (variable === "--checkbox-indicator-size")
    return { value: "9px", expect: (got) => got === "9px" };
  return { value: "23px", expect: (got) => got === "23px" };
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto(`${values.url}/?only=component-variables&chrome=0`, { waitUntil: "networkidle" });
// Colours and shadows animate; measure the end state.
await page.addStyleTag({ content: "*, *::before, *::after { transition: none !important; }" });

const read = (wrapper) => {
  const { cvProp, cvTarget, cvPseudo } = wrapper.dataset;
  const part = wrapper.firstElementChild;
  const element = cvTarget ? part.querySelector(cvTarget) : part;
  return getComputedStyle(element, cvPseudo ?? null)[cvProp];
};

const probes = page.locator("[data-cv-role]");
const total = await probes.count();
let failed = 0;
const variables = new Set();
for (let index = 0; index < total; index += 1) {
  const wrapper = probes.nth(index);
  const data = await wrapper.evaluate((element) => ({ ...element.dataset }));
  const part = wrapper.locator(":scope > *").first();
  const { value, expect } = probeValue(data.cvVariable, data.cvProp);
  variables.add(data.cvVariable);

  await page.mouse.move(0, 0);
  await page.evaluate(() => document.activeElement?.blur?.());
  if (data.cvState === "hover") await part.hover();
  if (data.cvState === "focus") {
    // Tab first: it switches the page to keyboard modality, so the scripted
    // focus counts as `:focus-visible`.
    await page.keyboard.press("Tab");
    await part.focus();
  }

  const before = await wrapper.evaluate(read);
  await page.evaluate(
    ([name, v]) => document.documentElement.style.setProperty(name, v),
    [data.cvVariable, value],
  );
  const after = await wrapper.evaluate(read);
  await page.evaluate(
    (name) => document.documentElement.style.removeProperty(name),
    data.cvVariable,
  );

  const ok = data.cvRole === "plain" ? expect(after) && before !== after : before === after;
  if (!ok) failed += 1;
  console.log(
    JSON.stringify({
      variable: data.cvVariable,
      mode: "cvDark" in data ? "dark" : "light",
      state: data.cvState,
      role: data.cvRole,
      ...(data.cvCaller ? { callerClass: data.cvCaller } : {}),
      property: data.cvProp,
      unset: before,
      set: after,
      ok,
    }),
  );
}

await browser.close();
console.error(`${variables.size} variables, ${total} measurements, ${failed} failed`);
process.exit(failed ? 1 : 0);
