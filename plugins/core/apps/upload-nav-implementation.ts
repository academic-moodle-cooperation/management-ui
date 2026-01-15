import { createPlugin, type PluginManager } from "@workspace/plugin-system";
import { UploadCloud } from "@workspace/ui/components";

/**
 * Upload Navigation Implementation
 * Provides navigation item for the Upload app
 *
 * Usage in upload app:
 * import { uploadNavImplementation } from '@workspace/plugins';
 * manager.register(uploadNavImplementation);
 */
export const uploadNavImplementation = createPlugin({
  namespace: "upload",
  type: "navigation",
  version: "1.0.0",

  initialize(manager: PluginManager) {
    manager.registerObject("sidebar:nav-items", "upload", {
      title: "Upload",
      path: "/upload",
      icon: UploadCloud,
      order: 40, // After Series (20) and Episodes (30)
      permissions: ["upload.create"],
      featureFlags: [],
      category: "content",
    });
  },

  activate() {},

  deactivate() {},
});
