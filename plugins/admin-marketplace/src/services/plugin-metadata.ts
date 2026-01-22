/**
 * Plugin Metadata Registry
 *
 * Provides human-readable metadata for plugins including descriptions,
 * extension points, and categorization for the marketplace UI.
 *
 * MIGRATION PATH (for future external plugins):
 * ─────────────────────────────────────────────
 * This metadata is currently defined statically. When plugins move to external
 * repositories, this data should be fetched from the plugin registry API:
 *
 * ```
 * const response = await fetch('/api/plugins/registry');
 * const registry = await response.json();
 * // Each plugin in registry includes its metadata
 * ```
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface PluginMetadata {
  /** Human-readable name */
  name: string;
  /** Description of what the plugin does */
  description: string;
  /** Category for grouping in UI */
  category: PluginCategory;
  /** Extension points this plugin registers to */
  extensionPoints: string[];
  /** Icon name (from lucide-react) */
  icon?: string;
  /** Author/organization */
  author?: string;
  /** Whether this is a core/required plugin */
  isCore?: boolean;
  /** Tags for filtering/search */
  tags?: string[];
}

export type PluginCategory =
  | "core"
  | "branding"
  | "navigation"
  | "content"
  | "customization"
  | "integration"
  | "admin"
  | "other";

// ─────────────────────────────────────────────────────────────────────────────
// Metadata Registry
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Static metadata for all known plugins
 *
 * Keys are plugin names in "namespace:type" format
 */
export const PLUGIN_METADATA: Record<string, PluginMetadata> = {
  // ─────────────────────────────────────────────────────────────────────────
  // Core Plugins
  // ─────────────────────────────────────────────────────────────────────────
  "core:config": {
    name: "Core Configuration",
    description: "Base application configuration and default settings",
    category: "core",
    extensionPoints: ["app:config"],
    isCore: true,
    author: "Management UI Team",
  },
  "core:landing-page": {
    name: "Core Landing Page",
    description: "Default landing page with quick actions and statistics",
    category: "core",
    extensionPoints: ["component-override:landing-page"],
    isCore: true,
    author: "Management UI Team",
  },
  "core:footer": {
    name: "Core Footer",
    description: "Default application footer",
    category: "core",
    extensionPoints: ["component-override:appshell:footer"],
    isCore: true,
    author: "Management UI Team",
  },
  "core:sidebar": {
    name: "Core Sidebar",
    description: "Default sidebar navigation structure",
    category: "core",
    extensionPoints: ["sidebar:nav-items"],
    isCore: true,
    author: "Management UI Team",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Episodes App
  // ─────────────────────────────────────────────────────────────────────────
  "episodes:app": {
    name: "Episodes App",
    description: "Episode management application with listing, details, and editing",
    category: "content",
    extensionPoints: ["apps:definitions"],
    icon: "Film",
    author: "Management UI Team",
  },
  "episodes:navigation": {
    name: "Episodes Navigation",
    description: "Sidebar navigation item for Episodes",
    category: "navigation",
    extensionPoints: ["sidebar:nav-items"],
    author: "Management UI Team",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Series App
  // ─────────────────────────────────────────────────────────────────────────
  "series:app": {
    name: "Series App",
    description: "Series management application with listing and organization",
    category: "content",
    extensionPoints: ["apps:definitions"],
    icon: "Layers",
    author: "Management UI Team",
  },
  "series:navigation": {
    name: "Series Navigation",
    description: "Sidebar navigation item for Series",
    category: "navigation",
    extensionPoints: ["sidebar:nav-items"],
    author: "Management UI Team",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Upload App
  // ─────────────────────────────────────────────────────────────────────────
  "upload:app": {
    name: "Upload App",
    description: "Media upload application for creating new episodes",
    category: "content",
    extensionPoints: ["apps:definitions"],
    icon: "Upload",
    author: "Management UI Team",
  },
  "upload:navigation": {
    name: "Upload Navigation",
    description: "Sidebar navigation item for Upload",
    category: "navigation",
    extensionPoints: ["sidebar:nav-items"],
    author: "Management UI Team",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Admin Marketplace
  // ─────────────────────────────────────────────────────────────────────────
  "admin:app": {
    name: "Admin Marketplace",
    description: "Plugin and theme marketplace for administrators",
    category: "admin",
    extensionPoints: ["apps:definitions", "sidebar:nav-items"],
    icon: "ShoppingBag",
    author: "Management UI Team",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // University of Vienna (univie)
  // ─────────────────────────────────────────────────────────────────────────
  "univie:config": {
    name: "Univie Configuration",
    description: "University of Vienna specific configuration and settings",
    category: "customization",
    extensionPoints: ["app:config"],
    author: "University of Vienna",
    tags: ["university", "austria"],
  },
  "univie:footer": {
    name: "Univie Footer",
    description: "University of Vienna branded footer with custom links",
    category: "branding",
    extensionPoints: ["component-override:appshell:footer"],
    author: "University of Vienna",
    tags: ["university", "austria", "branding"],
  },
  "univie:sidebar": {
    name: "Univie Sidebar",
    description: "University of Vienna sidebar customizations",
    category: "navigation",
    extensionPoints: ["sidebar:nav-items"],
    author: "University of Vienna",
  },
  "univie:landing-page": {
    name: "Univie Landing Page",
    description: "University of Vienna customized landing page",
    category: "branding",
    extensionPoints: ["component-override:landing-page"],
    author: "University of Vienna",
  },
  "univie:app": {
    name: "Univie Event Calendar",
    description: "University of Vienna event calendar integration",
    category: "integration",
    extensionPoints: ["apps:definitions"],
    icon: "Calendar",
    author: "University of Vienna",
  },
  "univie:navigation": {
    name: "Univie Navigation",
    description: "University of Vienna additional navigation items",
    category: "navigation",
    extensionPoints: ["sidebar:nav-items"],
    author: "University of Vienna",
  },
  "univie:empty-state": {
    name: "Univie Empty States",
    description: "University of Vienna customized empty state components",
    category: "customization",
    extensionPoints: ["component-override:empty-state"],
    author: "University of Vienna",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // TU Wien (tuwien)
  // ─────────────────────────────────────────────────────────────────────────
  "tuwien:config": {
    name: "TU Wien Configuration",
    description: "TU Wien specific configuration and settings",
    category: "customization",
    extensionPoints: ["app:config"],
    author: "TU Wien",
    tags: ["university", "austria"],
  },
  "tuwien:footer": {
    name: "TU Wien Footer",
    description: "TU Wien branded footer with custom links and styling",
    category: "branding",
    extensionPoints: ["component-override:appshell:footer"],
    author: "TU Wien",
    tags: ["university", "austria", "branding"],
  },
  "tuwien:header": {
    name: "TU Wien Header",
    description: "TU Wien branded header with logo and navigation",
    category: "branding",
    extensionPoints: ["component-override:appshell:header"],
    author: "TU Wien",
    tags: ["university", "austria", "branding"],
  },
  "tuwien:sidebar": {
    name: "TU Wien Sidebar",
    description: "TU Wien sidebar customizations",
    category: "navigation",
    extensionPoints: ["sidebar:nav-items"],
    author: "TU Wien",
  },
  "tuwien:landing-page": {
    name: "TU Wien Landing Page",
    description: "TU Wien customized landing page with specific quick actions",
    category: "branding",
    extensionPoints: ["component-override:landing-page"],
    author: "TU Wien",
  },
  "tuwien:table-sidebar": {
    name: "TU Wien Table Sidebar",
    description: "TU Wien customized table sidebar panel",
    category: "customization",
    extensionPoints: ["component-override:table-sidebar"],
    author: "TU Wien",
  },
  "tuwien:upload-acl-editor": {
    name: "TU Wien ACL Editor",
    description: "TU Wien customized ACL editor for upload workflow",
    category: "customization",
    extensionPoints: ["component-override:upload-acl-editor"],
    author: "TU Wien",
  },
  "tuwien:episodes-actions": {
    name: "TU Wien Episodes Actions",
    description: "TU Wien custom actions for episodes",
    category: "customization",
    extensionPoints: ["episodes:custom-actions"],
    author: "TU Wien",
  },
  "tuwien:series-actions": {
    name: "TU Wien Series Actions",
    description: "TU Wien custom actions for series",
    category: "customization",
    extensionPoints: ["series:custom-actions"],
    author: "TU Wien",
  },
  "tuwien:app": {
    name: "TU Wien Custom App",
    description: "TU Wien specific application features",
    category: "integration",
    extensionPoints: ["apps:definitions"],
    author: "TU Wien",
  },
  "tuwien:navigation": {
    name: "TU Wien Navigation",
    description: "TU Wien additional navigation items",
    category: "navigation",
    extensionPoints: ["sidebar:nav-items"],
    author: "TU Wien",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Example University
  // ─────────────────────────────────────────────────────────────────────────
  "example-university:header": {
    name: "Example University Header",
    description: "Example header implementation for reference",
    category: "branding",
    extensionPoints: ["component-override:appshell:header"],
    author: "Example University",
    tags: ["example", "reference"],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get metadata for a plugin by name
 */
export function getPluginMetadata(pluginName: string): PluginMetadata | null {
  return PLUGIN_METADATA[pluginName] || null;
}

/**
 * Get default metadata for unknown plugins
 */
export function getDefaultMetadata(pluginName: string): PluginMetadata {
  const [namespace, type] = pluginName.split(":");
  return {
    name: pluginName,
    description: `${type || "Plugin"} from ${namespace || "unknown"} namespace`,
    category: "other",
    extensionPoints: [],
  };
}

/**
 * Get metadata with fallback to default
 */
export function getPluginMetadataOrDefault(pluginName: string): PluginMetadata {
  return getPluginMetadata(pluginName) || getDefaultMetadata(pluginName);
}

/**
 * Get all plugins that use a specific extension point
 */
export function getPluginsByExtensionPoint(extensionPoint: string): string[] {
  const plugins: string[] = [];

  for (const [pluginName, metadata] of Object.entries(PLUGIN_METADATA)) {
    if (metadata.extensionPoints.includes(extensionPoint)) {
      plugins.push(pluginName);
    }
  }

  return plugins;
}

/**
 * Get all extension points used by a namespace
 */
export function getExtensionPointsByNamespace(namespace: string): string[] {
  const extensionPoints = new Set<string>();

  for (const [pluginName, metadata] of Object.entries(PLUGIN_METADATA)) {
    if (pluginName.startsWith(`${namespace}:`)) {
      metadata.extensionPoints.forEach((ep) => extensionPoints.add(ep));
    }
  }

  return Array.from(extensionPoints);
}

/**
 * Get all unique namespaces
 */
export function getAllNamespaces(): string[] {
  const namespaces = new Set<string>();

  for (const pluginName of Object.keys(PLUGIN_METADATA)) {
    const [namespace] = pluginName.split(":");
    if (namespace) {
      namespaces.add(namespace);
    }
  }

  return Array.from(namespaces);
}

/**
 * Get category display information
 */
export const CATEGORY_INFO: Record<PluginCategory, { label: string; description: string }> = {
  core: {
    label: "Core",
    description: "Essential plugins required for basic functionality",
  },
  branding: {
    label: "Branding",
    description: "Visual customization and organization branding",
  },
  navigation: {
    label: "Navigation",
    description: "Sidebar and navigation structure modifications",
  },
  content: {
    label: "Content",
    description: "Content management applications and features",
  },
  customization: {
    label: "Customization",
    description: "UI customizations and workflow modifications",
  },
  integration: {
    label: "Integration",
    description: "Third-party integrations and external services",
  },
  admin: {
    label: "Administration",
    description: "Administrative tools and settings",
  },
  other: {
    label: "Other",
    description: "Miscellaneous plugins",
  },
};
