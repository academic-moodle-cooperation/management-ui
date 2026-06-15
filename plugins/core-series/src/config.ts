import { z } from "zod";

import { definePluginConfig } from "@opencast-mui/query";

/**
 * Series plugin config — same pattern as `plugins/core-episodes/config.ts`.
 * See that file for the rationale behind using a reader object instead of
 * direct `config.plugins[id]` access.
 */

export const SERIES_PLUGIN_ID = "series";

const metadataFieldSchema = z.object({
  show: z.boolean(),
  readonly: z.boolean(),
});
const metadataItemSchema = z.record(z.string(), metadataFieldSchema);

const columnsFieldSchema = z.object({
  show: z.boolean(),
  label: z.string().optional(),
  labelKey: z.string().optional(),
});
const tableColumnItemSchema = z.record(z.string(), columnsFieldSchema);

export const seriesConfigSchema = z.object({
  seriesInfo: z
    .object({
      metadata: z.array(metadataItemSchema),
    })
    .optional(),
  seriesTable: z
    .object({
      columns: z.array(tableColumnItemSchema).optional(),
      createSeries: z
        .object({
          enabled: z.boolean().optional(),
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

export type SeriesConfig = z.infer<typeof seriesConfigSchema>;
export type SeriesInfo = NonNullable<SeriesConfig["seriesInfo"]>;
export type SeriesTable = NonNullable<SeriesConfig["seriesTable"]>;

export const seriesConfigDefaults: SeriesConfig = {
  protection: { public: false },
  seriesInfo: {
    metadata: [
      { title: { show: true, readonly: false } },
      { subject: { show: true, readonly: false } },
      { rightsHolder: { show: true, readonly: false } },
      { publisher: { show: true, readonly: false } },
      { license: { show: true, readonly: false } },
      { language: { show: true, readonly: false } },
      { identifier: { show: true, readonly: true } },
      { description: { show: true, readonly: false } },
      { creator: { show: true, readonly: true } },
      { contributor: { show: true, readonly: false } },
    ],
  },
  seriesTable: {
    createSeries: { enabled: true },
    columns: [
      { title: { show: true } },
      { created: { show: true } },
      { description: { show: true } },
      { creator: { show: true } },
      { contributors: { show: true } },
      { events: { show: true } },
      { actions: { show: true } },
    ],
  },
};

export const seriesConfig = definePluginConfig({
  id: SERIES_PLUGIN_ID,
  schema: seriesConfigSchema,
  defaults: seriesConfigDefaults,
});
