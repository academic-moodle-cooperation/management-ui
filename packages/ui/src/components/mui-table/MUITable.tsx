import React, { useEffect } from "react";

import { useI18n, loadNamespace } from "@workspace/i18n";

import { Container } from "../container";
import { DataTable, type DataTableProps } from "../datatable";
import { TooltipProvider, Toaster } from "../ui";

interface MUITableProps<TData, TValue> extends DataTableProps<TData, TValue> {
  refetch?: () => void;
  selectedId?: string;
  designButton?: React.ReactNode;
  toolbarEndButtons?: React.ReactNode;
}

function MUITable<TData extends Record<string, unknown>, TValue>({
  columns,
  data,
  refetch,
  onClickRowAction,
  selectedId,
  manualPagination,
  pageSize,
  setPageSize,
  pageCount,
  pageIndex,
  setPageIndex,
  totalRows,
  manualSorting,
  setSorting,
  sorting,
  queryFilter,
  setQueryFilter,
  columnVisibility,
  setColumnVisibility,
  designButton,
  toolbarEndButtons,
}: MUITableProps<TData, TValue>) {
  const { i18n } = useI18n();

  useEffect(() => {
    const loadTranslations = async () => {
      await loadNamespace("muitable-sidebar", i18n.language);
    };
    loadTranslations();
  }, [i18n.language]);

  return (
    <TooltipProvider>
      <Container className="w-full">
        <Container>
          <DataTable
            columns={columns}
            data={data}
            selectedId={selectedId}
            onClickRowAction={onClickRowAction}
            manualPagination={manualPagination}
            pageSize={pageSize}
            setPageSize={setPageSize}
            pageCount={pageCount}
            pageIndex={pageIndex}
            setPageIndex={setPageIndex}
            totalRows={totalRows}
            manualSorting={manualSorting}
            sorting={sorting}
            setSorting={setSorting}
            queryFilter={queryFilter}
            setQueryFilter={setQueryFilter}
            columnVisibility={columnVisibility}
            setColumnVisibility={setColumnVisibility}
            designButton={designButton}
            toolbarEndButtons={toolbarEndButtons}
            refetch={refetch}
          />
        </Container>
      </Container>
      <Toaster closeButton richColors toastOptions={{}} theme="light" />
    </TooltipProvider>
  );
}

export { MUITable };
