/**
 * The checkable requirements behind the "pilot3" theme, one entry per
 * requirement. Same shape as theme-spec-pilot.mjs.
 *
 * The source is a set of rules for applications: type, surfaces, a dark side
 * navigation with a bar at the active entry, footer. It says nothing about
 * buttons, fields, radii, focus, hover, dark mode or status colours.
 *
 * STATE: requirement list only. No theme exists yet and nothing is measured.
 * `how` is the verdict EXPECTED from reading the component source; the checks
 * are added together with the theme.
 *
 * how      D | V | VM | C | N, as in theme-spec-pilot.mjs
 * reason   missing-variable | missing-mark | component-rule | missing-variant |
 *          structure | missing-component
 * sure     false when the requirement itself is uncertain. In the export of
 *          the source some labels are shifted against their values, so the
 *          pairing of the link and breadcrumb colours needs a look at the page.
 */

export const SPEC = [
  // ---- type --------------------------------------------------------------
  { id: "Y1", part: "Type", text: "Headings in their own typeface (bold), body in another", how: "C",
    note: "No heading part. The page title is a bare h2 that sets no family, so theme CSS on the bare element may; that selector has no fixed mark." },
  { id: "Y2", part: "Type", text: "H1 42px/56px, brand colour, margin 40", how: "N", reason: "missing-component",
    note: "Sizes are written by each page with utilities. Colour may be reachable by theme CSS where the heading sets none." },
  { id: "Y3", part: "Type", text: "H2 32px/44px, brand colour, margin 40", how: "N", reason: "missing-component" },
  { id: "Y4", part: "Type", text: "H3 22px/44px, brand colour, margin 30", how: "N", reason: "missing-component" },
  { id: "Y5", part: "Type", text: "H4 19px/30px, black, margin 30", how: "N", reason: "missing-component" },
  { id: "Y6", part: "Type", text: "H1 on the coloured title bar: white", how: "N", reason: "missing-component" },
  { id: "Y7", part: "Type", text: "Body text 17px/30px, black", how: "C",
    note: "No variable for the body size. Theme CSS on the body reaches only text without a size utility; every part sets its own size." },
  { id: "Y8", part: "Type", text: "Links in body text: 17px/30px, grey #676767", how: "N", reason: "missing-component", sure: false,
    note: "Pairing of label and value uncertain: the picture in the source shows grey underlined links in a box, the text gives the brand colour there and grey here." },
  { id: "Y9", part: "Breadcrumb", text: "Text 16px/19.2px, #676767", how: "V", sure: false,
    note: "Which of the two colours is the current page is not clear from the export." },
  { id: "Y10", part: "Breadcrumb", text: "Links #373737", how: "V", sure: false,
    note: "The link has no resting colour of its own; it inherits the list's. List colour for the links, page colour for the text." },

  // ---- box ---------------------------------------------------------------
  { id: "X1", part: "Box", text: "Heading 19px/28px, bold heading face, brand colour", how: "C",
    note: "Mapped onto the card title. Line height and weight are variables; size, family and colour are not set by the part, so theme CSS may." },
  { id: "X2", part: "Box", text: "Text 15px/30px, black", how: "C" },
  { id: "X3", part: "Box", text: "Links 15px/30px, brand colour, underlined", how: "N", reason: "missing-component", sure: false },
  { id: "X4", part: "Box", text: "White surface", how: "V" },
  { id: "X5", part: "Box", text: "A 3px line #e6e6e6 at the bottom only, no other line", how: "N", reason: "missing-variable",
    note: "The card's line width is one variable for all four sides. The look can be had as a shadow (shadow token set on the card's mark); that is not a border and takes no space." },
  { id: "X6", part: "Box", text: "30px below every box", how: "N", reason: "structure",
    note: "Spacing between boxes belongs to the page." },

  // ---- surfaces ----------------------------------------------------------
  { id: "A1", part: "Surfaces", text: "Content area #f6f6f6", how: "V" },
  { id: "A2", part: "Surfaces", text: "Coloured title bar #487ca0 on top of the content", how: "N", reason: "missing-component" },
  { id: "A3", part: "Surfaces", text: "White strip with the breadcrumb below the title bar", how: "N", reason: "structure" },

  // ---- navigation --------------------------------------------------------
  { id: "S1", part: "Side navigation", text: "Dark surface #373737 in the light theme", how: "V" },
  { id: "S2", part: "Side navigation", text: "Title white", how: "VM", sure: false,
    note: "Title and entries share one colour token. Which element is the title here (logo block, group label) is a reading." },
  { id: "S3", part: "Side navigation", text: "Entries #c6c6c6", how: "V" },
  { id: "S4", part: "Side navigation", text: "Active entry: surface #1e1e1e", how: "V" },
  { id: "S5", part: "Side navigation", text: "Active entry: 8px bar in the brand colour at the left (library part)", how: "C",
    note: "The entry sets no border; theme CSS on the active entry's mark. Whether the entry's padding absorbs the 8px is to be measured." },
  { id: "S6", part: "Side navigation", text: "The same bar in the application's own navigation", how: "N", reason: "missing-mark",
    note: "The application draws its own marker, a bare element 4px wide in the primary colour. Its colour follows the theme, its width does not." },
  { id: "S7", part: "Side navigation", text: "No hover look stated", how: "D", sure: false,
    note: "Hover and active share one token today; a theme must choose." },
  { id: "H1", part: "App header", text: "Top navigation: white surface", how: "N", reason: "missing-mark",
    note: "The header reads the page background, which is grey here (A1). No slot, no variable." },
  { id: "H2", part: "App header", text: "Top navigation: entries in the brand colour, active #1e1e1e", how: "N", reason: "missing-component" },
  { id: "H3", part: "App header", text: "Sign in / sign out: brand fill, white text", how: "V", sure: false,
    note: "If it is a default button. To be looked up on the plugin pages." },
  { id: "H4", part: "App header", text: "Search bar: white surface, text #595959", how: "N", reason: "missing-component" },
  { id: "H5", part: "App header", text: "Signet top right, margins 50/20, overlapping the header image by 20", how: "N", reason: "structure",
    note: "Out of scope: no logos." },

  // ---- footer ------------------------------------------------------------
  { id: "F1", part: "Footer", text: "Page footer: brand-coloured surface", how: "V" },
  { id: "F2", part: "Footer", text: "Page footer links: heading face 13px/62px, white", how: "N", reason: "missing-mark",
    note: "The footer's content comes from a plugin and writes its own classes; the footer has a fixed height and no slot." },
  { id: "F3", part: "Footer", text: "Navigation footer above it: white, heading 15px/22px bold, links 15px/25px, both #676767", how: "N", reason: "missing-component" },
];

/** What the source does not describe. */
export const OPEN = [
  "Buttons, form fields, tables, dialogs, tabs, tags, notifications",
  "Radii, shadows, line colours, spacing other than the listed margins",
  "Hover, focus, pressed, disabled",
  "Dark mode, status colours",
  "The pairing of label and value for link and breadcrumb colours (shifted in the export)",
  "It demands accessibility but gives no contrast or focus rule",
];
