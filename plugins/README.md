# Plugins - Extension Point Definitions

This directory contains **extension point definitions** that specify **what CAN be extended** by universities and organizations. Plugins do NOT contain implementations - they define the APIs and contracts that extensions can implement.

## Architecture Overview

```
packages/     ← Infrastructure & framework code
plugins/      ← Extension point definitions (APIs) ← YOU ARE HERE  
extensions/   ← University implementations of extension points
apps/         ← Core applications
```

## Plugins vs Extensions

| **Plugins** (`plugins/`) | **Extensions** (`extensions/`) |
|---------------------------|--------------------------------|
| ✅ **Define** extension points | ✅ **Implement** extension points |
| ✅ **Document** APIs and contracts | ✅ **Provide** university-specific implementations |
| ✅ **Specify** what can be customized | ✅ **Customize** according to specifications |
| ✅ **Distributed** with core system | ✅ **University-specific** deployments |

## Extension Points Defined

### 1. **Sidebar Extension Points** (`sidebar-extension-points.ts`)
Defines where sidebar items can be added:
- `sidebar:nav-items` - Main navigation items
- `sidebar:user-items` - User actions (profile, settings)
- `sidebar:admin-items` - Administrative functions
- `sidebar:help-items` - Help and support links

### 2. **App Layout Extension Points** (`app-layout-extension-points.ts`)
Defines where app layout can be customized:
- `app:header-logo` - University logo in header
- `app:header-actions` - Actions in header area
- `app:footer` - Footer content and links
- `app:branding` - Theme colors and styles
- `app:config` - Application-wide configuration

### 3. **Content Extension Points** (`content-extension-points.ts`)
Defines where content management can be extended:
- `metadata:fields` - Custom metadata fields
- `workflows:definitions` - Custom approval workflows
- `content:validators` - Custom validation rules
- `content:transformers` - Custom content processing

## Plugin Structure

Each plugin follows this pattern:

```typescript
import { createPlugin, type PluginManager } from '@workspace/plugin-system';

export const myExtensionPoints = createPlugin({
  namespace: 'core',
  type: 'my-extension-points',
  version: '1.0.0',

  initialize(manager: PluginManager) {
    // Document what extensions can implement
    manager.registerObject('extension-points:documentation', 'my:extension-point', {
      description: 'What this extension point allows',
      expectedSchema: {
        // Define the API contract
      },
      examples: [
        // Provide implementation examples
      ]
    });
  }
});
```

## API Documentation System

Extension points automatically document their APIs:

```typescript
manager.registerObject('extension-points:documentation', 'sidebar:nav-items', {
  description: 'Main navigation items in the sidebar',
  expectedSchema: {
    title: 'string - Display name',
    path: 'string - Route path', 
    icon: 'string|Component - Icon identifier',
    order: 'number - Display order (lower = higher up)',
    permissions: 'string[] - Required permissions',
    category: 'string - Grouping category'
  },
  examples: [
    {
      title: 'Series',
      path: '/series',
      icon: 'list-video',
      order: 20,
      permissions: ['series.view'],
      category: 'content'
    }
  ]
});
```

## How Extensions Use These

Extensions implement the defined extension points:

```typescript
// In extensions/src/university-extension.ts
export const universityExtension = createPlugin({
  namespace: 'myuni',
  type: 'university-implementation',
  version: '1.0.0',

  initialize(manager: PluginManager) {
    // Implement the sidebar extension point
    manager.registerObject('sidebar:nav-items', 'university-policies', {
      title: 'University Policies',
      path: '/policies',
      icon: 'shield-check',
      order: 80,
      permissions: [],
      category: 'university'
    });

    // Implement the branding extension point
    manager.registerObject('app:branding', 'university-branding', {
      primaryColor: '#003366',
      logoUrl: '/assets/university-logo.png'
    });
  }
});
```

## Benefits of This Architecture

### ✅ **Controlled Extensibility**
- Universities can only customize what's explicitly allowed
- Prevents breaking changes from arbitrary modifications
- Maintains system stability and upgradeability

### ✅ **API Contracts**
- Clear documentation of what each extension point expects
- Type safety and validation
- Consistent behavior across universities

### ✅ **Upgrade Safety**
- Core system updates don't break university customizations
- Extension point APIs provide backwards compatibility
- Universities can upgrade core without losing customizations

### ✅ **Documentation**
- Extension points serve as living documentation
- Examples show proper usage patterns
- API schemas define exact requirements

## Adding New Extension Points

When adding new extension points:

1. **Identify the need** - What should universities be able to customize?
2. **Design the API** - What parameters and options should be available?
3. **Create the plugin** - Define the extension point with full documentation
4. **Provide examples** - Show how extensions should implement it
5. **Update this README** - Document the new extension point

## Extension Point Guidelines

### Do ✅
- Define clear, focused extension points
- Provide comprehensive API documentation
- Include practical examples
- Use consistent naming conventions
- Consider backwards compatibility

### Don't ❌
- Put implementations in plugins (use extensions/)
- Create overly broad extension points
- Break existing extension point APIs
- Skip documentation and examples
- Use inconsistent parameter names

## Migration from Old System

When migrating from the old mixed system:

1. **Extract implementations** from plugins → move to extensions/
2. **Define extension points** for what was customizable
3. **Document APIs** with schemas and examples
4. **Test implementations** against new extension points
5. **Update university extensions** to use new APIs

## Real-World Example

**Before (Mixed):**
```
plugins/navigation-plugin.ts ← Implementation mixed with definition
```

**After (Separated):**
```
plugins/sidebar-extension-points.ts ← Defines where nav items can go
extensions/university-navigation.ts ← University implements nav items
```

This separation ensures universities can customize navigation while the core system controls how navigation works. 