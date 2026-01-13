import { Settings2 } from "lucide-react";
import React from "react";

import { useI18n } from "@workspace/i18n";
import {
  DropdownMenuTrigger,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
 Button } from "@workspace/ui/components";

import type { Table, RowData } from "@tanstack/react-table";


interface DataTableViewOptionsProps<TData> {
  table: Table<TData>;
}
declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    translatedTitle: string;
  }
}

export function DataTableViewOptions<TData>({ table }: DataTableViewOptionsProps<TData>) {
  const { t } = useI18n();

  const [preventEditClose, setPreventEditClose] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        !preventEditClose && setOpen(open);
      }}
      open={open}
    >
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="hidden h-8 ml-auto lg:flex">
          <Settings2 className="w-4 h-4 mr-2" />
          {t("common:viewOptions")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[150px] sidebar-portal-inside"
        // TODO: This is a workaround to prevent the dropdown menu from closing when the user clicks on the table
        // still needed?
        onClick={() => {
          setPreventEditClose(true);
        }}
        onMouseEnter={() => {
          setPreventEditClose(true);
        }}
        onMouseLeave={() => {
          setPreventEditClose(false);
        }}
      >
        <DropdownMenuLabel>{t("toggleColumns")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {table
          .getAllColumns()
          .filter((column) => typeof column.accessorFn !== "undefined" && column.getCanHide())
          .map((column) => {
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="capitalize"
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                {t(column.columnDef.meta?.translatedTitle || column.id)}
              </DropdownMenuCheckboxItem>
            );
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
