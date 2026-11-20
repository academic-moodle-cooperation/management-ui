/**
 * The checkable requirements behind the "pilot2" theme
 * (apps/shell/public/plugins/themes/pilot2.css), one entry per requirement.
 * Same shape as theme-spec-pilot.mjs; read by check-theme-spec.mjs.
 *
 * The source is a token system with two tiers (base values, roles) and
 * measured values for a button and a checkbox. Its parts read roles only. It
 * describes a light look only, so every check skips dark.
 *
 * how      D | V | VM | C | N, as in theme-spec-pilot.mjs. "?" = the source
 *          defines a value but not where it applies; nothing to check.
 * reason   missing-variable | missing-mark | component-rule | missing-variant |
 *          structure | missing-component
 * roles    how the requirement would be met if the library had role variables
 *          (the draft of round two, Stop 1): "role" = a role variable on the
 *          root alone; "role+rule" = the same, but only once the part has a
 *          rule for that state (one of the nine state rules of the draft).
 *          Absent = no role covers it. Read by count-theme-names.mjs.
 * page     optional measurement on the real plugin pages (same fields as
 *          `check`, without a section).
 */

/** The source has no dark look. */
const L = (value) => ({ light: value, dark: null });
const BRAND = "#0063a6";

const button = (variant, size = "default") =>
  `[data-slot=button][data-variant=${variant}][data-size=${size}]:not(:disabled):not([aria-invalid])`;

export const SPEC = [
  // ---- base values -------------------------------------------------------
  { id: "T1", part: "Base values", text: "Typeface: the specified sans, everywhere", how: "V",
    check: { section: "button", sel: "body", prop: "font-family", want: L("Source Sans 3"), kind: "has" } },
  { id: "T2", part: "Base values", text: "A serif family next to the sans", how: "?",
    note: "The source defines the family but not where it is used. Not applied." },
  { id: "T3", part: "Base values", text: "Page surface #ffffff, text #333333", how: "V",
    check: { section: "button", sel: "body", prop: "color", want: L("#333333"), kind: "color" } },
  { id: "T4", part: "Base values", text: "Muted text #666666", how: "V",
    check: { section: "card", sel: "[data-slot=card-description]", prop: "color", want: L("#666666"), kind: "color" } },
  { id: "T5", part: "Base values", text: "Muted surface #f0f2f5", how: "V",
    check: { section: "tabs", sel: "[data-slot=tabs-list]", prop: "background-color", want: L("#f0f2f5"), kind: "color" } },
  { id: "T6", part: "Base values", text: "Subtle surface #f8f9fa as a second, lighter step", how: "N", reason: "missing-variable",
    note: "The library names surfaces by part (card, popover, side navigation, footer), not by tone. There is no second neutral step." },
  { id: "T7", part: "Base values", text: "Inverse surface #333333 with white text", how: "V", roles: "role",
    note: "The source does not say which part uses it. Mapped onto the tooltip, the only inverse surface here.",
    check: { section: "tooltip", open: "tooltip", sel: "[data-slot=tooltip-content]", prop: "background-color", want: L("#333333"), kind: "color" } },
  { id: "T7b", part: "Base values", text: "The tooltip's arrow has the same surface", how: "N", reason: "missing-variable",
    note: "The arrow is hard-wired to the primary colour.",
    check: { section: "tooltip", open: "tooltip", sel: "[data-slot=tooltip-content] svg", prop: "fill", want: L("#333333"), kind: "color" } },
  { id: "T8", part: "Base values", text: "Line of a control #ced4da, rule #dee2e6", how: "V",
    note: "The source calls them default and subtle; that default is the control line is a reading.",
    check: { section: "input", sel: "[data-slot=input]", prop: "border-top-color", want: L("#ced4da"), kind: "color" } },
  { id: "T9", part: "Base values", text: "Strong line #adb5bd", how: "N", reason: "missing-variable",
    note: "No use stated. Nothing in the library reads a third line colour." },
  { id: "T10", part: "Base values", text: "Radius steps 0 / 4 / 8 / 16 / full, controls use 4", how: "V",
    note: "The library derives its steps from one base radius by fixed offsets; the source's steps do not follow from one base. Only the controls' radius is set.",
    check: { section: "input", sel: "[data-slot=input]", prop: "border-top-left-radius", want: L("4px"), kind: "px" } },
  { id: "T11", part: "Base values", text: "Control heights 32 / 40 / 48", how: "V",
    note: "Applied to the fields. The source's own button does not follow this scale (see the button rows).",
    check: { section: "input", sel: "[data-slot=input]", prop: "height", want: L("40px"), kind: "px" } },
  { id: "T12", part: "Base values", text: "Control and body text 14px", how: "D",
    check: { section: "input", sel: "[data-slot=input]", prop: "font-size", want: L("14px"), kind: "px" } },
  { id: "T13", part: "Base values", text: "Motion steps 0.08 / 0.15 / 0.18s as a scale", how: "N", reason: "missing-variable",
    note: "Transition durations are fixed in the parts." },
  { id: "T14", part: "Base values", text: "Link colour #0063a6, under the pointer #004c80", how: "VM", roles: "role+rule",
    note: "Link button only. The resting colour follows the primary colour; the part has no colour rule for the pointer, so that one is set on the mark.",
    check: { section: "button", sel: "[data-ui-button][data-variant=link]", state: "hover", prop: "color", want: L("#004c80"), kind: "color" } },
  { id: "T15", part: "Base values", text: "Links in page content look the same", how: "N", reason: "missing-component" },
  { id: "T16", part: "Base values", text: "Disabled text #adb5bd instead of a fade", how: "C", roles: "role+rule",
    note: "Fade off by one shared variable. The colour is theme CSS, and only where a part sets no text colour: here the secondary and tertiary button.",
    check: { section: "button", sel: "[data-slot=button][data-variant=outline]:disabled", prop: "color", want: L("#adb5bd"), kind: "color" } },
  { id: "T17", part: "Base values", text: "Four audience colours are available", how: "N", reason: "missing-variable",
    note: "No use stated; the library has no such role." },

  // ---- focus -------------------------------------------------------------
  { id: "FO1", part: "Focus", text: "Focus ring in its own colour #94c154, not the brand colour", how: "V",
    check: { section: "button", sel: button("default"), state: "focus", prop: "box-shadow", want: L("148, 193, 84"), kind: "has" } },
  { id: "FO2", part: "Focus", text: "Ring width 2px", how: "V",
    check: { section: "button", sel: button("default"), state: "focus", prop: "box-shadow", want: L("0px 0px 0px 2px"), kind: "has" } },
  { id: "FO3", part: "Focus", text: "A 2px gap between the part and the ring", how: "N", reason: "missing-variable", roles: "role+rule",
    note: "The ring is a shadow that starts at the edge. With a gap its outer edge would sit 4px out.",
    check: { section: "button", sel: button("default"), state: "focus", prop: "box-shadow", want: L("0px 0px 0px 4px"), kind: "has" } },
  { id: "FO4", part: "Focus", text: "The part's own line does not change colour with focus", how: "V", roles: "role",
    note: "Inferred from 'ring with a gap'. Nine parts recolour their line on focus, each through its own variable.",
    check: { section: "input", sel: "[data-slot=input]", state: "focus", prop: "border-top-color", want: L("#ced4da"), kind: "color" } },

  // ---- button ------------------------------------------------------------
  { id: "B1", part: "Button", text: "Height 41", how: "V",
    note: "In the source the height follows from padding and line height, not from the height scale.",
    check: { section: "button", sel: button("default"), prop: "height", want: L("41px"), kind: "px" } },
  { id: "B2", part: "Button", text: "Horizontal padding 16", how: "D",
    check: { section: "button", sel: button("default"), prop: "padding-left", want: L("16px"), kind: "px" } },
  { id: "B3", part: "Button", text: "Radius 4", how: "V",
    check: { section: "button", sel: button("default"), prop: "border-top-left-radius", want: L("4px"), kind: "px" } },
  { id: "B4", part: "Button", text: "Label 14px / 21px, weight 500", how: "V",
    note: "Size and weight are already so; the line height is a variable.",
    check: { section: "button", sel: button("default"), prop: "line-height", want: L("21px"), kind: "px" } },
  { id: "B5", part: "Button", text: "Small: height 35.5", how: "V",
    check: { section: "button", sel: button("default", "sm"), prop: "height", want: L("35.5px"), kind: "px" } },
  { id: "B6", part: "Button", text: "Small: horizontal padding 14", how: "V",
    check: { section: "button", sel: button("default", "sm"), prop: "padding-left", want: L("14px"), kind: "px" } },
  { id: "B7", part: "Button", text: "Small: label 13px / 19.5px", how: "VM",
    note: "The button has one font-size variable for all sizes; set on the size mark.",
    check: { section: "button", sel: button("default", "sm"), prop: "font-size", want: L("13px"), kind: "px" } },
  { id: "B8", part: "Button", text: "Large: height 48", how: "V",
    check: { section: "button", sel: button("default", "lg"), prop: "height", want: L("48px"), kind: "px" } },
  { id: "B9", part: "Button", text: "Large: horizontal padding 20", how: "V",
    check: { section: "button", sel: button("default", "lg"), prop: "padding-left", want: L("20px"), kind: "px" } },
  { id: "B10", part: "Button", text: "Large: label 16px / 24px", how: "VM",
    check: { section: "button", sel: button("default", "lg"), prop: "font-size", want: L("16px"), kind: "px" } },
  { id: "B11", part: "Button", text: "Primary: fill #0063a6, white label", how: "V", roles: "role",
    check: { section: "button", sel: button("default"), prop: "background-color", want: L(BRAND), kind: "color" } },
  { id: "B12", part: "Button", text: "Primary under the pointer: #004c80", how: "V", roles: "role",
    check: { section: "button", sel: button("default"), state: "hover", prop: "background-color", want: L("#004c80"), kind: "color" } },
  { id: "B13", part: "Button", text: "Primary pressed: #003d66", how: "VM", roles: "role+rule",
    note: "The button has no pressed rule. Fill and hover fill are set on the mark while it is pressed.",
    check: { section: "button", sel: button("default"), state: "active", prop: "background-color", want: L("#003d66"), kind: "color" } },
  { id: "B14", part: "Button", text: "Primary disabled: solid #4c91c0", how: "VM", roles: "role+rule",
    check: { section: "button", sel: "[data-slot=button][data-variant=default]:disabled", prop: "background-color", want: L("#4c91c0"), kind: "color" } },
  { id: "B15", part: "Button", text: "Disabled: no fade", how: "V",
    check: { section: "button", sel: "[data-slot=button][data-variant=default]:disabled", prop: "opacity", want: L("1"), kind: "text" } },
  { id: "B16", part: "Button", text: "Secondary: white fill", how: "V", roles: "role",
    note: "Mapped onto the outline variant.",
    check: { section: "button", sel: button("outline"), prop: "background-color", want: L("#ffffff"), kind: "color" } },
  { id: "B17", part: "Button", text: "Secondary: a 1px line in the brand colour", how: "V", roles: "role",
    note: "In the source the line is an inset shadow, here the variant's border. Same look.",
    check: { section: "button", sel: button("outline"), prop: "border-top-color", want: L(BRAND), kind: "color" } },
  { id: "B18", part: "Button", text: "Secondary: label in the brand colour", how: "C", roles: "role",
    note: "The outline variant sets no label colour at rest, so theme CSS may.",
    check: { section: "button", sel: button("outline"), prop: "color", want: L(BRAND), kind: "color" } },
  { id: "B19", part: "Button", text: "Secondary under the pointer: fill #e5eff6, label stays", how: "V", roles: "role",
    note: "Through the library's hover-surface token, which menu entries share.",
    check: { section: "button", sel: button("outline"), state: "hover", prop: "background-color", want: L("#e5eff6"), kind: "color" } },
  { id: "B20", part: "Button", text: "Secondary pressed: fill #cce0ed", how: "VM", roles: "role+rule",
    check: { section: "button", sel: button("outline"), state: "active", prop: "background-color", want: L("#cce0ed"), kind: "color" } },
  { id: "B21", part: "Button", text: "Tertiary: no fill, label in the brand colour", how: "C", roles: "role",
    note: "Mapped onto the ghost variant.",
    check: { section: "button", sel: button("ghost", "icon"), prop: "color", want: L(BRAND), kind: "color" } },
  { id: "B22", part: "Button", text: "Tertiary under the pointer: fill #e5eff6", how: "V", roles: "role",
    check: { section: "button", sel: button("ghost", "icon"), state: "hover", prop: "background-color", want: L("#e5eff6"), kind: "color" } },
  { id: "B23", part: "Button", text: "Tertiary pressed: fill #cce0ed", how: "VM", roles: "role+rule",
    note: "Only while the pointer is over it: the ghost variant has no resting fill to set, so a press from the keyboard shows nothing.",
    check: { section: "button", sel: button("ghost", "icon"), state: "active", prop: "background-color", want: L("#cce0ed"), kind: "color" } },
  { id: "B24", part: "Button", text: "Can render as another element; as a link it has no underline", how: "D" },
  { id: "B25", part: "Button", text: "Transition 0.15s", how: "D",
    note: "Read from the source text (the utility's default duration); the measurement switches transitions off." },

  // ---- checkbox ----------------------------------------------------------
  { id: "K1", part: "Checkbox", text: "20 x 20", how: "V",
    check: { section: "checkbox", sel: "#gallery-check-off", prop: "width", want: L("20px"), kind: "px" } },
  { id: "K2", part: "Checkbox", text: "Radius 4", how: "D",
    check: { section: "checkbox", sel: "#gallery-check-off", prop: "border-top-left-radius", want: L("4px"), kind: "px" } },
  { id: "K3", part: "Checkbox", text: "Line 2px", how: "V",
    check: { section: "checkbox", sel: "#gallery-check-off", prop: "border-top-width", want: L("2px"), kind: "px" } },
  { id: "K4", part: "Checkbox", text: "Unchecked: line #ced4da", how: "V",
    check: { section: "checkbox", sel: "#gallery-check-off", prop: "border-top-color", want: L("#ced4da"), kind: "color" } },
  { id: "K5", part: "Checkbox", text: "Unchecked: white fill", how: "V",
    check: { section: "checkbox", sel: "#gallery-check-off", prop: "background-color", want: L("#ffffff"), kind: "color" } },
  { id: "K6", part: "Checkbox", text: "Checked: line and fill #0063a6", how: "V", roles: "role",
    check: { section: "checkbox", sel: "#gallery-check-on", prop: "background-color", want: L(BRAND), kind: "color" } },
  { id: "K7", part: "Checkbox", text: "Checked: white check, 16px", how: "V",
    check: { section: "checkbox", sel: "#gallery-check-on svg", prop: "width", want: L("16px"), kind: "px" } },
  { id: "K8", part: "Checkbox", text: "Checked under the pointer: #004c80", how: "VM", roles: "role+rule",
    note: "The checkbox has no rule for the pointer.",
    check: { section: "checkbox", sel: "#gallery-check-on", state: "hover", prop: "background-color", want: L("#004c80"), kind: "color" } },
  { id: "K9", part: "Checkbox", text: "Checked and disabled: line and fill #b2d0e4, no fade", how: "VM", roles: "role+rule",
    check: { section: "checkbox", sel: "#gallery-check-disabled", prop: "background-color", want: L("#b2d0e4"), kind: "color" } },
  { id: "K10", part: "Checkbox", text: "Unchecked and disabled: line #dee2e6, fill #f0f2f5", how: "VM", roles: "role+rule",
    note: "No such box in the gallery; the measurement disables the unchecked one.",
    check: { section: "checkbox", sel: "#gallery-check-off", script: "document.querySelector('#gallery-check-off').disabled = true",
      prop: "background-color", want: L("#f0f2f5"), kind: "color" } },
  { id: "K11", part: "Checkbox", text: "Indeterminate: line and fill as checked", how: "VM", roles: "role+rule",
    note: "The checkbox has no rule for that state; fill and line through the resting variables on the mark, the mark's colour as theme CSS. No such box in the gallery, not measured. The icon stays a check; a dash would need the part to change." },
  { id: "K12", part: "Checkbox", text: "Label 16px, #333333, gap 8", how: "VM",
    note: "There is no mark for 'the label of a checkbox'; the rule follows the order of the elements.",
    check: { section: "checkbox", sel: "label[for=gallery-check-on]", prop: "font-size", want: L("16px"), kind: "px" } },

  // ---- feedback ----------------------------------------------------------
  { id: "M1", part: "Feedback", text: "Info, success and danger: soft surface, line, text #333333", how: "VM",
    note: "On the notification only, through the toast library's own variables. Only the success toast is in the gallery.",
    check: { section: "sonner", open: "sonner", sel: ".sonner-toast", prop: "background-color", want: L("#eef2e5"), kind: "color" } },
  { id: "M2", part: "Feedback", text: "A fourth status 'update'", how: "N", reason: "missing-variant" },
  { id: "M3", part: "Feedback", text: "The same statuses on a message inside the page and on a tag", how: "N", reason: "missing-component",
    note: "No in-page message; the badge has no status variants." },

  // ---- parts without a counterpart --------------------------------------
  { id: "SP1", part: "Spinner", text: "Spinner", how: "N", reason: "missing-component" },
];

/** Measured on the real plugin pages as well. */
export const PAGE_CHECKS = [
  { id: "T1", sel: "body", prop: "font-family", want: "Source Sans 3", kind: "has" },
  { id: "B1", sel: "main [data-slot=button][data-variant=default][data-size=default]", prop: "height", want: "41px", kind: "px" },
  { id: "B3", sel: "main [data-ui-button][data-variant=default]", prop: "border-top-left-radius", want: "4px", kind: "px" },
  { id: "B11", sel: "main [data-ui-button][data-variant=default]", prop: "background-color", want: BRAND, kind: "color" },
  { id: "B12", sel: "main [data-ui-button][data-variant=default]", state: "hover", prop: "background-color", want: "#004c80", kind: "color" },
  { id: "B13", sel: "main [data-ui-button][data-variant=default]", state: "active", prop: "background-color", want: "#003d66", kind: "color" },
  { id: "B17", sel: "main [data-ui-button][data-variant=outline]", prop: "border-top-color", want: BRAND, kind: "color" },
  { id: "B18", sel: "main [data-ui-button][data-variant=outline]:not(:disabled)", prop: "color", want: BRAND, kind: "color" },
  { id: "B20", sel: "main [data-ui-button][data-variant=outline]", state: "active", prop: "background-color", want: "#cce0ed", kind: "color" },
  { id: "B21", sel: "main [data-ui-button][data-variant=ghost]", prop: "color", want: BRAND, kind: "color" },
  { id: "B5", sel: "main [data-ui-button][data-size=sm]", prop: "height", want: "35.5px", kind: "px" },
  { id: "B7", sel: "main [data-ui-button][data-size=sm]", prop: "font-size", want: "13px", kind: "px" },
  { id: "K1", sel: "main [data-slot=checkbox]", prop: "width", want: "20px", kind: "px" },
  { id: "K3", sel: "main [data-slot=checkbox]", prop: "border-top-width", want: "2px", kind: "px" },
  { id: "K4", sel: "main [data-slot=checkbox][data-state=unchecked]", prop: "border-top-color", want: "#ced4da", kind: "color" },
  { id: "T8", sel: "main [data-slot=input]", prop: "border-top-color", want: "#ced4da", kind: "color" },
  { id: "T11", sel: "main [data-slot=input]", prop: "height", want: "40px", kind: "px" },
  { id: "FO1", sel: "main [data-slot=input]", state: "focus", prop: "box-shadow", want: "148, 193, 84", kind: "has" },
];

/** What the source does not describe. */
export const OPEN = [
  "Dark mode",
  "Text fields, dropdowns, tables, dialogs, tabs, cards, navigation: only button, checkbox and spinner exist",
  "Which part uses the serif family, the inverse surface, the strong line, the audience colours",
  "Disabled look of the secondary and tertiary button (only a disabled text colour is given)",
  "Icon buttons, the gap between icon and label, icon sizes inside a button",
  "Our variants secondary, destructive and link have no counterpart and stay untouched",
];
