import { Film, Info } from "lucide-react";

import { i18next } from "@oc-mui/i18n";
import { SERIES_SORTABLE_FIELDS } from "@oc-mui/query";
import type { MuiSeriesDataFragment } from "@oc-mui/query";
import { Link } from "@oc-mui/router";
import {
  createColumnHelper,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  Button,
  DataTableColumnHeader,
  OverflowTooltip,
  restrictSortingToFields,
  type ColumnDef,
} from "@oc-mui/ui/components";
import { cn } from "@oc-mui/ui/lib";

import SeriesActionsCell from "./components/SeriesActionsCell";

const columnHelper = createColumnHelper<MuiSeriesDataFragment>();

// Convert columns to a factory function that accepts setIsEditing.
// Sortability is derived from the backend's SeriesOrderByInput via
// restrictSortingToFields — a column whose field the backend can't order
// by loses its sort control automatically, no per-column flag needed.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const createColumns = (setIsEditing: (editing: boolean) => void) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seriesColumns: ColumnDef<MuiSeriesDataFragment, any>[] = [
    columnHelper.accessor("title", {
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={i18next.t("series:seriesTable.heading.title")}
        />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex space-x-2">
            <OverflowTooltip className="max-w-[500px] truncate font-medium">
              {row.getValue("title")}
            </OverflowTooltip>
          </div>
        );
      },
      meta: {
        translatedTitle: "series:seriesTable.heading.title",
      },
    }),
    columnHelper.accessor("created", {
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={i18next.t("series:seriesTable.heading.created")}
          className="flex justify-center ml-3"
        />
      ),
      cell: ({ row }) => {
        const value = new Intl.DateTimeFormat("de-DE", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(row.getValue("created") as string));
        return (
          <OverflowTooltip className="flex justify-center space-x-2 truncate">
            {value}
          </OverflowTooltip>
        );
      },
      meta: {
        translatedTitle: "series:seriesTable.heading.created",
      },
    }),
    columnHelper.accessor("description", {
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={i18next.t("series:seriesTable.heading.description")}
        />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex space-x-2">
            <OverflowTooltip className="max-w-[200px] truncate">
              {row.getValue("description")}
            </OverflowTooltip>
          </div>
        );
      },
      meta: {
        translatedTitle: "series:seriesTable.heading.description",
      },
    }),
    columnHelper.accessor("creator", {
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={i18next.t("series:seriesTable.heading.creator")}
        />
      ),
      cell: (data) => {
        return <OverflowTooltip>{data.getValue()}</OverflowTooltip>;
      },
      meta: {
        translatedTitle: "series:seriesTable.heading.creator",
      },
    }),
    columnHelper.accessor("contributors", {
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={i18next.t("series:seriesTable.heading.contributors")}
        />
      ),
      cell: (data) => {
        const contributors = data.getValue() || [];
        return (
          <OverflowTooltip
            className={cn(
              "truncate whitespace-pre max-w-[200px] flex items-start",
              contributors.length === 3 ? "max-h-[48px]" : "max-h-[32px]",
            )}
          >
            {contributors.join("\n")}
          </OverflowTooltip>
        );
      },
      meta: {
        translatedTitle: "series:seriesTable.heading.contributors",
      },
    }),
    columnHelper.display({
      id: "actions",
      header: () => (
        <span className="flex justify-center items-center">
          {i18next.t("series:seriesTable.heading.actions.title")}
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="w-4 h-4">
                <Info className="w-4 h-4 ml-1 hover:text-foreground" />
                <span className="sr-only">
                  {i18next.t("series:seriesTable.heading.actions.info")}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent className="w-96">
              {i18next.t("series:seriesTable.heading.actions.info")}
            </TooltipContent>
          </Tooltip>
        </span>
      ),
      cell: (data) => {
        return <SeriesActionsCell series={data.row.original} />;
      },
      meta: {
        translatedTitle: "series:seriesTable.heading.actions.title",
      },
    }),
    columnHelper.accessor("events", {
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={i18next.t("series:seriesTable.heading.episodes")}
        />
      ),
      cell: (data) => {
        const episodeCount = data.getValue().totalCount || 0;
        return episodeCount > 0 ? (
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <Link
                to={`${import.meta.env.BASE_URL}/episodes/${data.row.original.id}`}
                className="flex items-center justify-center group"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <span className="group-hover:underline group-hover:text-info">
                  {episodeCount}
                </span>
                <Film className="inline w-4 h-4 ml-2 group-hover:text-info" />
              </Link>
            </TooltipTrigger>
            <TooltipContent>{i18next.t("series:seriesTable.heading.episodes")}</TooltipContent>
          </Tooltip>
        ) : (
          <p className="flex items-center justify-center">–</p>
        );
      },
      meta: {
        translatedTitle: "series:seriesTable.heading.episodes",
      },
      // The events count isn't a SeriesOrderByInput field, so it stays
      // non-sortable. restrictSortingToFields respects this explicit flag.
      enableSorting: false,
    }),
  ];
  return restrictSortingToFields(seriesColumns, SERIES_SORTABLE_FIELDS);
};

// Keep a fallback export for compatibility or testing
export const columns = createColumns(() => {});
