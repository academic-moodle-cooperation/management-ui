import { useCallback } from "react";

import {
  useGetMyEventsQuery,
  useEventsFromSeriesQuery,
  OrderDirection,
  useGetEventByIdInputFieldsQuery,
} from "@workspace/query";
import { useNavigate } from "@workspace/router";
import { useSidebarContent } from "@workspace/ui/components";
import type { Row } from "@workspace/ui/components";

import { useSidebarStore } from "../stores/sidebarStore";

import { useTableState } from "./useTableState";

import type { TableBaseState } from "./useTableState";

export type EpisodesUpdateData = {
  [key: string]: string | string[];
};

// State interface extending the base table state
export interface EpisodesTableState extends TableBaseState {
  episodesUpdateData?: EpisodesUpdateData | undefined;
  updateField: string;
  isEditing: boolean;
}

// Action types for episodes table
type EpisodesTableAction =
  | { type: "SET_PAGE_INDEX"; payload: number }
  | { type: "SET_PAGE_SIZE"; payload: number }
  | { type: "SET_QUERY_FILTER"; payload: string | undefined }
  | { type: "SET_EPISODES_UPDATE_DATA"; payload: EpisodesUpdateData | undefined }
  | { type: "SET_UPDATE_FIELD"; payload: string }
  | { type: "SET_IS_EDITING"; payload: boolean }
  | { type: "SET_SIDEBAR_OPEN"; payload: boolean }
  | { type: "RESET_UPDATE_FIELDS" }
  | { type: "CLOSE_SIDEBAR" };

// Initial state
const initialState: EpisodesTableState = {
  pageIndex: 0,
  pageSize: 10,
  queryFilter: undefined as string | undefined,
  episodesUpdateData: undefined as EpisodesUpdateData | undefined,
  updateField: "",
  isEditing: false,
  sidebarOpen: false,
} as unknown as EpisodesTableState;

// Reducer function
function episodesTableReducer(
  state: EpisodesTableState,
  action: EpisodesTableAction,
): EpisodesTableState {
  switch (action.type) {
    case "SET_PAGE_INDEX":
      return { ...state, pageIndex: action.payload };
    case "SET_PAGE_SIZE":
      return { ...state, pageSize: action.payload };
    case "SET_QUERY_FILTER":
      return { ...state, queryFilter: action.payload } as EpisodesTableState;
    case "SET_EPISODES_UPDATE_DATA":
      return { ...state, episodesUpdateData: action.payload } as EpisodesTableState;
    case "SET_UPDATE_FIELD":
      return { ...state, updateField: action.payload };
    case "SET_IS_EDITING":
      return { ...state, isEditing: action.payload };
    case "SET_SIDEBAR_OPEN":
      return { ...state, sidebarOpen: action.payload };
    case "RESET_UPDATE_FIELDS":
      return {
        ...state,
        episodesUpdateData: undefined,
        updateField: "",
        isEditing: false,
      };
    case "CLOSE_SIDEBAR":
      return {
        ...state,
        episodesUpdateData: undefined,
        updateField: "",
        isEditing: false,
        sidebarOpen: false,
      };
    default:
      return state;
  }
}

/**
 * Custom hook for managing episodes table state and data fetching
 */
export function useEpisodesTable(seriesId?: string) {
  // Use the general table state hook
  const tableState = useTableState<EpisodesTableState, EpisodesTableAction>(
    initialState,
    episodesTableReducer,
    "episodes",
  );

  // Use the sidebar content hook for metadata operations
  const sidebarContent = useSidebarContent();

  const { state, dispatch } = tableState;
  const { pageIndex, pageSize, queryFilter } = state;

  // Get the selectedId from the Zustand store
  const { selectedId } = useSidebarStore();

  // Router hooks
  const navigate = useNavigate({
    from: `${import.meta.env.BASE_URL}/episodes`,
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

  // API queries - conditionally use different queries based on seriesId
  const allEventsQuery = useGetMyEventsQuery(
    {
      limit: pageSize,
      offset,
      ...(orderBy !== undefined && { orderBy }),
      ...(queryFilter !== undefined && { query: queryFilter }),
    },
    {
      enabled: !seriesId, // Only enabled when no seriesId is provided
    },
  );

  const seriesEventsQuery = useEventsFromSeriesQuery(
    {
      seriesId: seriesId || "",
      limit: pageSize,
      offset,
      ...(orderBy !== undefined && { orderBy }),
      ...(queryFilter !== undefined && { query: queryFilter }),
    },
    {
      enabled: Boolean(seriesId), // Only enabled when seriesId is provided
    },
  );

  // Use the appropriate query result based on seriesId
  const episodesQuery = seriesId ? seriesEventsQuery : allEventsQuery;

  // API queries - Use selectedId from Zustand store
  const { data: episodesInputFields, isLoading: isLoadingMetadata } =
    useGetEventByIdInputFieldsQuery({ eventId: selectedId }, { enabled: Boolean(selectedId) });

  // Event handlers
  const handleEditClose = () => {
    dispatch({ type: "RESET_UPDATE_FIELDS" });
    dispatch({ type: "SET_SIDEBAR_OPEN", payload: false });
    dispatch({ type: "SET_IS_EDITING", payload: false });
    navigate({
      to: `${import.meta.env.BASE_URL}/episodes`,
      replace: true,
      params: {},
    });
  };

  const handleRowClick = (event: React.MouseEvent, row: Row<Record<string, unknown>>) => {
    navigate({
      to: `${import.meta.env.BASE_URL}/episodes/${row.original["id"]}`,
      replace: true,
    });
  };

  // Specific action dispatchers
  const setIsEditing = useCallback(
    (editing: boolean) => dispatch({ type: "SET_IS_EDITING", payload: editing }),
    [dispatch],
  );

  const setEpisodesUpdateData = useCallback(
    (data: EpisodesUpdateData | undefined) =>
      dispatch({ type: "SET_EPISODES_UPDATE_DATA", payload: data }),
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
    episodesQuery,
    episodesInputFields,
    isLoadingMetadata,
    textCopied,
    setTextCopied,
    refetch: episodesQuery.refetch,
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
    setEpisodesUpdateData,
    setUpdateField,
    ...state,
  };
}
