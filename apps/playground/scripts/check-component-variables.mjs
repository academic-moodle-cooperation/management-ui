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
 * Three passes: the parts on the page, the parts inside overlays (all opened
 * at once, `&open=component-variables`), and the toast, whose variables live
 * in the stylesheet and which no class of the caller reaches (plain only).
 *
 * Prints one JSON line per measurement to stdout and a summary to stderr;
 * exit 1 when a claim fails.
 *
 *   node apps/playground/scripts/check-component-variables.mjs --url http://127.0.0.1:3001
 */
import { parseArgs } from "node:util";

import { chromium } from "@playwright/test";

const { values } = parseArgs({
  options: { url: { type: "string", default: "http://127.0.0.1:3001" } },
});

const COLOR = "rgb(1, 2, 3)";

/** What the variable is set to, and what the plain part must then show. */
function probeValue(variable, prop) {
  if (prop === "boxShadow") {
    if (variable.includes("ring-width"))
      return { value: "7px", expect: (got) => got.includes(" 7px") };
    if (variable.endsWith("-shadow")) {
      return {
        value: `0 0 0 5px ${COLOR}`,
        expect: (got) => got.includes(`${COLOR} 0px 0px 0px 5px`),
      };
    }
    return { value: COLOR, expect: (got) => got.includes(COLOR) };
  }
  const fixed = (value) => ({ value, expect: (got) => got === value });
  if (/color/i.test(prop)) return fixed(COLOR);
  if (prop === "opacity") return fixed("0.37");
  if (prop === "fontWeight") return fixed("800");
  if (prop === "display") return fixed("grid");
  if (prop === "textDecorationLine") {
    return fixed(variable.endsWith("-hover") ? "line-through" : "underline");
  }
  if (prop === "translate") return fixed("7px");
  // The check mark sits in a 14px box and cannot grow past it; probe smaller.
  if (variable === "--checkbox-indicator-size") return fixed("9px");
  // A table cell is never lower than its content; probe taller.
  if (variable === "--table-head-height") return fixed("61px");
  return fixed("23px");
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

const setVariable = ([name, value]) => document.documentElement.style.setProperty(name, value);
const unsetVariable = (name) => document.documentElement.style.removeProperty(name);

const read = (wrapper) => {
  const { cvProp, cvTarget, cvPseudo, cvEl } = wrapper.dataset;
  const part = cvEl ? document.querySelector(`[data-cv-id="${cvEl}"]`) : wrapper.firstElementChild;
  const element = cvTarget ? (part.matches(cvTarget) ? part : part.querySelector(cvTarget)) : part;
  return getComputedStyle(element, cvPseudo ?? null)[cvProp];
};

let failed = 0;
let total = 0;
const variables = new Set();
const report = (row) => {
  total += 1;
  if (!row.ok) failed += 1;
  variables.add(row.variable);
  console.log(JSON.stringify(row));
};

for (const pass of ["page", "overlays"]) {
  const query = new URLSearchParams({ only: "component-variables", chrome: "0" });
  if (pass === "overlays") query.set("open", "component-variables");
  await page.goto(`${values.url}/?${query}`, { waitUntil: "networkidle" });
  // Colours and shadows animate; measure the end state.
  await page.addStyleTag({
    content: "*, *::before, *::after { transition: none !important; animation: none !important; }",
  });
  await page.waitForTimeout(300);

  const probes = page.locator("[data-cv-role]");
  const count = await probes.count();
  for (let index = 0; index < count; index += 1) {
    const wrapper = probes.nth(index);
    const data = await wrapper.evaluate((element) => ({ ...element.dataset }));
    const part = data.cvEl
      ? page.locator(`[data-cv-id="${data.cvEl}"]`)
      : wrapper.locator(":scope > *").first();
    const { value, expect } = probeValue(data.cvVariable, data.cvProp);

    if (pass === "page") {
      await page.mouse.move(0, 0);
      await page.evaluate(() => document.activeElement?.blur?.());
      if (data.cvState === "hover") await part.hover();
      if (data.cvState === "focus") {
        // Tab first: it switches the page to keyboard modality, so the
        // scripted focus counts as `:focus-visible`.
        await page.keyboard.press("Tab");
        await part.focus();
      }
    }

    const before = await wrapper.evaluate(read);
    await page.evaluate(setVariable, [data.cvVariable, value]);
    const after = await wrapper.evaluate(read);
    await page.evaluate(unsetVariable, data.cvVariable);

    report({
      variable: data.cvVariable,
      pass,
      mode: "cvDark" in data ? "dark" : "light",
      state: data.cvState,
      role: data.cvRole,
      ...(data.cvCaller ? { caller: data.cvCaller } : {}),
      property: data.cvProp,
      unset: before,
      set: after,
      ok: data.cvRole === "plain" ? expect(after) && before !== after : before === after,
    });
  }
}

// The toast: its variables are read by rules in the stylesheet.
const TOAST = [
  ["--sonner-toast-shadow", ".sonner-toast", "boxShadow"],
  ["--sonner-toast-font-size", ".sonner-toast", "fontSize"],
  ["--sonner-toast-gap", ".sonner-toast", "columnGap"],
  ["--sonner-icon-size", ".sonner-icon", "width"],
  ["--sonner-icon-size", ".sonner-icon svg", "width"],
  ["--sonner-description-color", ".sonner-description", "color"],
  ["--sonner-description-line-height", ".sonner-description", "lineHeight"],
];
for (const mode of ["light", "dark"]) {
  const query = new URLSearchParams({ only: "sonner", open: "sonner", chrome: "0" });
  if (mode === "dark") query.set("mode", "dark");
  await page.goto(`${values.url}/?${query}`, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: "*, *::before, *::after { transition: none !important; }" });
  await page.waitForSelector(".sonner-toast");
  for (const [variable, selector, prop] of TOAST) {
    const { value, expect } = probeValue(variable, prop);
    const get = ([sel, p]) => getComputedStyle(document.querySelector(sel))[p];
    const before = await page.evaluate(get, [selector, prop]);
    await page.evaluate(setVariable, [variable, value]);
    const after = await page.evaluate(get, [selector, prop]);
    await page.evaluate(unsetVariable, variable);
    report({
      variable,
      pass: "toast",
      mode,
      state: "rest",
      role: "plain",
      selector,
      property: prop,
      unset: before,
      set: after,
      ok: expect(after) && before !== after,
    });
  }
}

await browser.close();
console.error(`${variables.size} variables, ${total} measurements, ${failed} failed`);
process.exit(failed ? 1 : 0);
