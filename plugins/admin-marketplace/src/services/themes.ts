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
  {
    id: "example-theme",
    name: "Example",
    description: "Neutral reference theme shipped with @workspace/plugin-example",
    previewUrl: "/management-ui/plugins/example/example.css",
    category: "Example",
    author: "Management UI",
  },
  {
    id: "tuwien-theme",
    name: "TU Wien",
    description: "Official Vienna University of Technology theme with blue corporate colors and Roboto typography",
    previewUrl: "/management-ui/local-plugins/tuwien/themes/tuwien.css",
    category: "University",
    author: "TU Wien",
  },
  {
    id: "univie-theme",
    name: "University of Vienna",
    description: "Official University of Vienna theme with blue branding and status colors",
    previewUrl: "/management-ui/local-plugins/univie/themes/univie.css",
    category: "University",
    author: "University of Vienna",
  },
  /* Example themes (.local-plugins) – show what’s possible beyond colors */
  {
    id: "compact-theme",
    name: "Compact",
    description: "Dense, information-dense UI: small radius, tight spacing, minimal shadows",
    previewUrl: "/management-ui/local-plugins/compact/themes/compact.css",
    category: "Example",
    author: "Management UI",
  },
  {
    id: "rounded-theme",
    name: "Rounded",
    description: "Soft and friendly: large radius, soft shadows, relaxed spacing, blue accent",
    previewUrl: "/management-ui/local-plugins/rounded/themes/rounded.css",
    category: "Example",
    author: "Management UI",
  },
  {
    id: "minimal-theme",
    name: "Minimal",
    description: "Sharp and editorial: zero radius, no shadows, strong borders, high contrast",
    previewUrl: "/management-ui/local-plugins/minimal/themes/minimal.css",
    category: "Example",
    author: "Management UI",
  },
  {
    id: "warm-theme",
    name: "Warm",
    description: "Cozy cream and amber palette with soft shadows and medium radius",
    previewUrl: "/management-ui/local-plugins/warm/themes/warm.css",
    category: "Example",
    author: "Management UI",
  },
];
