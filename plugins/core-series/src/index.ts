import { GraduationCap, ListVideo } from "lucide-react";

import { CREATE_SERIES_VARIANTS, type CreateSeriesVariant } from "@oc-mui/plugin-core";
import { createPlugin, type PluginManager } from "@oc-mui/plugin-system";

import App from "./App";
import { CreateSeriesAction } from "./components/CreateSeriesAction";
import { DefaultCreateSeriesVariant } from "./components/DefaultCreateSeriesVariant";
import { DemoCourseVariant } from "./components/DemoCourseVariant";
import { seriesConfig } from "./config";

/**
 * Core Series Plugin
 *
 * Registers the `/series` route, its sidebar navigation entry, the
 * "Create series" action (toolbar placement) and the default create-series
 * variant through the public plugin API.
 *
 * The app `id` is `"series"`, matching the plugin namespace and the short
 * key in `config.plugins["series"]`.
 */
export const coreSeriesPlugin = createPlugin({
  namespace: "series",
  type: "app",
  version: "1.0.0",

  initialize(manager: PluginManager) {
    manager.registerObject("apps:definitions", "series", {
      id: "series",
      name: "Series",
      routePath: "/series",
      component: App,
    });

    manager.registerObject("sidebar:nav-items", "series", {
      title: "common:series",
      path: "/series",
      icon: ListVideo,
      order: 20,
      permissions: ["series.view"],
      featureFlags: [],
      category: "content",
    });

    // Rendered only when `createSeries.placement` is "toolbar"; the default
    // placement renders the same component next to the page heading.
    manager.registerObject("series:table:toolbar-end-actions", "create-series", {
      id: "create-series",
      order: 100,
      component: CreateSeriesAction,
    });

    // PREVIEW ONLY (see DemoCourseVariant.tsx); disable with
    // createSeries.variants["demo-course"].enabled = false.
    manager.registerObject(CREATE_SERIES_VARIANTS, "demo-course", {
      id: "demo-course",
      order: 10,
      label: "LV-Serie (Demo)",
      description: "Für eine Lehrveranstaltung aus i3v. Titel und Semester werden übernommen.",
      icon: GraduationCap,
      component: DemoCourseVariant,
    } satisfies CreateSeriesVariant);

    manager.registerObject(CREATE_SERIES_VARIANTS, "default", {
      id: "default",
      order: 100,
      label: "series:seriesTable.createSeries.variants.default.label",
      description: "series:seriesTable.createSeries.variants.default.description",
      component: DefaultCreateSeriesVariant,
    } satisfies CreateSeriesVariant);

    seriesConfig.register(manager);
  },

  activate() {},

  deactivate() {},
});

export default coreSeriesPlugin;
