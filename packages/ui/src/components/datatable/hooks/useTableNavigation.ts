// hooks/useTableNavigation.ts

/**
 * Type definition for the table navigation functions and state
 */
export interface TableNavigation {
  goToFirstPage: () => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  goToLastPage: () => void;
  canPreviousPage: boolean;
  canNextPage: boolean;
  totalRows: number;
}

/**
 * Hook to create table navigation controls
 * @param pageIndex Current page index (0-based)
 * @param pageCount Total number of pages
 * @param setPageIndex Function to set the page index
 * @param totalRows Total number of rows in the dataset
 * @returns Navigation controls and state
 */
export function useTableNavigation(
  pageIndex: number,
  pageCount: number,
  setPageIndex: (index: number) => void,
  totalRows: number,
): TableNavigation {
  const canPreviousPage = pageIndex > 0;
  const canNextPage = pageIndex < pageCount - 1;

  return {
    goToFirstPage: () => setPageIndex(0),
    goToNextPage: () => canNextPage && setPageIndex(pageIndex + 1),
    goToPreviousPage: () => canPreviousPage && setPageIndex(pageIndex - 1),
    goToLastPage: () => setPageIndex(pageCount - 1),
    canPreviousPage,
    canNextPage,
    totalRows,
  };
}
