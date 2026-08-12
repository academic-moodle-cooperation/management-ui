/**
 * Tests for the no-palette-classes rule (#297): raw Tailwind palette color
 * classes are forbidden; semantic tokens and everything else pass.
 */

import { RuleTester } from "eslint";
import { afterAll, describe, it } from "vitest";

import { noPaletteClasses } from "./no-palette-classes.js";

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;
RuleTester.afterAll = afterAll;

const tester = new RuleTester({
  languageOptions: { ecmaVersion: "latest", sourceType: "module" },
});

tester.run("no-palette-classes", noPaletteClasses, {
  valid: [
    // Semantic tokens — the intended vocabulary.
    { code: 'const c = "text-muted-foreground hover:text-foreground";' },
    { code: 'const c = "border-input bg-muted ring-ring/50";' },
    { code: 'const c = "text-ok text-warning text-error text-info";' },
    // Status/utility classes that merely contain a family word.
    { code: 'const c = "gap-2 rounded-md grayscale";' },
    // Arbitrary values are a deliberate escape hatch, not a palette class.
    { code: 'const c = "bg-[oklch(0.5_0_0)]";' },
    // Family word without a color utility prefix.
    { code: 'const c = "to-be-red-950-later";' },
    // Non-numbered token-ish names.
    { code: 'const c = "bg-sidebar text-sidebar-foreground";' },
    // Template literal with tokens only.
    { code: "const c = `flex ${x} text-foreground`;" },
  ],
  invalid: [
    // The literal #279 offenders.
    {
      code: 'const c = "block w-full text-gray-900 ring-1 ring-gray-300";',
      errors: [{ messageId: "palette" }],
    },
    {
      code: 'const c = "focus:ring-2 focus:ring-indigo-600";',
      errors: [{ messageId: "palette" }],
    },
    // Variant prefixes and opacity suffixes still match.
    {
      code: 'const c = "dark:bg-slate-800/50";',
      errors: [{ messageId: "palette" }],
    },
    {
      code: 'const c = "group-hover:text-slate-700";',
      errors: [{ messageId: "palette" }],
    },
    // Class strings in template literals (style maps, cn(...) pieces).
    {
      code: "const c = `flex ${x} border-gray-300`;",
      errors: [{ messageId: "palette" }],
    },
    // Every color-bearing utility family is covered.
    {
      code: 'const c = "placeholder:text-zinc-400";',
      errors: [{ messageId: "palette" }],
    },
  ],
});
