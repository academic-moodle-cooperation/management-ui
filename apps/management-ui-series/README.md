# Management UI Series

The **Video Series Management** application for the Management UI ecosystem. This application provides comprehensive tools for creating, organizing, and managing video content series within educational institutions.

## 🎯 Purpose

The Series application handles:

- **Series Creation & Management** - Create and organize video content into logical series
- **Metadata Management** - Rich metadata editing for series-level information
- **Content Organization** - Hierarchical organization of episodes within series
- **University Customization** - Plugin-based customization for institution-specific workflows
- **Access Control** - Integration with university permission systems

## 🏗️ Architecture

### Integration with Management UI Core

```
┌─────────────────────────────────────────────────┐
│ Management UI Core (Appshell)                   │
├─────────────────────────────────────────────────┤
│ Route: /series                                  │
│ ↓ Loads Management UI Series                    │
├─────────────────────────────────────────────────┤
│ Management UI Series                            │
│ ├─ Series List & Grid Views                     │
│ ├─ Series Creation & Editing                    │
│ ├─ Metadata Management                          │
│ ├─ Episode Organization                         │
│ └─ University Customizations                    │
└─────────────────────────────────────────────────┘
```

### Key Features

1. **Series Management**
   - Create new video series with rich metadata
   - Edit existing series information and settings
   - Organize episodes within series structure
   - Archive and manage series lifecycle

2. **Content Organization**
   - Hierarchical content structure (Series → Episodes)
   - Drag-and-drop episode reordering
   - Bulk operations on multiple series
   - Search and filtering capabilities

3. **University Integration**
   - Custom metadata fields through plugin system
   - Institution-specific approval workflows
   - University branding and theme integration
   - Custom validation rules and business logic

## 🚀 Development

### Prerequisites

- Node.js >= 20
- pnpm >= 10.4.1
- Access to Management UI Core for shared components

### Local Development

```bash
# From monorepo root
pnpm dev

# Or run only this app (requires core to be running)
cd apps/management-ui-series
pnpm dev
```

### Build

```bash
# Production build
pnpm build

# Type checking
pnpm check-types

# Linting
pnpm lint
```

## 🔧 Technology Stack

- **React 19** - Modern React with concurrent features
- **Vite** - Fast development server and optimized builds
- **TanStack Router** - Type-safe routing within the series context
- **TanStack Query** - Server state management for series data
- **Lucide React** - Icon library for consistent UI
- **@workspace packages** - Shared UI components, utilities, and plugin system

## 📊 Data Management

### Series Data Model

```typescript
interface Series {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  metadata: {
    creator: string;
    department: string;
    language: string;
    tags: string[];
    // University-specific fields via plugins
    [key: string]: unknown;
  };
  episodes: Episode[];
  permissions: {
    view: string[];
    edit: string[];
    admin: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### State Management

- **Local State**: Component-level state for UI interactions
- **Server State**: TanStack Query for series data fetching and caching
- **Global State**: Shared state through @workspace/store for cross-app data

## 🎨 University Customization

### Plugin Integration

Universities can customize the series application through plugins:

#### Custom Metadata Fields

```typescript
// Add university-specific metadata fields
manager.registerObject('series:metadata-fields', 'university-fields', {
  department: {
    type: 'select',
    label: 'Department',
    options: ['Computer Science', 'Mathematics', 'Physics'],
    required: true
  },
  funding: {
    type: 'text',
    label: 'Funding Source',
    validation: /^[A-Z]{2}-\d{4}$/
  }
});
```

#### Custom Workflows

```typescript
// Add university-specific approval workflow
manager.registerObject('series:workflows', 'university-approval', {
  name: 'Department Approval',
  steps: [
    { name: 'Created', status: 'draft' },
    { name: 'Department Review', status: 'review', permissions: ['dept.review'] },
    { name: 'Published', status: 'published', permissions: ['content.publish'] }
  ]
});
```

#### Custom Views

```typescript
// Replace series list view with university-specific implementation
manager.registerComponent('series:list-view', UniversitySeriesListView, {
  priority: 10
});
```

## 📱 User Interface

### Main Views

1. **Series Dashboard** - Overview of all series with statistics
2. **Series List** - Filterable and sortable list of all series
3. **Series Grid** - Visual grid view with thumbnails
4. **Series Editor** - Rich editor for creating and editing series
5. **Series Detail** - Detailed view with episode management

### Responsive Design

- **Desktop**: Full-featured interface with sidebar navigation
- **Tablet**: Adaptive layout with collapsible sidebars
- **Mobile**: Touch-optimized interface with bottom navigation

## 🔒 Security & Permissions

### Access Control

- **View Permissions**: Control who can see series
- **Edit Permissions**: Control who can modify series
- **Admin Permissions**: Control who can manage series settings
- **University Integration**: Connect with institutional permission systems

### Data Validation

- **Client-side Validation**: Immediate feedback on form inputs
- **Server-side Validation**: Secure validation of all data modifications
- **Custom Validators**: University-specific validation rules through plugins

## 📚 Integration Points

### With Other Apps

- **Episodes App**: Deep integration for episode management within series
- **Upload App**: Connection for associating uploaded content with series
- **Core App**: Shared navigation, authentication, and layout

### With External Systems

- **University SSO**: Authentication integration
- **Learning Management Systems**: Content syndication
- **Media Processing**: Video transcoding and storage integration

## 🧪 Testing

```bash
# Unit tests for components and utilities
pnpm test

# Integration tests with mock API
pnpm test:integration

# E2E tests across university configurations
pnpm test:e2e
```

### Testing Strategy

- **Component Testing**: React Testing Library for UI components
- **State Management**: Testing with mocked queries and mutations
- **University Variations**: Test with different plugin configurations
- **Accessibility**: Automated accessibility testing with axe

## 📁 File Structure

```
apps/management-ui-series/
├── src/
│   ├── components/              # Series-specific React components
│   │   ├── SeriesList.tsx       # List view component
│   │   ├── SeriesGrid.tsx       # Grid view component
│   │   ├── SeriesEditor.tsx     # Series creation/editing
│   │   ├── MetadataForm.tsx     # Metadata input forms
│   │   └── EpisodeManager.tsx   # Episode organization
│   ├── hooks/                   # Series-specific React hooks
│   │   ├── useSeries.ts         # Series data fetching
│   │   ├── useSeriesMetadata.ts # Metadata management
│   │   └── useSeriesPermissions.ts # Permission checking
│   ├── routes/                  # Application routes
│   │   ├── index.tsx            # Route definitions
│   │   ├── SeriesDashboard.tsx  # Dashboard route
│   │   ├── SeriesList.tsx       # List view route
│   │   └── SeriesDetail.tsx     # Detail view route
│   ├── types/                   # TypeScript type definitions
│   ├── utils/                   # Series-specific utilities
│   └── main.tsx                 # Application entry point
├── public/                      # Static assets
├── package.json
├── vite.config.ts
└── README.md
```

## 🤝 Contributing

### Guidelines

1. **Follow component patterns** - Use established patterns from @workspace/ui
2. **Plugin compatibility** - Ensure changes work with university customizations
3. **Test comprehensively** - Include tests for all new features
4. **Document changes** - Update documentation for any new functionality
5. **Consider accessibility** - Ensure all features are accessible

### Adding New Features

1. **Design plugin integration** - How can universities customize this feature?
2. **Implement with extension points** - Use the plugin system for customization
3. **Test with university plugins** - Verify compatibility with existing customizations
4. **Update documentation** - Document new plugin extension points

This Series application provides the foundation for comprehensive video content organization while maintaining the flexibility needed for diverse university requirements.