#!/usr/bin/env node
/**
 * Lists the component variables the base components read, with their
 * fallbacks, as a Markdown table. Read from the source text, not measured:
 * every `var(--name, fallback)` inside a class name in
 * `packages/ui/src/components/ui/*.tsx`, plus the toast's in the stylesheet.
 * Shared variables (`--control-*`, `--focus-ring-*`, `--card-spacing`) appear
 * inside the fallbacks.
 *
 *   node apps/playground/scripts/list-component-variables.mjs [--files button,input]
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const { values } = parseArgs({ options: { files: { type: "string" } } });
const dir = path.resolve(
  fileURLToPath(import.meta.url),
  "../../../../packages/ui/src/components/ui",
);
const wanted = values.files?.split(",");

/** The text of the `var(` call that starts at `start`, up to its closing bracket. */
function call(text, start) {
  let depth = 0;
  for (let index = start; index < text.length; index += 1) {
    if (text[index] === "(") depth += 1;
    if (text[index] === ")" && (depth -= 1) === 0) return text.slice(start, index + 1);
  }
  return text.slice(start);
}

let count = 0;
for (const file of readdirSync(dir)
  .filter((name) => name.endsWith(".tsx"))
  .sort()) {
  const id = file.replace(/\.tsx$/, "");
  if (wanted && !wanted.includes(id)) continue;
  const text = readFileSync(path.join(dir, file), "utf8");
  /** name → { fallbacks, conditions } */
  const found = new Map();
  for (const literal of text.matchAll(/"([^"\n]+)"/g)) {
    for (const className of literal[1].split(/\s+/)) {
      // Every `var(` that opens a bracket value: `h-[var(…)]`, `[color:var(…)]`,
      // the line height in `text-[…]/[var(…)]`, or a bare `var(…)` literal.
      for (const hit of className.matchAll(/(?:^|\[(?:[a-z-]+:)?)var\(--/g)) {
        const start = hit.index + hit[0].indexOf("var(");
        const outer = call(className, start);
        const comma = outer.indexOf(",");
        const name = outer.slice(4, comma === -1 ? -1 : comma);
        // Variables of the primitives underneath are not ours.
        if (/^--(radix|tw|cell|sidebar-width|spacing)/.test(name) || comma === -1) continue;
        const condition = className.slice(0, hit.index);
        const fallback = outer.slice(comma + 1, -1).replaceAll("_", " ");
        const entry = found.get(name) ?? new Map();
        const key = /(^|:)dark:/.test(condition) ? "dark" : "light";
        if (!entry.has(key)) entry.set(key, fallback);
        found.set(name, entry);
      }
    }
  }
  if (found.size === 0) continue;
  console.log(
    `\n### ${id} (${found.size})\n\n| Variable | Fallback | Fallback in dark, where it differs |\n|---|---|---|`,
  );
  for (const [name, entry] of found) {
    const light = entry.get("light") ?? "(no value in light)";
    const dark = entry.get("dark");
    console.log(`| \`${name}\` | \`${light}\` | ${dark && dark !== light ? `\`${dark}\`` : ""} |`);
  }
  count += found.size;
}

// The toast's variables live in the stylesheet (see "Toast" in globals.css).
if (!wanted || wanted.includes("sonner")) {
  const css = readFileSync(path.resolve(dir, "../../styles/globals.css"), "utf8");
  const rules = css.slice(css.indexOf("/* Toast."));
  const found = new Map();
  for (const hit of rules.matchAll(/var\((--sonner-[a-z-]+),\s*/g)) {
    const outer = call(rules, hit.index);
    if (!found.has(hit[1])) found.set(hit[1], outer.slice(outer.indexOf(",") + 1, -1).trim());
  }
  console.log(
    `\n### sonner, in the stylesheet (${found.size})\n\n| Variable | Fallback |\n|---|---|`,
  );
  for (const [name, fallback] of found) console.log(`| \`${name}\` | \`${fallback}\` |`);
  count += [...found.keys()].filter((name) => name !== "--sonner-icon-size").length;
}
console.error(`${count} variables`);
