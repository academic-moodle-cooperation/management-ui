import { useMemo, useEffect, useCallback, useRef } from "react";

import { loadNamespace, useI18n } from "@oc-mui/i18n";
import { useRegistry } from "@oc-mui/plugin-system";
import { useMuiUpdateSeriesMutation } from "@oc-mui/query";
import type { MuiSeriesDataFragment } from "@oc-mui/query";
import {
  MUITable,
  createMetadataHelpers,
  AppLoader,
  getColumnLabelOverrides,
  normalizeColumnConfigs,
  type Row,
} from "@oc-mui/ui/components";
import type { MetadataItem, TableColumnItem } from "@oc-mui/ui/config-primitives";
import { logger } from "@oc-mui/utils";

import { createColumns } from "../columns";
import { seriesConfig } from "../config";
import { useSeriesTable, type SeriesUpdateData } from "../hooks";
import { useSidebarStore } from "../stores/sidebarStore";

import { SeriesEmptyState } from "./SeriesEmptyState";
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
// TanStack table column types are complex; accessorKey and id are optional.
const columnId = (column: { accessorKey?: string; id?: string }) => column.id ?? column.accessorKey;

const SeriesTable = () => {
  const { t, i18n } = useI18n();
  const cfg = seriesConfig.use();

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
  const configColumns = cfg.seriesTable?.columns;
  const configuredColumns = useMemo(
    () => normalizeColumnConfigs(configColumns as TableColumnItem[] | undefined),
    [configColumns],
  );

  // Config label overrides for the headers (#372) — and the namespaces of any
  // org-plugin labelKeys, which nothing else loads before the table renders.
  const columnLabelOverrides = useMemo(
    () => getColumnLabelOverrides(configuredColumns),
    [configuredColumns],
  );
  useEffect(() => {
    const namespaces = new Set<string>();
    Object.values(columnLabelOverrides).forEach((override) => {
      const colon = override.labelKey?.indexOf(":") ?? -1;
      if (override.labelKey && colon > 0) {
        namespaces.add(override.labelKey.slice(0, colon));
      }
    });
    namespaces.forEach((namespace) => void loadNamespace(namespace, i18n.language));
  }, [columnLabelOverrides, i18n.language]);

  const columns = useMemo(
    () => createColumns(setIsEditing, columnLabelOverrides),
    [setIsEditing, columnLabelOverrides],
  );

  const metadata: MetadataItem[] = cfg.seriesInfo?.metadata ?? [];
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
              !isReadOnly(field.id) &&
              // The server's own flag, distinct from the config helper above:
              // the org's catalog config can make a field read-only, and such
              // fields are absent from the mutation's input type — sending
              // them is a hard ValidationError (#278).
              !("readOnly" in field && field.readOnly === true)
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
  const saveSeriesUpdate = useMuiUpdateSeriesMutation();
  const { items: seriesToolbarEndActions } = useRegistry<SeriesToolbarEndAction>(
    "series:table:toolbar-end-actions",
  );

  // Modified row click handler to pass inputFields directly
  const handleRowClick = useCallback(
    (_event: MouseEvent, row: Row<MuiSeriesDataFragment>) => {
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

  // The config's per-column `show` is the *default* visibility; the user's
  // own toggles are merged on top, win, and persist. Columns are ordered by
  // the config but never removed — hiding is the visibility default's job,
  // so the View menu keeps offering every column (the show/hide half of #80,
  // same fix as the episodes table).
  const hasConfiguredColumns = configuredColumns.length > 0;

  const visibilityDefaults = useMemo(() => {
    if (!hasConfiguredColumns) return {};
    // A config that lists columns enumerates the deployment's table: listed
    // columns carry their `show` flag, everything else starts hidden.
    const all: Record<string, boolean> = {};
    for (const column of columns) {
      const id = columnId(column);
      if (id) {
        all[id] = configuredColumns.find((c) => c.key === id)?.show ?? false;
      }
    }
    return all;
  }, [hasConfiguredColumns, configuredColumns, columns]);

  const effectiveColumnVisibility = useMemo(
    () => ({ ...visibilityDefaults, ...columnVisibility }),
    [visibilityDefaults, columnVisibility],
  );
  const handleColumnVisibilityChange = useCallback<typeof setColumnVisibility>(
    (updater) => {
      setColumnVisibility((previous) => {
        // Updaters must see what the user sees — defaults included.
        const base = { ...visibilityDefaults, ...previous };
        return typeof updater === "function" ? updater(base) : updater;
      });
    },
    [setColumnVisibility, visibilityDefaults],
  );

  const sortedColumns = hasConfiguredColumns
    ? [
        ...configuredColumns
          .map(({ key }) => columns.find((column) => columnId(column) === key))
          .filter((column): column is NonNullable<typeof column> => Boolean(column)),
        ...columns.filter((column) => {
          const id = columnId(column);
          return !id || !configuredColumns.some((c) => c.key === id);
        }),
      ]
    : columns;

  const isCreateSeriesEnabled = cfg.seriesTable?.createSeries?.enabled !== false;

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
          data={(seriesData?.filter(Boolean) as MuiSeriesDataFragment[]) || []}
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
          columnVisibility={effectiveColumnVisibility}
          setColumnVisibility={handleColumnVisibilityChange}
          toolbarEndButtons={toolbarEndButtons}
          emptyState={<SeriesEmptyState />}
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
