#!/usr/bin/env node
/**
 * Measures a theme against its list of requirements and guards the theme
 * contract.
 *
 *   node apps/playground/scripts/check-theme-spec.mjs --url http://127.0.0.1:3001 \
 *     --theme pilot --spec ./theme-spec-pilot.mjs --out tmp/pilot/spec.json --md tmp/pilot/spec.md
 *
 * Part 1, requirements. Every entry of the spec file with a `check` is
 * measured in the gallery as a computed value, light and dark, at rest or
 * under the pointer, pressed or with keyboard focus. An entry the theme claims to meet
 * (how D, V, VM, C) must match; an entry marked N documents the miss and is
 * reported when it unexpectedly matches.
 *
 * Part 2, contract guard. Theme CSS may only set properties no component
 * sets. The theme file marks where such rules start with the comment
 * `check-theme-spec: layered-from-here`. The guard loads the theme twice,
 * once as it is and once with those rules inside `@layer components` (below
 * every utility), and compares the properties these rules name on every
 * element of the gallery, overlays included. A difference means: a rule beats
 * a utility of a component or of a caller.
 *
 * Exit code 1 when a claimed requirement fails or the guard finds a difference.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

import { chromium } from "@playwright/test";

const here = path.dirname(fileURLToPath(import.meta.url));
const { values } = parseArgs({
  options: {
    url: { type: "string", default: "http://127.0.0.1:3001" },
    theme: { type: "string", default: "pilot" },
    spec: { type: "string", default: "./theme-spec-pilot.mjs" },
    css: { type: "string" },
    out: { type: "string" },
    md: { type: "string" },
  },
});

const { SPEC } = await import(pathToFileURL(path.resolve(here, values.spec)).href);
const cssPath =
  values.css ?? path.resolve(here, `../../shell/public/plugins/themes/${values.theme}.css`);
const themeCss = await readFile(cssPath, "utf8");
const MARKER = "check-theme-spec: layered-from-here";
const MODES = ["light", "dark"];
const OVERLAYS = [null, "select", "dialog", "alert-dialog", "sheet", "drawer", "dropdown-menu", "popover", "hover-card", "tooltip", "sonner"];

const STABILIZE_CSS = `
  *, *::before, *::after {
    animation-duration: 0s !important; animation-delay: 0s !important;
    transition-duration: 0s !important; transition-delay: 0s !important;
  }
  [class*="tsqd"] { display: none !important; }
`;

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce", timezoneId: "UTC" });
const page = await context.newPage();
await page.clock.setFixedTime(new Date("2026-01-08T12:00:00Z"));

async function open(params) {
  const query = new URLSearchParams({ chrome: "0", theme: values.theme });
  for (const [key, value] of Object.entries(params)) {
    if (value && value !== "light") query.set(key, value);
  }
  await page.goto(`${values.url}/?${query}`, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: STABILIZE_CSS });
  await page.waitForSelector(`link[data-theme="${values.theme}"]`, { state: "attached" });
  await page.waitForFunction(
    (id) => [...document.styleSheets].some((sheet) => sheet.ownerNode?.dataset?.theme === id),
    values.theme,
  );
  await page.evaluate(() => document.fonts.ready);
}

/** Runs in the page: any CSS colour → "r,g,b,a" through a canvas. */
const toRgba = (value) => {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.clearRect(0, 0, 1, 1);
  ctx.fillStyle = "#000";
  ctx.fillStyle = value;
  ctx.fillRect(0, 0, 1, 1);
  return Array.from(ctx.getImageData(0, 0, 1, 1).data);
};

function sameColor(a, b) {
  // Alpha 0 is "transparent" whatever the channels say.
  if (a[3] === 0 && b[3] === 0) return true;
  // Canvas pixels are premultiplied; allow for the rounding of low alphas.
  const tolerance = Math.min(a[3], b[3]) < 60 ? 12 : 2;
  return a.every((channel, index) => Math.abs(channel - b[index]) <= (index === 3 ? 2 : tolerance));
}

// ---------------------------------------------------------------------------
// Part 1: requirements
// ---------------------------------------------------------------------------
const results = [];
let failures = 0;

for (const entry of SPEC) {
  const result = { ...entry, measured: {} };
  results.push(result);
  const check = entry.check;
  if (!check) continue;
  for (const mode of MODES) {
    const want = typeof check.want === "object" && check.want !== null ? check.want[mode] : check.want;
    if (want === null || want === undefined) continue;
    // A requirement about a narrow screen names its own viewport.
    await page.setViewportSize(check.viewport ?? { width: 1280, height: 900 });
    await open({ mode, only: check.section, open: check.open });
    if (check.inject) await page.addStyleTag({ content: check.inject });
    const locator = page.locator(check.sel).nth(check.n ?? 0);
    if ((await locator.count()) === 0) {
      result.measured[mode] = { want, got: "(element not found)", ok: false };
      if (entry.how !== "N") failures += 1;
      continue;
    }
    // A state the gallery does not show: a short script sets it up.
    if (check.script) await page.evaluate(check.script);
    if (check.settle) await page.mouse.move(2, 2);
    if (check.state === "hover") await locator.hover();
    if (check.state === "active") {
      await locator.hover();
      await page.mouse.down();
    }
    if (check.state === "focus") {
      await page.keyboard.press("Tab");
      await locator.focus();
    }
    const got = await locator.evaluate(
      (element, prop) => getComputedStyle(element).getPropertyValue(prop),
      check.prop,
    );
    let ok;
    if (check.kind === "color") {
      const [a, b] = await page.evaluate(
        ([fn, x, y]) => {
          const f = new Function(`return (${fn})`)();
          return [f(x), f(y)];
        },
        [toRgba.toString(), got, want],
      );
      ok = sameColor(a, b);
    } else if (check.kind === "px") {
      ok = Math.abs(parseFloat(got) - parseFloat(want)) < 0.51 || (want === "999px" && parseFloat(got) > 100);
    } else if (check.kind === "has") {
      ok = got.includes(want);
    } else if (check.kind === "shadow") {
      // "none", or only fully transparent layers.
      ok = got === "none" || !/rgba?\((?![^)]*,\s*0\))[^)]*\)|#[0-9a-f]{3,8}/i.test(got.replace(/rgba\(0, 0, 0, 0\)/g, ""));
    } else {
      ok = got.trim() === want;
    }
    result.measured[mode] = { want, got, ok };
    if (entry.how !== "N" && !ok) failures += 1;
    if (check.state === "active") await page.mouse.up();
    await page.mouse.move(2, 2);
  }
}
await page.setViewportSize({ width: 1280, height: 900 });

// ---------------------------------------------------------------------------
// Part 2: contract guard
// ---------------------------------------------------------------------------
const markerAt = themeCss.indexOf(MARKER);
const guard = { marker: markerAt >= 0, properties: [], differences: [] };
if (markerAt >= 0) {
  const head = themeCss.slice(0, themeCss.lastIndexOf("/*", markerAt));
  const tail = themeCss.slice(themeCss.indexOf("*/", markerAt) + 2);
  const names = new Set();
  for (const match of tail.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/[{;]\s*([a-z-]+)\s*:/g)) {
    names.add(match[1]);
  }
  // Shorthands the rules may use → the longhands that can be read back.
  const LONGHANDS = {
    "border-bottom": ["border-bottom-width", "border-bottom-style", "border-bottom-color"],
    "border-top": ["border-top-width", "border-top-style", "border-top-color"],
    "border-left": ["border-left-width", "border-left-style", "border-left-color"],
    border: ["border-top-width", "border-top-style", "border-top-color", "border-bottom-width", "border-left-width", "border-right-width"],
    margin: ["margin-top", "margin-right", "margin-bottom", "margin-left"],
    "margin-block": ["margin-top", "margin-bottom"],
    padding: ["padding-top", "padding-right", "padding-bottom", "padding-left"],
    outline: ["outline-width", "outline-style", "outline-color", "outline-offset"],
    "text-decoration": ["text-decoration-line", "text-decoration-color", "text-decoration-thickness"],
    font: ["font-family", "font-size", "font-weight", "line-height"],
  };
  guard.properties = [...names].flatMap((name) => LONGHANDS[name] ?? [name]);
  const layered = `${head}\n@layer components {\n${tail}\n}`;

  const snapshot = () =>
    page.evaluate(([props, fn]) => {
      const toRgba = new Function(`return (${fn})`)();
      const rows = [];
      const describe = (element) => {
        const slot = element.dataset.slot ? `[data-slot=${element.dataset.slot}]` : "";
        const variant = element.dataset.variant ? `[data-variant=${element.dataset.variant}]` : "";
        const text = (element.textContent ?? "").trim().slice(0, 24);
        return `${element.tagName.toLowerCase()}${slot}${variant} "${text}"`;
      };
      for (const element of document.querySelectorAll("body *")) {
        const style = getComputedStyle(element);
        rows.push([
          describe(element),
          // Colours as pixels: the same colour can be serialised in two ways.
          props.map((prop) =>
            prop.endsWith("color") ? toRgba(style.getPropertyValue(prop)) : style.getPropertyValue(prop),
          ),
        ]);
      }
      return rows;
    }, [guard.properties, toRgba.toString()]);

  for (const mode of MODES) {
    for (const overlay of OVERLAYS) {
      await open({ mode, open: overlay });
      const before = await snapshot();
      await page.evaluate(
        ([id, css]) => {
          document.querySelectorAll(`link[data-theme="${id}"]`).forEach((el) => el.remove());
          const style = document.createElement("style");
          style.textContent = css;
          document.head.appendChild(style);
        },
        [values.theme, layered],
      );
      const after = await snapshot();
      if (before.length !== after.length) {
        guard.differences.push({ mode, overlay, element: "(element count changed)", property: "-", unlayered: before.length, layered: after.length });
        continue;
      }
      before.forEach(([name, valuesBefore], index) => {
        valuesBefore.forEach((value, propIndex) => {
          const other = after[index][1][propIndex];
          const same = Array.isArray(value) ? sameColor(value, other) : value === other;
          if (!same) {
            guard.differences.push({ mode, overlay, element: name, property: guard.properties[propIndex], unlayered: value, layered: other });
          }
        });
      });
    }
  }
}
await browser.close();

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
const known = results.filter((entry) => entry.known !== false);
const count = (list, how) => list.filter((entry) => entry.how === how).length;
const reasons = {};
for (const entry of known.filter((item) => item.how === "N")) {
  reasons[entry.reason] = (reasons[entry.reason] ?? 0) + 1;
}
const surprises = results.filter(
  (entry) => entry.how === "N" && Object.values(entry.measured).length > 0 && Object.values(entry.measured).every((m) => m.ok),
);
const summary = {
  theme: values.theme,
  requirements: known.length,
  D: count(known, "D"),
  V: count(known, "V"),
  VM: count(known, "VM"),
  C: count(known, "C"),
  N: count(known, "N"),
  reasons,
  unknownParts: results.length - known.length,
  measured: results.filter((entry) => Object.keys(entry.measured).length > 0).length,
  claimedButFailed: failures,
  markedNButMatches: surprises.map((entry) => entry.id),
  guard: { properties: guard.properties, differences: guard.differences.length },
};

const HOW = { D: "already so", V: "variable", VM: "variable on a mark", C: "theme CSS", N: "not possible", "?": "no value in the source" };
const cell = (text) => String(text ?? "").replace(/\|/g, "\\|");
const measuredText = (entry) =>
  Object.entries(entry.measured)
    .map(([mode, m]) => `${mode}: ${m.ok ? "ok" : `want ${m.want}, got ${m.got}`}`)
    .join("; ");
const lines = [
  `# Theme "${values.theme}" against its requirements`,
  "",
  `Requirements: ${summary.requirements} · already so ${summary.D} · variable ${summary.V} · variable on a mark ${summary.VM} · theme CSS ${summary.C} · not possible ${summary.N}`,
  `Not possible by reason: ${Object.entries(reasons).map(([reason, n]) => `${reason} ${n}`).join(" · ")}`,
  `Measured: ${summary.measured} · claimed but failed: ${failures} · contract guard differences: ${guard.differences.length}`,
  "",
  "| Id | Part | Requirement | Result | Reason | Measured | Note |",
  "|---|---|---|---|---|---|---|",
  ...known.map((entry) => `| ${entry.id} | ${cell(entry.part)} | ${cell(entry.text)} | ${HOW[entry.how]} | ${entry.reason ?? ""} | ${cell(measuredText(entry))} | ${cell(entry.note)} |`),
  "",
  "## Parts the design system does not describe (base values only)",
  "",
  "| Id | Part | Note |",
  "|---|---|---|",
  ...results.filter((entry) => entry.known === false).map((entry) => `| ${entry.id} | ${cell(entry.part)} | ${cell(entry.note)} |`),
  "",
];

if (values.out) {
  await mkdir(path.dirname(path.resolve(values.out)), { recursive: true });
  await writeFile(path.resolve(values.out), JSON.stringify({ summary, results, guard }, null, 2));
}
if (values.md) {
  await mkdir(path.dirname(path.resolve(values.md)), { recursive: true });
  await writeFile(path.resolve(values.md), lines.join("\n"));
}

console.error(JSON.stringify(summary, null, 2));
for (const entry of results) {
  for (const [mode, m] of Object.entries(entry.measured)) {
    if (entry.how !== "N" && !m.ok) console.error(`FAIL ${entry.id} ${mode}: want ${m.want}, got ${m.got}`);
  }
}
for (const difference of guard.differences.slice(0, 40)) console.error("GUARD", JSON.stringify(difference));
process.exit(failures > 0 || guard.differences.length > 0 ? 1 : 0);
