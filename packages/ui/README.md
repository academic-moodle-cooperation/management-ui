# @oc-mui/ui

**Version:** 0.0.0  
**Type:** Foundation / Component Library  
**Last Updated:** 2025-01-15

## Purpose & Scope

The `@oc-mui/ui` package is the centralized component library for the Management UI. It provides a consistent design system based on **Tailwind CSS (v4)** and **Radix UI**. It ranges from low-level atomic components to complex, data-integrated systems like the application shell and advanced data tables.

**In Scope:**

- Atomic UI components (Buttons, Inputs, Dialogs, etc.).
- The **App Shell** (layout system with sidebar and navigation).
- Advanced **DataTable** implementation based on TanStack Table.
- Specialized business components (Metadata fields, ACL editor).
- Plugin-aware components using the `ComponentResolver`.

**Out of Scope:**

- Application-specific business logic (belongs in apps).
- Direct API calls (uses `@oc-mui/query` hooks instead).
- Global state management (belongs in `@oc-mui/store`).

## Architecture & Design Decisions

### Design Principles

- **Composition Over Configuration:** Components are designed to be composed together using the "sub-component" pattern (e.g., `Dialog`, `DialogContent`, `DialogHeader`).
- **Plugin-First:** Key areas of the UI (Header, Footer, Sidebar) use the `ComponentResolver` to allow plugins to inject or override functionality.
- **Accessibility:** Built on Radix UI primitives to ensure high accessibility standards (WAI-ARIA).

### Key Concepts

#### The App Shell
The `Appshell` component provides the main structural layout. It includes the `AppSidebar`, a sticky header, and a footer. It uses `ComponentResolver` to allow external plugins to customize the layout.

#### DataTable vs. MUITable
- **DataTable:** A generic, highly flexible table implementation based on TanStack Table. Best for standard lists.
- **MUITable:** A specialized table implementation that includes a integrated sidebar for detail views and filtering.

#### Metadata Fields
A set of components designed to handle various metadata types (String, List, Duration, Long, etc.) in a consistent way across different applications.

### Architecture Diagram

```
┌─────────────────────────────────────────┐
│ @oc-mui/ui Architecture              │
├─────────────────────────────────────────┤
│ [ Appshell / Layout Components ]        │
│         ↓                               │
│ [ Specialized: DataTable, Metadata ]    │
│         ↓                               │
│ [ Atomic: Radix UI / shadcn ]           │
│         ↓                               │
│ [ Tailwind CSS / Design Tokens ]        │
└─────────────────────────────────────────┘
```

## API Surface (Public Exports)

### Exports Structure

```typescript
export * from "./ui";           // Atomic components
export * from "./appshell";     // Layout components
export * from "./datatable";    // Table implementation
export * from "./mui-table";    // Specialized tables
export * from "./metadata-fields";
```

### Core API

#### `Appshell`
**Purpose:** Wraps the application to provide the main sidebar layout.

#### `DataTable`
**Purpose:** A comprehensive table component supporting sorting, filtering, and pagination.

#### `ComponentResolver` (via plugin-system)
**Purpose:** Used within UI components to allow plugin-based overrides.

## Dependencies & Coupling

### Dependency Graph

```
@oc-mui/ui
├── External Dependencies
│   ├── @radix-ui/* (Primitives)
│   ├── lucide-react (Icons)
│   ├── tailwindcss (v4)
│   └── class-variance-authority (Styling)
└── Workspace Dependencies
    ├── @oc-mui/i18n - For component translations
    ├── @oc-mui/plugin-system - For component extensibility
    ├── @oc-mui/query - For data-integrated components (e.g., SelectSeries)
    ├── @oc-mui/router - For navigation-aware components
    └── @oc-mui/ui-config - For theming and configuration
```

### Dependency Layer

**Layer:** Foundation / Component Library

**Allowed to depend on:** Core Infrastructure, Foundation, Integration (Query/Router - for specialized components).

## Usage Examples

### Using Atomic Components

```typescript
import { Button, Card, CardHeader, CardTitle } from "@oc-mui/ui/components";

const MyComponent = () => (
  <Card>
    <CardHeader>
      <CardTitle>Hello World</CardTitle>
    </CardHeader>
    <Button onClick={() => console.log("Clicked")}>Click Me</Button>
  </Card>
);
```

### Using the App Shell

```typescript
import { Appshell } from "@oc-mui/ui/components";

const App = () => (
  <Appshell>
    <YourRoutes />
  </Appshell>
);
```

## Extension Points

### Plugin Overrides
You can override parts of the AppShell by registering components with the following types:
- `appshell:header`: Replaces the header content.
- `appshell:footer`: Replaces the footer content.
- `appshell:sidebar:top`: Adds components to the top of the sidebar.

## File Structure

```
packages/ui/
├── src/
│   ├── components/
│   │   ├── ui/                 # Atomic shadcn components
│   │   ├── appshell/           # Layout & Sidebar
│   │   ├── datatable/          # TanStack Table integration
│   │   ├── metadata-fields/    # Specialized business fields
│   │   └── index.ts            # Public API exports
│   ├── hooks/                  # UI-related hooks (e.g., use-mobile)
│   ├── lib/                    # Utilities (cn, etc.)
│   └── styles/                 # Global CSS and Tailwind setup
├── package.json
└── README.md                   # This file
```

## Related Packages

- [`@oc-mui/tailwind-config`](/packages/tailwind-config/README.md) - Provides the styling foundation.
- [`@oc-mui/plugin-system`](/packages/plugin-system/README.md) - Enables UI extensibility.

---

## Contributing

1. **Atomic Components:** Follow the shadcn/ui pattern. Keep them presentational and generic.
2. **Specialized Components:** If a component needs data from `@oc-mui/query`, try to pass it via props first. Only use hooks if the component is designed as a "Connected Component".
3. **Styling:** Use the `cn()` utility for class merging and follow the Tailwind v4 conventions.
4. **Icons:** Use `lucide-react` for all standard icons.
