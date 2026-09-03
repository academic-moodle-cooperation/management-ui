import { useCallback, useMemo } from "react";

import {
  useMuiGetMyEventsQuery,
  useMuiEventsFromSeriesQuery,
  OrderDirection,
  useMuiGetEventByIdInputFieldsQuery,
  useAppConfig,
} from "@oc-mui/query";
import { useNavigate } from "@oc-mui/router";
import { useSidebarContent } from "@oc-mui/ui/components";
import type { Row } from "@oc-mui/ui/components";
import { hasProcessingEvents, isEventProcessing } from "@oc-mui/utils";

import { GALLERY_SORT_FIELD_BY_COLUMN } from "../columns";
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
  const { config } = useAppConfig();

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
  // The combined gallery cells sort under their own column ids, which the
  // backend does not know — translate them to the field their content comes
  // from before building orderBy (#373).
  const sortColumnId = tableState.sorting[0]?.id;
  const orderByField =
    sortColumnId !== undefined
      ? (GALLERY_SORT_FIELD_BY_COLUMN[sortColumnId] ?? sortColumnId)
      : undefined;
  const orderBy =
    tableState.sorting.length > 0 && orderByField !== undefined
      ? {
          [orderByField]: tableState.sorting[0]!.desc ? OrderDirection.Desc : OrderDirection.Asc,
        }
      : undefined;

  // API queries - conditionally use different queries based on seriesId
  // Automatically refetch table data every 20 seconds when episodes are processing
  const allEventsQuery = useMuiGetMyEventsQuery(
    {
      limit: pageSize,
      offset,
      ...(orderBy !== undefined && { orderBy }),
      ...(queryFilter !== undefined && { query: queryFilter }),
      channel: config.app.channel,
      tags: config.app.tags,
    },
    {
      enabled: !seriesId, // Only enabled when no seriesId is provided
      refetchInterval: (query) => {
        // Refetch every 20 seconds if there are processing episodes
        const events = query.state.data?.currentUser?.myEvents.nodes;
        return hasProcessingEvents(events) ? 20000 : false;
      },
    },
  );

  const seriesEventsQuery = useMuiEventsFromSeriesQuery(
    {
      seriesId: seriesId || "",
      limit: pageSize,
      offset,
      ...(orderBy !== undefined && { orderBy }),
      ...(queryFilter !== undefined && { query: queryFilter }),
    },
    {
      enabled: Boolean(seriesId), // Only enabled when seriesId is provided
      refetchInterval: (query) => {
        // Refetch every 20 seconds if there are processing episodes
        const events = query.state.data?.seriesById?.events.nodes;
        return hasProcessingEvents(events) ? 20000 : false;
      },
    },
  );

  // Use the appropriate query result based on seriesId
  const episodesQuery = seriesId ? seriesEventsQuery : allEventsQuery;

  // Determine if the selected episode is being processed
  // This enables automatic polling for metadata when the selected video is processing
  const isSelectedEpisodeProcessing = useMemo(() => {
    if (!selectedId) return false;

    // Read from the query that is active for this seriesId; each has the correct type.
    const events = seriesId
      ? seriesEventsQuery.data?.seriesById?.events.nodes
      : allEventsQuery.data?.currentUser?.myEvents.nodes;

    const selectedEvent = events?.find((event) => event?.id === selectedId);
    return isEventProcessing(selectedEvent?.eventStatus);
  }, [seriesEventsQuery.data, allEventsQuery.data, selectedId, seriesId]);

  // API queries - Use selectedId from Zustand store
  // Automatically refetch metadata every 10 seconds when the selected episode is processing
  const {
    data: episodesInputFields,
    isLoading: isLoadingMetadata,
    refetch: refetchMetadata,
  } = useMuiGetEventByIdInputFieldsQuery(
    { eventId: selectedId },
    {
      enabled: Boolean(selectedId),
      refetchInterval: isSelectedEpisodeProcessing ? 10000 : false, // 10 seconds when processing
    },
  );

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
    refetchMetadata,
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
