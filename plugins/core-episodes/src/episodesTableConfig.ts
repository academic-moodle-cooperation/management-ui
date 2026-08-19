import {
  getColumnLabelOverrides,
  getColumnVisibilityDefaults,
  normalizeColumnConfigs,
  resolveColumnLabel as resolveColumnLabelGeneric,
  resolveColumnMeta as resolveColumnMetaGeneric,
} from "@oc-mui/ui/components";
import type { ColumnLabelOverrides, ResolvedColumnConfig } from "@oc-mui/ui/components";
import type { AppConfig } from "@oc-mui/ui-config";

import { episodesConfig, type EpisodesTable as EpisodesTableConfig } from "./config";

export type EpisodesLayout = "list" | "gallery";

// The generic per-column config semantics live in @oc-mui/ui (shared with the
// series table, #372); this module keeps the episode-specific view resolution
// and re-exports the helpers under their established names.
export type ResolvedEpisodesColumnConfig = ResolvedColumnConfig;
export type EpisodesColumnLabelOverride = ColumnLabelOverrides[string];
export type EpisodesColumnLabelOverrides = ColumnLabelOverrides;

export interface ResolvedEpisodesViewConfig {
  enabled: boolean;
  columns: ResolvedColumnConfig[];
}

export const resolveEpisodesViewConfig = (
  tableConfig: EpisodesTableConfig | undefined,
  layout: EpisodesLayout,
): ResolvedEpisodesViewConfig => {
  const viewConfig = tableConfig?.views?.[layout];
  const columns = viewConfig?.columns ?? tableConfig?.columns;

  return {
    enabled: viewConfig?.enabled ?? true,
    columns: normalizeColumnConfigs(columns),
  };
};

export const getEpisodesTableConfig = (config: AppConfig | undefined) => {
  const tableConfig = episodesConfig.read(config).episodesTable;

  return {
    list: resolveEpisodesViewConfig(tableConfig, "list"),
    gallery: resolveEpisodesViewConfig(tableConfig, "gallery"),
  };
};

export const getEpisodesColumnLabelOverrides = getColumnLabelOverrides;
export const getEpisodesVisibilityDefaults = getColumnVisibilityDefaults;
export const resolveColumnLabel = resolveColumnLabelGeneric;
export const resolveColumnMeta = resolveColumnMetaGeneric;
