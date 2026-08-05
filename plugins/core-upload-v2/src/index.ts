import { UploadCloud } from "lucide-react";

import { createPlugin, type PluginManager } from "@oc-mui/plugin-system";

import { App } from "./App";
import { uploadV2Config } from "./config";

/**
 * Upload v2.
 *
 * Runs alongside the original `upload` plugin on its own route so both can be
 * enabled at once during the test phase. Every registration ID is `upload-v2`
 * — reusing `upload` would collide with v1 and fail lint.
 *
 * When v1 is retired, the route moves to `/upload` and v1 is deleted; the
 * package keeps its name, because renaming it would be a major bump with a
 * deprecation cycle for a purely cosmetic gain.
 */
export const coreUploadV2Plugin = createPlugin({
  namespace: "upload-v2",
  type: "app",
  version: "1.0.0",

  initialize(manager: PluginManager) {
    manager.registerObject("apps:definitions", "upload-v2", {
      id: "upload-v2",
      name: "Upload (v2)",
      routePath: "/upload-v2",
      component: App,
    });

    manager.registerObject("sidebar:nav-items", "upload-v2", {
      title: "Upload (v2)",
      path: "/upload-v2",
      icon: UploadCloud,
      order: 41,
      permissions: ["upload.create"],
      featureFlags: [],
      category: "content",
    });

    uploadV2Config.register(manager);
  },

  activate() {},

  deactivate() {},
});

export default coreUploadV2Plugin;
