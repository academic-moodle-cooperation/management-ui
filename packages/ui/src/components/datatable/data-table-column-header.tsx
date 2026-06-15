import { ArrowDown, ArrowUp, ChevronsUpDown, EyeOff } from "lucide-react";
import React from "react";

import { useI18n } from "@opencast-mui/i18n";

import { cn } from "../../lib";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui";

import type { Column } from "@tanstack/react-table";

interface DataTableColumnHeaderProps<TData, TValue> extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  const { t } = useI18n();

  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>;
  }

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="-ml-3 h-8 data-[state=open]:bg-accent">
            <span>{title}</span>
            {column.getIsSorted() === "desc" ? (
              <ArrowDown className="w-4 h-4 ml-2" />
            ) : column.getIsSorted() === "asc" ? (
              <ArrowUp className="w-4 h-4 ml-2" />
            ) : (
              <ChevronsUpDown className="w-4 h-4 ml-2" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
            <ArrowUp className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            {t("sort.ascending")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
            <ArrowDown className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            {t("sort.descending")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => column.clearSorting()}>
            <ChevronsUpDown className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            {t("sort.none")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
            <EyeOff className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            {t("sort.hide")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
