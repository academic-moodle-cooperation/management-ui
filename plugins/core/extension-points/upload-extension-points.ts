import { createPlugin, type PluginManager } from '@workspace/plugin-system';

/**
 * Upload Extension Points Plugin
 * Defines where and how the upload application can be extended by universities
 * 
 * Extension Points Defined:
 * - upload:acl-editor - ACL (Access Control List) editor for uploads
 * - upload:metadata-editor - Additional metadata fields for uploads
 * - upload:workflow-selector - Custom workflow selection
 * - upload:pre-upload-validation - Pre-upload validation hooks
 */
export const uploadExtensionPoints = createPlugin({
  namespace: 'core',
  type: 'upload-extension-points',
  version: '1.0.0',

  initialize(manager: PluginManager) {

    // Document available extension points

    // Register ACL Editor extension point
    manager.registerObject('extension-points:documentation', 'upload:acl-editor', {
      description: 'Access Control List editor for configuring upload permissions',
      expectedSchema: {
        aclData: 'AclData - Current ACL configuration',
        onAclChange: 'function - Callback when ACL data changes',
        selectedSeries: 'SelectedElement|null - Currently selected series',
        disabled: 'boolean - Whether the editor is disabled',
        refetch: 'function - Refetch function for data refresh'
      },
      examples: [
        {
          placement: 'Between series selection and upload button',
          description: 'ACL editor in accordion format for setting upload permissions'
        }
      ]
    });

    // Register Metadata Editor extension point
    manager.registerObject('extension-points:documentation', 'upload:metadata-editor', {
      description: 'Additional metadata fields for uploads',
      expectedSchema: {
        metadata: 'object - Current metadata',
        onMetadataChange: 'function - Callback when metadata changes',
        selectedSeries: 'SelectedElement|null - Currently selected series',
        files: 'UploadFileBlob[] - Files being uploaded'
      }
    });

    // Register Workflow Selector extension point
    manager.registerObject('extension-points:documentation', 'upload:workflow-selector', {
      description: 'Custom workflow selection for uploads',
      expectedSchema: {
        workflowId: 'string - Current workflow ID',
        onWorkflowChange: 'function - Callback when workflow changes',
        availableWorkflows: 'Workflow[] - Available workflow options'
      }
    });

    // Register Pre-upload Validation extension point
    manager.registerObject('extension-points:documentation', 'upload:pre-upload-validation', {
      description: 'Pre-upload validation hooks',
      expectedSchema: {
        files: 'UploadFileBlob[] - Files to validate',
        aclData: 'AclData - ACL configuration',
        selectedSeries: 'SelectedElement|null - Selected series',
        onValidationResult: 'function - Callback with validation results'
      }
    });

  },

  activate() {

  },

  deactivate() {

  }
});