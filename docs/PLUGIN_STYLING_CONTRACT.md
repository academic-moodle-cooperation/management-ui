# Plugin Styling Contract

**Version:** 2.0.0
**Last Updated:** 2026-04-13

This document defines how plugin CSS must interact with the host Management UI.
Following this contract ensures plugins automatically match any organization's theme.

## Core Rule

**Plugins MUST use semantic CSS tokens and shared UI components. Hardcoded colors are forbidden.**

A plugin built correctly looks native in every org's deployment without any code changes.

## Ownership Model

| Layer | Owns | Examples |
|-------|------|----------|
| **Host shell CSS** | Shared UI from `@workspace/ui`, app shell structure | Sidebar, header, footer, buttons, menus, responsive layout |
| **Theme CSS** | Design tokens and branding variables | `--primary`, `--sidebar-primary`, `--color-footer`, fonts, radius |
| **Plugin CSS** | Markup rendered by the plugin itself | Plugin pages, cards, layouts, custom views, scoped wrappers |

## Semantic Token Catalog

These tokens are defined in `packages/ui/src/styles/globals.css` and available as Tailwind utility classes.
Org themes override these values via CSS custom properties.

### Surface & Text Tokens

| Token | Tailwind Class | Purpose |
|-------|---------------|---------|
| `--background` | `bg-background` | Page background |
| `--foreground` | `text-foreground` | Default text color |
| `--card` | `bg-card` | Card/panel surfaces |
| `--card-foreground` | `text-card-foreground` | Text on cards |
| `--popover` | `bg-popover` | Popover/dropdown backgrounds |
| `--popover-foreground` | `text-popover-foreground` | Text in popovers |
| `--primary` | `bg-primary` / `text-primary` | Primary actions and emphasis |
| `--primary-foreground` | `text-primary-foreground` | Text on primary surfaces |
| `--secondary` | `bg-secondary` | Secondary surfaces |
| `--secondary-foreground` | `text-secondary-foreground` | Text on secondary surfaces |
| `--muted` | `bg-muted` | Subdued backgrounds |
| `--muted-foreground` | `text-muted-foreground` | De-emphasized text |
| `--accent` | `bg-accent` | Accent/highlight surfaces |
| `--accent-foreground` | `text-accent-foreground` | Text on accent surfaces |
| `--destructive` | `bg-destructive` | Destructive/danger actions |
| `--destructive-foreground` | `text-destructive-foreground` | Text on destructive surfaces |

### Border & Interactive Tokens

| Token | Tailwind Class | Purpose |
|-------|---------------|---------|
| `--border` | `border-border` | Default borders |
| `--input` | `border-input` | Input field borders |
| `--ring` | `ring-ring` | Focus rings |

### Status Tokens

| Token | Tailwind Class | Purpose |
|-------|---------------|---------|
| `--ok` | `bg-ok` / `text-ok` | Success state |
| `--ok-foreground` | `text-ok-foreground` | Text on success |
| `--warning` | `bg-warning` | Warning state |
| `--warning-foreground` | `text-warning-foreground` | Text on warning |
| `--error` | `bg-error` | Error state |
| `--error-foreground` | `text-error-foreground` | Text on error |
| `--info` | `bg-info` | Info state |
| `--info-foreground` | `text-info-foreground` | Text on info |

### Sidebar Tokens

| Token | Tailwind Class | Purpose |
|-------|---------------|---------|
| `--sidebar` | `bg-sidebar` | Sidebar background |
| `--sidebar-foreground` | `text-sidebar-foreground` | Sidebar text |
| `--sidebar-primary` | `bg-sidebar-primary` | Active sidebar item |
| `--sidebar-primary-foreground` | `text-sidebar-primary-foreground` | Text on active item |
| `--sidebar-accent` | `bg-sidebar-accent` | Sidebar hover/accent |
| `--sidebar-accent-foreground` | `text-sidebar-accent-foreground` | Text on sidebar accent |
| `--sidebar-border` | `border-sidebar-border` | Sidebar borders |
| `--sidebar-ring` | `ring-sidebar-ring` | Sidebar focus rings |

### Layout & Typography Tokens

| Token | CSS Variable | Purpose |
|-------|-------------|---------|
| Font sans | `--font-sans` | Body text font family |
| Font mono | `--font-mono` | Monospace/code font |
| Font heading | `--font-heading` | Heading font (defaults to sans) |
| Radius | `--radius` | Base border radius (sm, md, lg, xl derived) |
| Spacing tight | `--spacing-tight` | Compact spacing (0.5rem) |
| Spacing normal | `--spacing-normal` | Default spacing (0.75rem) |
| Spacing relaxed | `--spacing-relaxed` | Generous spacing (1rem) |
| Transition duration | `--duration-transition` | Default animation speed |

### Chart Tokens

| Token | Tailwind Class | Purpose |
|-------|---------------|---------|
| `--chart-1` through `--chart-5` | `bg-chart-1` etc. | Data visualization colors |

## Rules

### DO

- Use `bg-background`, `text-foreground`, `bg-card`, `bg-muted`, `text-muted-foreground`, etc.
- Use shared UI components from `@workspace/ui/components` (Button, Card, Input, Table, etc.)
- Use `lucide-react` for icons (provided by host)
- Scope plugin CSS to plugin-owned markup
- Use explicit Tailwind layers in plugin CSS entry
- Override theme tokens in theme CSS files, not in plugin components
- Use `var(--token)` when writing raw CSS in plugin stylesheets

### DO NOT

- Use hardcoded hex, rgb, hsl, or oklch color values in components or CSS
- Use hardcoded font families (use `font-sans`, `font-heading`, `font-mono`)
- Bundle your own copy of shadcn/ui components
- Rely on CSS load order to override host styles
- Use `!important` on utility classes (except as documented escape hatch)
- Apply global styles that affect elements outside your plugin's DOM

### Examples

```tsx
// CORRECT: Semantic tokens
<div className="bg-background text-foreground">
  <h1 className="text-3xl font-bold font-heading">Dashboard</h1>
  <p className="text-muted-foreground">Summary view</p>
  <Card>
    <CardContent className="bg-card">
      <Badge className="bg-ok text-ok-foreground">Active</Badge>
    </CardContent>
  </Card>
</div>

// WRONG: Hardcoded colors
<div className="bg-white text-gray-900">
  <h1 className="text-3xl font-bold" style={{ fontFamily: 'Inter' }}>Dashboard</h1>
  <p className="text-gray-500">Summary view</p>
  <div className="bg-[#1a1a2e] rounded-lg">
    <span className="bg-green-500 text-white">Active</span>
  </div>
</div>
```

## Load Order

Remote/JAR plugin CSS is inserted **before** the host shell stylesheets.

This is intentional:
- Prevents plugin utilities (`.hidden`, `.flex`, `.p-0`) from overriding host UI
- Makes host styling stable when multiple plugins ship their own Tailwind builds

## Recommended Plugin CSS Entry

```css
@layer theme, base, components, utilities, plugin-overrides;

@import "tailwindcss/theme" layer(theme);
@import "tailwindcss/utilities" layer(utilities);

@layer plugin-overrides {
  /* Scoped overrides go here (rare) */
}
```

## Override Strategy

When a plugin must restyle a host/shared component:

1. Add a **plugin-specific root class or data attribute** around the affected area
2. Put the override in a **scoped CSS rule** inside `@layer plugin-overrides`
3. Prefer changing **theme tokens** over component-level overrides

```css
@layer plugin-overrides {
  .my-plugin-sidebar [data-sidebar="menu-button"][data-active="true"] {
    background-color: var(--sidebar-primary);
    color: var(--sidebar-accent-foreground);
  }
}
```

## How Org Themes Work

An org creates a theme CSS file that overrides token values:

```css
/* themes/univie.css */
:root {
  --primary: oklch(0.45 0.15 250);
  --primary-foreground: oklch(0.98 0 0);
  --sidebar: oklch(0.20 0.05 250);
  --sidebar-foreground: oklch(0.95 0 0);
  --font-heading: 'Merriweather', serif;
  --radius: 0.5rem;
}

.dark {
  --primary: oklch(0.65 0.18 250);
  --sidebar: oklch(0.15 0.03 250);
}
```

Any plugin using semantic tokens automatically picks up these theme values.

## Migration Checklist

When reviewing a plugin's styling:

- [ ] Plugin uses only semantic token classes (no hardcoded colors)
- [ ] Plugin uses shared UI components from `@workspace/ui`
- [ ] Plugin CSS entry declares explicit Tailwind layers
- [ ] Generic utilities apply only to plugin-owned markup
- [ ] Host/shell overrides (if any) are scoped with a plugin root selector
- [ ] Theme changes use CSS custom properties, not component overrides
- [ ] Plugin renders correctly in both light and dark mode
- [ ] Plugin renders correctly with the default theme and at least one org theme
