#!/usr/bin/env node
/**
 * Captures the component gallery as PNG files, one per component, so two runs
 * (before and after a change to the base components) can be compared.
 *
 * Start the playground first, then:
 *
 *   node apps/playground/scripts/capture-gallery.mjs --url http://127.0.0.1:3001 --out tmp/gallery/before
 *
 * Options:
 *   --url     Base URL of the running playground (default http://127.0.0.1:3001).
 *   --out     Output directory (default tmp/gallery/<timestamp>; `tmp/` is gitignored).
 *   --themes  Comma-separated theme ids (default "default").
 *   --modes   Comma-separated appearance modes (default "light,dark").
 *   --style   Style id passed through to the gallery (default "default").
 *
 * Output per <out>/<theme>-<mode>/:
 *   overview.png                  the whole page
 *   <component>.png               one section at rest
 *   <component>-open.png          every overlay, opened
 *   <component>-hover-<name>.png  pointer over one element (see HOVER)
 *   <component>-focus.png         keyboard focus on the section's first control
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";

import { chromium } from "@playwright/test";

/** Components whose opened state is captured through `?open=<id>`. */
const OVERLAYS = [
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

/**
 * Elements to capture under the pointer: section id → name → selector inside
 * that section. Hover styles differ per variant, so the button lists each.
 */
const HOVER = {
  button: {
    default: "[data-slot=button] >> nth=0",
    secondary: "[data-slot=button] >> nth=1",
    outline: "[data-slot=button] >> nth=2",
    ghost: "[data-slot=button] >> nth=3",
    destructive: "[data-slot=button] >> nth=4",
    link: "[data-slot=button] >> nth=5",
  },
  badge: { link: "a[data-slot=badge]" },
  input: { field: "[data-slot=input] >> nth=0" },
  select: { trigger: "[data-slot=select-trigger] >> nth=0" },
  tabs: { inactive: "[data-slot=tabs-trigger] >> nth=1" },
  table: { row: "tbody tr >> nth=0" },
  accordion: { trigger: "[data-slot=accordion-trigger] >> nth=1" },
  breadcrumb: { link: "[data-slot=breadcrumb-link] >> nth=0" },
  sidebar: { item: "[data-slot=sidebar-menu-button] >> nth=2" },
  "data-table": { row: "tbody tr >> nth=0", button: "[data-slot=button] >> nth=0" },
};

/**
 * Freeze everything that moves and hide the dev-only query devtools button,
 * which would otherwise float over the bottom-right corner of every picture.
 */
const STABILIZE_CSS = `
  *, *::before, *::after {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
    caret-color: transparent !important;
  }
  [class*="tsqd"] { display: none !important; }
`;

const { values } = parseArgs({
  options: {
    url: { type: "string", default: "http://127.0.0.1:3001" },
    out: { type: "string" },
    themes: { type: "string", default: "default" },
    modes: { type: "string", default: "light,dark" },
    style: { type: "string", default: "default" },
  },
});

const outRoot = path.resolve(
  values.out ?? path.join("tmp", "gallery", new Date().toISOString().replace(/[:.]/g, "-")),
);

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  deviceScaleFactor: 2,
  reducedMotion: "reduce",
});
const page = await context.newPage();

async function open(params) {
  const query = new URLSearchParams({ chrome: "0", ...params });
  for (const key of ["theme", "mode", "style"]) {
    if (query.get(key) === "default" || query.get(key) === "light") query.delete(key);
  }
  await page.goto(`${values.url}/?${query}`, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: STABILIZE_CSS });
  await page.evaluate(() => document.fonts.ready);
}

let count = 0;
for (const theme of values.themes.split(",")) {
  for (const mode of values.modes.split(",")) {
    const dir = path.join(outRoot, `${theme}-${mode}`);
    await mkdir(dir, { recursive: true });
    const view = { theme, mode, style: values.style };

    await open(view);
    await page.screenshot({ path: path.join(dir, "overview.png"), fullPage: true });
    count += 1;

    const sections = page.locator("[data-gallery-section]");
    const ids = await sections.evaluateAll((elements) =>
      elements.map((element) => element.dataset.gallerySection),
    );
    for (const id of ids) {
      await page
        .locator(`[data-gallery-section="${id}"]`)
        .screenshot({ path: path.join(dir, `${id}.png`) });
      count += 1;
    }

    // Interaction states need the section alone on the page: the pointer and
    // the focus are then guaranteed to sit inside the captured element.
    for (const id of ids) {
      const section = page.locator(`[data-gallery-section="${id}"]`);

      for (const [name, selector] of Object.entries(HOVER[id] ?? {})) {
        await open({ ...view, only: id });
        await section.locator(selector).hover();
        await section.screenshot({ path: path.join(dir, `${id}-hover-${name}.png`) });
        await page.mouse.move(0, 0);
        count += 1;
      }

      // Tab from a fresh page lands on the first focusable control and, being
      // keyboard focus, triggers `:focus-visible`.
      await open({ ...view, only: id });
      await page.keyboard.press("Tab");
      const focused = await page.evaluate(
        () => document.activeElement !== null && document.activeElement !== document.body,
      );
      if (focused) {
        await section.screenshot({ path: path.join(dir, `${id}-focus.png`) });
        count += 1;
      }
    }

    for (const id of OVERLAYS) {
      await open({ ...view, only: id, open: id });
      // Overlays are portalled out of the section, so capture the viewport.
      await page.screenshot({ path: path.join(dir, `${id}-open.png`) });
      count += 1;
    }
  }
}

await browser.close();
console.log(`${count} screenshots written to ${outRoot}`);
