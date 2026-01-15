# TU Wien Table Sidebar Plugin

This plugin adds ACL (Access Control List) editor functionality to table sidebars in episodes and series tables.

## Overview

Replaces the previous feature flag-based system (`isUnivie` check) with a proper plugin architecture that:

- ✅ **Plugin-based**: ACL editor tabs are registered via plugins
- ✅ **Dynamic**: Tables automatically show tabs when plugins are available
- ✅ **Extensible**: Multiple universities can add their own tabs
- ✅ **Clean**: No more hardcoded feature flags

## Features

- **ACL Editor Tab**: Adds an "Access" tab to episode and series table sidebars
- **Automatic Detection**: MUITable automatically shows tabbed interface when plugins are present
- **University-specific**: Only loaded for TU Wien instances

## How It Works

### 1. Extension Points

The plugin system defines extension points for table sidebar tabs:

- `table-sidebar:episodes:tabs` - Episode table sidebar tabs
- `table-sidebar:series:tabs` - Series table sidebar tabs
- `table-sidebar:tabs` - General table sidebar tabs

### 2. Plugin Registration

This plugin registers:

```typescript
// Register ACL editor tab component
manager.registerComponent("table-sidebar:episodes:tabs", AclEditorTab, {
  key: "access-tab",
  order: 20,
});

// Register tab metadata
manager.registerObject("table-sidebar:episodes:tab-definitions", "access", {
  id: "access",
  label: "muitable-sidebar:accessTab",
  order: 20,
  component: "AclEditorTab",
  context: ["episodes"],
});
```

### 3. Dynamic Tab Detection

MUITable automatically detects available tabs:

```typescript
// Check if table sidebar plugins are available
const { hasTabPlugins } = useTableSidebarPlugins(selectedElement);

// Show tabs if plugins available, otherwise default sidebar
const effectiveSidebarVariant = hasTabPlugins ? "tabs" : "default";
```

## Migration from Feature Flags

**Before (Feature Flag):**

```typescript
const { isUnivie } = useFeatureFlags();
const effectiveSidebarVariant = isUnivie ? "default" : "tabs";
```

**After (Plugin System):**

```typescript
const { hasTabPlugins } = useTableSidebarPlugins(selectedElement);
const effectiveSidebarVariant = hasTabPlugins ? "tabs" : "default";
```

## Configuration

The plugin is automatically loaded when TU Wien namespace is enabled in the plugin configuration:

```json
{
  "app": {
    "pluginNamespace": ["tuwien"]
  }
}
```

## Components

### AclEditorTab

Wraps the existing `AclEditor` component for use in table sidebar tabs.

**Props:**

- `selectedElement` - The selected table row element
- `refetch` - Function to refetch table data after changes
- `onClose` - Function called when sidebar closes

## Benefits

1. **No Feature Flags**: Eliminates hardcoded university checks
2. **Extensible**: Other universities can add their own tabs
3. **Clean Architecture**: Proper separation of concerns
4. **Dynamic**: Tables adapt based on available plugins
5. **Maintainable**: Clear plugin boundaries and responsibilities

## Future Extensions

This architecture enables:

- **Multiple Tabs**: Universities can add multiple custom tabs
- **Tab Ordering**: Control tab display order via `order` property
- **Conditional Tabs**: Show tabs based on permissions or data type
- **Custom Content**: Each university can create unique tab content
