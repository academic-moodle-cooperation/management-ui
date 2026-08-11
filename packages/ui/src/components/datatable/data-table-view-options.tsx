import { Settings2 } from "lucide-react";

import { useI18n } from "@oc-mui/i18n";

import {
  DropdownMenuTrigger,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  Button,
} from "../ui";

import type { Table, RowData } from "@tanstack/react-table";

interface DataTableViewOptionsProps<TData> {
  table: Table<TData>;
}
declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    translatedTitle?: string;
    resolvedTitle?: string;
  }
}

export function DataTableViewOptions<TData>({ table }: DataTableViewOptionsProps<TData>) {
  const { t } = useI18n();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="hidden h-8 ml-auto lg:flex">
          <Settings2 className="w-4 h-4 mr-2" />
          {t("common:viewOptions")}
        </Button>
      </DropdownMenuTrigger>
      {/*
        `sidebar-portal-inside` is what keeps the table sidebar open while this
        menu is used: the menu content is portalled out of the table, so the
        sidebar's `useClickOutside` would otherwise read a click in here as a
        click outside and call `onEditClose`. The hook bails on that class.
      */}
      <DropdownMenuContent align="end" className="w-[250px] sidebar-portal-inside">
        <DropdownMenuLabel>{t("common:toggleColumns")}</DropdownMenuLabel>
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
                // Toggling a column keeps the menu open so several columns can
                // be switched in one go. Expressed per item — suppressing the
                // menu's own `onOpenChange` instead would also swallow Esc and
                // outside clicks (#252).
                onSelect={(event) => event.preventDefault()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                {column.columnDef.meta?.resolvedTitle ??
                  t(column.columnDef.meta?.translatedTitle || column.id)}
              </DropdownMenuCheckboxItem>
            );
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
