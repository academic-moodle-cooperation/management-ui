# @workspace/ui

The shared component library for the Management UI system. This package provides a comprehensive set of React components, design system primitives, and UI patterns used across all applications in the management UI ecosystem.

## 🎨 Overview

The UI package serves as the **design system foundation** that ensures:

- **Visual consistency** across all management UI applications
- **Accessible components** following WCAG guidelines  
- **University customization** through plugin-aware theming
- **Developer efficiency** with pre-built, tested components

## 📦 Components

### Core Components

- **Data Tables** - Sortable, filterable tables with plugin customization points
- **Forms** - Input fields, validation, and form management
- **Navigation** - Breadcrumbs, pagination, and menu components
- **Layout** - Grid systems, containers, and spacing utilities
- **Feedback** - Loading states, error messages, and success indicators

### Specialized Components

- **Metadata Fields** - Custom fields for video content metadata
- **Upload Components** - File upload, progress tracking, and validation
- **Video Players** - Embedded video players with university branding
- **User Interfaces** - Profile cards, user menus, and authentication forms

### UI Primitives

Built on **shadcn/ui** and **Radix UI**:
- Buttons, inputs, selects, and form controls
- Modals, tooltips, and overlays
- Typography and spacing systems
- Color palettes and theme variables

## 🚀 Usage

### Installation

The UI package is automatically available in all monorepo applications:

```typescript
import { Button, DataTable, Input } from '@workspace/ui';
```

### Basic Components

```tsx
import { Button, Input, Card } from '@workspace/ui';

function LoginForm() {
  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Login</h2>
      
      <div className="space-y-4">
        <Input
          type="email"
          placeholder="Email address"
          required
        />
        
        <Input
          type="password"
          placeholder="Password"
          required
        />
        
        <Button type="submit" className="w-full">
          Sign In
        </Button>
      </div>
    </Card>
  );
}
```

### Data Table

```tsx
import { DataTable } from '@workspace/ui';

function SeriesTable() {
  const columns = [
    { accessorKey: 'title', header: 'Title' },
    { accessorKey: 'episodes', header: 'Episodes' },
    { accessorKey: 'updated', header: 'Last Updated' }
  ];

  return (
    <DataTable
      data={seriesData}
      columns={columns}
      searchable={true}
      sortable={true}
      pagination={true}
    />
  );
}
```

### Plugin-Aware Components

Components can be customized through the plugin system:

```tsx
import { ComponentResolver } from '@workspace/plugin-system';
import { DefaultHeader } from '@workspace/ui';

function AppHeader() {
  return (
    <ComponentResolver
      componentType="ui:header"
      defaultComponent={DefaultHeader}
      componentProps={{ 
        title: 'Management UI',
        user: currentUser 
      }}
    />
  );
}
```

## 🎨 Theming & Customization

### University Branding

The UI system supports university-specific customization:

```css
/* University theme variables */
:root {
  --primary: 210 40% 18%;        /* University blue */
  --primary-foreground: 0 0% 98%;
  --secondary: 210 40% 96%;
  --accent: 210 40% 92%;
}

/* TU Wien theme */
.theme-tuwien {
  --primary: 210 100% 20%;       /* TU Wien blue */
  --accent: 45 100% 50%;         /* TU Wien yellow */
}

/* University of Vienna theme */
.theme-univie {
  --primary: 0 84% 37%;          /* UniVie red */
  --secondary: 0 0% 15%;         /* UniVie dark gray */
}
```

### Component Variants

Components support multiple variants for different contexts:

```tsx
// Button variants
<Button variant="default">Default</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
<Button variant="ghost">Subtle Action</Button>

// Size variants
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
```

## 🧪 Testing

### Component Testing

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@workspace/ui';

test('renders button with correct text', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByText('Click me')).toBeInTheDocument();
});

test('calls onClick handler when clicked', () => {
  const handleClick = jest.fn();
  render(<Button onClick={handleClick}>Click me</Button>);
  
  fireEvent.click(screen.getByText('Click me'));
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

### Visual Testing

```bash
# Storybook for component development
pnpm storybook

# Visual regression testing
pnpm test:visual
```

## 📁 Package Structure

```
packages/ui/
├── src/
│   ├── components/              # React components
│   │   ├── ui/                  # Base UI primitives (shadcn/ui)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   └── ...
│   │   ├── datatable/           # Data table components
│   │   │   ├── data-table.tsx
│   │   │   ├── data-table-toolbar.tsx
│   │   │   └── columns.tsx
│   │   ├── forms/               # Form components
│   │   │   ├── form-field.tsx
│   │   │   ├── validation.tsx
│   │   │   └── ...
│   │   ├── metadata-fields/     # Content metadata components
│   │   ├── upload/              # File upload components
│   │   └── navigation/          # Navigation components
│   ├── hooks/                   # Shared React hooks
│   │   ├── use-theme.ts
│   │   ├── use-table-navigation.ts
│   │   └── ...
│   ├── lib/                     # Utility functions
│   │   ├── utils.ts
│   │   └── cn.ts                # Class name utility
│   ├── styles/                  # Global styles
│   │   ├── globals.css
│   │   └── components.css
│   └── index.ts                 # Public exports
├── components.json              # shadcn/ui configuration
├── tailwind.config.js           # Tailwind CSS configuration
├── package.json
└── README.md
```

## 🔧 Development

### Adding New Components

1. **Create the component** in the appropriate directory
2. **Export it** from `src/index.ts`
3. **Add tests** with good coverage
4. **Document usage** with examples
5. **Test across themes** to ensure university compatibility

### Component Guidelines

- **Follow shadcn/ui patterns** for consistency
- **Support plugin customization** where appropriate
- **Include proper TypeScript types** for all props
- **Ensure accessibility** with proper ARIA attributes
- **Test with university themes** to verify visual compatibility

### Building

```bash
# Development
pnpm dev

# Build for production
pnpm build

# Type checking
pnpm check-types

# Linting
pnpm lint
```

## 🎭 Accessibility

All components follow WCAG 2.1 AA guidelines:

- **Keyboard navigation** support
- **Screen reader** compatibility
- **Color contrast** compliance
- **Focus management** for complex components
- **ARIA attributes** for semantic meaning

### Example Accessible Component

```tsx
import { forwardRef } from 'react';
import { cn } from '../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline';
  size?: 'sm' | 'default' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          // Base styles
          'inline-flex items-center justify-center rounded-md font-medium',
          'focus-visible:outline-none focus-visible:ring-2',
          'disabled:pointer-events-none disabled:opacity-50',
          
          // Variant styles
          {
            'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'default',
            'bg-destructive text-destructive-foreground hover:bg-destructive/90': variant === 'destructive',
            'border border-input bg-background hover:bg-accent': variant === 'outline',
          },
          
          // Size styles
          {
            'h-9 px-3 text-sm': size === 'sm',
            'h-10 px-4 py-2': size === 'default',
            'h-11 px-8 text-lg': size === 'lg',
          },
          
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
export { Button };
```

## 🤝 Contributing

### Component Contributions

1. **Follow existing patterns** - Use shadcn/ui base components where possible
2. **Support university themes** - Test with TU Wien, UniVie, and default themes  
3. **Include comprehensive tests** - Unit tests, accessibility tests, and visual tests
4. **Document props and usage** - Clear examples and API documentation
5. **Consider plugin integration** - How can universities customize this component?

### Design System Evolution

- **Propose changes** through issues and discussions
- **Maintain backward compatibility** or provide clear migration paths
- **Consider all applications** - Changes affect core, series, episodes, upload, and test apps
- **Test university implementations** - Verify changes work with existing university plugins

This UI package provides the foundation for a cohesive, accessible, and customizable user experience across the entire Management UI ecosystem.