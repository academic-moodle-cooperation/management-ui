import { UploadCloud } from "lucide-react";

import { createPlugin, type PluginManager } from "@opencast-mui/plugin-system";

import { App } from "./App";
import { uploadConfig } from "./config";

/**
 * Core Upload Plugin
 *
 * Registers the `/upload` route and its sidebar navigation entry through
 * the public plugin API.
 *
 * Nested paths like `/upload/:seriesId` are served by the shell's
 * DynamicRouterProvider, which automatically creates a `$routeSubPath`
 * child route under every app definition. Inside the app, reading the
 * param via `useParams({ strict: false })` (see App.tsx) works
 * unchanged.
 *
 * The app `id` is `"upload"`, matching the plugin namespace and the short
 * key in `config.plugins["upload"]`.
 */
export const coreUploadPlugin = createPlugin({
  namespace: "upload",
  type: "app",
  version: "1.0.0",

  initialize(manager: PluginManager) {
    manager.registerObject("apps:definitions", "upload", {
      id: "upload",
      name: "Upload",
      routePath: "/upload",
      component: App,
    });

    manager.registerObject("sidebar:nav-items", "upload", {
      title: "Upload",
      path: "/upload",
      icon: UploadCloud,
      order: 40,
      permissions: ["upload.create"],
      featureFlags: [],
      category: "content",
    });

    uploadConfig.register(manager);
  },

  activate() {},

  deactivate() {},
});

export default coreUploadPlugin;
