# Management UI Episodes

The **Individual Episode Management** application for the Management UI ecosystem. This application provides detailed tools for managing individual video episodes, their metadata, transcripts, and publishing workflows within educational video series.

## 🎯 Purpose

The Episodes application handles:

- **Episode-Level Management** - Detailed management of individual video episodes
- **Rich Metadata Editing** - Comprehensive metadata forms with validation
- **Transcript Management** - Upload, edit, and sync video transcripts
- **Publishing Workflows** - University-specific approval and publishing processes
- **Media Integration** - Connection with video processing and storage systems

## 🏗️ Architecture

### Integration with Management UI Ecosystem

```
┌─────────────────────────────────────────────────┐
│ Series Context                                  │
│ ↓ Selected Series                               │
├─────────────────────────────────────────────────┤
│ Management UI Core (Appshell)                   │
├─────────────────────────────────────────────────┤
│ Route: /series/{id}/episodes                    │
│ ↓ Loads Management UI Episodes                  │
├─────────────────────────────────────────────────┤
│ Management UI Episodes                          │
│ ├─ Episode List & Detail Views                  │
│ ├─ Metadata & Transcript Editing                │
│ ├─ Publishing & Workflow Management             │
│ ├─ Media Preview & Processing Status            │
│ └─ University-Specific Customizations           │
└─────────────────────────────────────────────────┘
```

### Key Features

1. **Episode Management**
   - Create and edit individual episode information
   - Rich metadata forms with validation
   - Episode ordering and organization within series
   - Bulk operations on multiple episodes

2. **Content Processing**
   - Video upload status and processing progress
   - Thumbnail generation and selection
   - Transcript upload, editing, and synchronization
   - Quality checking and validation

3. **Publishing Workflows**
   - University-specific approval processes
   - Publishing status tracking
   - Access control and permissions management
   - Scheduled publishing and content lifecycle

## 🚀 Development

### Prerequisites

- Node.js >= 20
- pnpm >= 10.4.1
- Access to Management UI Core and Series apps

### Local Development

```bash
# From monorepo root
pnpm dev

# Or run only this app (requires core to be running)
cd apps/management-ui-episodes
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
- **TanStack Router** - Type-safe routing for episode navigation
- **TanStack Query** - Server state management for episode data
- **TanStack Table** - Advanced data tables for episode lists
- **Lucide React** - Consistent iconography
- **@workspace packages** - Shared infrastructure and UI components

## 📊 Data Management

### Episode Data Model

```typescript
interface Episode {
  id: string;
  seriesId: string;
  title: string;
  description?: string;
  duration?: string; // ISO 8601 duration format
  order: number;
  
  // Media information
  media: {
    videoUrl?: string;
    thumbnailUrl?: string;
    processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
    uploadProgress?: number;
  };
  
  // Rich metadata
  metadata: {
    speakers: string[];
    topics: string[];
    language: string;
    recordingDate?: Date;
    location?: string;
    // University-specific fields via plugins
    [key: string]: unknown;
  };
  
  // Transcript information
  transcript?: {
    content: string;
    language: string;
    synchronized: boolean;
    lastModified: Date;
  };
  
  // Publishing workflow
  workflow: {
    status: 'draft' | 'review' | 'approved' | 'published' | 'archived';
    approvals: ApprovalRecord[];
    publishDate?: Date;
    archiveDate?: Date;
  };
  
  // Access control
  permissions: {
    view: string[];
    edit: string[];
    approve: string[];
  };
  
  createdAt: Date;
  updatedAt: Date;
}
```

### State Management

- **Episode Data**: TanStack Query for server state management
- **Form State**: Local state for complex metadata forms
- **Upload Progress**: Real-time upload status tracking
- **Workflow State**: Approval and publishing process tracking

## 🎨 University Customization

### Plugin Integration

Universities can extensively customize episode management:

#### Custom Metadata Fields

```typescript
// Add university-specific episode metadata
manager.registerObject('episodes:metadata-fields', 'university-episode-fields', {
  courseCode: {
    type: 'text',
    label: 'Course Code',
    pattern: /^[A-Z]{3}\d{3}$/,
    required: true
  },
  lectureNumber: {
    type: 'number',
    label: 'Lecture Number',
    min: 1,
    max: 50
  },
  examRelevant: {
    type: 'boolean',
    label: 'Exam Relevant Content'
  }
});
```

#### Custom Workflows

```typescript
// Define university-specific publishing workflow
manager.registerObject('episodes:workflows', 'university-publishing', {
  name: 'Academic Review Process',
  steps: [
    { 
      name: 'Created',
      status: 'draft',
      description: 'Episode created by instructor'
    },
    {
      name: 'Department Review',
      status: 'dept-review',
      required: true,
      permissions: ['department.review'],
      timeout: '7d'
    },
    {
      name: 'Quality Check',
      status: 'quality-check',
      required: true,
      permissions: ['media.quality'],
      timeout: '3d'
    },
    {
      name: 'Published',
      status: 'published',
      permissions: ['content.publish']
    }
  ]
});
```

#### Custom Components

```typescript
// Replace episode editor with university-specific version
manager.registerComponent('episodes:editor', UniversityEpisodeEditor, {
  priority: 10
});

// Add custom transcript editor
manager.registerComponent('episodes:transcript-editor', CustomTranscriptEditor);
```

## 📱 User Interface

### Main Views

1. **Episode List** - Tabular list of episodes with sorting and filtering
2. **Episode Detail** - Comprehensive episode information and editing
3. **Episode Editor** - Rich form for creating and editing episodes
4. **Transcript Editor** - Specialized interface for transcript management
5. **Publishing Dashboard** - Workflow and approval status overview

### Advanced Features

- **Drag-and-Drop Reordering** - Visual episode sequence management
- **Bulk Operations** - Select and modify multiple episodes
- **Real-Time Updates** - Live processing status and collaboration
- **Rich Text Editing** - WYSIWYG editors for descriptions and transcripts

## 🔒 Security & Permissions

### Episode-Level Security

- **View Permissions**: Control episode visibility
- **Edit Permissions**: Restrict episode modification
- **Approval Permissions**: Manage publishing workflows
- **Transcript Permissions**: Separate access for transcript editing

### Data Validation

- **Metadata validation**: Ensure required fields and formats
- **File validation**: Verify transcript file formats and sizes  
- **Workflow validation**: Enforce approval process requirements
- **University-specific rules**: Custom validation through plugins

## 📚 Integration Points

### With Other Applications

- **Series App**: Parent-child relationship and navigation
- **Upload App**: Media file association and processing status
- **Core App**: Shared authentication, navigation, and plugins

### With External Systems

- **Video Processing**: Transcoding status and quality metrics
- **Learning Management Systems**: Content syndication and grading
- **Transcript Services**: Automated transcript generation
- **Analytics Systems**: Usage tracking and engagement metrics

## 🎥 Media Management

### Video Processing Integration

```typescript
// Monitor video processing status
const { data: processingStatus } = useProcessingStatus(episodeId);

// Handle upload progress
const { uploadFile, progress } = useVideoUpload({
  onSuccess: (videoUrl) => updateEpisode({ videoUrl }),
  onError: (error) => showError(error.message)
});
```

### Transcript Management

- **Manual Upload**: Support for VTT, SRT, and plain text formats
- **Auto-Generation**: Integration with speech-to-text services
- **Synchronization**: Timeline-based transcript editing
- **Multi-Language**: Support for multiple transcript languages

## 🧪 Testing

```bash
# Unit tests for components and utilities
pnpm test

# Integration tests with mock APIs
pnpm test:integration

# E2E tests for complete workflows
pnpm test:e2e
```

### Testing Focus Areas

- **Form Validation**: Complex metadata form testing
- **Workflow Transitions**: Publishing process testing
- **File Upload**: Media and transcript upload testing
- **Permissions**: Access control verification
- **University Customizations**: Plugin compatibility testing

## 📁 File Structure

```
apps/management-ui-episodes/
├── src/
│   ├── components/              # Episode-specific React components
│   │   ├── EpisodeList.tsx      # Episode listing component
│   │   ├── EpisodeDetail.tsx    # Detailed episode view
│   │   ├── EpisodeEditor.tsx    # Episode creation/editing
│   │   ├── MetadataForm.tsx     # Rich metadata forms
│   │   ├── TranscriptEditor.tsx # Transcript management
│   │   ├── WorkflowStatus.tsx   # Publishing workflow display
│   │   └── MediaPreview.tsx     # Video preview component
│   ├── hooks/                   # Episode-specific React hooks
│   │   ├── useEpisodes.ts       # Episode data management
│   │   ├── useEpisodeWorkflow.ts # Workflow state management
│   │   ├── useTranscripts.ts    # Transcript operations
│   │   └── useMediaUpload.ts    # File upload handling
│   ├── routes/                  # Application routes
│   │   ├── index.tsx            # Route definitions
│   │   ├── EpisodesList.tsx     # List view route
│   │   ├── EpisodeDetail.tsx    # Detail view route
│   │   └── EpisodeEdit.tsx      # Edit form route
│   ├── types/                   # TypeScript definitions
│   │   ├── Episode.ts           # Episode type definitions
│   │   ├── Workflow.ts          # Workflow type definitions
│   │   └── Transcript.ts        # Transcript type definitions
│   ├── utils/                   # Episode-specific utilities
│   │   ├── validation.ts        # Form validation helpers
│   │   ├── formatting.ts        # Data formatting utilities
│   │   └── workflow.ts          # Workflow helper functions
│   └── main.tsx                 # Application entry point
├── public/                      # Static assets
├── package.json
├── vite.config.ts
└── README.md
```

## 🤝 Contributing

### Development Guidelines

1. **Form Design**: Create accessible, intuitive metadata forms
2. **Real-Time Updates**: Implement optimistic updates and error handling
3. **Plugin Extension Points**: Ensure all major features can be customized
4. **Performance**: Optimize for large episode lists and media files
5. **Accessibility**: Full keyboard navigation and screen reader support

### Adding New Features

1. **Design for Customization**: How can universities modify this feature?
2. **Consider Workflows**: How does this fit into approval processes?
3. **Plan for Scale**: Will this work with thousands of episodes?
4. **Test Thoroughly**: Include edge cases and error scenarios
5. **Document Extension Points**: Help universities customize effectively

This Episodes application provides the detailed episode management capabilities needed for comprehensive educational video content management while maintaining the flexibility required by diverse academic institutions.