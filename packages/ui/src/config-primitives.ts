/**
 * UI-level config primitives
 *
 * These shapes describe UI-visible contracts that multiple plugins share
 * (metadata field visibility, table column definitions, table view toggles).
 * They live here — alongside `@workspace/ui/hooks/createMetadataHelpers` and
 * the generic table/metadata components that consume them — so that neither
 * the core `@workspace/ui-config` package nor individual plugins own the type
 * that they all have to agree on.
 *
 * Plugins compose these primitives into their own config types (see
 * `plugins/core-episodes/src/config.ts` for an example).
 */

export interface MetadataField {
  show: boolean;
  readonly: boolean;
}

export interface ColumnsField {
  show: boolean;
  // The `| undefined` is deliberate: plugins derive these types from Zod
  // schemas (via `z.infer<>`) and Zod's `.optional()` includes `| undefined`.
  // With `exactOptionalPropertyTypes: true` the two wouldn't line up
  // otherwise, so we accept `undefined` explicitly.
  label?: string | undefined;
  labelKey?: string | undefined;
}

export type MetadataItem = Record<string, MetadataField>;
export type TableColumnItem = Record<string, ColumnsField>;

export interface TableViewConfig {
  enabled?: boolean | undefined;
  columns?: TableColumnItem[] | undefined;
}
