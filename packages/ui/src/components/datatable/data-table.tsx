import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
  type OnChangeFn,
  type Row,
  type VisibilityState,
} from "@tanstack/react-table";
import React from "react";

import { useComponentTheme } from "../../theme/theme.context";
import { Table, TableHead, TableHeader, TableRow } from "../ui";

import { DataTableBody } from "./data-table-body";
import { DataTablePagination } from "./data-table-pagination";
import { DataTableToolbar } from "./data-table-toolbar";
// Import the hook from the new location
import { useTableNavigation } from "./hooks";

export interface DataTableProps<TData, TValue> {
  /** Table column definitions */
  columns: ColumnDef<TData, TValue>[];
  /** Data to display in the table */
  data: TData[];
  /** Callback for row click actions */
  onClickRowAction?:
    | ((event: React.MouseEvent<HTMLTableRowElement>, row: Row<TData>) => void)
    | undefined;
  /** ID of the currently selected row */
  selectedId?: string | undefined;

  /** Whether pagination is handled manually (outside the table) */
  manualPagination: boolean;
  /** Current page size */
  pageSize: number;
  /** Function to set page size */
  setPageSize: (size: number) => void;
  /** Total number of pages */
  pageCount: number;
  /** Current page index (0-based) */
  pageIndex: number;
  /** Function to set page index */
  setPageIndex: (index: number) => void;
  /** Total number of rows */
  totalRows: number;

  /** Current sorting state */
  sorting?: SortingState | undefined;
  /** Function to update sorting */
  setSorting?: OnChangeFn<SortingState> | undefined;
  /** Whether sorting is handled manually */
  manualSorting?: boolean | undefined;

  /** Current filter query */
  queryFilter: string | undefined;
  /** Function to update filter query */
  setQueryFilter: (filter: string | undefined) => void;

  /** Current column visibility state */
  columnVisibility?: VisibilityState | undefined;
  /** Function to update column visibility */
  setColumnVisibility?: OnChangeFn<VisibilityState> | undefined;

  /** Function to refetch data */
  refetch?: (() => void) | undefined;
  /** Custom design button (e.g., layout toggle) */
  designButton?: React.ReactNode;
  /** Custom buttons rendered at toolbar end (right of reload) */
  toolbarEndButtons?: React.ReactNode;
}

/**
 * Data table component with sorting, filtering, and pagination
 */
function DataTable<TData extends Record<string, unknown>, TValue>({
  columns,
  data,
  selectedId,
  onClickRowAction,
  manualPagination,
  pageSize,
  setPageSize,
  pageCount: controlledPageCount,
  pageIndex,
  setPageIndex,
  totalRows,
  sorting,
  setSorting,
  manualSorting,
  queryFilter,
  setQueryFilter,
  columnVisibility,
  setColumnVisibility,
  refetch,
  designButton,
  toolbarEndButtons,
}: DataTableProps<TData, TValue>) {
  // Initialize table instance - hooks must be called before any early returns
  const table = useReactTable({
    data: data || [],
    columns,
    state: {
      ...(sorting !== undefined && { sorting }),
      ...(columnVisibility !== undefined && { columnVisibility }),
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    ...(manualPagination !== undefined && { manualPagination }),
    pageCount: controlledPageCount || -1,
    getSortedRowModel: getSortedRowModel(),
    ...(setSorting !== undefined && { onSortingChange: setSorting }),
    ...(manualSorting !== undefined && { manualSorting }),
    ...(setColumnVisibility !== undefined && { onColumnVisibilityChange: setColumnVisibility }),
  });

  const theme = useComponentTheme("Table");

  // Create navigation helpers using the imported hook
  const tableNavigation = useTableNavigation(
    pageIndex,
    table.getPageCount(),
    setPageIndex,
    totalRows,
  );

  if (!data) {
    return null;
  }

  return (
    <>
      <DataTableToolbar
        table={table}
        queryFilter={queryFilter}
        setQueryFilter={setQueryFilter}
        setPageIndex={setPageIndex}
        refetch={refetch}
        designButton={designButton}
        toolbarEndButtons={toolbarEndButtons}
      />
      <div
        className={theme.wrapper({
          borderStyle: "solid",
          outerBorders: true,
          radius: "md",
        })}
      >
        <Table className={theme.table({ size: "md" })}>
          <TableHeader className={theme.thead({ size: "md", headerColor: "gray" })}>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <DataTableBody
            table={table}
            className={theme.tbody({ size: "xs" })}
            columns={columns}
            selectedId={selectedId}
            onClickRowAction={onClickRowAction}
            queryFilter={queryFilter}
          />
        </Table>
      </div>
      <DataTablePagination
        table={table}
        goToFirstPage={tableNavigation.goToFirstPage}
        goToNextPage={tableNavigation.goToNextPage}
        goToPreviousPage={tableNavigation.goToPreviousPage}
        goToLastPage={tableNavigation.goToLastPage}
        canPreviousPage={tableNavigation.canPreviousPage}
        canNextPage={tableNavigation.canNextPage}
        pageIndex={pageIndex}
        totalRows={totalRows}
        pageSize={pageSize}
        setPageSize={setPageSize}
      />
    </>
  );
}

export { DataTable, type ColumnDef, type VisibilityState, type SortingState, type OnChangeFn };
