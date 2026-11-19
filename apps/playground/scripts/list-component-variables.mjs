#!/usr/bin/env node
/**
 * Lists the component variables the base components read, with their
 * fallbacks, as a Markdown table. Read from the source text, not measured:
 * every `var(--name, fallback)` inside a class name in
 * `packages/ui/src/components/ui/*.tsx`, plus the toast's in the stylesheet.
 * Shared variables (`--control-*`, `--focus-ring-*`, `--card-spacing`) appear
 * inside the fallbacks.
 *
 * The column "Set by" names every theme or style that declares the variable
 * (`--name:` anywhere in its file): the theme stylesheets in
 * `apps/shell/public/plugins/themes/` and the style "compact" in the
 * stylesheet of `@oc-mui/ui`. It answers "which of these names has a theme
 * ever needed", per component in the headings and in the summary at the end.
 * A component that follows a shared variable a theme sets is not counted:
 * the shared variables have their own table.
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
const stylesheet = readFileSync(path.resolve(dir, "../../styles/globals.css"), "utf8");

/** Theme or style id → the set of custom properties it declares. */
const setters = new Map();
const declared = (css) =>
  new Set([...css.matchAll(/(?:^|[\s;{])(--[a-z0-9-]+)\s*:/g)].map((hit) => hit[1]));
const themeDir = path.resolve(dir, "../../../../../apps/shell/public/plugins/themes");
for (const file of readdirSync(themeDir)
  .filter((name) => name.endsWith(".css"))
  .sort()) {
  const css = readFileSync(path.join(themeDir, file), "utf8").replaceAll(/\/\*[\s\S]*?\*\//g, "");
  setters.set(file.replace(/\.css$/, ""), declared(css));
}
{
  const start = stylesheet.indexOf('[data-style="compact"] {');
  setters.set("compact", declared(stylesheet.slice(start, stylesheet.indexOf("}", start))));
}
const setBy = (name) => [...setters].filter(([, names]) => names.has(name)).map(([id]) => id);
/** One summary row per component: [id, variables, set by any, per setter]. */
const summary = [];
function summarize(id, names) {
  const per = new Map([...setters.keys()].map((setter) => [setter, 0]));
  let any = 0;
  for (const name of names) {
    const by = setBy(name);
    if (by.length > 0) any += 1;
    for (const setter of by) per.set(setter, per.get(setter) + 1);
  }
  summary.push([id, names.length, any, per]);
  const parts = [...per].filter(([, n]) => n > 0).map(([setter, n]) => `${setter} ${n}`);
  return `${names.length}; set by a theme or style: ${any}${parts.length > 0 ? ` (${parts.join(", ")})` : ""}`;
}

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
    `\n### ${id} (${summarize(id, [...found.keys()])})\n\n| Variable | Fallback | Fallback in dark, where it differs | Set by |\n|---|---|---|---|`,
  );
  for (const [name, entry] of found) {
    const light = entry.get("light") ?? "(no value in light)";
    const dark = entry.get("dark");
    console.log(
      `| \`${name}\` | \`${light}\` | ${dark && dark !== light ? `\`${dark}\`` : ""} | ${setBy(name).join(", ")} |`,
    );
  }
  count += found.size;
}

// The toast's variables live in the stylesheet (see "Toast" in globals.css).
if (!wanted || wanted.includes("sonner")) {
  const rules = stylesheet.slice(stylesheet.indexOf("/* Toast."));
  const found = new Map();
  for (const hit of rules.matchAll(/var\((--sonner-[a-z-]+),\s*/g)) {
    const outer = call(rules, hit.index);
    if (!found.has(hit[1])) found.set(hit[1], outer.slice(outer.indexOf(",") + 1, -1).trim());
  }
  // `--sonner-icon-size` is read by the component too and already counted there.
  const own = [...found.keys()].filter((name) => name !== "--sonner-icon-size");
  console.log(
    `\n### sonner, in the stylesheet (${summarize("sonner, in the stylesheet", own)})\n\n| Variable | Fallback | Set by |\n|---|---|---|`,
  );
  for (const [name, fallback] of found)
    console.log(`| \`${name}\` | \`${fallback}\` | ${setBy(name).join(", ")} |`);
  count += own.length;
}

if (!wanted) {
  const shared = [
    ...new Set(
      [
        ...stylesheet.matchAll(/`(--(?:control|focus-ring|card-spacing)[a-z-]*)(\[[^`]*)?`/g),
      ].flatMap((hit) =>
        hit[2] ? ["", ...hit[2].slice(1, -1).split("|")].map((suffix) => hit[1] + suffix) : hit[1],
      ),
    ),
  ];
  console.log(`\n### Shared variables (${shared.length})\n\n| Variable | Set by |\n|---|---|`);
  for (const name of shared) console.log(`| \`${name}\` | ${setBy(name).join(", ")} |`);
}

const ids = [...setters.keys()].filter((setter) => summary.some((row) => row[3].get(setter) > 0));
console.log(
  `\n### Summary: variables a theme or style sets\n\n| Component | Variables | Set by any | ${ids.join(" | ")} |\n|---|---|---|${ids.map(() => "---|").join("")}`,
);
const total = ["Total", 0, 0, new Map(ids.map((id) => [id, 0]))];
for (const [id, size, any, per] of summary) {
  console.log(`| ${id} | ${size} | ${any} | ${ids.map((setter) => per.get(setter)).join(" | ")} |`);
  total[1] += size;
  total[2] += any;
  for (const setter of ids) total[3].set(setter, total[3].get(setter) + per.get(setter));
}
console.log(
  `| **${total[0]}** | ${total[1]} | ${total[2]} | ${ids.map((setter) => total[3].get(setter)).join(" | ")} |`,
);
console.error(`${count} variables`);
