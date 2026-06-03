import { flexRender } from "@tanstack/react-table";

import { TableBody, TableCell, TableRow } from "../ui";

import { EmptyStateContent } from "./data-table-empty-state";

import type { ColumnDef, Row, Table } from "@tanstack/react-table";
import type { ReactNode } from "react";

interface DataTableBodyProps<TData, TValue> {
  table: Table<TData>;
  columns: ColumnDef<TData, TValue>[];
  className?: string | undefined;
  selectedId?: string | undefined;
  onClickRowAction?:
    | ((event: React.MouseEvent<HTMLTableRowElement>, row: Row<TData>) => void)
    | undefined;
  queryFilter?: string | undefined;
  /** Empty state rendered when there are no rows and no active filter. */
  emptyState?: ReactNode | undefined;
}

function DataTableBody<TData extends Record<string, unknown>, TValue>({
  table,
  columns,
  className,
  selectedId,
  onClickRowAction,
  queryFilter,
  emptyState,
}: DataTableBodyProps<TData, TValue>) {
  return (
    <TableBody className={className}>
      {table.getRowModel().rows?.length ? (
        table.getRowModel().rows.map((row) => (
          <TableRow
            key={row.id}
            data-state={
              row.getIsSelected() || (selectedId && row.original["id"] === selectedId)
                ? "selected"
                : undefined
            }
            onClick={(event) => {
              table.resetRowSelection();
              row.toggleSelected(true);
              onClickRowAction && onClickRowAction(event, row);
            }}
            tabIndex={0}
          >
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id} className={"h-[53px] py-0"}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))
      ) : (
        <TableRow>
          <TableCell colSpan={columns.length} className="h-24 text-center">
            <EmptyStateContent
              {...(queryFilter !== undefined && { queryFilter })}
              {...(emptyState !== undefined && { emptyState })}
            />
          </TableCell>
        </TableRow>
      )}
    </TableBody>
  );
}

export { DataTableBody };
