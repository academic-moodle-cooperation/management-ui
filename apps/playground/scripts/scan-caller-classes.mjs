#!/usr/bin/env node
/**
 * Counts the call sites whose look changes when a component's own look moves
 * from utility classes into a stylesheet in a lower cascade layer.
 *
 * Today a class of the caller and the component's classes sit in the same
 * layer. tailwind-merge drops the component's class for the same property AND
 * the same state; every other class of the component stays and competes by
 * specificity and order. So a caller's resting class loses against the
 * component's `hover:`, `dark:`, `focus-visible:`, `disabled:`,
 * `aria-invalid:` and `has-[>svg]:` rules. With the look in a lower layer the
 * caller's class wins in every state. This script finds those call sites by
 * reading the source; it does not render anything.
 *
 *   node apps/playground/scripts/scan-caller-classes.mjs plugins apps/shell/src packages/ui/src [--list]
 *
 * Kinds:
 *   state     the caller's class competes with a state rule of the component
 *             it does not replace (the class and the state are named)
 *   icon      an icon inside a button sized with w-/h- classes other than
 *             16px (today the button forces 16px unless the class is `size-*`)
 *   icon16    an icon inside a button sized with w-4 / h-4: no change by
 *             itself, but a theme's icon size no longer reaches it (the
 *             class wins; today the button's own size wins)
 *   font      a text field with a font-size class (today the field's own
 *             size from the `md` breakpoint up wins)
 *   relabel   a Button rendered through `asChild` by a wrapper that sets its
 *             own `data-variant` / `data-size`
 *   direct    `buttonVariants()` used on an element directly
 *   unknown   variant, size or class is computed; not judged
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(path.resolve("packages/ui/package.json"));
const { twMerge } = require("tailwind-merge");
const ts = require("typescript");

const args = process.argv.slice(2);
const list = args.includes("--list");
const roots = args.filter((arg) => !arg.startsWith("--"));

/**
 * The component's rules that tailwind-merge does not remove when the caller
 * passes a class without that state: state → probes (a class of the same
 * merge group, without the state prefix).
 */
const ALL_BUTTONS = {
  "focus-visible": ["border-red-500", "ring-red-500", "ring-2"],
  disabled: ["opacity-50"],
  "aria-invalid": ["border-red-500", "ring-red-500"],
};
const BUTTON_VARIANT = {
  default: { hover: ["bg-red-500"] },
  destructive: { hover: ["bg-red-500"], dark: ["bg-red-500"], "focus-visible": ["ring-red-500"] },
  outline: { hover: ["bg-red-500", "text-red-500"], dark: ["bg-red-500", "border-red-500"] },
  secondary: { hover: ["bg-red-500"] },
  ghost: { hover: ["bg-red-500", "text-red-500"] },
  link: { hover: ["underline"] },
};
const BUTTON_SIZE = {
  default: { "has-icon": ["px-1"] },
  sm: { "has-icon": ["px-1"] },
  lg: { "has-icon": ["px-1"] },
  icon: {},
};
const INPUT = {
  "focus-visible": ["border-red-500", "ring-red-500", "ring-2"],
  disabled: ["opacity-50"],
  "aria-invalid": ["border-red-500", "ring-red-500"],
  dark: ["bg-red-500"],
  "from md": ["text-sm"],
  placeholder: [],
};
const CHECKBOX = {
  "focus-visible": ["border-red-500", "ring-red-500", "ring-2"],
  disabled: ["opacity-50"],
  "aria-invalid": ["border-red-500", "ring-red-500"],
  dark: ["bg-red-500"],
  checked: ["bg-red-500", "text-red-500", "border-red-500"],
};

/** Wrappers that put their own `data-variant` / `data-size` on the child. */
const RELABELLING = new Set(["DropdownMenuItem", "SidebarMenuButton", "SidebarMenuSubButton"]);
const BUTTON_LIKE = { Button: null, AlertDialogAction: "default", AlertDialogCancel: "outline" };

const hasVariant = (token) => /:(?![^[]*\])/.test(token.replace(/\[[^\]]*\]/g, ""));
const conflicts = (probe, token) => twMerge(`${probe} ${token}`) === token;

function rulesFor(tag, variant, size) {
  if (tag === "Input") return [INPUT];
  if (tag === "Checkbox") return [CHECKBOX];
  const out = [ALL_BUTTONS];
  out.push(...(variant ? [BUTTON_VARIANT[variant] ?? {}] : Object.values(BUTTON_VARIANT)));
  out.push(...(size ? [BUTTON_SIZE[size] ?? {}] : []));
  return out;
}

function* files(dir) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "dist" || name === "dist-types" || name.startsWith(".")) continue;
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) yield* files(full);
    else if (/\.tsx$/.test(name) && !/\.(test|stories)\./.test(name)) yield full;
  }
}

const literal = (node) =>
  node && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) ? node.text : null;

/** Every string literal inside an expression, and whether anything else contributes. */
function strings(node, out = { texts: [], dynamic: false }) {
  if (!node) return out;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) out.texts.push(node.text);
  else if (ts.isTemplateExpression(node)) {
    out.texts.push(node.head.text, ...node.templateSpans.map((span) => span.literal.text));
    out.dynamic = true;
  } else if (ts.isIdentifier(node) || ts.isPropertyAccessExpression(node)) out.dynamic = true;
  ts.forEachChild(node, (child) => strings(child, out));
  return out;
}

const attribute = (element, name) =>
  element.attributes.properties.find((prop) => ts.isJsxAttribute(prop) && prop.name.getText() === name);
const attributeValue = (attr) =>
  !attr ? undefined : !attr.initializer ? "" : ts.isStringLiteral(attr.initializer) ? attr.initializer.text : literal(attr.initializer.expression) ?? null;

const findings = [];
const totals = { Button: 0, Input: 0, Checkbox: 0, withClass: 0 };

for (const root of roots) {
  for (const file of files(root)) {
    const source = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const at = (node) => `${file}:${source.getLineAndCharacterOfPosition(node.getStart()).line + 1}`;
    const add = (node, kind, detail) => findings.push({ root, where: at(node), kind, detail });

    const visit = (node, parentOpening) => {
      if (ts.isCallExpression(node) && node.expression.getText() === "buttonVariants") {
        add(node, "direct", "buttonVariants()");
      }
      const opening = ts.isJsxElement(node) ? node.openingElement : ts.isJsxSelfClosingElement(node) ? node : null;
      if (opening) {
        const tag = opening.tagName.getText();
        const kind = tag in BUTTON_LIKE ? "Button" : tag === "Input" || tag === "Checkbox" ? tag : null;
        if (kind) {
          totals[kind] += 1;
          if (kind === "Button" && parentOpening && attribute(parentOpening, "asChild")) {
            const wrapper = parentOpening.tagName.getText();
            if (RELABELLING.has(wrapper)) add(opening, "relabel", `${wrapper} asChild > ${tag}`);
          }
          const fixed = BUTTON_LIKE[tag];
          const variant = fixed ?? (attribute(opening, "variant") ? attributeValue(attribute(opening, "variant")) : "default");
          const size = fixed ? "default" : attribute(opening, "size") ? attributeValue(attribute(opening, "size")) : "default";
          if (kind === "Button" && (variant === null || size === null)) {
            add(opening, "unknown", `${variant === null ? "variant" : "size"} is computed`);
          }

          const classAttr = attribute(opening, "className");
          if (classAttr) {
            totals.withClass += 1;
            const { texts, dynamic } = classAttr.initializer && ts.isJsxExpression(classAttr.initializer)
              ? strings(classAttr.initializer.expression)
              : { texts: [attributeValue(classAttr) ?? ""], dynamic: false };
            if (dynamic && texts.length === 0) add(opening, "unknown", "className is computed");
            const tokens = [...new Set(texts.flatMap((text) => text.split(/\s+/)).filter(Boolean))];
            const resting = tokens.filter((token) => !hasVariant(token));
            const hits = new Set();
            for (const rules of rulesFor(kind, variant, size)) {
              for (const [state, probes] of Object.entries(rules)) {
                for (const probe of probes) {
                  for (const token of resting) {
                    if (state === "from md" && !/^text-(xs|sm|base|lg|xl|\dxl|\[)/.test(token)) continue;
                    if (conflicts(probe, token)) hits.add(`${token} vs ${state}`);
                  }
                }
              }
            }
            for (const hit of hits) {
              add(opening, hit.endsWith("from md") ? "font" : "state", `${tag}${kind === "Button" ? `[${variant ?? "?"}/${size ?? "?"}]` : ""} ${hit}`);
            }
          }

          if (kind === "Button" && ts.isJsxElement(node)) {
            const icons = (child) => {
              const childOpening = ts.isJsxElement(child) ? child.openingElement : ts.isJsxSelfClosingElement(child) ? child : null;
              if (childOpening) {
                const cls = attribute(childOpening, "className");
                const text = cls ? strings(cls.initializer && ts.isJsxExpression(cls.initializer) ? cls.initializer.expression : cls.initializer).texts.join(" ") : "";
                const sized = text.split(/\s+/).filter((token) => /^(w|h)-/.test(token) && !hasVariant(token));
                if (sized.length && !/(^|\s)size-/.test(text)) {
                  const sixteen = sized.every((token) => /^(w|h)-4$/.test(token));
                  add(childOpening, sixteen ? "icon16" : "icon", `${childOpening.tagName.getText()} ${sized.join(" ")}`);
                }
              }
              ts.forEachChild(child, icons);
            };
            node.children.forEach(icons);
          }
        }
      }
      ts.forEachChild(node, (child) => visit(child, opening ?? parentOpening));
    };
    visit(source, null);
  }
}

const byRoot = {};
for (const finding of findings) {
  byRoot[finding.root] ??= {};
  byRoot[finding.root][finding.kind] ??= { sites: new Set(), count: 0 };
  byRoot[finding.root][finding.kind].sites.add(finding.where);
  byRoot[finding.root][finding.kind].count += 1;
}
console.log(`elements read: ${totals.Button} buttons, ${totals.Input} text fields, ${totals.Checkbox} checkboxes; ${totals.withClass} with a className`);
for (const [root, kinds] of Object.entries(byRoot)) {
  console.log(`\n${root}`);
  for (const [kind, { sites, count }] of Object.entries(kinds)) {
    console.log(`  ${kind.padEnd(8)} ${String(sites.size).padStart(3)} call sites, ${count} findings`);
  }
}
if (list) {
  console.log("");
  for (const finding of findings) console.log(`${finding.kind.padEnd(8)} ${finding.where}  ${finding.detail}`);
}
