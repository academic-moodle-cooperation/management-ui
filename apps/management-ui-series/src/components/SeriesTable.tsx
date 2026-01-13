import React, { useMemo, useEffect, useCallback, useRef, useState } from "react";
import { MUITable, createMetadataHelpers, type ColumnDef } from "@workspace/ui/components";
import type { Row } from "@workspace/ui/components";
import { AppLoader } from "@workspace/ui/components";
import { useUpdateSeriesMutation, useAppConfig } from "@workspace/query";
import type { SeriesDataFragment } from "@workspace/query";
import { useNavigate } from "@workspace/router";
import type { MetadataItem, ColumnsField } from "@workspace/ui-config";
import { useI18n } from "@workspace/i18n";

import { createColumns } from "../columns";
import { useSeriesTable, type SeriesUpdateData } from "../hooks";
import { SeriesTableSidebar } from "./SeriesTableSidebar";
import { useSidebarStore } from "../stores/sidebarStore";
import { logger } from "@workspace/utils";

/**
 * Component for displaying and managing series data
 */
const SeriesTable = () => {
  const { t } = useI18n();
  const { config } = useAppConfig();
  const navigate = useNavigate({
    from: `${import.meta.env.BASE_URL}/series`,
  });

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
    openSidebarWithData,
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
  } = useSeriesTable();

  const { data, isLoading, error, refetch } = seriesQuery;

  const { pageIndex, pageSize, queryFilter } = state;

  // Create columns with the store's setIsEditing function
  const columns = useMemo(() => createColumns(setIsEditing), [setIsEditing]);

  const metadata = (config?.plugins?.["management-ui-series"]?.seriesInfo?.metadata ||
    []) as MetadataItem[];
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
              !isReadOnly(field.id!)
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
            { selectedId }
          );
        }
      } else {
        logger.debug("SeriesTable - No seriesInputFields.seriesById.commonMetadataV2 found", {
          selectedId,
          hasSeriesInputFields: !!seriesInputFields,
        });
      }
    }
  }, [isOpen, isEditing, selectedId, seriesUpdateData, seriesInputFields, setSeriesUpdateData]);

  // Mutation hook for updating series
  const saveSeriesUpdate = useUpdateSeriesMutation();

  // Modified row click handler to pass inputFields directly
  const handleRowClick = useCallback(
    (event: React.MouseEvent, row: Row<Record<string, unknown>>) => {
      logger.debug("SeriesTable - Row clicked", { rowId: row.original["id"] });

      // Reset edit state when clicking on a different row
      if (isEditing && selectedId !== row.original["id"]) {
        resetUpdateFields();
      }

      // This was causing the issue by passing stale data to the sidebar.
      // By only setting the ID, we allow the reactive data flow to update the sidebar.
      openSidebar(row.original["id"] as string);
    },
    [openSidebar, isEditing, selectedId, resetUpdateFields]
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
  const configColumns = config?.plugins?.["management-ui-series"]?.seriesTable?.columns || [];
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
        const col = column as any; // TanStack table column types are complex, using any for access
        return col.accessorKey === columnsKey || col.id === columnsKey;
      })
    )
    .filter((column): column is NonNullable<typeof column> => Boolean(column));

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
          columns={sortedColumns.length > 0 ? (sortedColumns as any) : columns}
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
        setIsEditing={setIsEditing}
        sidebarInfo={t(`series:seriesInfo.required`)}
        tableRef={tableRef} // Pass the table ref to the sidebar
        currentSeries={currentSeries || undefined} // Pass the current series data
      />
    </>
  );
};

export { SeriesTable };
