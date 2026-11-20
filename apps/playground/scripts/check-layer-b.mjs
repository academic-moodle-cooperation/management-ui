#!/usr/bin/env node
/**
 * Measures the cascade fixture `?only=layer-b`: who wins between the
 * component's own look, a theme rule on the fixed marks, a class of the
 * caller and a plugin stylesheet. Every case is read at rest, under the
 * pointer, with keyboard focus and pressed, plain, disabled and invalid, in
 * light and dark. States are forced through the DevTools protocol, so every
 * element is measured, not only the one under the real pointer.
 *
 *   node apps/playground/scripts/check-layer-b.mjs --url http://127.0.0.1:3001 --out tmp/b/run.json
 *
 * Options:
 *   --theme-layer  cascade layer of the fixture theme (default "ui-theme");
 *                  "none" loads it unlayered, the way a theme file is loaded today
 *   --layers       a full `@layer a, b, c;` order to declare before any
 *                  stylesheet loads (the first declaration fixes the order)
 *   --root-attr    `name=value`, set on the root element before the page
 *                  renders (for example `data-ui-states=above`)
 *   --plugin       what the fixture's plugin sheet ships besides its
 *                  utilities: "plain" (default), "preflight" (Tailwind's
 *                  reset in its `base` layer) or "copy" (the reset plus a
 *                  copy of the library's component sheets, as a plugin that
 *                  imports the library's stylesheet would)
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { parseArgs } from "node:util";

import { chromium } from "@playwright/test";

const { values } = parseArgs({
  options: {
    url: { type: "string", default: "http://127.0.0.1:3001" },
    out: { type: "string" },
    "theme-layer": { type: "string", default: "ui-theme" },
    layers: { type: "string" },
    plugin: { type: "string", default: "plain" },
    "root-attr": { type: "string" },
  },
});

const PROPS = [
  "background-color",
  "color",
  "border-top-color",
  "border-top-width",
  "height",
  "padding-left",
  "border-top-left-radius",
  "column-gap",
  "font-size",
  "font-weight",
  "opacity",
  "box-shadow",
  "text-decoration-line",
  "outline-style",
];

const STATES = {
  rest: [],
  hover: ["hover"],
  "focus-visible": ["focus", "focus-visible"],
  active: ["hover", "active"],
};

function pluginExtraCss() {
  if (values.plugin === "plain") return "";
  const require = createRequire(path.resolve("packages/ui/package.json"));
  const preflight = readFileSync(require.resolve("tailwindcss/preflight.css"), "utf8");
  let css = `@layer base {\n${preflight}\n}\n`;
  if (values.plugin === "copy") {
    const dir = path.resolve("packages/ui/src/styles/parts");
    const parts = existsSync(dir)
      ? readdirSync(dir)
          .filter((name) => name.endsWith(".css"))
          .map((name) => readFileSync(path.join(dir, name), "utf8"))
      : [];
    // The library's own order statement, as the plugin's build would carry it.
    css = `@layer theme, base, ui, ui-theme, ui-states, plugins, components, utilities;\n${css}@layer ui {\n${parts.join("\n")}\n}\n`;
  }
  return css;
}

const browser = await chromium.launch();
const result = { config: { ...values, out: undefined }, modes: {} };

for (const mode of ["light", "dark"]) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.addInitScript(
    ({ themeLayer, extra, layers }) => {
      window.__layerB = { themeLayer: themeLayer === "none" ? null : themeLayer, pluginExtraCss: extra };
      if (layers) {
        const declare = () => {
          const style = document.createElement("style");
          style.dataset.layerOrder = "";
          style.textContent = `@layer ${layers};`;
          document.head.prepend(style);
        };
        if (document.head) declare();
        else new MutationObserver((_, observer) => {
          if (!document.head) return;
          observer.disconnect();
          declare();
        }).observe(document, { childList: true, subtree: true });
      }
    },
    { themeLayer: values["theme-layer"], extra: pluginExtraCss(), layers: values.layers ?? null },
  );
  const query = new URLSearchParams({ only: "layer-b", chrome: "0" });
  if (mode === "dark") query.set("mode", "dark");
  await page.goto(`${values.url}/?${query}`, { waitUntil: "networkidle" });
  await page.waitForSelector("style[data-layer-b-fixture]", { state: "attached" });
  if (values["root-attr"]) {
    const [name, value] = values["root-attr"].split("=");
    await page.evaluate(([n, v]) => document.documentElement.setAttribute(n, v ?? ""), [name, value]);
  }
  await page.waitForTimeout(400); // the plugin sheet is an @import of a blob URL
  await page.addStyleTag({ content: "*, *::before, *::after { transition: none !important; }" });

  const cdp = await page.context().newCDPSession(page);
  await cdp.send("DOM.enable");
  await cdp.send("CSS.enable");
  const { root } = await cdp.send("DOM.getDocument", { depth: 0 });
  const { nodeIds } = await cdp.send("DOM.querySelectorAll", {
    nodeId: root.nodeId,
    selector: "[data-case]",
  });

  const cases = {};
  for (const [state, pseudo] of Object.entries(STATES)) {
    for (const nodeId of nodeIds) {
      await cdp.send("CSS.forcePseudoState", { nodeId, forcedPseudoClasses: pseudo });
    }
    const read = await page.evaluate((props) => {
      const out = [];
      for (const element of document.querySelectorAll("[data-case]")) {
        const style = getComputedStyle(element);
        const values = Object.fromEntries(props.map((prop) => [prop, style.getPropertyValue(prop)]));
        const svg = element.querySelector("svg");
        if (svg) values["svg:width"] = getComputedStyle(svg).width;
        out.push({
          id: element.getAttribute("data-case"),
          who: element.getAttribute("data-who"),
          want: JSON.parse(element.getAttribute("data-want") ?? "{}"),
          variant: element.getAttribute("data-variant"),
          size: element.getAttribute("data-size"),
          values,
        });
      }
      return out;
    }, PROPS);
    for (const entry of read) {
      cases[entry.id] ??= {
        who: entry.who,
        want: entry.want,
        variant: entry.variant,
        size: entry.size,
        states: {},
      };
      cases[entry.id].states[state] = entry.values;
    }
  }
  result.modes[mode] = cases;
  await page.close();
}

await browser.close();
const json = JSON.stringify(result, null, 1);
if (values.out) writeFileSync(values.out, json);
else console.log(json);
console.error(
  `${Object.keys(result.modes.light).length} elements, ${Object.keys(STATES).length} states, 2 modes` +
    (values.out ? ` → ${values.out}` : ""),
);
