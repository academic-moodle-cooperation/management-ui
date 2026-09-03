import { z } from "zod";

import { definePluginConfig } from "@oc-mui/query";

/**
 * Episodes plugin config.
 *
 * The Zod schema is the single source of truth for the slice shape and
 * is consumed by {@link definePluginConfig} at the bottom of the file.
 * Components obtain the validated slice through `episodesConfig.use()`
 * (or `episodesConfig.read(config)` outside React) — direct reads via
 * `useAppConfig().config.plugins.episodes` bypass validation — the
 * `local/no-cross-plugin-config` lint rule flags them (#323).
 */

export const EPISODES_PLUGIN_ID = "episodes";
export const channel = "download";
export const tags = "engage-download";

/** Per-field metadata visibility contract (show/readonly). */
const metadataFieldSchema = z.object({
  show: z.boolean(),
  readonly: z.boolean(),
});

/**
 * `MetadataItem` entries are `{ [fieldName]: metadataField }` objects; we
 * keep them as records (rather than a flat object) so the list order
 * defined by the deployment is preserved — plugins render metadata in
 * array order, not key order.
 */
const metadataItemSchema = z.record(z.string(), metadataFieldSchema);

/** Per-column table display contract; `label` wins over `labelKey`. */
const columnsFieldSchema = z.object({
  show: z.boolean(),
  label: z.string().optional(),
  labelKey: z.string().optional(),
});

const tableColumnItemSchema = z.record(z.string(), columnsFieldSchema);

const tableViewConfigSchema = z.object({
  enabled: z.boolean().optional(),
  columns: z.array(tableColumnItemSchema).optional(),
});

export const episodesConfigSchema = z.object({
  episodeInfo: z
    .object({
      metadata: z.array(metadataItemSchema),
    })
    .optional(),
  episodesTable: z
    .object({
      columns: z.array(tableColumnItemSchema).optional(),
      views: z
        .object({
          list: tableViewConfigSchema.optional(),
          gallery: tableViewConfigSchema.optional(),
        })
        .optional(),
    })
    .optional(),
  protection: z
    .object({
      public: z.boolean().optional(),
    })
    .optional(),
});

export type EpisodesConfig = z.infer<typeof episodesConfigSchema>;
export type EpisodeInfo = NonNullable<EpisodesConfig["episodeInfo"]>;
export type EpisodesTable = NonNullable<EpisodesConfig["episodesTable"]>;

/**
 * Defaults contributed via `app:config:defaults` on plugin initialize.
 * Merged below the fetched `config.json` and any `app:config` overlays,
 * so a deployment can override any key without re-specifying the rest.
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
      gallery: {
        enabled: true,
        // The gallery's out-of-the-box look: the combined cells plus the
        // columns it has always shown. The rest of the gallery pool (single
        // variants of the combined cells, thumbnail) starts hidden but stays
        // in the View menu; a deployment's own `views.gallery.columns`
        // replaces this list wholesale (#373).
        columns: [
          { video: { show: true } },
          { seriesName: { show: true } },
          { dateAndLocation: { show: true } },
          { presenters: { show: true } },
          { isPublic: { show: true } },
          { actions: { show: true } },
        ],
      },
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
      { isPublic: { show: true } },
      { actions: { show: true } },
    ],
  },
};

/**
 * Single reader for this plugin's slice. Call `.register(manager)` in
 * `initialize()` to seed defaults, and `.use()` / `.read(config)` to
 * consume the validated slice from component or non-React code.
 */
export const episodesConfig = definePluginConfig({
  id: EPISODES_PLUGIN_ID,
  schema: episodesConfigSchema,
  defaults: episodesConfigDefaults,
});
