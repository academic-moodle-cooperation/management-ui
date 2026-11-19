#!/usr/bin/env node
/**
 * Turns runs of `check-layer-b.mjs` into one table: for every case and every
 * property a contender asked for, in which states it did NOT get it, and who
 * won instead. One column per run, so two set-ups stand next to each other.
 *
 *   node apps/playground/scripts/report-layer-b.mjs today=tmp/b/a.json b=tmp/b/b.json [--all] [--scope=none|theme]
 *
 * A cell reads "ok" when the contender won in every state measured, otherwise
 * the states it lost in: `hover→component`, `dark hover→theme`. `--all` also
 * prints the rows that are "ok" in every run.
 */
import { readFileSync } from "node:fs";

const args = process.argv.slice(2);
const all = args.includes("--all");
// --scope=none: only the cases without a theme rule; --scope=theme: only those with one.
const scopeOnly = args.find((arg) => arg.startsWith("--scope="))?.slice(8);
const runs = args
  .filter((arg) => arg.includes("=") && !arg.startsWith("--"))
  .map((arg) => {
    const [label, file] = arg.split("=");
    return { label, data: JSON.parse(readFileSync(file, "utf8")) };
  });

/** What the fixture theme asks for (see `sections/layer-b.tsx`). */
const THEME_REST = {
  "background-color": "rgb(10, 20, 30)",
  color: "rgb(11, 21, 31)",
  "border-top-color": "rgb(12, 22, 32)",
  height: "44px",
  "padding-left": "22px",
  "border-top-left-radius": "11px",
  "column-gap": "13px",
  "font-size": "17px",
  "font-weight": "600",
  opacity: "0.9",
  "box-shadow": "rgb(13, 23, 33) 0px 0px 0px 1px",
};
const themeStates = (render, state) => {
  const want = { "background-color": "rgb(10, 20, 30)", color: "rgb(11, 21, 31)", "border-top-color": "rgb(12, 22, 32)" };
  if (state === "hover" || state === "active") Object.assign(want, { "background-color": "rgb(40, 50, 60)", color: "rgb(41, 51, 61)" });
  if (state === "active") want["background-color"] = "rgb(44, 54, 64)";
  if (state === "focus-visible") Object.assign(want, { "border-top-color": "rgb(42, 52, 62)", "box-shadow": "CONTAINS rgb(43, 53, 63) 0px 0px 0px 2px" });
  if (render === "disabled") Object.assign(want, { "background-color": "rgb(45, 55, 65)", opacity: "0.7" });
  if (render === "invalid") want["border-top-color"] = "rgb(46, 56, 66)";
  return want;
};
const THEME_VALUES = new Set([
  ...Object.values(THEME_REST),
  ...["plain", "disabled", "invalid"].flatMap((render) =>
    ["rest", "hover", "focus-visible", "active"].flatMap((state) => Object.values(themeStates(render, state))),
  ),
]);

const matches = (actual, wanted) =>
  wanted.startsWith("CONTAINS ") ? (actual ?? "").includes(wanted.slice(9)) : actual === wanted;

/** The checks of one element in one state: [property, wanted value, contender]. */
function checks(id, entry, render, state, mode) {
  const scope = id.startsWith("rest/") ? "rest" : id.startsWith("states/") ? "states" : null;
  const out = [];
  if (entry.who === "none") {
    if (scope === "rest") for (const [prop, value] of Object.entries(THEME_REST)) out.push([prop, value, "theme"]);
    if (scope === "states") for (const [prop, value] of Object.entries(themeStates(render, state))) out.push([prop, value, "theme"]);
    return out;
  }
  for (const [key, value] of Object.entries(entry.want)) {
    const [prop, only] = key.split("@");
    // The contender's own rule for the pointer replaces its resting value there.
    if (!only && `${prop}@hover` in entry.want && (state === "hover" || state === "active")) continue;
    if (only === "hover" && !(state === "hover" || state === "active")) continue;
    if (only === "focus-visible" && (state !== "focus-visible" || render !== "plain")) continue;
    if (only === "disabled" && render !== "disabled") continue;
    if (only === "dark" && mode !== "dark") continue;
    out.push([prop, value, entry.who]);
  }
  return out;
}

const rows = new Map(); // "case | prop | contender" → label → [lost states]
const totals = {};
for (const { label, data } of runs) {
  totals[label] = { checks: 0, won: 0, by: {} };
  for (const [mode, cases] of Object.entries(data.modes)) {
    for (const [fullId, entry] of Object.entries(cases)) {
      const [id, renderSuffix] = fullId.split("|");
      const themed = id.startsWith("rest/") || id.startsWith("states/");
      if (scopeOnly === "none" && themed) continue;
      if (scopeOnly === "theme" && !themed) continue;
      const render = renderSuffix ?? "plain";
      for (const [state, values] of Object.entries(entry.states)) {
        // A disabled button takes no pointer events: it is never under the pointer or pressed.
        if (render === "disabled" && (state === "hover" || state === "active")) continue;
        for (const [prop, wanted, contender] of checks(id, entry, render, state, mode)) {
          const actual = values[prop];
          const key = `${id} | ${prop} | ${contender}`;
          if (!rows.has(key)) rows.set(key, {});
          const cell = (rows.get(key)[label] ??= []);
          const by = (totals[label].by[contender] ??= { checks: 0, won: 0 });
          totals[label].checks += 1;
          by.checks += 1;
          if (matches(actual, wanted)) {
            totals[label].won += 1;
            by.won += 1;
            continue;
          }
          const winner = THEME_VALUES.has(actual) || /rgb\(1[0-3], 2[0-3], 3[0-3]\)|rgb\(4[0-6], 5[0-6], 6[0-6]\)/.test(actual ?? "")
            ? "theme"
            : /rgb\(1[0-3][0-9], 1[0-3][0-9], 1[0-3][0-9]\)/.test(actual ?? "") || ["51px", "53px", "55px", "57px", "37px"].includes(actual)
              ? "plugin"
              : "component";
          const where = [mode === "dark" ? "dark" : "", render === "plain" ? "" : render, state].filter(Boolean).join(" ");
          cell.push(`${where}→${winner}`);
        }
      }
    }
  }
}

// Shortens a cell: what also holds for the plain element is not repeated for
// the disabled and the invalid one, "pressed" is not repeated when it equals
// "under the pointer", and light and dark are merged.
function compact(lost) {
  if (!lost.length) return "ok";
  const perMode = { light: new Set(), dark: new Set() };
  for (const item of lost) {
    const dark = item.startsWith("dark ");
    perMode[dark ? "dark" : "light"].add(dark ? item.slice(5) : item);
  }
  const parse = (item) => {
    const [where, winner] = item.split("→");
    const words = where.split(" ");
    const state = words.pop();
    return { render: words.join(" "), state, winner };
  };
  for (const set of Object.values(perMode)) {
    for (const item of [...set]) {
      const { render, state, winner } = parse(item);
      if (state === "active" && set.has(`${[render, "hover"].filter(Boolean).join(" ")}→${winner}`)) set.delete(item);
    }
    for (const item of [...set]) {
      const { render, state, winner } = parse(item);
      if (render && set.has(`${state}→${winner}`)) set.delete(item);
    }
  }
  const { light, dark } = perMode;
  const out = [];
  for (const item of light) out.push(dark.has(item) ? item : `${item} (light only)`);
  for (const item of dark) if (!light.has(item)) out.push(`${item} (dark only)`);
  return out.join(", ");
}

const labels = runs.map((run) => run.label);
console.log(`| Case | Property | Contender | ${labels.join(" | ")} |`);
console.log(`|---|---|---|${labels.map(() => "---").join("|")}|`);
for (const [key, cells] of rows) {
  const texts = labels.map((label) => compact(cells[label] ?? []));
  if (!all && texts.every((text) => text === "ok")) continue;
  console.log(`| ${key} | ${texts.join(" | ")} |`);
}
console.log("");
for (const label of labels) {
  const parts = Object.entries(totals[label].by).map(([who, n]) => `${who} ${n.won}/${n.checks}`);
  console.log(`${label}: ${totals[label].won} of ${totals[label].checks} checks went to the contender that asked (${parts.join(", ")})`);
}
