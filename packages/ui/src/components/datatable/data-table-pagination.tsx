import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

import { useI18n } from "@workspace/i18n";

import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui";

import type { Table } from "@tanstack/react-table";

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  goToFirstPage?: () => void;
  goToNextPage?: () => void;
  goToPreviousPage?: () => void;
  goToLastPage?: () => void;
  canPreviousPage?: boolean;
  canNextPage?: boolean;
  pageIndex?: number;
  totalRows?: number;
  setPageSize?: (pageSize: number) => void;
  pageSize?: number;
}

export function DataTablePagination<TData>({
  table,
  goToFirstPage,
  goToNextPage,
  goToPreviousPage,
  goToLastPage,
  canPreviousPage,
  canNextPage,
  pageIndex,
  totalRows,
  setPageSize,
  pageSize,
}: DataTablePaginationProps<TData>) {
  const { t } = useI18n();

  return (
    <div className="flex items-center justify-between px-2 py-4">
      {!totalRows && (
        <div className="flex-1 text-sm text-muted-foreground">
          {totalRows} {t("pagination.rows")} {t("pagination.total")}.
        </div>
      )}
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-normal">{t("pagination.entriesPage")}</p>
          <Select
            value={`${pageSize ? pageSize : table.getState().pagination.pageSize}`}
            onValueChange={(pageSize) => {
              typeof setPageSize === "function"
                ? setPageSize(Number(pageSize))
                : table.setPageSize(Number(pageSize));
              typeof goToFirstPage === "function" && goToFirstPage();
            }}
          >
            <span className="sr-only">{t("pagination.selectEntriesPage")}</span>

            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue
                placeholder={pageSize ? pageSize : table.getState().pagination.pageSize}
              />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-[100px] items-center justify-center text-sm font-normal">
          {t("pagination.page")}{" "}
          {pageIndex !== undefined ? pageIndex + 1 : table.getState().pagination.pageIndex + 1}{" "}
          {t("pagination.of")} {table.getPageCount()}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="hidden w-8 h-8 p-0 lg:flex"
            onClick={
              typeof goToFirstPage === "function" ? goToFirstPage : () => table.setPageIndex(0)
            }
            disabled={
              canPreviousPage !== undefined ? !canPreviousPage : !table.getCanPreviousPage()
            }
          >
            <span className="sr-only">{t("pagination.goToFirstPage")}</span>
            <ChevronsLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            className="w-8 h-8 p-0"
            onClick={
              typeof goToPreviousPage === "function" ? goToPreviousPage : () => table.previousPage()
            }
            disabled={
              canPreviousPage !== undefined ? !canPreviousPage : !table.getCanPreviousPage()
            }
          >
            <span className="sr-only">{t("pagination.goToPreviousPage")}</span>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            className="w-8 h-8 p-0"
            onClick={typeof goToNextPage === "function" ? goToNextPage : () => table.nextPage()}
            disabled={canNextPage !== undefined ? !canNextPage : !table.getCanNextPage()}
          >
            <span className="sr-only">{t("pagination.goToNextPage")}</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            className="hidden w-8 h-8 p-0 lg:flex"
            onClick={
              typeof goToLastPage === "function"
                ? goToLastPage
                : () => table.setPageIndex(table.getPageCount() - 1)
            }
            disabled={canNextPage !== undefined ? !canNextPage : !table.getCanNextPage()}
          >
            <span className="sr-only">{t("pagination.goToLastPage")}</span>
            <ChevronsRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

{
  /* <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() =>
                setPageIndex((page: number) => (page === 0 ? 0 : page - 1))
              }
              unselectable={
                !canPreviousPage(
                  pageIndex || table.getState().pagination.pageIndex,
                  table.getPageCount()
                )
                  ? "on"
                  : "off"
              }
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#">1</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="#" isActive>
              2
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              onClick={() => {
                setPageIndex((page: number) => page + 1);
              }}
              unselectable={
                !canNextPage(
                  pageIndex || table.getState().pagination.pageIndex,
                  table.getPageCount()
                )
                  ? "on"
                  : "off"
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination> */
}
