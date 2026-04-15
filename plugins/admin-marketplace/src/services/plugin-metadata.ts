/**
 * Plugin Metadata Registry
 *
 * Provides human-readable metadata for plugins including descriptions,
 * extension points, and categorization for the marketplace UI.
 *
 * Supports both:
 * - Bundled plugins (static metadata defined here)
 * - Community plugins (dynamic metadata from registry)
 */

import { type RegistryPlugin } from "./registry-fetcher";

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

/**
 * Extended metadata for community plugins
 */
export interface CommunityPluginMetadata extends PluginMetadata {
  /** Unique plugin identifier */
  id: string;
  /** Plugin version */
  version: string;
  /** URL to the plugin bundle */
  url: string;
  /** Author details */
  authorInfo?: {
    name: string;
    email?: string;
    url?: string;
  };
  /** Repository URL */
  repositoryUrl?: string;
  /** Homepage URL */
  homepageUrl?: string;
  /** License */
  license?: string;
  /** Version constraints for workspace packages */
  workspaceDependencies?: Record<string, string>;
  /** Whether this plugin is verified by maintainers */
  verified?: boolean;
  /** Download count (optional, for display) */
  downloads?: number;
  /** Rating (optional, for display) */
  rating?: number;
  /** Last updated timestamp */
  lastUpdated?: string;
  /** Whether this is a community (remote) plugin */
  isCommunity: true;
}

export type PluginCategory =
  | "core"
  | "branding"
  | "navigation"
  | "content"
  | "customization"
  | "integration"
  | "admin"
  | "feature"
  | "theme"
  | "utility"
  | "experimental"
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
  // Core Extension Point Slots
  // ─────────────────────────────────────────────────────────────────────────
  "core:layout": {
    name: "Core Layout Slots",
    description: "Extension point slots for header, footer, branding, and app config",
    category: "core",
    extensionPoints: ["app:header-logo", "app:header-actions", "app:footer", "app:branding", "app:config"],
    isCore: true,
    author: "Management UI Team",
  },
  "core:sidebar": {
    name: "Core Sidebar Slots",
    description: "Extension point slots for sidebar navigation, user items, admin items, and help",
    category: "core",
    extensionPoints: ["sidebar:nav-items", "sidebar:user-items", "sidebar:admin-items", "sidebar:help-items"],
    isCore: true,
    author: "Management UI Team",
  },
  "core:series": {
    name: "Core Series Slots",
    description: "Extension point slots for series toolbar actions and ACL editor",
    category: "core",
    extensionPoints: ["series:table:toolbar-end-actions", "series:create-series:acl-editor"],
    isCore: true,
    author: "Management UI Team",
  },
  "core:upload": {
    name: "Core Upload Slots",
    description: "Extension point slots for upload ACL editor, metadata, and workflows",
    category: "core",
    extensionPoints: ["upload:acl-editor", "upload:metadata-editor", "upload:workflow-selector"],
    isCore: true,
    author: "Management UI Team",
  },
  "core:table-sidebar": {
    name: "Core Table Sidebar Slots",
    description: "Extension point slots for table sidebar tabs",
    category: "core",
    extensionPoints: ["table-sidebar:tabs", "table-sidebar:episodes:tabs", "table-sidebar:series:tabs"],
    isCore: true,
    author: "Management UI Team",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Core Default Modules
  // ─────────────────────────────────────────────────────────────────────────
  "core:navigation": {
    name: "Core Navigation",
    description: "Default sidebar navigation and landing page",
    category: "core",
    extensionPoints: ["sidebar:nav-items", "component-override:landing-page"],
    isCore: true,
    author: "Management UI Team",
  },
  "core:header": {
    name: "Core Header",
    description: "Default application header with language switcher and login",
    category: "core",
    extensionPoints: ["component-override:appshell:header"],
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
  "series:create-series": {
    name: "Series Create Action",
    description: "Adds a create-series button and dialog to the series toolbar",
    category: "customization",
    extensionPoints: ["series:table:toolbar-end-actions", "series:create-series:acl-editor"],
    author: "Management UI Team",
  },
  "series-create-acl-editor-plugin:series-create-acl-editor": {
    name: "Series Create ACL Editor",
    description: "Adds an optional ACL editor UI to the create-series dialog",
    category: "customization",
    extensionPoints: ["series:create-series:acl-editor"],
    author: "Management UI Team",
    tags: ["series", "acl", "permissions"],
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
  // Admin Plugins
  // ─────────────────────────────────────────────────────────────────────────
  "admin:marketplace": {
    name: "Admin Marketplace",
    description: "Plugin and theme marketplace for administrators",
    category: "admin",
    extensionPoints: ["apps:definitions", "sidebar:nav-items"],
    icon: "ShoppingBag",
    author: "Management UI Team",
  },
  "admin:dashboard": {
    name: "Admin Dashboard",
    description: "Project information and community statistics",
    category: "admin",
    extensionPoints: ["apps:definitions", "sidebar:nav-items"],
    icon: "LayoutDashboard",
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

  // ─────────────────────────────────────────────────────────────────────────
  // System / Internal Plugins (registered by PluginInitializer)
  // ─────────────────────────────────────────────────────────────────────────
  "core:app-registry": {
    name: "App Registry",
    description: "Internal registry for application route definitions",
    category: "core",
    extensionPoints: [],
    isCore: true,
    author: "Management UI Team",
  },
  "core:object-registry": {
    name: "Object Registry",
    description: "Internal registry for shared objects and extension points",
    category: "core",
    extensionPoints: [],
    isCore: true,
    author: "Management UI Team",
  },
  "core:renderer": {
    name: "Component Renderer",
    description: "Internal renderer for dynamic component slots",
    category: "core",
    extensionPoints: [],
    isCore: true,
    author: "Management UI Team",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // .local-plugins (community/dev plugins loaded dynamically)
  // ─────────────────────────────────────────────────────────────────────────
  "core:cyan-cat-rain": {
    name: "Cyan Cat Rain",
    description: "Demo plugin — animated falling cyan cats",
    category: "experimental",
    extensionPoints: ["apps:definitions", "sidebar:nav-items"],
    author: "Community",
    tags: ["demo", "fun"],
  },
  "core:nyan-cat-rain": {
    name: "Nyan Cat Rain",
    description: "Demo plugin — animated falling nyan cats",
    category: "experimental",
    extensionPoints: ["apps:definitions", "sidebar:nav-items"],
    author: "Community",
    tags: ["demo", "fun"],
  },
  "poll-plugin:app": {
    name: "Audience Poll",
    description: "Interactive audience polling during live events",
    category: "feature",
    extensionPoints: ["apps:definitions", "sidebar:nav-items"],
    author: "Community",
    tags: ["interactive", "live"],
  },
  "video-playlists-plugin:app": {
    name: "Video Playlists",
    description: "Create and manage video playlist collections",
    category: "feature",
    extensionPoints: ["apps:definitions", "sidebar:nav-items"],
    author: "Community",
    tags: ["playlists", "video"],
  },
  "video-playlists-acl-editor-plugin:video-playlists-acl-editor": {
    name: "Playlists ACL Editor",
    description: "Access control editor for video playlists",
    category: "feature",
    extensionPoints: [],
    author: "Community",
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
 * Get default metadata for unknown plugins.
 * Generates a human-readable display name from the namespace:type format.
 */
export function getDefaultMetadata(pluginName: string): PluginMetadata {
  const [namespace, type] = pluginName.split(":");
  const humanize = (s: string) =>
    s
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  const displayName = type ? humanize(type) : humanize(pluginName);
  const displayNamespace = namespace ? humanize(namespace) : "Unknown";

  return {
    name: displayName,
    description: `Provided by ${displayNamespace}`,
    category: "other",
    extensionPoints: [],
    author: displayNamespace,
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
  feature: {
    label: "Feature",
    description: "Additional features and functionality",
  },
  theme: {
    label: "Theme",
    description: "Visual themes and styling",
  },
  utility: {
    label: "Utility",
    description: "Helper tools and utilities",
  },
  experimental: {
    label: "Experimental",
    description: "Experimental or beta features",
  },
  other: {
    label: "Other",
    description: "Miscellaneous plugins",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Community Plugin Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Convert a RegistryPlugin to CommunityPluginMetadata
 */
export function registryPluginToMetadata(plugin: RegistryPlugin): CommunityPluginMetadata {
  const metadata: CommunityPluginMetadata = {
    id: plugin.id,
    name: plugin.name,
    description: plugin.description,
    version: plugin.version,
    url: plugin.url,
    category: plugin.category as PluginCategory,
    extensionPoints: [], // Community plugins don't expose extension points in registry
    author: plugin.author.name,
    isCommunity: true,
  };

  // Add optional icon if defined
  if (plugin.icon) {
    metadata.icon = plugin.icon;
  }

  // Add optional properties only if they are defined
  if (plugin.author) {
    metadata.authorInfo = plugin.author;
  }
  if (plugin.repositoryUrl) {
    metadata.repositoryUrl = plugin.repositoryUrl;
  }
  if (plugin.homepageUrl) {
    metadata.homepageUrl = plugin.homepageUrl;
  }
  if (plugin.license) {
    metadata.license = plugin.license;
  }
  if (plugin.tags) {
    metadata.tags = plugin.tags;
  }
  if (plugin.workspaceDependencies) {
    // Convert PluginVersionConstraints to Record<string, string>
    metadata.workspaceDependencies = plugin.workspaceDependencies as Record<string, string>;
  }
  if (plugin.verified !== undefined) {
    metadata.verified = plugin.verified;
  }
  if (plugin.downloads !== undefined) {
    metadata.downloads = plugin.downloads;
  }
  if (plugin.rating !== undefined) {
    metadata.rating = plugin.rating;
  }
  if (plugin.lastUpdated) {
    metadata.lastUpdated = plugin.lastUpdated;
  }

  return metadata;
}

/**
 * Check if metadata is for a community plugin
 */
export function isCommunityPlugin(
  metadata: PluginMetadata | CommunityPluginMetadata,
): metadata is CommunityPluginMetadata {
  return "isCommunity" in metadata && metadata.isCommunity === true;
}

/**
 * Get display name for a category
 */
export function getCategoryLabel(category: PluginCategory): string {
  return CATEGORY_INFO[category]?.label || category;
}

/**
 * Get all available categories
 */
export function getAllCategories(): PluginCategory[] {
  return Object.keys(CATEGORY_INFO) as PluginCategory[];
}
