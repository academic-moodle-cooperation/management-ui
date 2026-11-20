#!/usr/bin/env node
/**
 * Counts the names a theme sets, and how many of them are roles.
 *
 *   node apps/playground/scripts/count-theme-names.mjs [--json out.json] pilot pilot2 pilot3 stress compact
 *
 * Reads the source text only; nothing is measured. `compact` is the style in
 * the library's globals.css, the others are theme files.
 *
 * Every custom property a theme declares falls into one class:
 *
 *   private    the theme's own names (its tiers, helpers); the library never
 *              reads them
 *   token      a design token of the library (`--primary`, `--radius`, …)
 *   shared     one of the shared variables several parts read
 *              (`--control-height`, `--focus-ring-width`, …)
 *   component  a variable of one part (`--button-height`, …)
 *   toast      a variable of the toast library, set on its own class names
 *
 * and is set either on the root or on a mark (any other selector).
 *
 * Two readings of "role":
 *
 *   today      the library as it is. Roles are what several parts share:
 *              tokens and shared variables. Everything else is per part.
 *   draft      as if the library had the role variables drafted in round two
 *              (ROLES below). A component variable, a token set on a mark in
 *              a state, or a plain declaration of the theme then collapses
 *              into the role that would carry it. `rule: true` marks a role
 *              that only works once the part has a rule for that state (the
 *              nine state rules of the draft); `decl: true` one that needs a
 *              new resting declaration.
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../..");
const { values, positionals } = parseArgs({ options: { json: { type: "string" } }, allowPositionals: true });
const themes = positionals.length ? positionals : ["pilot", "pilot2", "pilot3", "stress", "compact"];

const SHARED = [
  "--control-height", "--control-height-sm", "--control-height-lg", "--control-radius",
  "--control-font-size", "--control-line-height", "--control-border-width",
  "--control-opacity-disabled", "--focus-ring-width", "--focus-ring-color", "--card-spacing",
];

/**
 * The draft. `when` tests the selector the declaration sits in ("" = root),
 * `name` the property. First match wins.
 */
const state = (s) => (sel) => sel.includes(s);
const rest = (sel) => !/:(hover|active|disabled|focus)|data-state|aria-invalid|data-disabled/.test(sel);
const ROLES = [
  // states the parts have no rule for today
  { role: "--action-primary-bg-pressed", rule: true, when: state(":active"), name: /^--button-bg-default(-hover)?$/ },
  { role: "--action-secondary-bg-pressed", rule: true, when: state(":active"), name: /^--button-bg-outline(-hover)?$/ },
  { role: "--action-tertiary-bg-pressed", rule: true, when: state(":active"), name: /^--button-bg-ghost-hover$/ },
  { role: "--action-primary-bg-disabled", rule: true, when: state(":disabled"), name: /^--button-bg-(default|secondary|destructive)$/ },
  { role: "--selected-bg-disabled", rule: true, when: state(":disabled"), name: /^--(checkbox|switch)-(bg|border-color)-checked$/ },
  { role: "--selected-bg-hover", rule: true, when: state(":hover"), name: /^--(checkbox|switch)-(bg|border-color)-checked$/ },
  { role: "--text-link-hover", rule: true, when: state(":hover"), name: /^--button-color-link$/ },
  { role: "--control-border-color-hover", rule: true, when: state(":hover"), name: /^--(input|(input|textarea|select-trigger|checkbox)-border-color|button-border-color-outline)$/ },
  { role: "--text-disabled", rule: true, when: (sel) => /:disabled|data-disabled/.test(sel), name: /^(color|--button-color-(default|secondary|destructive|link))$/ },
  // resting look
  { role: "--action-primary-bg", when: rest, name: /^--(button|badge)-bg-default$/ },
  { role: "--action-primary-bg-hover", when: rest, name: /^--(button|badge)-bg-default-hover$/ },
  { role: "--action-primary-color", when: rest, name: /^--(button|badge)-color-default$/ },
  { role: "--action-secondary-bg", when: rest, name: /^--button-bg-outline$/ },
  { role: "--action-secondary-bg-hover", when: rest, name: /^--button-bg-outline-hover$/ },
  { role: "--action-secondary-border-color", when: rest, name: /^--button-border-color-outline$/ },
  { role: "--action-secondary-color-hover", when: rest, name: /^--button-color-outline-hover$/ },
  { role: "--action-tertiary-bg-hover", when: rest, name: /^--button-bg-ghost-hover$/ },
  { role: "--action-tertiary-color-hover", when: rest, name: /^--button-color-ghost-hover$/ },
  { role: "--action-secondary-color", decl: true, when: (sel) => rest(sel) && /outline|ghost/.test(sel), name: /^color$/ },
  { role: "--selected-bg", when: rest, name: /^--(checkbox|switch)-(bg|border-color)-checked$/ },
  { role: "--selected-color", when: rest, name: /^--checkbox-color-checked$/ },
  { role: "--text-link", when: rest, name: /^--button-color-link$/ },
  { role: "--surface-inverse", when: rest, name: /^--tooltip-content-bg$/ },
  { role: "--text-inverse", when: rest, name: /^--tooltip-content-color$/ },
  { role: "--control-border-color", when: rest, name: /^--(input|textarea|select-trigger|checkbox)-border-color$/ },
  { role: "--control-border-color-focus", when: rest, name: /-border-color-focus$/ },
  // exists today as a shared variable; a theme that sets it per part could use it
  { role: "--control-opacity-disabled", exists: true, when: rest, name: /-opacity-disabled$/ },
];

// ---------------------------------------------------------------------------
// What the library defines
// ---------------------------------------------------------------------------
const globals = await readFile(path.join(root, "packages/ui/src/styles/globals.css"), "utf8");
const uiDir = path.join(root, "packages/ui/src/components/ui");
const read = new Set();
for (const file of await readdir(uiDir)) {
  if (!file.endsWith(".tsx")) continue;
  const text = await readFile(path.join(uiDir, file), "utf8");
  for (const hit of text.matchAll(/var\((--[a-z0-9-]+)/g)) read.add(hit[1]);
}
for (const hit of globals.slice(globals.indexOf("/* Toast.")).matchAll(/var\((--sonner-[a-z-]+)/g)) read.add(hit[1]);
// Tokens are what the stylesheet declares outside the compact style's blocks
// (the style sets shared and component variables, it does not define them).
const withoutStyles = globals.replace(/\[data-style="compact"\][^{]*\{[^}]*\}/g, "");
const declared = new Set([...withoutStyles.matchAll(/^\s*(--[a-z0-9-]+)\s*:/gm)].map((hit) => hit[1]));
const TOAST = /^--(normal|success|error|warning|info)-(bg|text|border)$|^--border-radius$/;

function classify(name) {
  if (SHARED.includes(name)) return "shared";
  if (TOAST.test(name)) return "toast";
  if (declared.has(name)) return "token";
  if (read.has(name)) return "component";
  return "private";
}

// ---------------------------------------------------------------------------
// A small reader for the theme files: rules with their declarations
// ---------------------------------------------------------------------------
function rules(css) {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const out = [];
  const walk = (source, layered) => {
    let index = 0;
    while (index < source.length) {
      const open = source.indexOf("{", index);
      if (open < 0) break;
      let depth = 1;
      let close = open + 1;
      while (depth > 0 && close < source.length) {
        if (source[close] === "{") depth += 1;
        if (source[close] === "}") depth -= 1;
        close += 1;
      }
      const selector = source.slice(index, open).trim().replace(/\s+/g, " ");
      const body = source.slice(open + 1, close - 1);
      if (selector.startsWith("@media") || selector.startsWith("@layer")) {
        walk(body, layered || selector.startsWith("@layer"));
      } else {
        const declarations = [];
        let paren = 0;
        let start = 0;
        for (let i = 0; i <= body.length; i += 1) {
          if (body[i] === "(") paren += 1;
          if (body[i] === ")") paren -= 1;
          if ((body[i] === ";" && paren === 0) || i === body.length) {
            const piece = body.slice(start, i).trim();
            const colon = piece.indexOf(":");
            if (colon > 0) declarations.push(piece.slice(0, colon).trim());
            start = i + 1;
          }
        }
        out.push({ selector, declarations, layered });
      }
      index = close;
    }
  };
  walk(text, false);
  return out;
}

const isRoot = (selector) => /^(:root|\.dark|\[data-style="?[a-z]+"?\])$/.test(selector);

async function source(id) {
  if (id === "compact") {
    // The style's blocks in globals.css.
    return [...globals.matchAll(/\[data-style="compact"\][^{]*\{[^}]*\}/g)].map((hit) => hit[0]).join("\n");
  }
  return readFile(path.join(root, `apps/shell/public/plugins/themes/${id}.css`), "utf8");
}

const report = {};
for (const id of themes) {
  const list = rules(await source(id));
  const names = { private: new Set(), token: new Set(), shared: new Set(), component: new Set(), toast: new Set() };
  const onMark = { token: new Set(), shared: new Set(), component: new Set(), toast: new Set() };
  const onRoot = { token: new Set(), shared: new Set(), component: new Set(), toast: new Set() };
  const plain = []; // theme CSS declarations
  const markRules = new Set();
  const draft = { roles: new Map(), left: new Set(), plainLeft: 0 };
  for (const rule of list) {
    const atRoot = isRoot(rule.selector);
    for (const property of rule.declarations) {
      const custom = property.startsWith("--");
      const kind = custom ? classify(property) : "plain";
      if (custom) names[kind].add(property);
      if (custom && kind !== "private") (atRoot ? onRoot : onMark)[kind].add(property);
      if (!custom) plain.push(`${rule.selector} { ${property} }`);
      if (!atRoot && custom && kind !== "private") markRules.add(rule.selector);
      // The draft reading. Tokens and shared variables on the root stay what they are.
      if (kind === "private" || kind === "toast") continue;
      if (atRoot && (kind === "token" || kind === "shared")) continue;
      // `:not(:disabled)` is not the disabled state.
      const selector = atRoot ? "" : rule.selector.replace(/:not\([^)]*\)/g, "");
      const role = ROLES.find((item) => item.name.test(property) && item.when(selector));
      if (role) {
        const entry = draft.roles.get(role.role) ?? { rule: !!role.rule, decl: !!role.decl, exists: !!role.exists, replaces: new Set() };
        entry.replaces.add(custom ? property : `${property} (theme CSS)`);
        draft.roles.set(role.role, entry);
      } else if (custom) {
        draft.left.add(property);
      } else {
        draft.plainLeft += 1;
      }
    }
  }
  const size = (set) => set.size;
  const libraryNames = size(names.token) + size(names.shared) + size(names.component);
  const roleEntries = [...draft.roles.entries()];
  // A component name counts as replaced only if no declaration of it is left over.
  const replaced = new Set(roleEntries.flatMap(([, entry]) => [...entry.replaces]).filter((name) => name.startsWith("--") && !draft.left.has(name) && classify(name) === "component"));
  report[id] = {
    names: {
      private: size(names.private),
      token: size(names.token),
      shared: size(names.shared),
      component: size(names.component),
      toast: size(names.toast),
      library: libraryNames,
    },
    where: {
      componentOnRootOnly: [...names.component].filter((name) => !onMark.component.has(name)).length,
      componentOnAMark: size(onMark.component),
      tokenOnAMark: size(onMark.token),
      markRules: markRules.size,
      themeCssDeclarations: plain.length,
    },
    today: {
      roles: size(names.token) + size(names.shared),
      perPart: size(names.component),
    },
    draft: {
      rolesExisting: size(names.token) + size(names.shared),
      rolesNew: roleEntries.filter(([, entry]) => !entry.exists).length,
      rolesNewWithoutTheNineRules: roleEntries.filter(([, entry]) => !entry.exists && !entry.rule).length,
      ofThoseNeedingAStateRule: roleEntries.filter(([, entry]) => entry.rule).length,
      ofThoseNeedingARestingDeclaration: roleEntries.filter(([, entry]) => entry.decl).length,
      componentNamesReplaced: replaced.size,
      componentNamesReplacedWithoutTheNineRules: [...replaced].filter((name) => roleEntries.some(([, entry]) => !entry.rule && entry.replaces.has(name)) && !roleEntries.some(([, entry]) => entry.rule && entry.replaces.has(name))).length,
      perPartLeft: size(names.component) - replaced.size,
      themeCssLeft: draft.plainLeft,
      detail: Object.fromEntries(roleEntries.map(([role, entry]) => [role, { rule: entry.rule, decl: entry.decl, exists: entry.exists, replaces: [...entry.replaces] }])),
      left: [...names.component].filter((name) => !replaced.has(name)).sort(),
    },
  };
}

const ids = Object.keys(report);
const row = (label, pick) => `| ${label} | ${ids.map((id) => pick(report[id])).join(" | ")} |`;
console.log(`| | ${ids.join(" | ")} |\n|---|${ids.map(() => "---|").join("")}`);
console.log(row("Names of the library the theme sets", (r) => r.names.library));
console.log(row("  design tokens", (r) => r.names.token));
console.log(row("  shared variables", (r) => r.names.shared));
console.log(row("  component variables", (r) => r.names.component));
console.log(row("    of those also or only on a mark", (r) => r.where.componentOnAMark));
console.log(row("Variables of the toast library", (r) => r.names.toast));
console.log(row("The theme's own names", (r) => r.names.private));
console.log(row("Rules that set a variable on a mark", (r) => r.where.markRules));
console.log(row("Theme CSS declarations", (r) => r.where.themeCssDeclarations));
console.log(row("TODAY roles (tokens + shared)", (r) => r.today.roles));
console.log(row("TODAY per part (component variables)", (r) => r.today.perPart));
console.log(row("DRAFT roles that exist today", (r) => r.draft.rolesExisting));
console.log(row("DRAFT new roles used", (r) => r.draft.rolesNew));
console.log(row("  of those only with one of the nine state rules", (r) => r.draft.ofThoseNeedingAStateRule));
console.log(row("  of those needing a new resting declaration", (r) => r.draft.ofThoseNeedingARestingDeclaration));
console.log(row("DRAFT component variables replaced by a role", (r) => r.draft.componentNamesReplaced));
console.log(row("DRAFT per part left", (r) => r.draft.perPartLeft));
console.log(row("DRAFT theme CSS declarations left", (r) => r.draft.themeCssLeft));

if (values.json) await writeFile(path.resolve(values.json), JSON.stringify(report, null, 2));
