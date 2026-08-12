import { LayoutGrid, List } from "lucide-react";
import { useMemo, useEffect, useCallback, useRef } from "react";

import { useI18n } from "@oc-mui/i18n";
import {
  useMuiUpdateEventMutation,
  useAppConfig,
  type MuiEventsFromSeriesQuery,
  type MuiEventsDataFragment,
  type MuiGetMyEventsQuery,
} from "@oc-mui/query";
import {
  type Row,
  type ColumnDef,
  MUITable,
  createMetadataHelpers,
  Button,
} from "@oc-mui/ui/components";
import { AppLoader } from "@oc-mui/ui/components";
import type { MetadataItem } from "@oc-mui/ui/config-primitives";
import { logger } from "@oc-mui/utils";

import { createColumns } from "../columns";
import { episodesConfig } from "../config";
import {
  getEpisodesColumnLabelOverrides,
  getEpisodesTableConfig,
} from "../episodesTableConfig";
import { useEpisodesTable } from "../hooks";
import { useSidebarStore } from "../stores/sidebarStore";

import { EpisodesEmptyState } from "./EpisodesEmptyState";
import { EpisodesTableSidebar } from "./EpisodesTableSidebar";

import type { MouseEvent } from "react";

interface EpisodesTableProps {
  seriesId?: string;
}

/**
 * Component for displaying and managing episodes data
 */
const EpisodesTable = ({ seriesId }: EpisodesTableProps) => {
  const { t } = useI18n();
  const { config } = useAppConfig();

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
    toggleLayout,
    setLayout,
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
    refetchMetadata,
  } = useEpisodesTable(seriesId);

  const { data, isLoading, error, refetch } = episodesQuery;

  const { pageIndex, pageSize, queryFilter } = state;

  const episodesTableConfig = useMemo(() => getEpisodesTableConfig(config), [config]);
  const galleryEnabled = episodesTableConfig.gallery.enabled;
  const effectiveLayout = galleryEnabled ? layout : "list";
  const activeViewConfig = episodesTableConfig[effectiveLayout];
  const columnLabelOverrides = useMemo(
    () => getEpisodesColumnLabelOverrides(activeViewConfig.columns),
    [activeViewConfig.columns],
  );

  // Create columns with the current layout and refetch function
  const columns: ColumnDef<MuiEventsDataFragment>[] = useMemo(
    () => createColumns(refetch, effectiveLayout, columnLabelOverrides),
    [refetch, effectiveLayout, columnLabelOverrides],
  );

  const metadata: MetadataItem[] = episodesConfig.use().episodeInfo?.metadata ?? [];
  const { isReadOnly } = createMetadataHelpers(metadata);

  useEffect(() => {
    if (!galleryEnabled && layout === "gallery") {
      setLayout("list");
    }
  }, [galleryEnabled, layout, setLayout]);

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
              field.id &&
              !isReadOnly(field.id) &&
              // The server's own flag, distinct from the config helper above:
              // the org's catalog config can make a field read-only, and such
              // fields are absent from the mutation's input type — sending
              // them is a hard ValidationError (#280).
              !("readOnly" in field && field.readOnly === true)
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
  const saveEpisodeUpdate = useMuiUpdateEventMutation();

  // Modified row click handler to pass inputFields directly
  const handleRowClick = useCallback(
    (event: MouseEvent, row: Row<MuiEventsDataFragment>) => {
      logger.debug("EpisodesTable - Row clicked", { rowId: row.original.id, seriesId });

      // Reset edit state when clicking on a different row
      if (isEditing && selectedId !== row.original.id) {
        resetUpdateFields();
      }

      // This was causing the issue by passing stale data to the sidebar.
      // By only setting the ID, we allow the reactive data flow to update the sidebar.
      openSidebar(row.original.id);
    },
    [openSidebar, isEditing, selectedId, resetUpdateFields, seriesId],
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
      const seriesData = data as MuiEventsFromSeriesQuery | undefined;
      return seriesData?.seriesById?.events.nodes.filter(Boolean) as MuiEventsDataFragment[];
    } else {
      // When showing all events, data comes from currentUser.myEvents
      const eventsData = data as MuiGetMyEventsQuery | undefined;
      return eventsData?.currentUser?.myEvents.nodes.filter(Boolean) as MuiEventsDataFragment[];
    }
  }, [data, seriesId]);

  // Get total count based on query type
  const totalCount = useMemo(() => {
    if (seriesId) {
      const seriesData = data as MuiEventsFromSeriesQuery | undefined;
      return seriesData?.seriesById?.events.totalCount || 0;
    } else {
      const eventsData = data as MuiGetMyEventsQuery | undefined;
      return eventsData?.currentUser?.myEvents.totalCount || 0;
    }
  }, [data, seriesId]);

  // Get the current episode from the table data
  const currentEpisode = useMemo(() => {
    return episodesData?.find((episode) => episode.id === selectedId);
  }, [episodesData, selectedId]);

  const configuredVisibleColumns = activeViewConfig.columns.filter((column) => column.show);
  const configuredColumnKeys = configuredVisibleColumns.map((column) => column.key);
  const hasConfiguredColumns = activeViewConfig.columns.length > 0;

  const sortedColumns = hasConfiguredColumns
    ? configuredColumnKeys
        .map((columnsKey) =>
          columns.find((column) => {
            // TanStack table column types are complex, accessorKey and id are optional
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const col = column as any;
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
  const layoutToggleButton = galleryEnabled ? (
    <Button
      variant="outline"
      size="sm"
      className="hidden h-8 ml-auto lg:flex"
      onClick={toggleLayout}
    >
      <span className="sr-only">
        {effectiveLayout === "list"
          ? t("episodes:episodesTable.layoutToggle.toGallery")
          : t("episodes:episodesTable.layoutToggle.toList")}
      </span>
      {effectiveLayout === "list" ? (
        <LayoutGrid className="w-4 h-4" />
      ) : (
        <List className="w-4 h-4" />
      )}
    </Button>
  ) : undefined;

  return (
    <>
      {/* Main table with ref */}
      <div ref={tableRef}>
        <MUITable
          columns={sortedColumns as ColumnDef<MuiEventsDataFragment>[]}
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
          emptyState={<EpisodesEmptyState />}
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
        refetchMetadata={refetchMetadata}
        setIsEditing={setIsEditing}
        sidebarInfo={t(`episodes:episodesInfo.required`)}
        tableRef={tableRef} // Pass the table ref to the sidebar
        currentEpisode={currentEpisode} // Pass the current episode data
      />
    </>
  );
};

export { EpisodesTable };
