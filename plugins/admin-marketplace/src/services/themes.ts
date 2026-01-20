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
  {
    id: "default-theme",
    name: "Default Theme",
    description: "Clean and minimal default theme with balanced colors and modern design",
    previewUrl: "/management-ui/plugins/themes/default.css",
    category: "Base",
    author: "Management UI Team",
  },
  {
    id: "example-university-theme",
    name: "Example University",
    description: "Red-themed university branding with custom sidebar and corporate colors",
    previewUrl: "/management-ui/plugins/themes/example-university.css",
    category: "University",
    author: "Example University",
  },
  {
    id: "tuwien-theme",
    name: "TU Wien",
    description: "Official Vienna University of Technology theme with blue corporate colors and Roboto typography",
    previewUrl: "/management-ui/plugins/themes/tuwien.css",
    category: "University",
    author: "TU Wien",
  },
  {
    id: "univie-theme",
    name: "University of Vienna",
    description: "Official University of Vienna theme with blue branding and status colors",
    previewUrl: "/management-ui/plugins/themes/univie.css",
    category: "University",
    author: "University of Vienna",
  },
];
