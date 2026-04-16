import type { AppConfig } from "@workspace/query";
import type { AppProtectionConfig } from "@workspace/router";
import type { MetadataItem, TableColumnItem } from "@workspace/ui/config-primitives";

export interface SeriesInfo {
  metadata: MetadataItem[];
}

export interface SeriesTable {
  columns: TableColumnItem[];
  createSeries?: {
    enabled?: boolean;
  };
}

export interface SeriesConfig {
  seriesInfo?: SeriesInfo;
  seriesTable?: SeriesTable;
  protection?: AppProtectionConfig;
}

export const SERIES_PLUGIN_ID = "series";

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

export function readSeriesConfig(config: AppConfig | undefined): SeriesConfig | undefined {
  return config?.plugins?.[SERIES_PLUGIN_ID] as SeriesConfig | undefined;
}
