import { flexRender } from "@tanstack/react-table";

import { useUiRouter } from "../router-context";
import { TableBody, TableCell, TableRow } from "../ui";

import { EmptyStateContent } from "./data-table-empty-state";

import type { ColumnDef, Row, Table } from "@tanstack/react-table";

interface DataTableBodyProps<TData, TValue> {
  table: Table<TData>;
  columns: ColumnDef<TData, TValue>[];
  className?: string | undefined;
  selectedId?: string | undefined;
  onClickRowAction?:
    | ((event: React.MouseEvent<HTMLTableRowElement>, row: Row<TData>) => void)
    | undefined;
  queryFilter?: string | undefined;
}

function DataTableBody<TData extends Record<string, unknown>, TValue>({
  table,
  columns,
  className,
  selectedId,
  onClickRowAction,
  queryFilter,
}: DataTableBodyProps<TData, TValue>) {
  // Current path for empty-state detection (host-injected; see router-context).
  const { usePathname } = useUiRouter();
  const pathname = usePathname();

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
              pathname={pathname}
            />
          </TableCell>
        </TableRow>
      )}
    </TableBody>
  );
}

export { DataTableBody };
