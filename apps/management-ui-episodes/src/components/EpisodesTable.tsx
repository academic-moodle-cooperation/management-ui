import React, { useMemo, useEffect, useCallback, useRef } from "react";
import { type ColumnDef, MUITable, createMetadataHelpers, Button } from "@workspace/ui/components";
import type { Row } from "@workspace/ui/components";
import { AppLoader } from "@workspace/ui/components";
import { LayoutGrid, List } from "lucide-react";
import {
  useUpdateEventMutation,
  useAppConfig,
  type EventsFromSeriesQuery,
  type EventsDataFragment,
  type GetMyEventsQuery,
} from "@workspace/query";
import { useNavigate } from "@workspace/router";
import type { MetadataItem, ColumnsField } from "@workspace/ui-config";
import { useI18n } from "@workspace/i18n";
import { createColumns } from "../columns";
import { useEpisodesTable } from "../hooks";
import { EpisodesTableSidebar } from "./EpisodesTableSidebar";
import { useSidebarStore } from "../stores/sidebarStore";
import { logger } from "@workspace/utils";

interface EpisodesTableProps {
  seriesId?: string;
}

/**
 * Component for displaying and managing episodes data
 */
const EpisodesTable = ({ seriesId }: EpisodesTableProps) => {
  const { t } = useI18n();
  const { config } = useAppConfig();
  const navigate = useNavigate({
    from: `${import.meta.env.BASE_URL}/episodes`,
  });

  // Create a ref for the table element
  const tableRef = useRef<HTMLDivElement>(null);

  // Get state from Zustand store
  const {
    isOpen,
    isEditing,
    selectedId,
    episodesUpdateData,
    updateField,
    layout,
    openSidebar,
    closeSidebar,
    setIsEditing,
    resetUpdateFields,
    setEpisodesUpdateData,
    setUpdateField,
    openSidebarWithData,
    toggleLayout,
  } = useSidebarStore();

  // Use the custom hook for table functionality
  const {
    state,
    episodesQuery,
    episodesInputFields,
    isLoadingMetadata,
    sorting,
    setSorting,
    columnVisibility,
    setColumnVisibility,
    setPageIndex,
    setPageSize,
    setQueryFilter,
    textCopied,
    setTextCopied,
  } = useEpisodesTable(seriesId);

  const { data, isLoading, error, refetch } = episodesQuery;

  const { pageIndex, pageSize, queryFilter } = state;

  // Create columns with the current layout and refetch function
  const columns: ColumnDef<EventsDataFragment>[] = useMemo(
    () => createColumns(refetch, layout),
    [refetch, layout],
  );

  const metadata = (config?.plugins?.["management-ui-episodes"]?.episodeInfo?.metadata ||
    []) as MetadataItem[];
  const { isReadOnly } = createMetadataHelpers(metadata);

  // Create a mechanism to ensure data is loaded when the sidebar is opened from the edit button
  useEffect(() => {
    // Only proceed if the sidebar is open, editing is true, and we don't have data yet
    if (isOpen && isEditing && selectedId && episodesInputFields && !episodesUpdateData) {
      // Here we'll use the existing input fields data to populate the sidebar
      if (episodesInputFields?.eventById?.commonMetadataV2) {
        const formattedData: Record<string, string | string[]> = {};
        try {
          // Process each metadata field in eventById.commonMetadataV2
          const metadataFields = episodesInputFields.eventById.commonMetadataV2;

          // Process all the metadata fields
          Object.entries(metadataFields).forEach(([key, field]) => {
            if (
              field &&
              typeof field === "object" &&
              "value" in field &&
              field.value !== undefined &&
              !isReadOnly(field.id!)
            ) {
              formattedData[key] = field.value;
            }
          });

          if (Object.keys(formattedData).length > 0) {
            setEpisodesUpdateData(formattedData);
          }
        } catch (error) {
          logger.error(
            "Error formatting episodes data",
            error instanceof Error ? error : new Error(String(error)),
            { selectedId, isEditing },
          );
        }
      }
    }
  }, [
    isOpen,
    isEditing,
    selectedId,
    episodesUpdateData,
    episodesInputFields,
    setEpisodesUpdateData,
    isReadOnly,
  ]);

  // Mutation hook for updating episodes
  const saveEpisodeUpdate = useUpdateEventMutation();

  // Modified row click handler to pass inputFields directly
  const handleRowClick = useCallback(
    (event: React.MouseEvent, row: Row<EventsDataFragment>) => {
      logger.debug("EpisodesTable - Row clicked", { rowId: row.original.id, seriesId });

      // Reset edit state when clicking on a different row
      if (isEditing && selectedId !== row.original.id) {
        resetUpdateFields();
      }

      // This was causing the issue by passing stale data to the sidebar.
      // By only setting the ID, we allow the reactive data flow to update the sidebar.
      openSidebar(row.original.id);
    },
    [openSidebar, isEditing, selectedId, resetUpdateFields],
  );

  // Modified edit close handler - no URL updates
  const handleEditClose = useCallback(() => {
    resetUpdateFields();
    closeSidebar();
  }, [resetUpdateFields, closeSidebar]);

  // Prepare table data - filter out any null values
  const episodesData = useMemo(() => {
    if (seriesId) {
      // When filtering by series, data comes from seriesById.events
      const seriesData = data as EventsFromSeriesQuery | undefined;
      return seriesData?.seriesById?.events.nodes.filter(Boolean) as EventsDataFragment[];
    } else {
      // When showing all events, data comes from currentUser.myEvents
      const eventsData = data as GetMyEventsQuery | undefined;
      return eventsData?.currentUser?.myEvents.nodes.filter(Boolean) as EventsDataFragment[];
    }
  }, [data, seriesId]);

  // Get total count based on query type
  const totalCount = useMemo(() => {
    if (seriesId) {
      const seriesData = data as EventsFromSeriesQuery | undefined;
      return seriesData?.seriesById?.events.totalCount || 0;
    } else {
      const eventsData = data as GetMyEventsQuery | undefined;
      return eventsData?.currentUser?.myEvents.totalCount || 0;
    }
  }, [data, seriesId]);

  // Get the current episode from the table data
  const currentEpisode = useMemo(() => {
    return episodesData?.find((episode) => episode.id === selectedId);
  }, [episodesData, selectedId]);

  // Get visible columns from app config with proper type safety
  const configColumns = config?.plugins?.["management-ui-episodes"]?.episodesTable?.columns || [];
  const visibleColumns = (configColumns as Record<string, ColumnsField>[]).filter((column) => {
    if (!column || typeof column !== "object") return false;
    const key = Object.keys(column)[0];
    if (!key) return false;
    const field = column[key];
    return field?.show === true;
  });

  const columnsKeys = visibleColumns
    .map((column) => Object.keys(column)[0])
    .filter((key): key is string => Boolean(key));

  const sortedColumns =
    columnsKeys.length > 0
      ? columnsKeys
          .map((columnsKey) =>
            columns.find((column) => {
              const col = column as any; // TanStack table column types are complex, using any for access
              return col.accessorKey === columnsKey || col.id === columnsKey;
            }),
          )
          .filter((column): column is NonNullable<typeof column> => Boolean(column))
      : columns;

  // Error handling
  if (error && typeof error === "object" && "message" in error) {
    return (
      <div className="error-container">
        <p>Error loading episodes: {error.message as string}</p>
        <button onClick={() => refetch()}>Retry</button>
      </div>
    );
  }

  if (isLoading) return <AppLoader />;

  // Create the layout toggle button
  const layoutToggleButton = (
    <Button
      variant="outline"
      size="sm"
      className="hidden h-8 ml-auto lg:flex"
      onClick={toggleLayout}
    >
      {layout === "list" ? <LayoutGrid className="w-4 h-4" /> : <List className="w-4 h-4" />}
    </Button>
  );

  return (
    <>
      {/* Main table with ref */}
      <div ref={tableRef}>
        <MUITable
          columns={sortedColumns as any}
          data={episodesData?.filter(Boolean) || []}
          selectedId={selectedId}
          refetch={refetch}
          onClickRowAction={handleRowClick}
          manualPagination={true}
          pageSize={pageSize}
          setPageSize={setPageSize}
          pageCount={Math.ceil(totalCount / pageSize || 0)}
          pageIndex={pageIndex}
          setPageIndex={setPageIndex}
          totalRows={totalCount}
          manualSorting={true}
          setSorting={setSorting}
          sorting={sorting}
          queryFilter={queryFilter}
          setQueryFilter={setQueryFilter}
          columnVisibility={columnVisibility}
          setColumnVisibility={setColumnVisibility}
          designButton={layoutToggleButton}
        />
      </div>

      {/* Episodes-specific sidebar */}
      <EpisodesTableSidebar
        isOpen={isOpen}
        onEditClose={handleEditClose}
        heading={t(`episodes:episodesInfo.heading`)}
        episodesInputFields={episodesInputFields}
        isLoadingMetadata={isLoadingMetadata}
        episodesUpdateData={episodesUpdateData}
        updateField={updateField}
        isEditing={isEditing}
        setEpisodesUpdateData={setEpisodesUpdateData}
        setUpdateField={setUpdateField}
        textCopied={textCopied}
        setTextCopied={setTextCopied}
        saveEpisodeUpdate={saveEpisodeUpdate}
        selectedEpisodeId={selectedId}
        refetch={refetch}
        setIsEditing={setIsEditing}
        sidebarInfo={t(`episodes:episodesInfo.required`)}
        tableRef={tableRef} // Pass the table ref to the sidebar
        currentEpisode={currentEpisode} // Pass the current episode data
      />
    </>
  );
};

export { EpisodesTable };
