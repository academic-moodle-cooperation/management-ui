import { useReducer, useMemo, useCallback } from "react";

import { atomWithStorage, useAtomValue, useSetAtom } from "@opencast-mui/store";
import type { OnChangeFn, SortingState, VisibilityState } from "@opencast-mui/ui/components";
export interface TableBaseState {
  pageIndex: number;
  pageSize: number;
  queryFilter?: string | undefined;
  sidebarOpen: boolean;
}

export interface TableAction {
  type: string;
  payload?: unknown;
}

/**
 * Hook to manage table pagination and filtering state
 */
export function useTableState<State extends TableBaseState, Action extends TableAction>(
  initialState: State,
  reducer: (state: State, action: Action) => State,
  appName: string,
) {
  // Initialize state with reducer
  const [state, dispatch] = useReducer(reducer, initialState);

  // Define atoms for persistent sorting and column visibility
  const sortingAtomKey = `${appName}_sorting`;
  const columnVisibilityAtomKey = `${appName}_columnVisibility`;

  // Create atoms for storage
  const sortingAtom = useMemo(
    () => atomWithStorage<SortingState>(sortingAtomKey, [{ id: "created", desc: true }]),
    [sortingAtomKey],
  );

  const columnVisibilityAtom = useMemo(
    () =>
      atomWithStorage<VisibilityState>(columnVisibilityAtomKey, { title: true } as VisibilityState),
    [columnVisibilityAtomKey],
  );

  // Get values and setters from atoms
  const sorting = useAtomValue(sortingAtom);
  const setSorting = useSetAtom(sortingAtom);

  const columnVisibility: VisibilityState = useAtomValue(columnVisibilityAtom);
  const setColumnVisibility: OnChangeFn<VisibilityState> = useSetAtom(columnVisibilityAtom);

  // Utility functions
  const setPageIndex = useCallback(
    (index: number) => dispatch({ type: "SET_PAGE_INDEX", payload: index } as Action),
    [dispatch],
  );

  const setPageSize = useCallback(
    (size: number) => dispatch({ type: "SET_PAGE_SIZE", payload: size } as Action),
    [dispatch],
  );

  const setQueryFilter = useCallback(
    (filter: string | undefined) =>
      dispatch({ type: "SET_QUERY_FILTER", payload: filter } as Action),
    [dispatch],
  );

  const setSidebarOpen = useCallback(
    (open: boolean) => dispatch({ type: "SET_SIDEBAR_OPEN", payload: open } as Action),
    [dispatch],
  );

  return {
    state,
    dispatch,
    sorting,
    setSorting,
    columnVisibility,
    setColumnVisibility,
    setPageIndex,
    setPageSize,
    setQueryFilter,
    setSidebarOpen,
  };
}
