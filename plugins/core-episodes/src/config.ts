import type { AppConfig } from "@workspace/query";
import type { AppProtectionConfig } from "@workspace/router";
import type {
  MetadataItem,
  TableColumnItem,
  TableViewConfig,
} from "@workspace/ui/config-primitives";

/**
 * Episodes plugin config shape.
 *
 * The core `AppConfig.plugins` map is untyped (`Record<string, unknown>`) by
 * design, so each plugin owns its own slice and casts from `unknown` through
 * {@link readEpisodesConfig}. Once Phase 2b / Commit 4 lands, the shape is
 * also enforced at runtime via a Zod schema defined alongside this file.
 */

export interface EpisodeInfo {
  metadata: MetadataItem[];
}

export interface EpisodesTable {
  columns?: TableColumnItem[];
  views?: {
    list?: TableViewConfig;
    gallery?: TableViewConfig;
  };
}

export interface EpisodesConfig {
  episodeInfo?: EpisodeInfo;
  episodesTable?: EpisodesTable;
  protection?: AppProtectionConfig;
}

export const EPISODES_PLUGIN_ID = "episodes";

/**
 * Defaults contributed by this plugin on startup via the
 * `app:config:defaults` extension point. They sit *below* the fetched
 * `config.json` and any `app:config` overlays so a deployment can override
 * any key without having to re-specify the rest. Kept small and declarative
 * so the registration in `initialize()` stays readable; Commit 4 will drive
 * this through a Zod schema so unrecognised keys produce warnings.
 */
export const episodesConfigDefaults: EpisodesConfig = {
  protection: { public: false },
  episodeInfo: {
    metadata: [
      { title: { show: true, readonly: false } },
      { subject: { show: true, readonly: false } },
      { startDate: { show: true, readonly: false } },
      { source: { show: true, readonly: false } },
      { rightsHolder: { show: true, readonly: false } },
      { publisher: { show: true, readonly: true } },
      { location: { show: true, readonly: false } },
      { license: { show: true, readonly: false } },
      { language: { show: true, readonly: false } },
      { isPartOf: { show: true, readonly: false } },
      { identifier: { show: true, readonly: true } },
      { duration: { show: true, readonly: false } },
      { description: { show: true, readonly: false } },
      { creator: { show: true, readonly: true } },
      { created: { show: true, readonly: true } },
      { contributor: { show: true, readonly: false } },
    ],
  },
  episodesTable: {
    views: {
      list: { enabled: true },
      gallery: { enabled: true },
    },
    columns: [
      { title: { show: true } },
      { seriesName: { show: true } },
      { description: { show: true } },
      { contributors: { show: true } },
      { creator: { show: true } },
      { created: { show: true } },
      { eventStatus: { show: true } },
      { duration: { show: true } },
      { location: { show: true } },
      { presenters: { show: true } },
      { startDate: { show: true } },
      { actions: { show: true } },
    ],
  },
};

/**
 * Typed accessor for the episodes slice of `AppConfig.plugins`.
 *
 * The core type is intentionally `unknown` so the runtime contract is owned
 * by this plugin alone. Until the Zod migration we perform a structural cast;
 * callers that need a guaranteed value should `?? episodesConfigDefaults`
 * their sub-reads.
 */
export function readEpisodesConfig(config: AppConfig | undefined): EpisodesConfig | undefined {
  return config?.plugins?.[EPISODES_PLUGIN_ID] as EpisodesConfig | undefined;
}
