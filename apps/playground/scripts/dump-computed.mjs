#!/usr/bin/env node
/**
 * Dumps EVERY computed property of the parts named by --selector (and of all
 * their descendants) in every gallery section, at rest, under the pointer,
 * with keyboard focus and pressed, in light and dark. Two dumps, one before
 * and one after a change to how a part gets its look, must be identical:
 * a stronger proof than a picture, because it also covers what a picture
 * cannot show (a transition, a cursor, a value hidden by another one).
 *
 *   node apps/playground/scripts/dump-computed.mjs --url http://127.0.0.1:3001 --out tmp/b/before.json
 *   node apps/playground/scripts/dump-computed.mjs --diff tmp/b/before.json tmp/b/after.json
 *
 * Options: --selector (the parts), --theme, --style, --only (section ids);
 * with --diff, --custom also compares custom properties.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";

import { chromium } from "@playwright/test";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    url: { type: "string", default: "http://127.0.0.1:3001" },
    out: { type: "string" },
    diff: { type: "boolean", default: false },
    custom: { type: "boolean", default: false },
    selector: {
      type: "string",
      default:
        "[data-ui-button], [data-slot=button], [data-ui-input], [data-slot=input], [data-slot=sidebar-input], [data-slot=checkbox], [data-slot=calendar-day-button]",
    },
    theme: { type: "string", default: "default" },
    style: { type: "string", default: "default" },
    only: { type: "string" },
  },
});

if (values.diff) {
  const [a, b] = positionals.map((file) => JSON.parse(readFileSync(file, "utf8")));
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  let elements = 0;
  let differing = 0;
  const byProperty = {};
  for (const key of keys) {
    elements += 1;
    if (!a[key] || !b[key]) {
      differing += 1;
      console.log(`${key}: only in ${a[key] ? "first" : "second"}`);
      continue;
    }
    const lines = [];
    for (const state of Object.keys(a[key])) {
      const [x, y] = [a[key][state], b[key][state] ?? {}];
      for (const prop of new Set([...Object.keys(x), ...Object.keys(y)])) {
        // Custom properties are plumbing (Tailwind's `--tw-*`, theme tokens
        // that exist only while some class uses them), not look.
        if (prop.startsWith("--") && !values.custom) continue;
        if (x[prop] === y[prop]) continue;
        lines.push(`  ${state} ${prop}: ${x[prop]} → ${y[prop]}`);
        byProperty[prop] = (byProperty[prop] ?? 0) + 1;
      }
    }
    if (lines.length) {
      differing += 1;
      console.log(`${key}\n${lines.slice(0, 12).join("\n")}${lines.length > 12 ? `\n  … ${lines.length - 12} more` : ""}`);
    }
  }
  console.log(`\nelements ${elements}, differing ${differing}`);
  if (differing) console.log("by property:", JSON.stringify(byProperty));
  process.exit(differing ? 1 : 0);
}

const OVERLAYS = ["select", "dialog", "alert-dialog", "sheet", "drawer", "dropdown-menu", "popover", "hover-card", "tooltip", "sonner"];
const STATES = { hover: ["hover"], "focus-visible": ["focus", "focus-visible"], active: ["hover", "active"] };
const NOW = new Date("2026-01-08T12:00:00Z");

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, timezoneId: "UTC" });
const page = await context.newPage();
await page.clock.setFixedTime(NOW);

const urlFor = (params) => {
  const query = new URLSearchParams({ chrome: "0", ...params });
  if (values.theme !== "default") query.set("theme", values.theme);
  if (values.style !== "default") query.set("style", values.style);
  return `${values.url}/?${query}`;
};

await page.goto(urlFor({}), { waitUntil: "networkidle" });
let sections = await page.$$eval("[data-gallery-section]", (nodes) =>
  nodes.map((node) => node.getAttribute("data-gallery-section")),
);
if (values.only) sections = values.only.split(",");

const views = [];
for (const section of sections) {
  views.push({ only: section });
  if (OVERLAYS.includes(section)) views.push({ only: section, open: section });
}

const readAll = (selector) => {
  const roots = [...document.querySelectorAll(selector)];
  const seen = new Set();
  const out = [];
  const describe = (element) =>
    [
      element.tagName.toLowerCase(),
      element.getAttribute("data-slot") ?? "",
      element.getAttribute("data-variant") ?? "",
      element.getAttribute("data-size") ?? "",
      (element.textContent ?? "").trim().slice(0, 24),
    ].join("/");
  for (const root of roots) {
    for (const element of [root, ...root.querySelectorAll("*")]) {
      if (seen.has(element)) continue;
      seen.add(element);
      const style = getComputedStyle(element);
      const props = {};
      for (let index = 0; index < style.length; index += 1) {
        const name = style[index];
        props[name] = style.getPropertyValue(name);
      }
      for (const pseudo of ["::before", "::after", "::placeholder", "::file-selector-button"]) {
        const pseudoStyle = getComputedStyle(element, pseudo);
        for (const name of ["color", "background-color", "font-size", "content", "height", "border-top-width"]) {
          props[`${pseudo} ${name}`] = pseudoStyle.getPropertyValue(name);
        }
      }
      out.push({ key: `${out.length}:${describe(element)}`, props });
    }
  }
  return out;
};

const result = {};
let count = 0;
for (const mode of ["light", "dark"]) {
  for (const view of views) {
    const params = { ...view };
    if (mode === "dark") params.mode = "dark";
    await page.goto(urlFor(params), { waitUntil: "networkidle" });
    await page.waitForTimeout(view.open ? 500 : 150);
    const label = `${mode} ${view.only}${view.open ? " open" : ""}`;

    // At rest first, untouched: this pass also compares the transition itself.
    for (const entry of await page.evaluate(readAll, values.selector)) {
      result[`${label} ${entry.key}`] = { rest: entry.props };
      count += 1;
    }

    await page.addStyleTag({ content: "*, *::before, *::after { transition-duration: 0s !important; animation-duration: 0s !important; }" });
    const cdp = await context.newCDPSession(page);
    await cdp.send("DOM.enable");
    await cdp.send("CSS.enable");
    const { root } = await cdp.send("DOM.getDocument", { depth: 0 });
    const { nodeIds } = await cdp.send("DOM.querySelectorAll", { nodeId: root.nodeId, selector: values.selector });
    for (const [state, pseudo] of Object.entries(STATES)) {
      for (const nodeId of nodeIds) await cdp.send("CSS.forcePseudoState", { nodeId, forcedPseudoClasses: pseudo });
      for (const entry of await page.evaluate(readAll, values.selector)) {
        delete entry.props["transition-duration"];
        delete entry.props["animation-duration"];
        result[`${label} ${entry.key}`][state] = entry.props;
      }
    }
    await cdp.detach();
  }
}

await browser.close();
writeFileSync(values.out, JSON.stringify(result));
console.error(`${count} elements in ${views.length} views x 2 modes → ${values.out}`);
