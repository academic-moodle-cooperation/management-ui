/**
 * no-palette-classes
 *
 * Enforces the semantic-token theme rule (AGENTS.md → "Theme — CSS variables
 * only", docs/extend/styling.md) mechanically: Tailwind's raw palette color
 * classes (`text-gray-900`, `border-slate-300`, `focus:ring-indigo-600`, …)
 * are forbidden in string and template literals. Raw palette classes ignore
 * the theme tokens, which is exactly how #279 happened — near-black text on
 * the dark background, invisible until someone edited a field in dark mode.
 * Use the semantic tokens instead (`text-foreground`, `text-muted-foreground`,
 * `border-input`, `bg-muted`, `text-ok/warning/error/info`, ring tokens, …).
 *
 * Scope decisions:
 *
 *   - The rule scans EVERY string/template literal, not just `className`
 *     attributes — class strings also live in plain `.ts` style maps
 *     (e.g. `MUITable.styles.ts`), which an attribute-scoped rule would miss.
 *     The pattern is specific enough (`utility-family-number`) that false
 *     positives are unlikely; genuinely intentional fixed colors get an
 *     `eslint-disable-next-line local/no-palette-classes` with a reason.
 *   - `components/ui/` (the shadcn-generated layer) is excluded in `base.js`
 *     alongside the repo's existing lint policy for those files.
 *   - Only NUMBERED palette classes are matched (`gray-300`). Semantic tokens
 *     (`text-muted-foreground`), one-off arbitrary values (`bg-[oklch(...)]`)
 *     and non-color utilities (`gap-2`, `slate` inside a word) never match.
 */

const RULE_NAME = "no-palette-classes";

// Tailwind's raw color palette families. Deliberately NOT including project
// token names (foreground, muted, primary, ok, warning, error, info, …).
const PALETTE_FAMILIES =
  "(?:gray|slate|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)";

// Color-bearing utility prefixes. A palette family only means "color" when it
// follows one of these (otherwise `to-red-...` in prose etc. could match).
const COLOR_UTILITIES =
  "(?:text|bg|border|ring|outline|fill|stroke|shadow|accent|caret|divide|decoration|placeholder|from|via|to)";

// utility-family-number, optionally with variant prefixes (`hover:`,
// `focus:`, `dark:`, `group-hover:` …) and an opacity suffix (`/50`).
const PALETTE_CLASS = new RegExp(
  `(?:^|[\\s'"\`])(?:[\\w-]+:)*${COLOR_UTILITIES}-${PALETTE_FAMILIES}-\\d{2,3}(?:/\\d{1,3})?(?=$|[\\s'"\`])`,
);

/** @type {import("eslint").Rule.RuleModule} */
export const noPaletteClasses = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Forbid Tailwind raw palette color classes; use the semantic theme tokens (they are what dark mode and org themes restyle).",
    },
    schema: [],
    messages: {
      palette:
        'Raw palette class "{{match}}" ignores the theme tokens (this is how #279 happened). Use a semantic token instead — see docs/extend/styling.md.',
    },
  },

  create(context) {
    const check = (node, value) => {
      if (typeof value !== "string") return;
      const match = PALETTE_CLASS.exec(value);
      if (match) {
        context.report({
          node,
          messageId: "palette",
          data: { match: match[0].trim() },
        });
      }
    };

    return {
      Literal(node) {
        check(node, node.value);
      },
      TemplateElement(node) {
        check(node, node.value.cooked);
      },
    };
  },
};

export const ruleName = RULE_NAME;
