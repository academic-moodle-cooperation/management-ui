import { useMemo, useEffect, useCallback, useRef } from "react";

import { useI18n } from "@workspace/i18n";
import { useRegistry } from "@workspace/plugin-system";
import { useUpdateSeriesMutation, useAppConfig } from "@workspace/query";
import type { SeriesDataFragment } from "@workspace/query";
import { MUITable, createMetadataHelpers, AppLoader, type Row } from "@workspace/ui/components";
import type { ColumnsField, MetadataItem } from "@workspace/ui/config-primitives";
import { logger } from "@workspace/utils";

import { createColumns } from "../columns";
import { readSeriesConfig } from "../config";
import { useSeriesTable, type SeriesUpdateData } from "../hooks";
import { useSidebarStore } from "../stores/sidebarStore";

import { SeriesTableSidebar } from "./SeriesTableSidebar";

import type { ComponentType, MouseEvent } from "react";

interface SeriesToolbarEndAction {
  id: string;
  order?: number;
  component: ComponentType<{ refetch?: () => void }>;
}

/**
 * Component for displaying and managing series data
 */
const SeriesTable = () => {
  const { t } = useI18n();
  const { config } = useAppConfig();

  // Create a ref for the table element
  const tableRef = useRef<HTMLDivElement>(null);

  // Get state from Zustand store
  const {
    isOpen,
    isEditing,
    selectedId,
    seriesUpdateData,
    updateField,
    openSidebar,
    closeSidebar,
    setIsEditing,
    resetUpdateFields,
    setSeriesUpdateData,
    setUpdateField,
  } = useSidebarStore();

  // Use the custom hook for table functionality
  const {
    state,
    seriesQuery,
    seriesInputFields,
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
  } = useSeriesTable();

  const { data, isLoading, error, refetch } = seriesQuery;

  const { pageIndex, pageSize, queryFilter } = state;

  // Create columns with the store's setIsEditing function
  const columns = useMemo(() => createColumns(setIsEditing), [setIsEditing]);

  const seriesConfig = readSeriesConfig(config);
  const metadata: MetadataItem[] = seriesConfig?.seriesInfo?.metadata ?? [];
  const { isReadOnly } = createMetadataHelpers(metadata);

  // Create a mechanism to ensure data is loaded when the sidebar is opened from the edit button
  useEffect(() => {
    // Only proceed if the sidebar is open, editing is true, and we don't have data yet
    if (isOpen && isEditing && selectedId && !seriesUpdateData) {
      logger.debug("SeriesTable - Sidebar opened in edit mode", { selectedId });

      // Here we'll use the existing input fields data to populate the sidebar
      if (seriesInputFields?.seriesById?.commonMetadataV2) {
        const formattedData: SeriesUpdateData = {};
        try {
          // Process each metadata field in seriesById.commonMetadataV2
          const metadataFields = seriesInputFields.seriesById.commonMetadataV2;

          // Process all the metadata fields
          Object.entries(metadataFields).forEach(([key, field]) => {
            if (
              field &&
              typeof field === "object" &&
              "value" in field &&
              field.value !== undefined &&
              field.id &&
              !isReadOnly(field.id)
            ) {
              // Type assertion: field.value can be string | (string | null)[] | null
              // but SeriesUpdateData expects string | string[]
              const value = field.value;
              if (value !== null) {
                if (Array.isArray(value)) {
                  formattedData[key] = value.filter((v): v is string => v !== null) as string[];
                } else if (typeof value === "string") {
                  formattedData[key] = value;
                }
              }
            }
          });

          logger.debug("SeriesTable - Formatted data", { formattedData, selectedId });

          if (Object.keys(formattedData).length > 0) {
            setSeriesUpdateData(formattedData);
          }
        } catch (error) {
          logger.error(
            "Error formatting series data",
            error instanceof Error ? error : new Error(String(error)),
            { selectedId },
          );
        }
      } else {
        logger.debug("SeriesTable - No seriesInputFields.seriesById.commonMetadataV2 found", {
          selectedId,
          hasSeriesInputFields: !!seriesInputFields,
        });
      }
    }
  }, [
    isOpen,
    isEditing,
    selectedId,
    seriesUpdateData,
    seriesInputFields,
    setSeriesUpdateData,
    isReadOnly,
  ]);

  // Mutation hook for updating series
  const saveSeriesUpdate = useUpdateSeriesMutation();
  const { items: seriesToolbarEndActions } = useRegistry<SeriesToolbarEndAction>(
    "series:table:toolbar-end-actions",
  );

  // Modified row click handler to pass inputFields directly
  const handleRowClick = useCallback(
    (_event: MouseEvent, row: Row<SeriesDataFragment>) => {
      logger.debug("SeriesTable - Row clicked", { rowId: row.original.id });

      // Reset edit state when clicking on a different row
      if (isEditing && selectedId !== row.original.id) {
        resetUpdateFields();
      }

      // This was causing the issue by passing stale data to the sidebar.
      // By only setting the ID, we allow the reactive data flow to update the sidebar.
      if (row.original.id) {
        openSidebar(row.original.id);
      }
    },
    [openSidebar, isEditing, selectedId, resetUpdateFields],
  );

  // Modified edit close handler - no URL updates
  const handleEditClose = useCallback(() => {
    resetUpdateFields();
    closeSidebar();
  }, [resetUpdateFields, closeSidebar]);

  // Prepare table data - filter out any null values
  const seriesData = useMemo(() => data?.currentUser?.mySeries.nodes.filter(Boolean), [data]);

  // Get the current series from the table data
  const currentSeries = useMemo(() => {
    return seriesData?.find((series) => series?.id === selectedId);
  }, [seriesData, selectedId]);

  // Get visible columns from app config - use the columns configuration or fallback to all columns
  const configColumns = seriesConfig?.seriesTable?.columns ?? [];
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

  const sortedColumns = columnsKeys
    .map((columnsKey) =>
      columns.find((column) => {
        // TanStack table column types are complex, but we can safely access these properties
        const col = column as { accessorKey?: string; id?: string };
        return col.accessorKey === columnsKey || col.id === columnsKey;
      }),
    )
    .filter((column): column is NonNullable<typeof column> => Boolean(column));

  const isCreateSeriesEnabled = seriesConfig?.seriesTable?.createSeries?.enabled !== false;

  const toolbarEndButtons = useMemo(() => {
    const sortedActions = [...seriesToolbarEndActions]
      .filter((action) => (isCreateSeriesEnabled ? true : action.id !== "create-series"))
      .filter((action) => typeof action.component === "function")
      .sort((a, b) => (a.order || 100) - (b.order || 100));

    if (sortedActions.length === 0) {
      return undefined;
    }

    return (
      <>
        {sortedActions.map((action, index) => {
          const ActionComponent = action.component;
          const actionId = action.id || `series-toolbar-action-${index}`;
          return <ActionComponent key={actionId} refetch={refetch} />;
        })}
      </>
    );
  }, [seriesToolbarEndActions, refetch, isCreateSeriesEnabled]);

  // Error handling
  if (error && typeof error === "object" && "message" in error) {
    return (
      <div className="error-container">
        <p>Error loading series: {error.message as string}</p>
        <button onClick={() => refetch()}>Retry</button>
      </div>
    );
  }

  if (isLoading) return <AppLoader />;

  return (
    <>
      {/* Main table with ref */}
      <div ref={tableRef}>
        <MUITable
          columns={
            sortedColumns.length > 0
              ? // Type assertion needed because TanStack table column types are complex
                // and the filtered columns may have slightly different type structure
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (sortedColumns as any)
              : // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (columns as any)
          }
          data={(seriesData?.filter(Boolean) as SeriesDataFragment[]) || []}
          selectedId={selectedId}
          refetch={refetch}
          onClickRowAction={handleRowClick}
          manualPagination={true}
          pageSize={pageSize}
          setPageSize={setPageSize}
          pageCount={Math.ceil(data?.currentUser.mySeries.totalCount / pageSize || 0)}
          pageIndex={pageIndex}
          setPageIndex={setPageIndex}
          totalRows={data?.currentUser.mySeries.totalCount || 0}
          manualSorting={true}
          setSorting={setSorting}
          sorting={sorting}
          queryFilter={queryFilter}
          setQueryFilter={setQueryFilter}
          columnVisibility={columnVisibility}
          setColumnVisibility={setColumnVisibility}
          toolbarEndButtons={toolbarEndButtons}
        />
      </div>

      {/* Series-specific sidebar - passing the table ref */}
      <SeriesTableSidebar
        isOpen={isOpen}
        onEditClose={handleEditClose}
        heading={t(`series:seriesInfo.heading`)}
        seriesInputFields={seriesInputFields}
        isLoadingMetadata={isLoadingMetadata}
        seriesUpdateData={seriesUpdateData}
        updateField={updateField}
        isEditing={isEditing}
        setSeriesUpdateData={setSeriesUpdateData}
        setUpdateField={setUpdateField}
        textCopied={textCopied}
        setTextCopied={setTextCopied}
        saveSeriesUpdate={saveSeriesUpdate}
        selectedSeriesId={selectedId}
        refetch={refetch}
        refetchMetadata={refetchMetadata}
        setIsEditing={setIsEditing}
        sidebarInfo={t(`series:seriesInfo.required`)}
        tableRef={tableRef} // Pass the table ref to the sidebar
        currentSeries={currentSeries || undefined} // Pass the current series data
      />
    </>
  );
};

export { SeriesTable };
