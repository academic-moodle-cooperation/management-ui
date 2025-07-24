import React, { useMemo, useEffect, useCallback, useRef } from "react";
import { MUITable, createMetadataHelpers, Row } from "@workspace/ui/components";
import { AppLoader } from "@workspace/ui/components";
import { useUpdateSeriesMutation, SeriesDataFragment } from "@workspace/query";
import { useLoaderData, useNavigate } from "@workspace/router";
import { useI18n } from "@workspace/i18n";

import { createColumns } from "../columns";
import { useSeriesTable } from "../hooks";
import { SeriesTableSidebar } from "./SeriesTableSidebar";
import { useSidebarStore } from "../stores/sidebarStore";

/**
 * Component for displaying and managing series data
 */
const SeriesTable = () => {
  const { t } = useI18n();
  const loaderData = useLoaderData({ from: "/series" });
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
    openSidebarWithData
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
    setTextCopied
  } = useSeriesTable();

  const {
    data,
    isLoading,
    error,
    refetch
  } = seriesQuery;

  const {
    pageIndex,
    pageSize,
    queryFilter,
  } = state;

  // Create columns with the store's setIsEditing function
  const columns = useMemo(() => createColumns(setIsEditing), [setIsEditing]);

  const { isReadOnly } = createMetadataHelpers(loaderData?.seriesInfo?.metadata);

  // Create a mechanism to ensure data is loaded when the sidebar is opened from the edit button
  useEffect(() => {
    // Only proceed if the sidebar is open, editing is true, and we don't have data yet
    if (isOpen && isEditing && selectedId && !seriesUpdateData) {
      // Add debug logging
      console.log("SeriesTable - Sidebar opened in edit mode");
      console.log("seriesInputFields:", seriesInputFields);

      // Here we'll use the existing input fields data to populate the sidebar
      if (seriesInputFields?.seriesById?.commonMetadataV2) {
        const formattedData: Record<string, any> = {};
        try {
          // Process each metadata field in seriesById.commonMetadataV2
          const metadataFields = seriesInputFields.seriesById.commonMetadataV2;

          // Process all the metadata fields
          Object.entries(metadataFields).forEach(([key, field]) => {
            if (field && typeof field === 'object' && 'value' in field && field.value !== undefined && !isReadOnly(field.id!)) {
              formattedData[key] = field.value;
            }
          });

          console.log("SeriesTable - Formatted data:", formattedData);

          if (Object.keys(formattedData).length > 0) {
            setSeriesUpdateData(formattedData);
          }
        } catch (error) {
          console.error("Error formatting series data:", error);
        }
      } else {
        console.log("SeriesTable - No seriesInputFields.seriesById.commonMetadataV2 found");
        console.log("seriesInputFields full structure:", JSON.stringify(seriesInputFields, null, 2));
      }
    }
  }, [isOpen, isEditing, selectedId, seriesUpdateData, seriesInputFields, setSeriesUpdateData]);

  // Mutation hook for updating series
  const saveSeriesUpdate = useUpdateSeriesMutation();

  // Modified row click handler to pass inputFields directly
  const handleRowClick = useCallback((event: React.MouseEvent, row: Row<Record<string, unknown>>) => {
    console.log("SeriesTable - Row clicked, row data:", row.original);

    // Reset edit state when clicking on a different row
    if (isEditing && selectedId !== row.original.id) {
      resetUpdateFields();
    }

    // This was causing the issue by passing stale data to the sidebar.
    // By only setting the ID, we allow the reactive data flow to update the sidebar.
    openSidebar(row.original.id as string);
  }, [openSidebar, isEditing, selectedId, resetUpdateFields]);

  // Modified edit close handler - no URL updates
  const handleEditClose = useCallback(() => {
    resetUpdateFields();
    closeSidebar();
  }, [resetUpdateFields, closeSidebar]);

  // Prepare table data - filter out any null values
  const seriesData = useMemo(
    () => data?.currentUser?.mySeries.nodes.filter(Boolean),
    [data]
  );

  // Get visible columns from loader data
  const visibleColumns = loaderData?.seriesTable?.columns?.filter(
    (column) => column[Object.keys(column)[0]].show
  );

  const columnsKeys = visibleColumns?.map((column) => Object.keys(column)[0]);

  const sortedColumns = columnsKeys?.map((columnsKey) =>
    columns.find((column) => (column["accessorKey"] || column["id"]) === columnsKey)
  );

  // Error handling
  if (error && typeof error === 'object' && 'message' in error) {
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
          columns={sortedColumns || columns}
          data={(seriesData?.filter(Boolean) as SeriesDataFragment[]) || []}
          selectedId={selectedId}
          refetch={refetch}
          onClickRowAction={handleRowClick}
          manualPagination={true}
          pageSize={pageSize}
          setPageSize={setPageSize}
          pageCount={Math.ceil(
            data?.currentUser.mySeries.totalCount / pageSize || 0
          )}
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
      />
    </>
  );
};

export { SeriesTable };
