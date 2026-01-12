import { useMemo } from "react";
import { TableBody, TableCell, TableRow } from "@workspace/ui/components";
import { EmptyStateContent } from "./data-table-empty-state";
import { useRouter } from "@workspace/router";
import { ColumnDef, flexRender, Row, Table } from "@tanstack/react-table";

interface DataTableBodyProps<TData, TValue> {
  table: Table<TData>;
  columns: ColumnDef<TData, TValue>[];
  className?: string;
  selectedId?: string;
  onClickRowAction?: (event: React.MouseEvent<HTMLTableRowElement>, row: Row<TData>) => void;
  queryFilter?: string;
}

function DataTableBody<TData extends Record<string, unknown>, TValue>({
  table,
  columns,
  className,
  selectedId,
  onClickRowAction,
  queryFilter,
}: DataTableBodyProps<TData, TValue>) {
  const router = useRouter();

  // Get current path for empty state detection
  const pathname = useMemo(() => router.parseLocation().pathname, [router]);

  return (
    <TableBody className={className}>
      {table.getRowModel().rows?.length ? (
        table.getRowModel().rows.map((row) => (
          <TableRow
            key={row.id}
            data-state={
              row.getIsSelected() || (selectedId && row.original.id === selectedId)
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
            <EmptyStateContent queryFilter={queryFilter} pathname={pathname} />
          </TableCell>
        </TableRow>
      )}
    </TableBody>
  );
}

export { DataTableBody };
