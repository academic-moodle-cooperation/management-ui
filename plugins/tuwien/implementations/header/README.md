# TU Wien Header Implementation

This plugin provides a **complete TU Wien-branded header** for the Management UI, migrated from the old extension system to Plugin Architecture 3.0.

## What it does

The `tuwienHeaderImplementation` plugin provides a **complete, self-contained header component** that includes:

- **Mobile sidebar trigger** - Hamburger menu button for mobile devices
- **TU Wien navigation** - Portal and Manage navigation links with university styling
- **TU Wien logo** - Official university SVG logo with external link to tuwien.ac.at
- **University branding** - TU Wien specific colors (#069 blue) and styling

## Migration from Old System

This implementation was migrated from:

```
migrate/extensions/src/tuwien/src/plugins/header/HeaderPlugin.tsx
migrate/extensions/src/tuwien/src/plugins/header/HeaderPlugin.css
```

**Key improvements:**

- ✅ **Modern architecture** - Uses Plugin Architecture 3.0
- ✅ **Complete component** - Single extension point, no nesting conflicts
- ✅ **Responsive design** - Mobile-first with desktop navigation
- ✅ **Maintainable** - Self-contained with inline styles
- ✅ **Accessible** - Proper ARIA labels and semantic HTML

## Features

### Navigation Links

- **Portal** - Links to `//video.tuwien.ac.at` (research portal)
- **Manage** - Links to `/` (current management interface)
- **Responsive** - Hidden on mobile devices (< 768px)

### TU Wien Logo

- **SVG format** - Official TU Wien logo
- **External link** - Opens `//tuwien.ac.at` in new tab
- **Accessibility** - Proper ARIA labels and alt text

### Mobile Support

- **Hamburger menu** - Mobile sidebar trigger button
- **Responsive layout** - Desktop-only navigation
- **Touch-friendly** - Proper button sizing for mobile

## Technical Details

- **Extension Point**: `appshell:header` (new simplified architecture)
- **Priority**: 50 (higher than core default of 100)
- **Dependencies**: `@workspace/ui/components`, `@workspace/i18n`
- **Plugin Type**: `header`
- **Namespace**: `tuwien`

## Styling

Uses TU Wien-specific colors and branding:

- **TU Wien Blue**: `#069` (primary university color)
- **Hover Blue**: `#063e5a` (darker shade for interactions)
- **Text Gray**: `#767676` (navigation text color)
- **Logo Size**: 20x20 (5rem/80px)

## Usage

The header is automatically registered when TU Wien plugins are loaded:

```typescript
import { tuwienHeaderImplementation } from "@workspace/plugins";

// Plugin is automatically registered via plugins/index.ts
// No manual registration needed
```

## Customization

Universities can override with their own header by registering with higher priority:

```typescript
manager.registerComponent("appshell:header", CustomHeader, {
  key: "my-university-header",
  order: 25, // Higher priority than TU Wien (50)
});
```
