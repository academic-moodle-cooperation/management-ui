import { createPlugin } from "@workspace/plugin-system";
import type { PluginManager } from "@workspace/plugin-system";

import { UploadAclEditor } from "./components/UploadAclEditor";

/**
 * TU Wien Upload ACL Editor Implementation Plugin
 * University-specific ACL editor integration for the upload interface
 *
 * This plugin provides an ACL (Access Control List) editor that integrates
 * into the upload UI, allowing users to configure access permissions for
 * their uploads before they are processed.
 */
export const tuwienUploadAclEditorImplementation = createPlugin({
  namespace: "tuwien",
  type: "upload-acl-editor",
  version: "1.0.0",

  initialize(manager: PluginManager) {
    // Register the ACL Editor component for the upload interface
    manager.registerComponent("upload:acl-editor", UploadAclEditor, {
      key: "tuwien-upload-acl-editor",
      order: 50, // Standard priority for TU Wien implementations
    });
  },

  activate() {},

  deactivate() {},
});
