/**
 * Theme Registry
 *
 * This file contains the list of available themes that can be installed
 * from the marketplace. Each theme is a CSS file that can be dynamically
 * loaded and applied to the application.
 */

export interface ThemeDefinition {
  id: string;
  name: string;
  description: string;
  previewUrl: string;
  category: string;
  author: string;
}

/**
 * Static registry of available themes
 * 
 * Theme URLs are relative to the repository root and will be served by the application.
 * In a production environment, these could be fetched from a remote API or CDN.
 */
export const AVAILABLE_THEMES: ThemeDefinition[] = [
  // The Default Theme is baked into the shell (apps/shell/src/themes/default.css)
  // and is always applied as the baseline. Installing another theme only overrides
  // the subset of CSS custom properties that it customizes.

  /*
   * Curated showcase themes (apps/shell/public/plugins/themes/*.css). Each is
   * a complete, distinct *design language* — color, typography, radius, shadows
   * and spacing — not just a recolor, with both light (:root) and dark (.dark)
   * variants using only the standard semantic tokens. Served as raw CSS so the
   * marketplace and `app.theme` both apply them, in dev and the production
   * build. (No web fonts: system stacks only, to stay GDPR-safe and offline.)
   */
  {
    id: "oxford-navy",
    name: "Oxford Navy",
    description: "Editorial & formal — deep navy and gold, serif headings, sharp corners, crisp shadows.",
    previewUrl: "/management-ui/plugins/themes/oxford-navy.css",
    category: "Showcase",
    author: "Management UI",
  },
  {
    id: "modern-slate",
    name: "Modern Slate & Teal",
    description: "Contemporary SaaS — cool slate and teal, geometric sans, soft radius, diffused shadows, airy spacing.",
    previewUrl: "/management-ui/plugins/themes/modern-slate.css",
    category: "Showcase",
    author: "Management UI",
  },
  {
    id: "heritage-burgundy",
    name: "Heritage Burgundy",
    description: "Refined & luxe — burgundy and cream, elegant serif headings, restrained radius, minimal shadows, generous spacing.",
    previewUrl: "/management-ui/plugins/themes/heritage-burgundy.css",
    category: "Showcase",
    author: "Management UI",
  },
  {
    id: "forest-sage",
    name: "Forest Sage",
    description: "Organic & calm — forest green and stone, rounded humanist sans, very round corners, soft low shadows.",
    previewUrl: "/management-ui/plugins/themes/forest-sage.css",
    category: "Showcase",
    author: "Management UI",
  },
  {
    id: "aurora",
    name: "Aurora",
    description: "Modern & vivid — indigo, large rounded corners, soft shadows, a rounded geometric sans and relaxed spacing.",
    previewUrl: "/management-ui/plugins/themes/aurora.css",
    category: "Showcase",
    author: "Management UI",
  },
  {
    id: "press",
    name: "Press",
    description: "Editorial & high-contrast — monochrome ink on white, zero radius, no shadows, bold borders, a grotesque sans.",
    previewUrl: "/management-ui/plugins/themes/press.css",
    category: "Showcase",
    author: "Management UI",
  },
  {
    id: "example-theme",
    name: "Example",
    description: "Minimal reference theme — a single-token recolor (Harvard Crimson primary) showing the smallest possible theme",
    previewUrl: "/management-ui/plugins/themes/example.css",
    category: "Example",
    author: "Management UI",
  },
];
