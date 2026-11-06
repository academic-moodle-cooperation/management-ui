import { flexRender } from "@tanstack/react-table";

import { TableBody, TableCell, TableRow } from "../ui";

import type { Row, Table } from "@tanstack/react-table";

interface DataTableBodyProps<TData> {
  table: Table<TData>;
  className?: string | undefined;
  selectedId?: string | undefined;
  onClickRowAction?:
    | ((event: React.MouseEvent<HTMLTableRowElement>, row: Row<TData>) => void)
    | undefined;
}

function DataTableBody<TData extends Record<string, unknown>>({
  table,
  className,
  selectedId,
  onClickRowAction,
}: DataTableBodyProps<TData>) {
  return (
    <TableBody className={className}>
      {table.getRowModel().rows.map((row) => (
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
      ))}
    </TableBody>
  );
}

export { DataTableBody };
