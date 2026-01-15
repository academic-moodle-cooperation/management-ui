# University of Vienna Sidebar Implementation

This plugin provides custom sidebar navigation, header, and footer components for the University of Vienna.

## Migration Status

✅ **Successfully migrated from old extension system**

**Original Location**: `migrate/extensions/src/univie/src/plugins/appshell-sidebar/`

**New Location**: `plugins/univie/implementations/sidebar/`

## Components

### CustomNavMain

- Custom navigation component with University of Vienna specific styling
- Supports collapsible navigation groups
- Custom active state indicators
- Responsive design with collapsed/expanded states

### SidebarHeaderLogo

- Custom header logo component
- Animated transitions between full logo and home icon
- Integrates with app configuration for logo customization

### SidebarFooter

- Custom footer component displaying current user information
- Shows user avatar with Gravatar integration
- Responsive design that adapts to sidebar open/closed state
- Only displays for authenticated users

## Extension Points

This plugin registers components on the following extension points:

- `component-override:appshell:sidebar:content` - Replaces default sidebar navigation
- `component-override:appshell:sidebar:header` - Replaces default sidebar header
- `component-override:appshell:sidebar:footer` - Replaces default sidebar footer

## Usage

The plugin is automatically loaded when the `univie` namespace is included in the plugin configuration:

```typescript
pluginNamespace: ["core", "univie"];
```

## Features

- ✅ Custom navigation styling
- ✅ Animated logo transitions
- ✅ User avatar with Gravatar integration
- ✅ Responsive design
- ✅ University branding integration
- ✅ Plugin system integration
- ✅ Authenticated user detection

## Dependencies

- `@workspace/plugin-system` - Core plugin framework
- `@workspace/router` - Navigation routing
- `@workspace/ui` - UI components and utilities
- `@workspace/ui-config` - Configuration management
- `@workspace/query` - User data fetching
- `@workspace/utils` - Utility functions (sha256)

## Migration Notes

- Replaced `usePlugin` with `useSidebar` hook from UI components
- Simplified sidebar state management using built-in sidebar context
- Removed custom event system in favor of direct state access
- Updated imports to use new workspace package structure
