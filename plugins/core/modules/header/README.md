# Core Header Implementation

This plugin provides a complete default header system for the Management UI using the new single extension point architecture.

## What it does

The `coreHeaderImplementation` plugin provides a **complete, self-contained header component** that includes:

- **Sidebar trigger** - The hamburger menu to toggle the sidebar
- **Language switcher** - German/English language switching dropdown
- **Login button** - Authentication state and login/logout functionality

## New Architecture (Single Extension Point)

This plugin uses the **new simplified architecture** where complete header components are registered directly on the `appshell:header` extension point.

**Benefits:**

- ✅ **No nesting conflicts** - No "button-in-button" HTML issues
- ✅ **Complete layout control** - Universities design the entire header
- ✅ **Simpler mental model** - One extension point, complete components
- ✅ **Better performance** - No complex extension point resolution

## How it works

The plugin registers a complete header component on `appshell:header`:

```typescript
manager.registerComponent("appshell:header", DefaultHeader, {
  key: "default-header",
  order: 100,
});
```

The `DefaultHeader` component is self-contained and includes all functionality directly - no extension points needed.

## Extension Point Used

### `appshell:header`

Register complete header components:

```typescript
manager.registerComponent("appshell:header", MyCustomHeader, {
  key: "university-header",
  order: 50, // Lower order = higher priority
});
```

## University Customization

Universities can create their own complete header components and register them with higher priority:

```typescript
import React from 'react';
import { SidebarTrigger } from '@workspace/ui/components';
import { LangSwitcher, LoginButton } from '@workspace/plugins';

const UniversityHeader = () => {
  return (
    <div className="flex items-center justify-between gap-4 px-4 w-full">
      {/* Left side - Sidebar + University logo */}
      <div className="flex items-center gap-3">
        <SidebarTrigger className="-ml-1" />
        <img
          src="/assets/university-logo.png"
          alt="University Name"
          className="h-8 w-auto"
        />
      </div>

      {/* Right side - Custom actions + standard auth */}
      <div className="flex items-center gap-2">
        <button className="text-sm hover:underline">
          Help
        </button>
        <LangSwitcher />
        <LoginButton />
      </div>
    </div>
  );
};

// Register with higher priority (lower order number)
manager.registerComponent('appshell:header', UniversityHeader, {
  key: 'university-header',
  order: 50 // Higher priority than default (100)
});
```

## Reusable Components

The core implementation exports reusable components that universities can use in their custom headers:

- `LangSwitcher` - Language switching dropdown
- `LoginButton` - Authentication button with proper state

```typescript
import { LangSwitcher, LoginButton } from "@workspace/plugins";
```

## Usage

The header implementation is automatically loaded when you import from `@workspace/plugins`:

```typescript
import { coreHeaderImplementation } from "@workspace/plugins";

// Automatically provides:
// ✅ Complete header component (replaces minimal default)
// ✅ Language switcher (German/English)
// ✅ Login button (proper auth state)
```

## Migration from Old Architecture

**Before (Granular Extension Points):**

```typescript
// ❌ Old way - caused nesting conflicts
manager.registerObject("app:header-actions", "login-button", {
  title: "Login",
  icon: LoginButton, // Button inside button wrapper!
  action: () => {},
  order: 20,
});
```

**After (Complete Components):**

```typescript
// ✅ New way - complete control, no nesting
const MyHeader = () => (
  <div className="flex justify-between w-full px-4">
    <SidebarTrigger />
    <LoginButton /> {/* Direct usage, no wrapper */}
  </div>
);

manager.registerComponent('appshell:header', MyHeader);
```

## Features

- **Clean architecture** - Single extension point, complete components
- **No HTML conflicts** - Eliminates button-in-button nesting issues
- **Layout freedom** - Universities control entire header layout
- **Reusable components** - Core components available for custom headers
- **Simple mental model** - One place to register, complete replacement

## Technical Details

- **Extension Point**: `appshell:header` (direct registration)
- **Priority**: 100 (allows university overrides)
- **Dependencies**: `@workspace/ui/components`, `@workspace/router`
- **Plugin Type**: `header`
- **Namespace**: `core`
