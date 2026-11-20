/**
 * The checkable requirements behind the "pilot3" theme
 * (apps/shell/public/plugins/themes/pilot3.css), one entry per requirement.
 * Same shape as theme-spec-pilot.mjs; read by check-theme-spec.mjs.
 *
 * The source is a set of rules for applications: type, surfaces, a dark side
 * navigation with a bar at the active entry, footer. It says nothing about
 * buttons, fields, radii, focus, hover, dark mode or status colours. It
 * describes a light look only, so every check skips dark.
 *
 * how      D | V | VM | C | N, as in theme-spec-pilot.mjs
 * reason   missing-variable | missing-mark | component-rule | missing-variant |
 *          structure | missing-component
 * roles    as in theme-spec-pilot2.mjs.
 * page     true: the requirement is about the application frame or a page and
 *          is measured on the real plugin pages (PAGE_CHECKS), not in the
 *          gallery.
 */

const L = (value) => ({ light: value, dark: null });
const BRAND = "#006699";
const entry = "[data-slot=sidebar-content] [data-slot=sidebar-menu-button]";

export const SPEC = [
  // ---- type --------------------------------------------------------------
  { id: "Y1", part: "Type", text: "Headings in their own typeface, body in another", how: "N", reason: "missing-component", page: true,
    note: "No heading part. A theme rule on the bare elements would work for the family, but it also beats every class a page or plugin wrote on a heading (the contract guard finds those), so it is not in the theme. The heading token reaches only the few headings that ask for it by class." },
  { id: "Y2", part: "Type", text: "H1 42px/56px bold, brand colour, margin 40", how: "N", reason: "missing-component", page: true,
    note: "Sizes are written by each page with utilities." },
  { id: "Y3", part: "Type", text: "H2 32px/44px bold, brand colour, margin 40", how: "N", reason: "missing-component", page: true },
  { id: "Y4", part: "Type", text: "H3 22px/44px bold, brand colour, margin 30", how: "N", reason: "missing-component", page: true },
  { id: "Y5", part: "Type", text: "H4 19px/30px bold, black, margin 30", how: "N", reason: "missing-component", page: true },
  { id: "Y6", part: "Type", text: "H1 on the coloured title bar: white", how: "N", reason: "missing-component" },
  { id: "Y7", part: "Type", text: "Body typeface: the specified sans", how: "V",
    check: { section: "button", sel: "body", prop: "font-family", want: L("Roboto"), kind: "has" } },
  { id: "Y8", part: "Type", text: "Body text 17px/30px, black", how: "C",
    note: "No variable for the body size. Theme CSS on the body; it reaches only text without a size utility, and every part sets its own size.",
    check: { section: "button", sel: "body", prop: "font-size", want: L("17px"), kind: "px" } },
  { id: "Y9", part: "Type", text: "Links in body text: 17px/30px, grey #676767", how: "N", reason: "missing-component",
    note: "Pages write bare anchors; there is no link part." },
  { id: "Y10", part: "Breadcrumb", text: "Text 16px/19.2px, #676767", how: "V",
    check: { section: "breadcrumb", sel: "[data-slot=breadcrumb-page]", prop: "color", want: L("#676767"), kind: "color" } },
  { id: "Y11", part: "Breadcrumb", text: "Links #373737", how: "V",
    note: "The link has no resting colour of its own; it inherits the list's. List colour for the links, page colour for the text. The separators take the link colour with it.",
    check: { section: "breadcrumb", sel: "[data-slot=breadcrumb-link]", prop: "color", want: L("#373737"), kind: "color" } },
  { id: "Y12", part: "Breadcrumb", text: "Size 16px, line height 19.2px", how: "V",
    check: { section: "breadcrumb", sel: "[data-slot=breadcrumb-link]", prop: "line-height", want: L("19.2px"), kind: "px" } },

  // ---- box ---------------------------------------------------------------
  { id: "X1", part: "Box", text: "Heading 19px/28px, bold", how: "C",
    note: "Mapped onto the card title. Line height and weight are variables; the part sets no size, so theme CSS may. The guard is silent in the gallery; a caller that sizes a card title by class would lose (one such call site in the shell, read from the source).",
    check: { section: "card", sel: "[data-slot=card-title]", prop: "font-size", want: L("19px"), kind: "px" } },
  { id: "X2", part: "Box", text: "Heading in the heading face and the brand colour", how: "C",
    check: { section: "card", sel: "[data-slot=card-title]", prop: "color", want: L(BRAND), kind: "color" } },
  { id: "X3", part: "Box", text: "Text 15px/30px, black", how: "N", reason: "missing-variable",
    note: "The card's content area has no size variable. A theme rule on its slot works, but beats a caller's size class on the same element (contract guard: 44 differences in the gallery's fixture), so it is not in the theme.",
    check: { section: "card", sel: "[data-slot=card-content]", prop: "font-size", want: L("15px"), kind: "px" } },
  { id: "X4", part: "Box", text: "Links 15px/30px, brand colour, underlined", how: "N", reason: "missing-component" },
  { id: "X5", part: "Box", text: "White surface on the grey content area", how: "V",
    check: { section: "card", sel: "[data-slot=card]", prop: "background-color", want: L("#ffffff"), kind: "color" } },
  { id: "X6", part: "Box", text: "No line at the top and at the sides", how: "V",
    check: { section: "card", sel: "[data-slot=card]", prop: "border-top-width", want: L("0px"), kind: "px" } },
  { id: "X7", part: "Box", text: "A 3px border #e6e6e6 at the bottom", how: "N", reason: "missing-variable",
    note: "The card's line width is one variable for all four sides.",
    check: { section: "card", sel: "[data-slot=card]", prop: "border-bottom-width", want: L("3px"), kind: "px" } },
  { id: "X7b", part: "Box", text: "The same look, drawn as a shadow", how: "VM",
    note: "The shadow token, set on the card's mark. Not a border: it takes no space.",
    check: { section: "card", sel: "[data-slot=card]", prop: "box-shadow", want: L("0px 3px 0px 0px"), kind: "has" } },
  { id: "X8", part: "Box", text: "30px below every box", how: "N", reason: "structure",
    note: "Spacing between boxes belongs to the page." },

  // ---- surfaces ----------------------------------------------------------
  { id: "A1", part: "Surfaces", text: "Content area #f6f6f6", how: "V",
    check: { section: "button", sel: "body", prop: "background-color", want: L("#f6f6f6"), kind: "color" } },
  { id: "A2", part: "Surfaces", text: "Coloured title bar #487ca0 on top of the content", how: "N", reason: "missing-component" },
  { id: "A3", part: "Surfaces", text: "White strip with the breadcrumb below the title bar", how: "N", reason: "structure" },

  // ---- side navigation ---------------------------------------------------
  { id: "S1", part: "Side navigation", text: "Dark surface #373737 in the light theme", how: "V",
    check: { section: "sidebar", sel: "[data-slot=sidebar]", prop: "background-color", want: L("#373737"), kind: "color" } },
  { id: "S2", part: "Side navigation", text: "Title white", how: "C",
    note: "Title and entries share one colour token. The header sets no colour, so theme CSS may.",
    check: { section: "sidebar", sel: "[data-slot=sidebar-header] [data-slot=sidebar-menu-button]", prop: "color", want: L("#ffffff"), kind: "color" } },
  { id: "S3", part: "Side navigation", text: "Entries #c6c6c6", how: "V",
    check: { section: "sidebar", sel: `${entry}:not([data-active=true])`, prop: "color", want: L("#c6c6c6"), kind: "color" } },
  { id: "S4", part: "Side navigation", text: "Active entry: surface #1e1e1e", how: "V",
    check: { section: "sidebar", sel: `${entry}[data-active=true]`, prop: "background-color", want: L("#1e1e1e"), kind: "color" } },
  { id: "S5", part: "Side navigation", text: "Active entry: 8px bar in the brand colour at the left", how: "C",
    note: "The entry sets no border; theme CSS on the active entry's mark. The bar takes the place of the left padding (a variable on the same mark), so the content does not move.",
    check: { section: "sidebar", sel: `${entry}[data-active=true]`, prop: "border-left-width", want: L("8px"), kind: "px" } },
  { id: "S6", part: "Side navigation", text: "The same bar in the application's own navigation", how: "C", page: true,
    note: "See the page measurement. The application draws its own marker as well, a bare element 4px wide in the primary colour; it lies over the bar and has the same colour." },
  { id: "S7", part: "Side navigation", text: "No hover look stated", how: "D",
    note: "Hover and active share one token; here hover takes the active surface. A choice of the theme, not of the source." },

  // ---- application frame -------------------------------------------------
  { id: "H1", part: "App header", text: "Top navigation: white surface", how: "N", reason: "missing-mark", page: true,
    note: "The header reads the page background, which is grey here (A1). No slot, no variable." },
  { id: "H2", part: "App header", text: "Top navigation: entries in the brand colour, active #1e1e1e", how: "N", reason: "missing-component" },
  { id: "H3", part: "App header", text: "Sign in / sign out: brand fill, white text", how: "V", page: true,
    note: "It is a default button and follows the primary colour." },
  { id: "H4", part: "App header", text: "Search bar: white surface, text #595959", how: "N", reason: "missing-component" },
  { id: "H5", part: "App header", text: "Signet top right, margins 50/20, overlapping the header image by 20", how: "N", reason: "structure",
    note: "Out of scope: no logos." },
  { id: "F1", part: "Footer", text: "Page footer: brand-coloured surface", how: "V", page: true },
  { id: "F2", part: "Footer", text: "Page footer text: heading face 13px/62px, white", how: "N", reason: "missing-mark", page: true,
    note: "The footer's content comes from a plugin and writes its own classes; the footer has a fixed height and no slot." },
  { id: "F3", part: "Footer", text: "Navigation footer above it: white, heading 15px/22px bold, links 15px/25px, both #676767", how: "N", reason: "missing-component" },
];

/** Measured on the real plugin pages. `n: "all"` = every match must agree. */
export const PAGE_CHECKS = [
  { id: "Y1", sel: "main h2", prop: "font-family", want: "PT Sans", kind: "has" },
  { id: "Y3", sel: "main h2", prop: "font-size", want: "32px", kind: "px" },
  { id: "Y3", sel: "main h2", prop: "color", want: BRAND, kind: "color" },
  { id: "Y7", sel: "body", prop: "font-family", want: "Roboto", kind: "has" },
  { id: "Y8", sel: "body", prop: "font-size", want: "17px", kind: "px" },
  { id: "Y8", sel: "main td", prop: "font-size", want: "17px", kind: "px" },
  { id: "A1", sel: "body", prop: "background-color", want: "#f6f6f6", kind: "color" },
  { id: "S1", sel: "[data-slot=sidebar-inner]", prop: "background-color", want: "#373737", kind: "color" },
  { id: "S3", sel: "[data-slot=sidebar-menu-button]:not([data-active=true])", prop: "color", want: "#c6c6c6", kind: "color" },
  { id: "S4", sel: "[data-slot=sidebar-menu-button][data-active=true]", prop: "background-color", want: "#1e1e1e", kind: "color" },
  { id: "S6", sel: "[data-slot=sidebar-menu-button][data-active=true]", prop: "border-left-width", want: "8px", kind: "px" },
  { id: "S6", sel: "[data-slot=sidebar-menu-button][data-active=true]", prop: "border-left-color", want: BRAND, kind: "color" },
  { id: "H1", sel: "header", prop: "background-color", want: "#ffffff", kind: "color" },
  { id: "H3", sel: "header [data-ui-button][data-variant=default]", prop: "background-color", want: BRAND, kind: "color" },
  { id: "F1", sel: "footer", prop: "background-color", want: BRAND, kind: "color" },
  { id: "F2", sel: "footer span", prop: "color", want: "#ffffff", kind: "color" },
  { id: "F2", sel: "footer span", prop: "font-size", want: "13px", kind: "px" },
];

/** What the source does not describe. */
export const OPEN = [
  "Buttons, form fields, tables, dialogs, tabs, tags, notifications",
  "Radii, shadows, line colours, spacing other than the listed margins",
  "Hover, focus, pressed, disabled; the text colour of the active entry",
  "Dark mode, status colours",
  "It demands accessibility but gives no contrast or focus rule",
];
