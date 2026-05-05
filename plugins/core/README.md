# Core Plugin

The core plugin defines the **extension point system** and provides **default implementations** for the Management UI. It serves as the foundation that university plugins extend and customize.

## Purpose

The core plugin has three primary responsibilities:

1. **Define Extension Points** - Declare what can be customized (header, footer, sidebar, etc.)
2. **Provide Default Implementations** - Ship working defaults that universities can override
3. **Export App Plugins** - Provide navigation and default app actions (Episodes, Series, Upload, Series Create)

## Directory Structure

```
plugins/core/
├── extension-points/               # Defines WHAT can be customized
│   ├── index.ts                   # Extension point exports
│   ├── app-layout-extension-points.ts    # Header, footer, branding
│   ├── sidebar-extension-points.ts       # Navigation items
│   ├── series-extension-points.ts        # Series table toolbar actions
│   ├── table-sidebar-extension-points.ts # Table detail panels
│   └── upload-extension-points.ts        # Upload customization
├── modules/                        # Default implementations
│   ├── index.ts                   # Implementation exports
│   ├── defaults.ts                # Core navigation (Home)
│   ├── header/                    # Default header
│   │   ├── index.ts
│   │   ├── core-header-implementation.tsx
│   │   └── components/
│   │       ├── default-header.tsx
│   │       ├── LangSwitcher.tsx
│   │       └── LoginButton.tsx
│   └── footer/                    # Default footer
│       ├── index.ts
│       ├── core-footer-implementation.tsx
│       ├── components/
│       │   └── default-footer.tsx
│       └── locales/
│           └── core-footer/
│               ├── de.json
│               └── en.json
├── apps/                           # App-related plugins
│   ├── index.ts
│   ├── episodes-nav-implementation.ts
│   ├── series-create-implementation.ts
│   ├── series-nav-implementation.ts
│   ├── components/
│   │   └── CreateSeriesToolbarAction.tsx
│   └── upload-nav-implementation.ts
├── index.ts                        # Main exports
└── package.json
```

## Extension Point Catalog

Extension points define **what** can be customized. University plugins implement these extension points to customize behavior.

### App Layout Extension Points

| Extension Point      | Description               | Priority     |
| -------------------- | ------------------------- | ------------ |
| `app:header-logo`    | University logo in header | Lower = wins |
| `app:header-actions` | Action buttons in header  | Lower = wins |
| `app:footer`         | Footer content and links  | Lower = wins |
| `app:branding`       | Theme colors and styles   | Lower = wins |
| `app:config`         | Application-wide settings | Merged       |

#### `app:header-logo`

University logo displayed in the application header.

```typescript
interface HeaderLogoSchema {
  src: string; // Logo image URL
  alt: string; // Alt text for accessibility
  width?: number; // Logo width in pixels
  height?: number; // Logo height in pixels
  href?: string; // Click destination URL
}

// Example implementation
manager.registerObject("app:header-logo", "my-university-logo", {
  src: "/assets/my-university/logo.svg",
  alt: "My University",
  width: 120,
  height: 40,
  href: "https://my-university.edu",
});
```

#### `app:header-actions`

Action buttons and links in the header area.

```typescript
interface HeaderActionSchema {
  title: string; // Action title/label
  icon: string | React.ComponentType; // Icon identifier or component
  action: () => void; // Click handler
  order: number; // Display order (lower = left)
  permissions?: string[]; // Required permissions
}

// Example implementation
manager.registerObject("app:header-actions", "help-action", {
  title: "Help",
  icon: "help-circle",
  action: () => window.open("/help", "_blank"),
  order: 100,
  permissions: [],
});
```

#### `app:footer`

Footer content including links, disclaimers, and contact info.

```typescript
interface FooterSchema {
  content?: React.ReactNode; // Footer content
  links?: Array<{
    title: string;
    url: string;
    external?: boolean;
  }>;
  disclaimer?: string; // Legal disclaimer text
  order?: number; // Display order
}

// Example implementation
manager.registerObject("app:footer", "my-university-footer", {
  links: [
    { title: "Privacy Policy", url: "/privacy", external: false },
    { title: "Terms of Service", url: "/terms", external: false },
    { title: "Contact", url: "mailto:support@university.edu", external: true },
  ],
  disclaimer: "© 2025 My University. All rights reserved.",
});
```

#### `app:branding`

University-specific theme and branding settings.

```typescript
interface BrandingSchema {
  primaryColor: string; // Primary brand color (HSL or hex)
  secondaryColor: string; // Secondary brand color
  logoUrl: string; // Logo URL
  faviconUrl: string; // Favicon URL
  fontFamily?: string; // Custom font family
  customCss?: string; // Additional CSS
}

// Example implementation
manager.registerObject("app:branding", "my-university-branding", {
  primaryColor: "220 90% 45%",
  secondaryColor: "220 80% 35%",
  logoUrl: "/assets/logo.svg",
  faviconUrl: "/assets/favicon.svg",
});
```

#### `app:config`

Application-wide configuration settings. Multiple configs are **merged** (not replaced).

```typescript
interface AppConfigSchema {
  organizationName?: string; // University/organization name
  organizationUrl?: string; // University website URL
  supportEmail?: string; // Support contact email
  privacyPolicyUrl?: string; // Privacy policy URL
  termsOfServiceUrl?: string; // Terms of service URL
  features?: Record<string, boolean>; // Feature flag overrides
}

// Example implementation
manager.registerObject("app:config", "my-university-config", {
  organizationName: "My University",
  organizationUrl: "https://my-university.edu",
  supportEmail: "support@my-university.edu",
  features: {
    enableTranscripts: true,
    enableComments: false,
  },
});
```

### Sidebar Extension Points

| Extension Point       | Description                    | Priority     |
| --------------------- | ------------------------------ | ------------ |
| `sidebar:nav-items`   | Main navigation items          | Order-based  |
| `sidebar:user-items`  | User actions (profile, logout) | Order-based  |
| `sidebar:admin-items` | Administrative functions       | Order-based  |
| `sidebar:help-items`  | Help and support links         | Order-based  |
| `sidebar:header-logo` | Custom sidebar header logo     | Lower = wins |
| `sidebar:footer`      | Custom sidebar footer          | Lower = wins |

#### `sidebar:nav-items`

Main navigation items in the sidebar. Items are sorted by `order`.

```typescript
interface NavItemSchema {
  title: string; // Display name
  path: string; // Route path
  icon: string | React.ComponentType; // Icon identifier or component
  order: number; // Display order (lower = higher up)
  permissions?: string[]; // Required permissions
  featureFlags?: string[]; // Required feature flags
  category?: string; // Grouping category
}

// Example implementation
manager.registerObject("sidebar:nav-items", "custom-app", {
  title: "Custom App",
  path: "/custom",
  icon: "layout-dashboard",
  order: 50,
  permissions: ["custom.view"],
  featureFlags: [],
  category: "apps",
});
```

**Standard Navigation Order:**

| Order | Item        | Category |
| ----- | ----------- | -------- |
| 10    | Home        | core     |
| 20    | Series      | content  |
| 30    | Episodes    | content  |
| 40    | Upload      | content  |
| 50+   | Custom Apps | apps     |

#### `sidebar:user-items`

User-specific actions and settings.

```typescript
interface UserItemSchema {
  title: string; // Display name
  action: () => void; // Click handler
  icon: string | React.ComponentType; // Icon identifier
  order: number; // Display order
  permissions?: string[]; // Required permissions
}

// Example implementation
manager.registerObject("sidebar:user-items", "profile", {
  title: "My Profile",
  action: () => navigate("/profile"),
  icon: "user",
  order: 10,
  permissions: [],
});
```

#### `sidebar:admin-items`

Administrative functions for authorized users.

```typescript
interface AdminItemSchema {
  title: string; // Display name
  path: string; // Route path
  icon: string | React.ComponentType; // Icon identifier
  order: number; // Display order
  permissions: string[]; // Required admin permissions
}

// Example implementation
manager.registerObject("sidebar:admin-items", "user-management", {
  title: "User Management",
  path: "/admin/users",
  icon: "users",
  order: 10,
  permissions: ["admin.users"],
});
```

#### `sidebar:help-items`

Help, support, and documentation links.

```typescript
interface HelpItemSchema {
  title: string; // Display name
  path: string; // Route path or external URL
  icon: string | React.ComponentType; // Icon identifier
  order: number; // Display order
  external?: boolean; // Opens in new tab
}

// Example implementation
manager.registerObject("sidebar:help-items", "documentation", {
  title: "Documentation",
  path: "https://docs.university.edu",
  icon: "book-open",
  order: 10,
  external: true,
});
```

#### `sidebar:header-logo`

Custom sidebar header logo component.

```typescript
// Type: React.ComponentType<{ collapsed: boolean }>

// Example implementation
const MySidebarLogo: React.FC<{ collapsed: boolean }> = ({ collapsed }) => {
  return collapsed
    ? <img src="/icon.svg" alt="Logo" className="w-8 h-8" />
    : <img src="/logo-full.svg" alt="My University" className="h-8" />;
};

manager.registerComponent('sidebar:header-logo', MySidebarLogo, { priority: 10 });
```

### Table Sidebar Extension Points

| Extension Point               | Description                | Priority    |
| ----------------------------- | -------------------------- | ----------- |
| `table-sidebar:tabs`          | Generic table sidebar tabs | Order-based |
| `table-sidebar:episodes:tabs` | Episode-specific tabs      | Order-based |
| `table-sidebar:series:tabs`   | Series-specific tabs       | Order-based |

#### `table-sidebar:tabs`

Additional tabs for table detail sidebars.

```typescript
interface TableSidebarTabSchema {
  id: string; // Unique tab identifier
  label: string; // Tab display name
  order: number; // Tab order (lower = left)
  component: React.ComponentType; // Tab content component
  context?: string[]; // Which tables this applies to
  permissions?: string[]; // Required permissions
  featureFlags?: string[]; // Required feature flags
}

// Example implementation
manager.registerObject("table-sidebar:tabs", "access-control", {
  id: "access",
  label: "Access Control",
  order: 20,
  component: AclEditorComponent,
  context: ["episodes", "series"],
  permissions: ["acl.edit"],
  featureFlags: [],
});
```

### Series Extension Points

| Extension Point                       | Description                                     | Priority    |
| ------------------------------------- | ----------------------------------------------- | ----------- |
| `series:table:toolbar-end-actions`    | Actions rendered to the right of reload button  | Order-based |
| `series:create-series:acl-editor`     | Optional ACL editor in create-series dialog     | Component order |

#### `series:table:toolbar-end-actions`

Series table toolbar end actions (right side, after reload button).

```typescript
interface SeriesToolbarEndActionSchema {
  id: string; // Unique action identifier
  order: number; // Display order (lower = earlier)
  component: React.ComponentType<{ refetch?: () => void }>; // Toolbar action component
}

// Example implementation
manager.registerObject("series:table:toolbar-end-actions", "custom-series-action", {
  id: "custom-series-action",
  order: 200,
  component: CustomSeriesToolbarAction,
});
```

#### `series:create-series:acl-editor`

Optional ACL editor component inside the create-series dialog.

```typescript
// Component props
interface CreateSeriesAclEditorProps {
  aclData: AclData | null;
  onAclDataChange: (aclData: AclData, managedAclId: string) => void;
  selectedSeries: SelectedElement | null;
  disabled: boolean;
  refetch?: () => void;
}

// Example implementation
manager.registerComponent("series:create-series:acl-editor", CustomCreateSeriesAclEditor, {
  key: "my-create-series-acl-editor",
  order: 50,
});
```

### Upload Extension Points

| Extension Point                | Description                 | Priority     |
| ------------------------------ | --------------------------- | ------------ |
| `upload:acl-editor`            | ACL editor for uploads      | Lower = wins |
| `upload:metadata-editor`       | Additional metadata fields  | Lower = wins |
| `upload:workflow-selector`     | Custom workflow selection   | Lower = wins |
| `upload:pre-upload-validation` | Pre-upload validation hooks | All run      |

#### `upload:acl-editor`

Access Control List editor for configuring upload permissions.

```typescript
interface AclEditorProps {
  aclData: AclData;                          // Current ACL configuration
  onAclChange: (data: AclData) => void;      // Callback when ACL changes
  selectedSeries: SelectedElement | null;    // Currently selected series
  disabled?: boolean;                        // Whether editor is disabled
  refetch?: () => void;                      // Refetch function
}

// Example implementation
const CustomAclEditor: React.FC<AclEditorProps> = ({ aclData, onAclChange, disabled }) => {
  return (
    <div className="space-y-4">
      {/* Custom ACL UI */}
    </div>
  );
};

manager.registerComponent('upload:acl-editor', CustomAclEditor, { priority: 10 });
```

#### `upload:metadata-editor`

Additional metadata fields for uploads.

```typescript
interface MetadataEditorProps {
  metadata: Record<string, unknown>; // Current metadata
  onMetadataChange: (data: Record<string, unknown>) => void; // Callback
  selectedSeries: SelectedElement | null; // Selected series
  files: UploadFileBlob[]; // Files being uploaded
}

// Example implementation
manager.registerComponent("upload:metadata-editor", CustomMetadataEditor, { priority: 10 });
```

## Default Implementations

The core plugin provides default implementations that work out of the box:

### Default Navigation

```typescript
// Registered by coreDefaultImplementations
manager.registerObject("sidebar:nav-items", "home", {
  title: "Home",
  path: "/",
  icon: Home,
  order: 10,
  permissions: [],
  featureFlags: [],
  category: "core",
});
```

### Default Header

The core header includes:

- Language switcher (`LangSwitcher` component)
- Login button (`LoginButton` component)
- Basic branding

### Default Footer

The core footer includes:

- Copyright notice
- Basic links
- Internationalization support

## Overriding Defaults

To override a default implementation:

1. **Register with lower priority** (components) or **same key** (objects)
2. **Higher priority numbers are lower priority** - priority 10 wins over priority 100

```typescript
// Override header logo (component - use priority)
manager.registerComponent("app:header-logo", MyUniversityLogo, {
  priority: 10, // Lower number = higher priority
});

// Override navigation item (object - use same key)
manager.registerObject("sidebar:nav-items", "home", {
  title: "Dashboard", // Override title
  path: "/",
  icon: LayoutDashboard,
  order: 10,
  permissions: [],
  featureFlags: [],
  category: "core",
});
```

## App Plugins

The core plugin exports app-related implementations:

### Episodes Navigation

```typescript
import { episodesNavImplementation } from "@workspace/plugins";

// Registers: sidebar:nav-items/episodes
// Path: /episodes
// Order: 30
```

### Series Navigation

```typescript
import { seriesNavImplementation } from "@workspace/plugins";

// Registers: sidebar:nav-items/series
// Path: /series
// Order: 20
```

### Upload Navigation

```typescript
import { uploadNavImplementation } from "@workspace/plugins";

// Registers: sidebar:nav-items/upload
// Path: /upload
// Order: 40
```

### Series Create Action

```typescript
import { seriesCreateImplementation } from "@workspace/plugins";

// Registers: series:table:toolbar-end-actions/create-series
// Button position: right of reload in series toolbar
// Plugin name: series:create-series
```

Default ACL behavior in `series:create-series` (without optional ACL plugin):

- uses managed ACL policy `private` when available
- adds current user role with `read` + `write` entries
- ACL fields are not shown in the dialog UI
- language and license are selected from fixed option lists

### Disable Series Create While Keeping Series Navigation

The old `{ series: { types: [...] } }` object form of `pluginNamespace`
is gone (Phase 2b, Commit 5). To turn off a single core feature while
keeping the rest of a namespace, use the per-slice runtime switch:

```jsonc
// config.json
{
  "app": {
    "enabledPlugins": ["core", "episodes", "series", "upload", "admin", "config"]
  },
  "plugins": {
    "series": {
      "seriesTable": {
        "createSeries": { "enabled": false }
      }
    }
  }
}
```

The core `series` plugin reads
`config.plugins.series.seriesTable.createSeries.enabled` (via its own
Zod schema + `definePluginConfig`) and hides the create button when it
is `false`. To deactivate the whole series plugin instead, set
`config.plugins.series.enabled = false`. For the full model see
[`docs/architecture/CONFIGURATION.md`](../../docs/architecture/CONFIGURATION.md).

## Reusable Components

The core plugin exports reusable components for university implementations:

```typescript
import { LangSwitcher, LoginButton } from '@workspace/plugins';

// Use in custom headers
const MyHeader = () => (
  <header>
    <MyLogo />
    <LangSwitcher />
    <LoginButton />
  </header>
);
```

## Usage in University Plugins

### Basic Implementation Pattern

```typescript
import { createPlugin, type PluginManager } from "@workspace/plugin-system";

export const myUniversityPlugin = createPlugin({
  namespace: "my-university",
  type: "university-extension",
  version: "1.0.0",

  initialize(manager: PluginManager) {
    // Override header logo
    manager.registerComponent("app:header-logo", MyLogo, { priority: 10 });

    // Add custom navigation
    manager.registerObject("sidebar:nav-items", "custom-feature", {
      title: "Custom Feature",
      path: "/custom",
      icon: Star,
      order: 60,
    });

    // Override footer
    manager.registerComponent("app:footer", MyFooter, { priority: 10 });
  },
});
```

### Configuration Override Pattern

```typescript
export const myUniversityConfig = createPlugin({
  namespace: "my-university",
  type: "config",
  version: "1.0.0",

  initialize(manager: PluginManager) {
    manager.registerObject("app:config", "my-university-config", {
      organizationName: "My University",
      organizationUrl: "https://my-university.edu",
      features: {
        enableTranscripts: true,
      },
    });
  },
});
```

## Dependencies

```json
{
  "@workspace/plugin-system": "workspace:*",
  "@workspace/ui": "workspace:*",
  "react": "^18.0.0 || ^19.0.0"
}
```

## Related Documentation

- [Plugin System Overview](/plugins/README.md) - Complete plugin architecture
- [Adding Plugins Guide](/docs/workflows/ADDING_PLUGINS.md) - Step-by-step plugin creation
- [Example University](/plugins/example-university/README.md) - Reference implementation
- [Example University](/plugins/example-university/README.md) - Reference implementation; org plugins (univie, tuwien) use `.local-plugins/` or separate repos

## Extension Point Discovery

To discover all available extension points at runtime:

```typescript
const documentation = manager.getObjects("extension-points:documentation");
console.log("Available extension points:", Object.keys(documentation));
```

## Best Practices

1. **Use meaningful namespaces** - e.g., `my-university` not `plugin1`
2. **Document your extensions** - Update your plugin's README
3. **Test both modes** - Standalone and integrated
4. **Follow priority conventions** - Use 10 for high priority overrides
5. **Provide fallbacks** - Gracefully handle missing configurations
6. **Use translations** - Support i18n for all user-facing text
