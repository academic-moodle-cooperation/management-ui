# TU Wien Upload ACL Editor Plugin

This plugin provides an Access Control List (ACL) editor integration for the upload interface, following TU Wien's plugin architecture conventions.

## Overview

The TU Wien Upload ACL Editor plugin extends the upload application by adding an ACL editor component that allows users to configure access permissions for their uploads before processing.

## Features

- **Seamless Integration**: Plugs into the upload workflow using the TU Wien plugin system
- **Accordion UI**: Space-efficient accordion interface that fits naturally in the upload form
- **Real-time ACL Management**: Live updates to ACL data as users make changes
- **Series Context Awareness**: Integrates with selected series context
- **Upload Workflow Optimization**: Designed specifically for the upload use case

## Architecture

### Plugin Structure

```
plugins/tuwien/implementations/upload-acl-editor/
├── index.ts                          # Plugin registration and configuration
├── components/
│   └── TUWienUploadAclEditor.tsx     # Main ACL editor component
└── README.md                         # Documentation (this file)
```

### Plugin Registration

The plugin is registered in the TU Wien plugin system as:

- **Namespace**: `tuwien`
- **Type**: `upload-acl-editor`
- **Extension Point**: `upload:acl-editor`

## Integration

### Extension Point

This plugin implements the `upload:acl-editor` extension point defined in the core upload extension points. The extension point expects:

```typescript
interface UploadAclEditorProps {
  aclData?: AclData | null;
  onAclChange?: (aclData: AclData) => void;
  selectedSeries?: SelectedElement | null;
  disabled?: boolean;
  refetch?: () => void;
}
```

### Usage in Upload App

The plugin is automatically loaded and registered when the upload app initializes. It appears in the upload form between the series selection and the upload button.

## Component Details

### TUWienUploadAclEditor

The main component that provides the ACL editing interface:

#### Props

- `aclData`: Current ACL configuration
- `onAclChange`: Callback for ACL data changes
- `selectedSeries`: Currently selected series for context
- `disabled`: Whether the editor should be disabled
- `refetch`: Function to refresh data

#### Features

- Accordion-based UI for space efficiency
- Integration with existing AclEditor component
- Proper state management for upload context
- User-friendly feedback for ACL changes

## Development

### Adding Features

To extend the ACL editor functionality:

1. Modify the `TUWienUploadAclEditor` component
2. Update the props interface if needed
3. Ensure compatibility with the existing AclEditor component
4. Test integration with the upload workflow

### Testing

The plugin should be tested in the context of:

- Upload workflow with and without series selection
- ACL data changes and persistence
- UI responsiveness and accessibility
- Plugin loading and unloading

## Dependencies

- `@workspace/ui/components` - For AclEditor and UI components
- `@workspace/i18n` - For internationalization
- `@workspace/plugin-system` - For plugin infrastructure

## Conventions

This plugin follows TU Wien plugin conventions:

- Consistent naming patterns (`tuwien*Implementation`)
- Proper plugin lifecycle management
- Standard component structure and props
- Documentation and maintainability focus
