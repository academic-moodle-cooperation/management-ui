# Management UI [App Name]

**Version:** 1.0.0  
**Port:** [Port Number]  
**Last Updated:** YYYY-MM-DD

## Purpose

[1-2 paragraph description of what this application does]

This application handles [primary responsibility] within the Management UI ecosystem. It provides [key capabilities] for [target users].

## Key Features

- **[Feature 1]** - [Description]
- **[Feature 2]** - [Description]
- **[Feature 3]** - [Description]
- **[Feature 4]** - [Description]

## Architecture

### Integration with Management UI Ecosystem

```
┌─────────────────────────────────────────────────┐
│ Management UI Core (App Shell)                  │
├─────────────────────────────────────────────────┤
│ Route: /[route-path]                            │
│ ↓ Loads Management UI [App Name]                │
├─────────────────────────────────────────────────┤
│ Management UI [App Name]                        │
│ ├─ [Component/Feature 1]                        │
│ ├─ [Component/Feature 2]                        │
│ ├─ [Component/Feature 3]                        │
│ └─ University-Specific Customizations           │
└─────────────────────────────────────────────────┘
```

### Application Architecture

```
┌─────────────────────────────────────────────────┐
│ Presentation Layer                              │
│ - React Components                              │
│ - UI State Management                           │
├─────────────────────────────────────────────────┤
│ Business Logic Layer                            │
│ - Custom Hooks                                  │
│ - Data Transformations                          │
├─────────────────────────────────────────────────┤
│ Data Layer                                      │
│ - TanStack Query                                │
│ - GraphQL Queries                               │
└─────────────────────────────────────────────────┘
```

### Design Decisions

#### [Decision 1: Title]

**Context:** [Why this decision was needed]

**Decision:** [What was decided]

**Rationale:** [Why this approach was chosen]

**Alternatives Considered:** [Other options and why rejected]

#### [Decision 2: Title]

[Repeat for major architectural decisions]

## Dependencies & Coupling

### Package Dependencies

```
management-ui-[app-name]
├── @oc-mui/app-runtime      - [Why needed]
├── @oc-mui/ui               - [Why needed]
├── @oc-mui/query            - [Why needed]
├── @oc-mui/router           - [Why needed]
├── @oc-mui/plugin-system    - [Why needed]
└── @oc-mui/i18n             - [Why needed]
```

### External Dependencies

- **[Package Name]** (version): [Purpose and justification]
- **[Package Name]** (version): [Purpose and justification]

### Coupling Analysis

**Integration Points:**

- **Core App:** [How this app integrates with core shell]
- **Other Apps:** [Dependencies on other apps, if any]
- **Backend API:** [GraphQL endpoints used]

**Loose Coupling Strategies:**

- [Strategy 1]
- [Strategy 2]

## Technology Stack

- **React 19** - [Why/how used]
- **Vite** - [Build configuration specifics]
- **TanStack Router** - [Routing approach]
- **TanStack Query** - [Data fetching patterns]
- **[Other Tech]** - [Purpose]

## Development

### Prerequisites

- Node.js >= 20
- pnpm >= 10.4.1
- [Any other prerequisites]

### Local Development

#### Standalone Mode (Recommended for focused development)

```bash
cd apps/management-ui-[app-name]
pnpm dev
```

Access at: `http://127.0.0.1:[port]`

**Standalone Features:**

- Full provider context (router, auth, plugins, query client)
- Fast hot reload
- Independent from core shell
- Isolated testing

#### Integrated Mode (With core shell)

```bash
# From monorepo root
pnpm dev
```

Access at: `http://127.0.0.1:3000/[route-path]`

### Build

```bash
# Production build
pnpm build

# Preview production build
pnpm preview

# Type checking
pnpm check-types

# Linting
pnpm lint
```

### Environment Variables

```bash
# .env.local
VITE_PROXY_TARGET=http://your-backend-url
GRAPHQL_ENDPOINT=/graphql
# [Other variables]
```

## User Interface

### Main Views

#### [View 1: Name]

**Purpose:** [What this view does]

**URL:** `/[route]`

**Features:**

- [Feature 1]
- [Feature 2]

**Screenshot/Diagram:**

```
[ASCII diagram or description]
```

#### [View 2: Name]

[Repeat for each major view]

### Component Structure

```
src/
├── App.tsx                     # Main app component
├── components/                 # UI components
│   ├── [Component1].tsx       # [Purpose]
│   ├── [Component2].tsx       # [Purpose]
│   └── [ComponentN].tsx       # [Purpose]
├── hooks/                      # Custom React hooks
│   ├── use[Hook1].ts          # [Purpose]
│   └── use[Hook2].ts          # [Purpose]
└── main.tsx                    # Entry point
```

### State Management

**Strategy:** [How state is managed in this app]

- **Server State:** TanStack Query for [data types]
- **UI State:** [Local state, context, or store]
- **Form State:** [Form management approach]

**State Flow:**

```
[Diagram or description of state flow]
```

## Data Management

### Data Models

#### [Model 1 Name]

```typescript
interface Model1 {
  id: string;
  property1: string;
  property2: number;
  // ... properties
}
```

**Used in:** [Where this model is used]

#### [Model 2 Name]

[Repeat for key data models]

### GraphQL Queries

#### [Query Name]

**Purpose:** [What data this fetches]

```graphql
query QueryName {
  field {
    subfield
  }
}
```

**Used in:** [Which components use this]

### Data Fetching Patterns

```typescript
// Example of data fetching in this app
import { use[DataHook] } from '@oc-mui/query';

function Component() {
  const { data, isLoading, error } = use[DataHook]();

  // Component logic
}
```

## Plugin Integration & Extension Points

### Extension Points Consumed

This app uses the following extension points:

- **`[extension:point]`** - [How used, fallback behavior]
- **`[extension:point]`** - [How used, fallback behavior]

### Extension Points Provided

This app provides the following extension points for customization:

#### `[app-name]:[extension-point]`

**Purpose:** [What can be customized]

**Default Implementation:** [What happens by default]

**Customization Example:**

```typescript
// In university plugin
manager.registerComponent("[app-name]:[extension-point]", CustomComponent);
```

### University Customization Examples

#### Custom [Feature]

```typescript
// Example from TU Wien or UniVie
// plugins/[university]/implementations/[feature]/
```

[Explain how universities can customize this app]

## Routing

### Route Structure

```
/[base-route]/
├── /                          # [View name]
├── /:id                       # [View name]
├── /:id/edit                  # [View name]
└── /[other-routes]            # [View name]
```

### Route Configuration

```typescript
// Route definition example
const routes = [
  {
    path: "/[route]",
    component: ViewComponent,
    permissions: ["permission.required"],
  },
];
```

## Security & Permissions

### Permission Model

- **`[permission.name]`** - [What this permission grants]
- **`[permission.name]`** - [What this permission grants]

### Access Control

```typescript
// How permissions are checked in this app
```

### Data Validation

- **Client-side:** [Validation approach]
- **Server-side:** [What backend validates]

## Integration Points

### With Other Applications

- **[App Name]:** [How they integrate, data shared]
- **[App Name]:** [How they integrate, data shared]

### With Core Shell

- **Navigation:** [How navigation works]
- **Authentication:** [How auth is handled]
- **Plugin System:** [How plugins are loaded]

### With Backend Services

- **[Service Name]:** [What API endpoints used]
- **[Service Name]:** [What API endpoints used]

### With External Systems

[If applicable - integrations with LMS, video processing, etc.]

## Testing

### Testing Strategy

- **Unit Tests:** [What is unit tested]
- **Integration Tests:** [What is integration tested]
- **E2E Tests:** [What is E2E tested]

### Running Tests

```bash
# Unit tests
pnpm test

# Integration tests
pnpm test:integration

# E2E tests
pnpm test:e2e

# Coverage
pnpm test:coverage
```

### Testing Patterns

```typescript
// Example test structure
import { render, screen } from '@testing-library/react';
import { Component } from './Component';

describe('Component', () => {
  it('should render expected content', () => {
    render(<Component />);
    expect(screen.getByText('Expected')).toBeInTheDocument();
  });
});
```

## Performance Considerations

- **Bundle Size:** [Approximate size and optimization strategies]
- **Lazy Loading:** [What is lazy loaded]
- **Memoization:** [Where React.memo or useMemo is critical]
- **Data Caching:** [TanStack Query caching strategy]

## Accessibility

### WCAG Compliance

- **Level:** [AA or AAA]
- **Keyboard Navigation:** [How supported]
- **Screen Readers:** [ARIA labels, semantic HTML]
- **Color Contrast:** [Compliance]

### Testing Accessibility

```bash
# Accessibility linting
pnpm lint:a11y

# Manual testing checklist
- [ ] Keyboard navigation works
- [ ] Screen reader announces correctly
- [ ] Color contrast meets standards
- [ ] Focus management is clear
```

## Deployment

### Build Process

```bash
# Build for production
pnpm build

# Output location
dist/
```

### Configuration

[Any production configuration needed]

### Environment-Specific Settings

- **Development:** [Config]
- **Staging:** [Config]
- **Production:** [Config]

## Troubleshooting

### Common Issues

#### [Issue 1]

**Symptoms:** [What user sees]

**Cause:** [Why it happens]

**Solution:** [How to fix]

#### [Issue 2]

[Repeat for common issues]

## File Structure

```
apps/management-ui-[app-name]/
├── src/
│   ├── components/             # React components
│   │   ├── [Feature]/         # Feature-specific components
│   │   └── shared/            # Shared components
│   ├── hooks/                  # Custom hooks
│   │   ├── use[Data].ts       # Data fetching hooks
│   │   └── use[UI].ts         # UI-related hooks
│   ├── routes/                 # Route components (if using file-based)
│   ├── types/                  # TypeScript types
│   ├── utils/                  # Utility functions
│   ├── App.tsx                 # Main component
│   └── main.tsx                # Entry point
├── public/                     # Static assets
├── index.html                  # HTML template
├── vite.config.ts              # Vite configuration
├── package.json
├── tsconfig.json
└── README.md                   # This file
```

## Contributing

### Development Guidelines

1. **Component Design:** [Guidelines specific to this app]
2. **State Management:** [Patterns to follow]
3. **Plugin Integration:** [How to add extension points]
4. **Testing:** [Testing requirements]

### Adding New Features

1. **Check scope:** Does this feature belong in this app?
2. **Design for plugins:** Can universities customize this?
3. **Consider permissions:** What access controls needed?
4. **Add tests:** Unit, integration, and E2E as appropriate
5. **Update docs:** This README and any affected docs
6. **Consider performance:** Impact on bundle size and runtime

### Code Review Checklist

- [ ] Follows existing patterns
- [ ] Includes tests
- [ ] Documentation updated
- [ ] Accessibility considered
- [ ] Plugin extension points provided
- [ ] TypeScript types are correct
- [ ] No console.log or debugging code
- [ ] Performance considered

## Related Documentation

- [Application Architecture Overview](/apps/README.md)
- [Plugin System](/plugins/README.md)
- [Package Documentation](/packages/README.md)
- [Adding Apps Workflow](/docs/workflows/ADDING_APPS.md)

## Changelog

### [Next Version]

- [Upcoming features or changes]

### 1.0.0 (YYYY-MM-DD)

- Initial release
- [Feature 1]
- [Feature 2]

## License

[License information]
