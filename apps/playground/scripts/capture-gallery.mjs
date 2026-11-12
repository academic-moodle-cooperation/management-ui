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
 * Output: <out>/<theme>-<mode>/<component>.png, <component>-open.png for every
 * overlay, and overview.png (the whole page).
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
