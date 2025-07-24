import React, { useEffect } from "react";
import {
  TooltipProvider,
  Container,
  DataTable,
  DataTableProps,
  Toaster,
} from "@workspace/ui/components";
import { useI18n, loadNamespace } from "@workspace/i18n";

interface MUITableProps<TData, TValue> extends DataTableProps<TData, TValue> {
  refetch?: () => void;
  selectedId?: string;
  designButton?: React.ReactNode;
}

function MUITable<TData extends Record<string, any>, TValue>({
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
            refetch={refetch}
          />
        </Container>
      </Container>
      <Toaster closeButton richColors toastOptions={{}} theme="light" />
    </TooltipProvider>
  );
}

export { MUITable };
