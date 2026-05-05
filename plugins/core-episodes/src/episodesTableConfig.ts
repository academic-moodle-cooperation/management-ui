import type { TableColumnItem } from "@workspace/ui/config-primitives";
import type { AppConfig } from "@workspace/ui-config";

import { episodesConfig, type EpisodesTable as EpisodesTableConfig } from "./config";

export type EpisodesLayout = "list" | "gallery";

export interface ResolvedEpisodesColumnConfig {
  key: string;
  show: boolean;
  label?: string;
  labelKey?: string;
}

export interface ResolvedEpisodesViewConfig {
  enabled: boolean;
  columns: ResolvedEpisodesColumnConfig[];
}

export interface EpisodesColumnLabelOverride {
  label?: string;
  labelKey?: string;
}

export type EpisodesColumnLabelOverrides = Record<string, EpisodesColumnLabelOverride>;

const normalizeColumnConfig = (
  column: TableColumnItem | undefined,
): ResolvedEpisodesColumnConfig | null => {
  if (!column || typeof column !== "object") {
    return null;
  }

  const key = Object.keys(column)[0];
  if (!key) {
    return null;
  }

  const field = column[key];
  if (!field) {
    return null;
  }

  return {
    key,
    show: field.show === true,
    ...(field.label && { label: field.label }),
    ...(field.labelKey && { labelKey: field.labelKey }),
  };
};

const normalizeColumns = (columns: TableColumnItem[] | undefined): ResolvedEpisodesColumnConfig[] =>
  (columns ?? [])
    .map((column) => normalizeColumnConfig(column))
    .filter((column): column is ResolvedEpisodesColumnConfig => Boolean(column));

export const resolveEpisodesViewConfig = (
  tableConfig: EpisodesTableConfig | undefined,
  layout: EpisodesLayout,
): ResolvedEpisodesViewConfig => {
  const viewConfig = tableConfig?.views?.[layout];
  const columns = viewConfig?.columns ?? tableConfig?.columns;

  return {
    enabled: viewConfig?.enabled ?? true,
    columns: normalizeColumns(columns),
  };
};

export const getEpisodesTableConfig = (config: AppConfig | undefined) => {
  const tableConfig = episodesConfig.read(config).episodesTable;

  return {
    list: resolveEpisodesViewConfig(tableConfig, "list"),
    gallery: resolveEpisodesViewConfig(tableConfig, "gallery"),
  };
};

export const getEpisodesColumnLabelOverrides = (
  columns: ResolvedEpisodesColumnConfig[],
): EpisodesColumnLabelOverrides =>
  columns.reduce<EpisodesColumnLabelOverrides>((acc, column) => {
    if (!column.label && !column.labelKey) {
      return acc;
    }

    acc[column.key] = {
      ...(column.label && { label: column.label }),
      ...(column.labelKey && { labelKey: column.labelKey }),
    };

    return acc;
  }, {});

export const resolveColumnLabel = (
  overrides: EpisodesColumnLabelOverrides,
  columnKey: string,
  fallbackLabelKey: string,
  translate: (key: string) => string,
) => {
  const override = overrides[columnKey];

  if (override?.label) {
    return override.label;
  }

  return translate(override?.labelKey ?? fallbackLabelKey);
};

export const resolveColumnMeta = (
  overrides: EpisodesColumnLabelOverrides,
  columnKey: string,
  fallbackLabelKey: string,
) => {
  const override = overrides[columnKey];

  return {
    ...(!override?.label && { translatedTitle: override?.labelKey ?? fallbackLabelKey }),
    ...(override?.label && { resolvedTitle: override.label }),
  };
};
