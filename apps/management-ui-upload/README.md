# Management UI Upload

The **Content Upload and Processing** application for the Management UI ecosystem. This application provides a comprehensive file upload system with progress tracking, validation, processing pipelines, and university-specific access control integration.

## 🎯 Purpose

The Upload application handles:

- **Multi-File Upload** - Batch upload of video files, transcripts, and media assets
- **Progress Tracking** - Real-time upload progress with detailed status information
- **File Validation** - Format checking, size limits, and content validation
- **Processing Pipelines** - Video transcoding, thumbnail generation, and quality checks
- **Access Control Integration** - University-specific ACL systems and permissions
- **Error Handling** - Comprehensive error recovery and user feedback

## 🏗️ Architecture

### Integration with Management UI Ecosystem

```
┌─────────────────────────────────────────────────┐
│ Management UI Core (Appshell)                   │
├─────────────────────────────────────────────────┤
│ Route: /upload                                  │
│ ↓ Loads Management UI Upload                    │
├─────────────────────────────────────────────────┤
│ Management UI Upload                            │
│ ├─ File Upload Interface                        │
│ ├─ Progress Tracking & Monitoring               │
│ ├─ Processing Pipeline Status                   │
│ ├─ University ACL Integration                   │
│ └─ Error Handling & Recovery                    │
├─────────────────────────────────────────────────┤
│ Backend Processing                              │
│ ├─ Video Transcoding                            │
│ ├─ Thumbnail Generation                         │
│ ├─ Quality Validation                           │
│ └─ Storage Management                           │
└─────────────────────────────────────────────────┘
```

### Key Features

1. **Advanced Upload System**
   - Drag-and-drop file interface
   - Multiple file selection and batching
   - Resume interrupted uploads
   - Chunked upload for large files

2. **Processing Integration**
   - Real-time processing status updates
   - Video transcoding progress tracking
   - Thumbnail generation and preview
   - Quality metrics and validation

3. **University Customization**
   - Pluggable ACL systems (TU Wien, UniVie, etc.)
   - Custom validation rules
   - Institution-specific upload workflows
   - Branded upload interfaces

## 🚀 Development

### Prerequisites

- Node.js >= 20
- pnpm >= 10.4.1
- Access to backend processing services
- University ACL system integration

### Local Development

```bash
# From monorepo root
pnpm dev

# Or run only this app (requires core and backend)
cd apps/management-ui-upload
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
- **Vite** - Fast development server and build system
- **TanStack Table** - Advanced data tables for upload management
- **TanStack Query** - Server state management for upload tracking
- **Mustache** - Template engine for dynamic content generation
- **Lucide React** - Consistent iconography
- **@workspace packages** - Shared infrastructure and plugin system

## 📊 Data Management

### Upload Data Model

```typescript
interface Upload {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  type: string; // MIME type
  
  // Upload progress
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed';
  progress: {
    uploaded: number;
    total: number;
    percentage: number;
    speed?: number; // bytes per second
    estimatedTimeRemaining?: number; // seconds
  };
  
  // Processing information
  processing: {
    stage: 'validation' | 'transcoding' | 'thumbnails' | 'quality_check' | 'completed';
    progress: number;
    logs: ProcessingLog[];
    error?: string;
  };
  
  // File information
  metadata: {
    duration?: string; // for video files
    resolution?: { width: number; height: number };
    codec?: string;
    bitrate?: number;
    checksum: string;
  };
  
  // Access control
  acl: {
    owner: string;
    permissions: Record<string, string[]>; // role -> permissions
    inheritFrom?: string; // parent series/folder ID
  };
  
  // University-specific data
  custom: Record<string, unknown>;
  
  createdAt: Date;
  updatedAt: Date;
}
```

### State Management

- **Upload Queue**: Real-time tracking of multiple concurrent uploads
- **Processing Status**: Live updates from backend processing services
- **Error State**: Comprehensive error handling and recovery options
- **ACL Integration**: University permission system integration

## 🎨 University Customization

### Plugin Integration

Universities can customize the upload system extensively:

#### Custom ACL Systems

```typescript
// TU Wien ACL integration
manager.registerObject('upload:acl-provider', 'tuwien-acl', {
  name: 'TU Wien Access Control',
  
  async validatePermissions(userId: string, action: string): Promise<boolean> {
    // Custom TU Wien permission checking logic
    return tuWienAclService.checkPermission(userId, action);
  },
  
  async getAvailableGroups(userId: string): Promise<Group[]> {
    // Get TU Wien groups for ACL assignment
    return tuWienAclService.getUserGroups(userId);
  },
  
  renderAclEditor: TuWienAclEditor // Custom ACL editor component
});
```

#### Custom Validation Rules

```typescript
// University-specific file validation
manager.registerObject('upload:validation-rules', 'university-validation', {
  fileTypes: {
    video: ['.mp4', '.mov', '.avi'],
    transcript: ['.vtt', '.srt', '.txt'],
    thumbnail: ['.jpg', '.png', '.webp']
  },
  
  maxSizes: {
    video: '2GB',
    transcript: '10MB',
    thumbnail: '5MB'
  },
  
  customValidators: [
    {
      name: 'course-code-required',
      validate: (file, metadata) => {
        // Require course code in filename for academic content
        return /^[A-Z]{3}\d{3}[-_]/.test(file.name);
      },
      message: 'Filename must start with course code (e.g., CS101_lecture01.mp4)'
    }
  ]
});
```

#### Custom Upload Workflows

```typescript
// University-specific upload processing workflow
manager.registerObject('upload:workflows', 'university-processing', {
  name: 'Academic Content Processing',
  
  stages: [
    {
      name: 'Initial Validation',
      handler: 'validate-academic-content',
      timeout: '30s'
    },
    {
      name: 'Virus Scanning',
      handler: 'university-virus-scan',
      timeout: '5m'
    },
    {
      name: 'Content Analysis',
      handler: 'analyze-educational-content',
      timeout: '10m'
    },
    {
      name: 'Transcoding',
      handler: 'university-transcoding',
      timeout: '30m'
    }
  ],
  
  notifications: {
    onComplete: ['email:creator', 'webhook:lms'],
    onError: ['email:admin', 'slack:it-support']
  }
});
```

## 📱 User Interface

### Main Views

1. **Upload Dashboard** - Overview of all uploads with status
2. **File Drop Zone** - Drag-and-drop upload interface
3. **Upload Queue** - Real-time progress tracking
4. **Processing Monitor** - Detailed processing status
5. **ACL Manager** - Permission and access control settings

### Advanced Features

- **Batch Operations** - Select and manage multiple uploads
- **Resume Uploads** - Recover from network interruptions
- **Preview Generation** - Real-time thumbnail and preview creation
- **Error Recovery** - Automatic retry with exponential backoff

## 🔒 Security & Access Control

### Upload Security

- **File Validation**: Comprehensive security scanning and validation
- **Size Limits**: Configurable per file type and user role
- **Content Scanning**: Integration with university security systems
- **Secure Storage**: Encrypted storage with access logging

### ACL Integration

The upload system integrates with multiple university ACL systems:

#### TU Wien Integration

```typescript
// TU Wien specific ACL editor component
const TuWienAclEditor = ({ uploadId, currentAcl, onChange }) => {
  const { data: groups } = useTuWienGroups();
  
  return (
    <div className="acl-editor">
      <h3>TU Wien Access Control</h3>
      
      <div className="permission-groups">
        {groups?.map(group => (
          <PermissionGroup
            key={group.id}
            group={group}
            permissions={currentAcl.permissions[group.id] || []}
            onChange={(perms) => onChange(group.id, perms)}
          />
        ))}
      </div>
      
      <div className="inheritance-settings">
        <label>
          <input
            type="checkbox"
            checked={currentAcl.inheritFromSeries}
            onChange={(e) => onChange('inherit', e.target.checked)}
          />
          Inherit permissions from series
        </label>
      </div>
    </div>
  );
};
```

## 📊 Processing Integration

### Backend Processing Pipeline

```typescript
// Monitor processing status with real-time updates
const { data: processingStatus } = useUploadProcessing(uploadId, {
  refetchInterval: 1000, // Real-time updates
  enabled: status === 'processing'
});

// Handle processing stages
const ProcessingMonitor = ({ upload }) => {
  const currentStage = upload.processing.stage;
  const progress = upload.processing.progress;
  
  return (
    <div className="processing-monitor">
      <ProgressBar value={progress} />
      
      <div className="stage-indicator">
        <StageIcon stage={currentStage} />
        <span>{getStageDisplayName(currentStage)}</span>
      </div>
      
      {upload.processing.logs.map(log => (
        <LogEntry key={log.id} log={log} />
      ))}
    </div>
  );
};
```

### Quality Metrics

- **Video Quality Analysis**: Resolution, bitrate, codec validation
- **Audio Quality**: Audio levels, silence detection, format validation
- **Content Validation**: Duration limits, aspect ratio requirements
- **Accessibility**: Caption requirements, audio description checks

## 🧪 Testing

```bash
# Unit tests for upload components
pnpm test

# Integration tests with mock backend
pnpm test:integration

# E2E tests for complete upload workflows
pnpm test:e2e
```

### Testing Focus Areas

- **File Upload**: Various file types, sizes, and error conditions
- **Progress Tracking**: Real-time updates and error recovery
- **ACL Integration**: University-specific permission systems
- **Processing Pipeline**: Backend integration and status updates
- **Error Handling**: Network failures, timeout scenarios

## 📁 File Structure

```
apps/management-ui-upload/
├── src/
│   ├── components/              # Upload-specific React components
│   │   ├── UploadDropzone.tsx   # Drag-and-drop upload interface
│   │   ├── UploadQueue.tsx      # Progress tracking component
│   │   ├── ProcessingMonitor.tsx # Backend processing status
│   │   ├── AclEditor.tsx        # Access control management
│   │   ├── FileValidator.tsx    # File validation display
│   │   └── ErrorRecovery.tsx    # Error handling and retry
│   ├── hooks/                   # Upload-specific React hooks
│   │   ├── useFileUpload.ts     # File upload management
│   │   ├── useUploadProgress.ts # Progress tracking
│   │   ├── useProcessingStatus.ts # Backend processing
│   │   └── useAclIntegration.ts # University ACL systems
│   ├── services/                # Upload and processing services
│   │   ├── uploadService.ts     # Core upload functionality
│   │   ├── processingService.ts # Processing status tracking
│   │   ├── aclService.ts        # Access control integration
│   │   └── validationService.ts # File validation
│   ├── routes/                  # Application routes
│   │   ├── index.tsx            # Route definitions
│   │   ├── UploadDashboard.tsx  # Main upload interface
│   │   └── ProcessingStatus.tsx # Processing monitoring
│   ├── types/                   # TypeScript definitions
│   │   ├── Upload.ts            # Upload type definitions
│   │   ├── Processing.ts        # Processing type definitions
│   │   └── Acl.ts               # ACL type definitions
│   ├── utils/                   # Upload-specific utilities
│   │   ├── fileValidation.ts    # File validation helpers
│   │   ├── progressCalculation.ts # Progress calculation
│   │   └── errorHandling.ts     # Error recovery utilities
│   └── main.tsx                 # Application entry point
├── public/                      # Static assets
├── package.json
├── vite.config.ts
└── README.md
```

## 🤝 Contributing

### Development Guidelines

1. **Robust Error Handling**: Handle all possible upload and processing failures
2. **Real-Time Updates**: Implement efficient progress tracking and status updates
3. **Security First**: Validate all uploads and integrate with security systems
4. **University Flexibility**: Design for multiple ACL systems and workflows
5. **Performance**: Optimize for large files and concurrent uploads

### Adding New Features

1. **Consider Scale**: Will this work with hundreds of concurrent uploads?
2. **Security Review**: How does this affect file validation and access control?
3. **ACL Integration**: How can universities customize this feature?
4. **Error Scenarios**: What happens when this feature fails?
5. **Monitoring**: How can administrators track the health of this feature?

This Upload application provides the robust file upload and processing capabilities needed for educational video content management while supporting the diverse security and workflow requirements of different academic institutions.