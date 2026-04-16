import { UploadCloud } from "lucide-react";

import { createPlugin, type PluginManager } from "@workspace/plugin-system";

import { App } from "./App";

/**
 * Core Upload Plugin
 *
 * Registers the `/upload` route and its sidebar navigation entry through
 * the public plugin API. Replaces the legacy `apps/management-ui-upload`
 * Vite app + the separate `upload-nav-implementation.ts` plugin, per
 * ADR-003.
 *
 * Nested paths like `/upload/:seriesId` are served by the shell's
 * DynamicRouterProvider, which automatically creates a `$routeSubPath`
 * child route under every app definition. Inside the app, reading the
 * param via `useParams({ strict: false })` (see App.tsx) works
 * unchanged.
 *
 * The app `id` remains `"management-ui-upload"` so that existing
 * `config.plugins["management-ui-upload"]` lookups keep working during
 * the Phase 3 migration.
 */
export const coreUploadPlugin = createPlugin({
  namespace: "upload",
  type: "app",
  version: "1.0.0",

  initialize(manager: PluginManager) {
    manager.registerObject("apps:definitions", "management-ui-upload", {
      id: "management-ui-upload",
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
  },

  activate() {},

  deactivate() {},
});

export default coreUploadPlugin;
