import { Info, Globe, Lock } from "lucide-react";

import { formatDate, i18next } from "@oc-mui/i18n";
import { EVENT_SORTABLE_FIELDS } from "@oc-mui/query";
import type { MuiEventsDataFragment } from "@oc-mui/query";
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
  type Row,
  type Column,
} from "@oc-mui/ui/components";
import { cn } from "@oc-mui/ui/lib";
import { parseDuration } from "@oc-mui/utils";

import ActionsCell from "./components/ActionsCell";
import { EpisodeStatusCell } from "./components/EpisodeStatus";
import { GalleryVideoCell } from "./components/GalleryVideoCell";
import {
  resolveColumnLabel,
  resolveColumnMeta,
  type EpisodesColumnLabelOverrides,
} from "./episodesTableConfig";

const columnHelper = createColumnHelper<MuiEventsDataFragment>();

// Convert columns to a factory function that accepts layout and refetch
export const createColumns = (
  refetch: () => void,
  layout: "list" | "gallery" = "list",
  columnLabelOverrides: EpisodesColumnLabelOverrides = {},
): ColumnDef<MuiEventsDataFragment, unknown>[] => {
  const getTitle = (columnKey: string, fallbackLabelKey: string) =>
    resolveColumnLabel(columnLabelOverrides, columnKey, fallbackLabelKey, i18next.t.bind(i18next));

  const getMeta = (columnKey: string, fallbackLabelKey: string) =>
    resolveColumnMeta(columnLabelOverrides, columnKey, fallbackLabelKey);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const listColumns: ColumnDef<MuiEventsDataFragment, any>[] = [
    columnHelper.accessor("title", {
      header: ({ column }: { column: Column<MuiEventsDataFragment> }) => (
        <DataTableColumnHeader
          column={column}
          title={getTitle("title", "episodes:episodesTable.heading.title")}
        />
      ),
      cell: ({ row }: { row: Row<MuiEventsDataFragment> }) => {
        return (
          <div className="flex space-x-2">
            <OverflowTooltip className="max-w-[500px] truncate font-medium">
              {row.getValue("title")}
            </OverflowTooltip>
          </div>
        );
      },
      meta: getMeta("title", "episodes:episodesTable.heading.title"),
    }),
    columnHelper.accessor("seriesName", {
      header: ({ column }: { column: Column<MuiEventsDataFragment> }) => (
        <DataTableColumnHeader
          column={column}
          title={getTitle("seriesName", "episodes:episodesTable.heading.series")}
        />
      ),
      cell: (data) => {
        return (
          <div className="flex space-x-2">
            <OverflowTooltip className="max-w-[200px] truncate">
              {data.getValue() as string}
            </OverflowTooltip>
          </div>
        );
      },
      meta: getMeta("seriesName", "episodes:episodesTable.heading.series"),
    }),
    columnHelper.accessor("description", {
      header: ({ column }: { column: Column<MuiEventsDataFragment> }) => (
        <DataTableColumnHeader
          column={column}
          title={getTitle("description", "episodes:episodesTable.heading.description")}
        />
      ),
      cell: (data) => {
        return (
          <div className="flex space-x-2">
            <OverflowTooltip className="max-w-[300px] truncate">
              {data.getValue() as string}
            </OverflowTooltip>
          </div>
        );
      },
      meta: getMeta("description", "episodes:episodesTable.heading.description"),
    }),
    columnHelper.accessor("eventStatus", {
      header: ({ column }: { column: Column<MuiEventsDataFragment> }) => (
        <DataTableColumnHeader
          column={column}
          title={getTitle("eventStatus", "episodes:episodesTable.heading.status")}
          className="flex justify-center"
        />
      ),
      cell: ({ row }: { row: Row<MuiEventsDataFragment> }) => (
        <EpisodeStatusCell event={row.original} />
      ),
      meta: getMeta("eventStatus", "episodes:episodesTable.heading.status"),
    }),
    columnHelper.accessor("contributors", {
      header: ({ column }: { column: Column<MuiEventsDataFragment> }) => (
        <DataTableColumnHeader
          column={column}
          title={getTitle("contributors", "episodes:episodesTable.heading.contributors")}
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
      meta: getMeta("contributors", "episodes:episodesTable.heading.contributors"),
    }),
    columnHelper.accessor("presenters", {
      header: ({ column }: { column: Column<MuiEventsDataFragment> }) => (
        <DataTableColumnHeader
          column={column}
          title={getTitle("presenters", "episodes:episodesTable.heading.presenters")}
        />
      ),
      cell: (data) => {
        const presenters = data.getValue() || [];
        return (
          <OverflowTooltip
            className={cn(
              "truncate whitespace-pre max-w-[200px] flex items-start",
              presenters.length === 3 ? "max-h-[48px]" : "max-h-[32px]",
            )}
          >
            {presenters.map((name: string | null, index: number) => (
              <span key={index} className="block">
                {name || ""}
              </span>
            ))}
          </OverflowTooltip>
        );
      },
      meta: getMeta("presenters", "episodes:episodesTable.heading.presenters"),
    }),
    columnHelper.accessor("location", {
      header: ({ column }: { column: Column<MuiEventsDataFragment> }) => (
        <DataTableColumnHeader
          column={column}
          title={getTitle("location", "episodes:episodesTable.heading.location")}
        />
      ),
      cell: (data) => {
        return (
          <div className="flex space-x-2">
            <OverflowTooltip className="max-w-[200px] truncate">
              {(data.getValue() as string) || ""}
            </OverflowTooltip>
          </div>
        );
      },
      meta: getMeta("location", "episodes:episodesTable.heading.location"),
    }),
    columnHelper.accessor((row) => row.muiEventInfo?.isPublic, {
      id: "isPublic",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={getTitle("isPublic", "episodes:episodesTable.heading.access")}
          className="flex justify-center"
        />
      ),
      cell: ({ row }) => {
        const isPublic = row.original.muiEventInfo?.isPublic;
        return (
          <div className="flex justify-center space-x-2">
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                {isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              </TooltipTrigger>
              <TooltipContent>
                {isPublic
                  ? i18next.t("episodes:episodesTable.accessState.public")
                  : i18next.t("episodes:episodesTable.accessState.private")}
              </TooltipContent>
            </Tooltip>
          </div>
        );
      },
      enableSorting: false,
      meta: getMeta("isPublic", "episodes:episodesTable.heading.access"),
    }),
    columnHelper.accessor("duration", {
      header: ({ column }: { column: Column<MuiEventsDataFragment> }) => (
        <DataTableColumnHeader
          column={column}
          title={getTitle("duration", "episodes:episodesTable.heading.duration")}
          className="flex justify-center"
        />
      ),
      cell: ({ row }: { row: Row<MuiEventsDataFragment> }) => {
        const parsedDuration = parseDuration(row.getValue("duration") as string);
        return (
          <div className="flex justify-center space-x-2">
            <OverflowTooltip>
              {!parsedDuration || parsedDuration === "00:00:00" ? "∞" : parsedDuration}
            </OverflowTooltip>
          </div>
        );
      },
      meta: getMeta("duration", "episodes:episodesTable.heading.duration"),
    }),
    columnHelper.accessor("startDate", {
      header: ({ column }: { column: Column<MuiEventsDataFragment> }) => (
        <DataTableColumnHeader
          column={column}
          title={getTitle("startDate", "episodes:episodesTable.heading.startDate")}
          className="flex justify-center ml-3"
        />
      ),
      cell: ({ row }: { row: Row<MuiEventsDataFragment> }) => {
        const value = formatDate(row.getValue("startDate") as string);
        return (
          <div className="flex justify-center space-x-2 truncate">
            <OverflowTooltip>{value}</OverflowTooltip>
          </div>
        );
      },
      meta: getMeta("startDate", "episodes:episodesTable.heading.startDate"),
    }),
    columnHelper.display({
      id: "actions",
      header: () => (
        <span className="flex justify-center items-center">
          {getTitle("actions", "episodes:episodesTable.heading.actions.title")}
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="w-4 h-4">
                <Info className="w-4 h-4 ml-1 hover:text-foreground" />
                <span className="sr-only">
                  {i18next.t("episodes:episodesTable.heading.actions.info")}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent className="w-96">
              {i18next.t("episodes:episodesTable.heading.actions.info")}
            </TooltipContent>
          </Tooltip>
        </span>
      ),
      // 3 direct actions in BOTH views (#42): edit-data, edit-video, play.
      // Download and the delete actions live in the overflow menu, matching
      // the gallery view.
      cell: ({ row }: { row: Row<MuiEventsDataFragment> }) => (
        <ActionsCell event={row.original} refetch={refetch} maxVisibleActions={3} />
      ),
      meta: getMeta("actions", "episodes:episodesTable.heading.actions.title"),
    }),
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const galleryColumns: ColumnDef<MuiEventsDataFragment, any>[] = [
    columnHelper.accessor("title", {
      // Config-addressable id for the combined cell (#373). Sorting stays
      // enabled explicitly: the id is no backend field, so the automatic
      // restriction below would strip it — useEpisodesTable maps the id back
      // to `title` when building orderBy.
      id: "video",
      enableSorting: true,
      header: ({ column }: { column: Column<MuiEventsDataFragment> }) => (
        <DataTableColumnHeader
          column={column}
          title={getTitle("video", "episodes:episodesTable.heading.video")}
        />
      ),
      cell: ({ row }: { row: Row<MuiEventsDataFragment> }) => (
        <GalleryVideoCell event={row.original} />
      ),
      meta: getMeta("video", "episodes:episodesTable.heading.video"),
    }),
    columnHelper.accessor("seriesName", {
      header: ({ column }: { column: Column<MuiEventsDataFragment> }) => (
        <DataTableColumnHeader
          column={column}
          title={getTitle("seriesName", "episodes:episodesTable.heading.series")}
        />
      ),
      cell: ({ row }: { row: Row<MuiEventsDataFragment> }) => {
        return (
          <div className="flex space-x-2">
            <OverflowTooltip className="max-w-[200px] truncate">
              {row.getValue("seriesName")}
            </OverflowTooltip>
          </div>
        );
      },
      meta: getMeta("seriesName", "episodes:episodesTable.heading.series"),
    }),
    columnHelper.accessor("startDate", {
      // See "video" above — id maps back to `startDate` for orderBy.
      id: "dateAndLocation",
      enableSorting: true,
      header: ({ column }: { column: Column<MuiEventsDataFragment> }) => (
        <DataTableColumnHeader
          column={column}
          title={getTitle("dateAndLocation", "episodes:episodesTable.heading.dateAndLocation")}
          className="grid justify-start space-x-2"
        />
      ),
      cell: ({ row }: { row: Row<MuiEventsDataFragment> }) => {
        const value = formatDate(row.getValue("startDate") as string);
        return (
          <div className="grid items-center justify-start">
            <OverflowTooltip className="truncate text-center">{value}</OverflowTooltip>
            <p className="flex justify-start">{row.original.location}</p>
          </div>
        );
      },
      meta: getMeta("dateAndLocation", "episodes:episodesTable.heading.dateAndLocation"),
    }),
    columnHelper.accessor("presenters", {
      header: ({ column }: { column: Column<MuiEventsDataFragment> }) => (
        <DataTableColumnHeader
          column={column}
          title={getTitle("presenters", "episodes:episodesTable.heading.presenters")}
        />
      ),
      cell: (data) => {
        const presenters = data.getValue() || [];
        return (
          <OverflowTooltip className="truncate whitespace-pre max-h-[32px] max-w-[200px] flex items-center">
            {presenters.map((name: string | null, index: number) => (
              <span key={index} className="block">
                {name || ""}
              </span>
            ))}
          </OverflowTooltip>
        );
      },
      meta: getMeta("presenters", "episodes:episodesTable.heading.presenters"),
    }),
    columnHelper.display({
      id: "actions",
      header: () => (
        <span className="flex justify-center items-center">
          {getTitle("actions", "episodes:episodesTable.heading.actions.title")}
        </span>
      ),
      cell: ({ row }: { row: Row<MuiEventsDataFragment> }) => (
        <ActionsCell event={row.original} refetch={refetch} maxVisibleActions={3} />
      ),
      meta: getMeta("actions", "episodes:episodesTable.heading.actions.title"),
    }),
  ];

  // A standalone thumbnail column for deployments that split the combined
  // "video" cell into separate columns (#373). Display-only, never sortable.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const thumbnailColumn: ColumnDef<MuiEventsDataFragment, any> = columnHelper.display({
    id: "thumbnail",
    header: ({ column }: { column: Column<MuiEventsDataFragment> }) => (
      <DataTableColumnHeader
        column={column}
        title={getTitle("thumbnail", "episodes:episodesTable.heading.thumbnail")}
      />
    ),
    cell: ({ row }: { row: Row<MuiEventsDataFragment> }) => (
      <img
        src={row.original.muiEventInfo?.thumbnailUrl || "./nothumbnail.svg"}
        className="w-[120px] rounded-lg"
        alt=""
      />
    ),
    enableSorting: false,
    meta: getMeta("thumbnail", "episodes:episodesTable.heading.thumbnail"),
  });

  // The gallery's column POOL is the combined cells plus every list column
  // that has no gallery-specific counterpart, plus the thumbnail. Which of
  // them actually show is decided by visibility (GALLERY_DEFAULT_VISIBLE
  // below ⊕ the deployment's config ⊕ the user's toggles) — so one config
  // can keep the combined cells while another splits them into single
  // columns, without two view implementations (#373).
  const galleryOnlyIds = new Set(
    galleryColumns.map(
      (column) =>
        (column as { id?: string; accessorKey?: string }).id ??
        (column as { accessorKey?: string }).accessorKey,
    ),
  );
  const galleryPool = [
    ...galleryColumns,
    thumbnailColumn,
    ...listColumns.filter((column) => {
      const id =
        (column as { id?: string; accessorKey?: string }).id ??
        (column as { accessorKey?: string }).accessorKey;
      return id !== undefined && !galleryOnlyIds.has(id);
    }),
  ];

  // Derive sortability from the backend's EventOrderByInput rather than
  // hardcoding enableSorting per column: any column whose field the
  // backend can't order by loses its sort control automatically. Keeps
  // the table honest when columns are added or the schema changes.
  const columns = layout === "gallery" ? galleryPool : listColumns;
  return restrictSortingToFields(columns, EVENT_SORTABLE_FIELDS);
};

/**
 * Sorting ids the backend does not know: the combined gallery cells sort by
 * the field their primary content comes from. Applied where orderBy is built
 * (useEpisodesTable).
 */
export const GALLERY_SORT_FIELD_BY_COLUMN: Record<string, string> = {
  video: "title",
  dateAndLocation: "startDate",
};
