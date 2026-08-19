// import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { X, RefreshCcw } from "lucide-react";
import React from "react";

import { useI18n } from "@oc-mui/i18n";

import { cn } from "../../lib";
import { DebouncedInput } from "../debounced-input";
import { Button } from "../ui";

import { DataTableViewOptions } from "./data-table-view-options";

import type { Table } from "@tanstack/react-table";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  queryFilter: string | undefined;
  setQueryFilter: (filter: string | undefined) => void;
  setPageIndex: (index: number) => void;
  refetch?: (() => void) | undefined;
  designButton?: React.ReactNode | undefined;
  toolbarEndButtons?: React.ReactNode | undefined;
}

export function DataTableToolbar<TData>({
  table,
  queryFilter,
  setQueryFilter,
  setPageIndex,
  refetch,
  designButton,
  toolbarEndButtons,
}: DataTableToolbarProps<TData>) {
  const isFiltered = queryFilter && queryFilter?.length > 0;

  const { t } = useI18n();

  const [isFetchingExtended, setIsFetchingExtended] = React.useState(false);

  const handleRefetch = () => {
    refetch && refetch();

    (async () => {
      setIsFetchingExtended(true);

      await new Promise((resolve) => {
        setTimeout(resolve, 1000);
      });

      setIsFetchingExtended(false);
    })();
  };

  return (
    <div className="flex items-center justify-between py-4 gap-2">
      <div className="flex items-center flex-1 space-x-2">
        <DebouncedInput
          placeholder={t("search")}
          value={queryFilter || ""}
          // onChange={(event) => {
          //   setQueryFilter(event.target.value);
          // }}
          className="h-8 w-[150px] lg:w-[250px]"
          onChange={(value) => {
            setQueryFilter(value ? value.toString() : undefined);
            setPageIndex(0);
          }}
          type="text"
          autoFocus={queryFilter?.length && queryFilter?.length > 0 ? true : false}
        />
        {/* {table.getColumn("status") && (
          <DataTableFacetedFilter
            column={table.getColumn("status")}
            title="Status"
            options={statuses}
          />
        )} */}

        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => {
              setQueryFilter(undefined);
              setPageIndex(0);
            }}
            className="h-8 px-2 lg:px-3"
          >
            {t("reset")}
            <X className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
      {designButton && <div>{designButton}</div>}
      <DataTableViewOptions table={table} />
      <Button
        variant={"secondary"}
        // size={"xs"}
        className={"flex font-medium text-sm h-8 rounded-md px-3 py-1"}
        onClick={handleRefetch}
      >
        <div className={cn("mr-2", isFetchingExtended && "animate-spin")}>
          <RefreshCcw className={cn("h-4 scale-x-[-1]")} />
        </div>
        {t("reloadData")}
      </Button>
      {toolbarEndButtons && <div>{toolbarEndButtons}</div>}
    </div>
  );
}
