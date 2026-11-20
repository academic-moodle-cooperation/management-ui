/**
 * The "pilot2" requirements, measured on the theme of the other way
 * (apps/shell/public/plugins/themes/pilot2-b.css). The list is the one of
 * theme-spec-pilot2.mjs; this file only states what differs here:
 *
 *   b   the means in this way:
 *         rule        a rule in the layer `ui-theme`
 *         state-rule  such a rule for a state (hover, pressed, disabled, …)
 *         token       a design token on the root
 *         shared      a shared variable on the root
 *         var         a component variable of a part that is still the other way
 *         var-mark    such a variable, set on a mark
 *         D           already so
 *         N           not possible
 *
 * and replaces the measurement where the look is reached by another
 * property (the focus ring is an outline here, not a shadow).
 */
import { OPEN, PAGE_CHECKS, SPEC as BASE } from "./theme-spec-pilot2.mjs";

const L = (value) => ({ light: value, dark: null });
const focusOf = (id) => BASE.find((entry) => entry.id === id).check;

const MEANS = {
  T1: "token", T3: "token", T4: "token", T5: "token", T7: "var", T8: "token", T10: "shared",
  T11: "shared", T12: "D", T14: "state-rule", T16: "state-rule",
  FO1: "state-rule", FO2: "state-rule", FO3: "state-rule", FO4: "state-rule",
  B1: "rule", B2: "D", B3: "shared", B4: "rule", B5: "rule", B6: "rule", B7: "rule", B8: "rule",
  B9: "rule", B10: "rule", B11: "token", B12: "state-rule", B13: "state-rule", B14: "state-rule",
  B15: "shared", B16: "rule", B17: "rule", B18: "rule", B19: "state-rule", B20: "state-rule",
  B21: "rule", B22: "token", B23: "state-rule", B24: "D", B25: "D",
  K1: "rule", K2: "D", K3: "rule", K4: "rule", K5: "rule", K6: "state-rule", K7: "rule",
  K8: "state-rule", K9: "state-rule", K10: "state-rule", K11: "state-rule", K12: "var-mark",
  M1: "var-mark",
};

const OVERRIDE = {
  FO1: { check: { ...focusOf("FO1"), prop: "outline-color", want: L("#94c154"), kind: "color" } },
  FO2: { check: { ...focusOf("FO2"), prop: "outline-width", want: L("2px"), kind: "px" } },
  FO3: { how: "C", reason: undefined, note: "An outline with an offset, in the theme layer. The part's own `outline-style: none` sits in a lower layer.",
    check: { ...focusOf("FO3"), prop: "outline-offset", want: L("2px"), kind: "px" } },
  B23: { note: "A rule for the pressed state; it also holds for a press from the keyboard." },
  K11: { note: "One selector covers checked and indeterminate. No such box in the gallery, not measured. The icon stays a check." },
};

export const SPEC = BASE.map((entry) => ({ ...entry, ...OVERRIDE[entry.id], b: MEANS[entry.id] ?? (entry.how === "N" ? "N" : entry.how) }));
export { OPEN, PAGE_CHECKS };
