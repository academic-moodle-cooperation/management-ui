# Plugin Styling Contract

This document defines how plugin CSS is expected to interact with the host Management UI.

## Ownership Model

There are three different styling responsibilities:

1. **Host shell CSS**
   - Owns shared UI from `@workspace/ui`
   - Owns app shell structure such as sidebar, header, footer, buttons, menus, and responsive shell behavior

2. **Theme CSS**
   - Owns design tokens and branding variables
   - Typical examples: `--primary`, `--sidebar-primary`, `--color-footer`

3. **Plugin CSS**
   - Owns markup rendered by the plugin itself
   - Typical examples: plugin pages, cards, layouts, custom views, plugin-local wrappers

## Load Order

Remote/JAR plugin CSS is inserted **before** the host shell stylesheets.

This is intentional:
- It prevents generic plugin utilities such as `.hidden`, `.block`, `.flex`, `.p-0` from accidentally overriding the host UI.
- It makes host styling stable even when multiple plugins ship their own Tailwind builds.

## What Is Safe

Plugin Tailwind classes are expected to work normally when they style **plugin-owned elements**:

- Layout utilities on plugin pages and cards
- Typography, spacing, sizing, borders, shadows
- Responsive utilities inside plugin markup
- Plugin-local component classes

## What Is Not Safe

Do **not** rely on equal-specificity utility classes to override host/shared UI components by stylesheet order.

Examples of risky patterns:

- Plugin adds `data-[active=true]:bg-sidebar-primary` to a shared sidebar button that already has a host `data-[active=true]:bg-sidebar-accent`
- Plugin expects generic utilities like `.hidden` or `.block` to win over host classes because plugin CSS is loaded later
- Plugin changes host appearance only by passing another utility class to a component that already ships the same kind of utility selector

These patterns are order-sensitive and will break when CSS precedence changes.

## Recommended Override Strategy

When a plugin needs to intentionally restyle a host/shared component:

1. Add a **plugin-specific root class or data attribute** around the affected area.
2. Put the override in a **scoped CSS rule**.
3. Keep the rule in a dedicated override layer.

Example:

```css
@layer theme, base, components, utilities, plugin-overrides;

@import "tailwindcss/theme" layer(theme);
@import "tailwindcss/utilities" layer(utilities);

@layer plugin-overrides {
  .my-plugin-sidebar [data-sidebar="menu-button"][data-active="true"] {
    background-color: var(--sidebar-primary);
    color: var(--sidebar-accent-foreground);
  }
}
```

And in React:

```tsx
<NavMain menuClassName="my-plugin-sidebar" />
```

This is preferred over:

- relying on later stylesheet load order
- unscoped global selectors
- broad utility collisions against host classes

## Theme Tokens

If a visual change is a branding/theme concern, prefer changing the theme token in theme CSS instead of overriding many component classes.

Examples:

- `--primary`
- `--sidebar-primary`
- `--sidebar-accent`
- `--color-footer`

Theme files should define the final color values used by the UI.

## Last Resort

Tailwind important variants such as `!bg-sidebar-primary` may be used as a short-term escape hatch, but they are not the preferred long-term contract.

Use them only when:

- a scoped override is impractical
- the affected host component does not expose a better hook yet

## Migration Checklist

Use this checklist when reviewing an existing plugin:

- Does the plugin CSS entry declare explicit Tailwind layers?
- Does the plugin use generic utilities only on plugin-owned markup?
- Does the plugin restyle shared shell UI such as sidebar, header, footer, or buttons?
- If yes, is that override scoped with a plugin root selector instead of depending on load order?
- Can the change be expressed as a theme token instead of a component override?

If any answer is "no", the plugin likely still depends on the older order-sensitive behavior.

## Template Guidance

Community/local plugin CSS entries should declare explicit layers:

```css
@layer theme, base, components, utilities, plugin-overrides;

@import "tailwindcss/theme" layer(theme);
@import "tailwindcss/utilities" layer(utilities);
```

This keeps plugin CSS predictable and leaves room for explicit host overrides in `plugin-overrides`.
