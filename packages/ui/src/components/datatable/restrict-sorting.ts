import type { ColumnDef } from "@tanstack/react-table";

/**
 * Extract the field id a column maps to.
 *
 * String accessors (`columnHelper.accessor("title", …)`) carry an
 * `accessorKey`; function accessors and display columns carry an
 * explicit `id`. Returns `undefined` for columns with neither.
 */
function columnFieldId<TData, TValue>(column: ColumnDef<TData, TValue>): string | undefined {
  if ("accessorKey" in column && typeof column.accessorKey === "string") {
    return column.accessorKey;
  }
  return column.id;
}

/**
 * Disable sorting on every column whose field isn't in `sortableFields`.
 *
 * The backend only accepts a fixed set of fields in its `*OrderByInput`
 * types. A column that maps to a field outside that set must not show a
 * sort control — clicking it would send an `orderBy` variable the server
 * rejects. Feed in the backend's sortable-field list (exported from
 * `@oc-mui/query`, e.g. `EVENT_SORTABLE_FIELDS`) and this flips
 * `enableSorting: false` on any column that isn't in it.
 *
 * `DataTableColumnHeader` already renders a plain, non-interactive label
 * when `!column.getCanSort()`, so disabled columns lose their sort button
 * too — not just the broken behaviour behind it.
 *
 * Columns that set `enableSorting` explicitly are left untouched: an
 * author who wrote `enableSorting: false` (or `true`) meant it, and
 * deriving the flag should never override an explicit decision.
 *
 * @param columns        The column definitions to process.
 * @param sortableFields The backend-orderable field names.
 * @returns A new array; input columns are not mutated.
 */
export function restrictSortingToFields<TData, TValue>(
  columns: ColumnDef<TData, TValue>[],
  sortableFields: readonly string[],
): ColumnDef<TData, TValue>[] {
  const allowed = new Set(sortableFields);
  return columns.map((column) => {
    if (column.enableSorting !== undefined) return column;
    const id = columnFieldId(column);
    if (id !== undefined && !allowed.has(id)) {
      return { ...column, enableSorting: false };
    }
    return column;
  });
}
