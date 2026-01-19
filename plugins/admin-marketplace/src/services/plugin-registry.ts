/**
 * Available Plugin Registry
 *
 * This file contains the list of available plugins that can be installed
 * from the marketplace. In a production environment, this should be fetched
 * from a remote API endpoint.
 */

export interface AvailablePlugin {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  url: string;
  category: string;
}

/**
 * Static registry of available plugins
 * 
 * TODO: Replace with API call in production:
 * const response = await fetch('/api/marketplace/plugins');
 * const plugins = await response.json();
 */
export const AVAILABLE_PLUGINS: AvailablePlugin[] = [
  {
    id: "example-plugin-1",
    name: "Example Analytics Plugin",
    description: "Adds analytics dashboard and reporting features",
    version: "1.0.0",
    author: "Example Team",
    url: "https://example.com/plugins/analytics.js",
    category: "Analytics",
  },
  {
    id: "example-plugin-2",
    name: "Custom Theme Plugin",
    description: "Provides additional theme customization options",
    version: "1.2.0",
    author: "Theme Team",
    url: "https://example.com/plugins/theme.js",
    category: "Theming",
  },
  {
    id: "example-plugin-3",
    name: "Export Tools Plugin",
    description: "Advanced export functionality for episodes and series",
    version: "2.0.0",
    author: "Tools Team",
    url: "https://example.com/plugins/export-tools.js",
    category: "Utilities",
  },
];
