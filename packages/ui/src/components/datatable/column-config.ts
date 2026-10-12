import type { TableColumnItem } from "../../config-primitives";

/**
 * Shared resolution for the per-column table config
 * (`columns: [{ <key>: { show, label?, labelKey? } }]`).
 *
 * Both table plugins consume this: the config's `show` is the *default*
 * visibility (the user's own toggles win on top), `label` is a literal
 * caption, `labelKey` a translation key resolved at render time. Lifted here
 * from the episodes plugin so the series table can use the identical
 * semantics without a cross-plugin import (#372).
 */

export interface ResolvedColumnConfig {
  key: string;
  show: boolean;
  label?: string;
  labelKey?: string;
}

export interface ColumnLabelOverride {
  label?: string;
  labelKey?: string;
}

export type ColumnLabelOverrides = Record<string, ColumnLabelOverride>;

const normalizeColumnConfig = (
  column: TableColumnItem | undefined,
): ResolvedColumnConfig | null => {
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

export const normalizeColumnConfigs = (
  columns: TableColumnItem[] | undefined,
): ResolvedColumnConfig[] =>
  (columns ?? [])
    .map((column) => normalizeColumnConfig(column))
    .filter((column): column is ResolvedColumnConfig => Boolean(column));

export const getColumnLabelOverrides = (columns: ResolvedColumnConfig[]): ColumnLabelOverrides =>
  columns.reduce<ColumnLabelOverrides>((acc, column) => {
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
  overrides: ColumnLabelOverrides,
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
  overrides: ColumnLabelOverrides,
  columnKey: string,
  fallbackLabelKey: string,
) => {
  const override = overrides[columnKey];

  return {
    ...(!override?.label && { translatedTitle: override?.labelKey ?? fallbackLabelKey }),
    ...(override?.label && { resolvedTitle: override.label }),
  };
};

/**
 * Config-declared default visibility, keyed by column id.
 *
 * Only columns the config names appear here — everything else keeps the
 * table's own default. This is a *default*, not a lock: the user's own
 * show/hide toggles are merged on top and win.
 */
export const getColumnVisibilityDefaults = (
  columns: ResolvedColumnConfig[],
): Record<string, boolean> =>
  columns.reduce<Record<string, boolean>>((acc, column) => {
    acc[column.key] = column.show;
    return acc;
  }, {});
