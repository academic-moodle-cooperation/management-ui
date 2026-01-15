import { useCallback } from "react";
import type { MouseEvent } from "react";

import {
  useGetMySeriesQuery,
  OrderDirection,
  useGetSeriesByIdInputFieldsQuery,
} from "@workspace/query";
import { useNavigate } from "@workspace/router";
import { useSidebarContent } from "@workspace/ui/components";
import type { Row } from "@workspace/ui/components";

import { useSidebarStore } from "../stores/sidebarStore";

import { useTableState } from "./useTableState";

import type { TableBaseState } from "./useTableState";

export type SeriesUpdateData = {
  [key: string]: string | string[];
};

// State interface extending the base table state
export interface SeriesTableState extends TableBaseState {
  seriesUpdateData?: SeriesUpdateData | undefined;
  updateField: string;
  isEditing: boolean;
}

// Action types for series table
type SeriesTableAction =
  | { type: "SET_PAGE_INDEX"; payload: number }
  | { type: "SET_PAGE_SIZE"; payload: number }
  | { type: "SET_QUERY_FILTER"; payload: string | undefined }
  | { type: "SET_SERIES_UPDATE_DATA"; payload: SeriesUpdateData | undefined }
  | { type: "SET_UPDATE_FIELD"; payload: string }
  | { type: "SET_IS_EDITING"; payload: boolean }
  | { type: "SET_SIDEBAR_OPEN"; payload: boolean }
  | { type: "RESET_UPDATE_FIELDS" }
  | { type: "CLOSE_SIDEBAR" };

// Initial state
const initialState: SeriesTableState = {
  pageIndex: 0,
  pageSize: 10,
  queryFilter: undefined as string | undefined,
  seriesUpdateData: undefined as SeriesUpdateData | undefined,
  updateField: "",
  isEditing: false,
  sidebarOpen: false,
} as unknown as SeriesTableState;

// Reducer function
function seriesTableReducer(state: SeriesTableState, action: SeriesTableAction): SeriesTableState {
  switch (action.type) {
    case "SET_PAGE_INDEX":
      return { ...state, pageIndex: action.payload };
    case "SET_PAGE_SIZE":
      return { ...state, pageSize: action.payload };
    case "SET_QUERY_FILTER":
      return { ...state, queryFilter: action.payload } as SeriesTableState;
    case "SET_SERIES_UPDATE_DATA":
      return { ...state, seriesUpdateData: action.payload as SeriesUpdateData | undefined };
    case "SET_UPDATE_FIELD":
      return { ...state, updateField: action.payload };
    case "SET_IS_EDITING":
      return { ...state, isEditing: action.payload };
    case "SET_SIDEBAR_OPEN":
      return { ...state, sidebarOpen: action.payload };
    case "RESET_UPDATE_FIELDS":
      return {
        ...state,
        seriesUpdateData: undefined as SeriesUpdateData | undefined,
        updateField: "",
        isEditing: false,
      };
    case "CLOSE_SIDEBAR":
      return {
        ...state,
        seriesUpdateData: undefined as SeriesUpdateData | undefined,
        updateField: "",
        isEditing: false,
        sidebarOpen: false,
      };
    default:
      return state;
  }
}

/**
 * Custom hook for managing series table state and data fetching
 */
export function useSeriesTable() {
  // Use the general table state hook
  const tableState = useTableState<SeriesTableState, SeriesTableAction>(
    initialState,
    seriesTableReducer,
    "series",
  );

  // Use the sidebar content hook for metadata operations
  const sidebarContent = useSidebarContent();

  const { state, dispatch } = tableState;
  const { pageIndex, pageSize, queryFilter } = state;

  // Get the selectedId from the Zustand store
  const { selectedId } = useSidebarStore();

  // Router hooks
  const navigate = useNavigate({
    from: `${import.meta.env.BASE_URL}/series`,
  });

  // Calculate API parameters
  const offset = pageSize * pageIndex;
  const orderBy =
    tableState.sorting.length > 0 && tableState.sorting[0]?.id !== undefined
      ? {
          [tableState.sorting[0].id]: tableState.sorting[0].desc
            ? OrderDirection.Desc
            : OrderDirection.Asc,
        }
      : undefined;

  // API queries - Use selectedId from Zustand store
  const { data: seriesInputFields, isLoading: isLoadingMetadata } =
    useGetSeriesByIdInputFieldsQuery({ seriesId: selectedId }, { enabled: Boolean(selectedId) });

  const seriesQuery = useGetMySeriesQuery({
    limit: pageSize,
    offset,
    ...(orderBy !== undefined && { orderBy }),
    ...(queryFilter !== undefined && { query: queryFilter }),
  });

  // Event handlers
  const handleEditClose = () => {
    dispatch({ type: "RESET_UPDATE_FIELDS" });
    dispatch({ type: "SET_SIDEBAR_OPEN", payload: false });
    dispatch({ type: "SET_IS_EDITING", payload: false });
    navigate({
      to: `${import.meta.env.BASE_URL}/series`,
      replace: true,
      params: {},
    });
  };

  const handleRowClick = (event: MouseEvent, row: Row<Record<string, unknown>>) => {
    navigate({
      to: `${import.meta.env.BASE_URL}/series/${row.original["id"]}`,
      replace: true,
    });
  };

  // Specific action dispatchers
  const setIsEditing = useCallback(
    (editing: boolean) => dispatch({ type: "SET_IS_EDITING", payload: editing }),
    [dispatch],
  );

  const setSeriesUpdateData = useCallback(
    (data: SeriesUpdateData | undefined) =>
      dispatch({ type: "SET_SERIES_UPDATE_DATA", payload: data }),
    [dispatch],
  );

  const setUpdateField = useCallback(
    (field: string) => dispatch({ type: "SET_UPDATE_FIELD", payload: field }),
    [dispatch],
  );

  // Extract values from sidebarContent
  const { textCopied, setTextCopied } = sidebarContent;

  return {
    state,
    dispatch,
    seriesQuery,
    seriesInputFields,
    isLoadingMetadata,
    textCopied,
    setTextCopied,
    refetch: seriesQuery.refetch,
    handleEditClose,
    handleRowClick,
    setSorting: tableState.setSorting,
    setColumnVisibility: tableState.setColumnVisibility,
    setPageIndex: tableState.setPageIndex,
    setPageSize: tableState.setPageSize,
    setQueryFilter: tableState.setQueryFilter,
    sorting: tableState.sorting,
    columnVisibility: tableState.columnVisibility,
    selectedId,
    setIsEditing,
    setSeriesUpdateData,
    setUpdateField,
    ...state,
  };
}
