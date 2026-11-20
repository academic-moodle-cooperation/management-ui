/**
 * The checkable requirements behind the "pilot2" theme, one entry per
 * requirement. Same shape as theme-spec-pilot.mjs.
 *
 * The source is a token system with two tiers (base values, roles) and
 * measured values for a button. Its parts read roles only.
 *
 * STATE: requirement list only. No theme exists yet and nothing is measured.
 * `how` is the verdict EXPECTED from reading the component source; the checks
 * are added together with the theme.
 *
 * how      D | V | VM | C | N, as in theme-spec-pilot.mjs. "?" = the source
 *          gives no value, nothing to check yet.
 * reason   missing-variable | missing-mark | component-rule | missing-variant |
 *          structure | missing-component
 * sure     false when the requirement itself is uncertain: a value that was
 *          inferred, or a role whose use the source does not state.
 */

export const SPEC = [
  // ---- base values -------------------------------------------------------
  { id: "T1", part: "Base values", text: "Typeface: the specified sans, everywhere", how: "V" },
  { id: "T2", part: "Base values", text: "A serif family next to the sans", how: "V", sure: false,
    note: "The source defines the family but not where it is used. Mapped onto the heading family, which few parts read." },
  { id: "T3", part: "Base values", text: "Page surface #ffffff, text #333333", how: "V" },
  { id: "T4", part: "Base values", text: "Muted text #666666", how: "V" },
  { id: "T5", part: "Base values", text: "Muted surface #f0f2f5", how: "V" },
  { id: "T6", part: "Base values", text: "Subtle surface #f8f9fa as a second, lighter step", how: "N", reason: "missing-variable",
    note: "The library names surfaces by part (card, popover, side navigation, footer), not by tone. There is no second neutral step." },
  { id: "T7", part: "Base values", text: "Inverse surface #333333 with white text", how: "V", sure: false,
    note: "The source does not say which part uses it. Mapped onto the tooltip, the only inverse surface here." },
  { id: "T8", part: "Base values", text: "Line of a control #ced4da, rule #dee2e6", how: "V", sure: false,
    note: "The source calls them default and subtle; that default is the control line is a reading." },
  { id: "T9", part: "Base values", text: "Strong line #adb5bd", how: "N", reason: "missing-variable", sure: false,
    note: "No use stated. Nothing in the library reads a third line colour." },
  { id: "T10", part: "Base values", text: "Radius steps 0 / 4 / 8 / 16 / full, controls use 4", how: "V",
    note: "The library derives its steps from one base radius by fixed offsets; the source's steps do not follow from one base, so each part is set on its own." },
  { id: "T11", part: "Base values", text: "Control heights 32 / 40 / 48", how: "V", sure: false,
    note: "The scale says 32 and 40; the button measures 35.5 and 41. Its height seems to come from padding and line height, not from the scale." },
  { id: "T12", part: "Base values", text: "Control and body text 14px", how: "D" },
  { id: "T13", part: "Base values", text: "Motion steps 0.08 / 0.15 / 0.18s", how: "N", reason: "missing-variable",
    note: "Transition durations are fixed in the parts." },
  { id: "T14", part: "Base values", text: "Link colour #0063a6, under the pointer #004c80", how: "VM",
    note: "Link button only. The resting colour is a variable; the part has no colour rule for the pointer, so that one is set on the mark." },
  { id: "T15", part: "Base values", text: "Links in page content look the same", how: "N", reason: "missing-component" },
  { id: "T16", part: "Base values", text: "Disabled text #adb5bd instead of a fade", how: "VM",
    note: "Fade off by one shared variable; the colour is set per part on the mark when disabled." },
  { id: "T17", part: "Base values", text: "Four audience colours are available", how: "N", reason: "missing-variable", sure: false,
    note: "No use stated; the library has no such role." },

  // ---- focus -------------------------------------------------------------
  { id: "FO1", part: "Focus", text: "Focus ring in its own colour #94c154, not the brand colour", how: "V" },
  { id: "FO2", part: "Focus", text: "Ring width 2px", how: "V" },
  { id: "FO3", part: "Focus", text: "A 2px gap between the part and the ring", how: "N", reason: "missing-variable",
    note: "The ring is a shadow that starts at the edge." },
  { id: "FO4", part: "Focus", text: "The part's own line does not change colour with focus", how: "V", sure: false,
    note: "Inferred from 'ring with a gap'. Nine parts recolour their line on focus, each through its own variable." },

  // ---- button ------------------------------------------------------------
  { id: "B1", part: "Button", text: "Height 41", how: "V" },
  { id: "B2", part: "Button", text: "Horizontal padding 16", how: "D" },
  { id: "B3", part: "Button", text: "Radius 4", how: "V" },
  { id: "B4", part: "Button", text: "Label 14px, weight 500", how: "D" },
  { id: "B5", part: "Button", text: "Small: height 35.5, padding 14", how: "V" },
  { id: "B6", part: "Button", text: "Small: label 13px", how: "VM",
    note: "The button has one font size for all sizes; set on the size mark." },
  { id: "B7", part: "Button", text: "Large: height 48", how: "V",
    note: "Padding and label of the large size are not in the source." },
  { id: "B8", part: "Button", text: "Primary: fill #0063a6, white label", how: "V" },
  { id: "B9", part: "Button", text: "Primary under the pointer: #004c80", how: "V" },
  { id: "B10", part: "Button", text: "Primary pressed: #003d66", how: "VM",
    note: "The button has no pressed rule. Fill and hover fill are set on the mark while it is pressed." },
  { id: "B11", part: "Button", text: "Primary disabled: solid #4c91c0, no fade", how: "VM" },
  { id: "B12", part: "Button", text: "Secondary: white fill, line in the brand colour", how: "V", sure: false,
    note: "Mapped onto the outline variant. The line's width is not in the source." },
  { id: "B13", part: "Button", text: "Secondary: label in the brand colour", how: "C",
    note: "The outline variant sets no label colour at rest, so theme CSS may." },
  { id: "B14", part: "Button", text: "Secondary under the pointer: fill #e5eff6", how: "V" },
  { id: "B15", part: "Button", text: "Secondary pressed: fill #cce0ed", how: "VM" },
  { id: "B16", part: "Button", text: "Tertiary: no fill, label in the brand colour", how: "C",
    note: "Mapped onto the ghost variant." },
  { id: "B17", part: "Button", text: "Tertiary under the pointer: fill #e5eff6", how: "V" },
  { id: "B18", part: "Button", text: "Tertiary pressed: fill #cce0ed", how: "VM" },
  { id: "B19", part: "Button", text: "Can render as another element", how: "D" },
  { id: "B20", part: "Button", text: "No shadow", how: "V", sure: false, note: "Not stated; assumed." },

  // ---- checkbox ----------------------------------------------------------
  { id: "K1", part: "Checkbox", text: "Checked: fill #0063a6, white check", how: "V" },
  { id: "K2", part: "Checkbox", text: "Checked under the pointer: #004c80", how: "VM" },
  { id: "K3", part: "Checkbox", text: "Checked and disabled: solid #b2d0e4", how: "VM" },
  { id: "K4", part: "Checkbox", text: "Unchecked: line #ced4da", how: "V", sure: false },
  { id: "K5", part: "Checkbox", text: "Size, radius, line width, check size", how: "?", sure: false,
    note: "Measured values are not in the notes on the source." },

  // ---- feedback ----------------------------------------------------------
  { id: "M1", part: "Feedback", text: "Info, success and danger: soft surface, line, icon colour, text #333333", how: "VM",
    note: "On the notification only, through the toast library's own variables." },
  { id: "M2", part: "Feedback", text: "A fourth status 'update'", how: "N", reason: "missing-variant" },
  { id: "M3", part: "Feedback", text: "The same statuses on a message inside the page and on a tag", how: "N", reason: "missing-component",
    note: "No in-page message; the badge has no status variants." },

  // ---- parts without a counterpart --------------------------------------
  { id: "SP1", part: "Spinner", text: "Spinner", how: "N", reason: "missing-component" },
];

/** What the source does not describe. */
export const OPEN = [
  "Dark mode",
  "Text fields, dropdowns, tables, dialogs, tabs, cards, navigation: only button, checkbox and spinner exist",
  "Which part uses the serif family, the inverse surface, the strong line, the audience colours",
  "Checkbox measurements; padding and label of the large button; the secondary button's line width",
  "Whether the three button variants replace or extend ours (secondary, destructive and link have no counterpart)",
];
