import {
  History,
  CircleEllipsis,
  OctagonX,
  CirclePause,
  CircleCheck,
  CircleX,
  CalendarClock,
  ArrowUpToLine,
  Videotape,
  Info,
  Globe,
  Lock,
} from "lucide-react";
import React from "react";

import { i18next } from "@workspace/i18n";
import type { EventsDataFragment } from "@workspace/query";
import {
  createColumnHelper,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  Button,
  DataTableColumnHeader,
  OverflowTooltip,
  type ColumnDef,
  type Row,
  type Column,
} from "@workspace/ui/components";
import { cn } from "@workspace/ui/lib";
import { parseDuration } from "@workspace/utils";

import ActionsCell from "./components/ActionsCell";

const columnHelper = createColumnHelper<EventsDataFragment>();

const getStatusIcon = (status: string) => {
  switch (status) {
    case "PENDING":
      return <CircleEllipsis className="h-5 w-5 text-warning" />;
    case "PROCESSING":
      return <History className="scale-x-[-1] h-5 w-5 text-info" />;
    case "PROCESSING_CANCELLED":
      return <OctagonX className="h-5 w-5 text-warning" />;
    case "PAUSED":
      return <CirclePause className="h-5 w-5 text-info" />;
    case "PROCESSED":
      return <CircleCheck className="h-5 w-5 text-ok" />;
    case "PROCESSING_FAILURE":
      return <CircleX className="h-5 w-5 text-error" />;
    case "SCHEDULED":
      return <CalendarClock className="h-5 w-5 text-info" />;
    case "INGESTING":
      return <ArrowUpToLine className="h-5 w-5 text-info" />;
    case "RECORDING":
      return <Videotape className="h-5 w-5 text-error" />;
    default:
      return <CircleEllipsis className="h-5 w-5 text-warning" />;
  }
};

// Convert columns to a factory function that accepts layout and refetch
export const createColumns = (
  refetch: () => void,
  layout: "list" | "gallery" = "list",
): ColumnDef<EventsDataFragment, unknown>[] => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const listColumns: ColumnDef<EventsDataFragment, any>[] = [
    columnHelper.accessor("title", {
      header: ({ column }: { column: Column<EventsDataFragment> }) => (
        <DataTableColumnHeader
          column={column}
          title={i18next.t("episodes:episodesTable.heading.title")}
        />
      ),
      cell: ({ row }: { row: Row<EventsDataFragment> }) => {
        return (
          <div className="flex space-x-2">
            <OverflowTooltip className="max-w-[500px] truncate font-medium">
              {row.getValue("title")}
            </OverflowTooltip>
          </div>
        );
      },
      meta: {
        translatedTitle: "episodes:episodesTable.heading.title",
      },
    }),
    columnHelper.accessor("seriesName", {
      header: ({ column }: { column: Column<EventsDataFragment> }) => (
        <DataTableColumnHeader
          column={column}
          title={i18next.t("episodes:episodesTable.heading.series")}
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
      meta: {
        translatedTitle: "episodes:episodesTable.heading.series",
      },
    }),
    columnHelper.accessor("description", {
      header: ({ column }: { column: Column<EventsDataFragment> }) => (
        <DataTableColumnHeader
          column={column}
          title={i18next.t("episodes:episodesTable.heading.description")}
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
      meta: {
        translatedTitle: "episodes:episodesTable.heading.description",
      },
    }),
    columnHelper.accessor("eventStatus", {
      header: ({ column }: { column: Column<EventsDataFragment> }) => (
        <DataTableColumnHeader
          column={column}
          title={i18next.t("episodes:episodesTable.heading.status")}
          className="flex justify-center"
        />
      ),
      cell: ({ row }: { row: Row<EventsDataFragment> }) => {
        const status = row.original.eventStatus?.split(".").pop() || "";
        const statusIcon = getStatusIcon(status);

        return (
          <div className="flex justify-center space-x-2">
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <span className="flex items-center">{statusIcon}</span>
              </TooltipTrigger>
              <TooltipContent>
                {i18next.t(`episodes:episodesTable.status.${status.toLowerCase()}`)}
              </TooltipContent>
            </Tooltip>
          </div>
        );
      },
      meta: {
        translatedTitle: "episodes:episodesTable.heading.status",
      },
    }),
    columnHelper.accessor("contributors", {
      header: ({ column }: { column: Column<EventsDataFragment> }) => (
        <DataTableColumnHeader
          column={column}
          title={i18next.t("episodes:episodesTable.heading.contributors")}
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
        translatedTitle: "episodes:episodesTable.heading.contributors",
      },
    }),
    columnHelper.accessor("presenters", {
      header: ({ column }: { column: Column<EventsDataFragment> }) => (
        <DataTableColumnHeader
          column={column}
          title={i18next.t("episodes:episodesTable.heading.presenters")}
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
      meta: {
        translatedTitle: "episodes:episodesTable.heading.presenters",
      },
    }),
    columnHelper.accessor("location", {
      header: ({ column }: { column: Column<EventsDataFragment> }) => (
        <DataTableColumnHeader
          column={column}
          title={i18next.t("episodes:episodesTable.heading.location")}
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
      meta: {
        translatedTitle: "episodes:episodesTable.heading.location",
      },
    }),
    columnHelper.accessor((row) => row.muiEventInfo?.isPublic, {
      id: "isPublic",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={i18next.t("episodes:episodesTable.heading.access")}
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
      meta: {
        translatedTitle: "episodes:episodesTable.heading.access",
      },
    }),
    columnHelper.accessor("duration", {
      header: ({ column }: { column: Column<EventsDataFragment> }) => (
        <DataTableColumnHeader
          column={column}
          title={i18next.t("episodes:episodesTable.heading.duration")}
          className="flex justify-center"
        />
      ),
      cell: ({ row }: { row: Row<EventsDataFragment> }) => {
        const parsedDuration = parseDuration(row.getValue("duration") as string);
        return (
          <div className="flex justify-center space-x-2">
            <OverflowTooltip>
              {!parsedDuration || parsedDuration === "00:00:00" ? "∞" : parsedDuration}
            </OverflowTooltip>
          </div>
        );
      },
      meta: {
        translatedTitle: "episodes:episodesTable.heading.duration",
      },
    }),
    columnHelper.accessor("startDate", {
      header: ({ column }: { column: Column<EventsDataFragment> }) => (
        <DataTableColumnHeader
          column={column}
          title={i18next.t("episodes:episodesTable.heading.startDate")}
          className="flex justify-center ml-3"
        />
      ),
      cell: ({ row }: { row: Row<EventsDataFragment> }) => {
        const value = new Intl.DateTimeFormat("de-DE", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(row.getValue("startDate") as string));
        return (
          <div className="flex justify-center space-x-2 truncate">
            <OverflowTooltip>{value}</OverflowTooltip>
          </div>
        );
      },
      meta: {
        translatedTitle: "episodes:episodesTable.heading.startDate",
      },
    }),
    columnHelper.display({
      id: "actions",
      header: () => (
        <span className="flex justify-center items-center">
          {i18next.t("episodes:episodesTable.heading.actions.title")}
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="w-4 h-4">
                <Info className="w-4 h-4 ml-1 hover:text-gray-900" />
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
      cell: ({ row }: { row: Row<EventsDataFragment> }) => (
        <ActionsCell event={row.original} refetch={refetch} maxVisibleActions={4} />
      ),
      meta: {
        translatedTitle: "episodes:episodesTable.heading.actions.title",
      },
    }),
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const galleryColumns: ColumnDef<EventsDataFragment, any>[] = [
    columnHelper.accessor("title", {
      header: ({ column }: { column: Column<EventsDataFragment> }) => (
        <DataTableColumnHeader
          column={column}
          title={i18next.t("episodes:episodesTable.heading.video")}
        />
      ),
      cell: ({ row }: { row: Row<EventsDataFragment> }) => {
        const thumbnail = row.original.muiEventInfo?.thumbnailUrl;
        const parsedDuration = parseDuration(row.original.duration);
        const duration = !parsedDuration || parsedDuration === "00:00:00" ? "∞" : parsedDuration;
        const status = row.original.eventStatus?.split(".").pop() || "";
        const statusIcon = getStatusIcon(status);
        const isProcessed = status === "PROCESSED";

        return (
          <div className="flex items-center h-[125px] w-[500px] space-x-2 group">
            <div className="relative my-2 me-2 group overflow-hidden rounded-lg">
              <a
                href={row.original.muiEventInfo?.publishUrl || ""}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                }}
              >
                <img
                  src={thumbnail || "./nothumbnail.svg"}
                  className="
                  overflow-hidden
                  rounded-lg
                  w-[160px]
                  h-[90px]
                  transition-transform
                  duration-300
                  group-hover:scale-110
                "
                  alt=""
                />
                {!isProcessed && (
                  <>
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm grayscale" />
                    <div className="absolute inset-0 flex items-center justify-center group-hover:scale-110">
                      {React.cloneElement(statusIcon, {
                        className: "w-1/3 h-1/3 text-white drop-shadow-lg mix-blend-screen",
                      })}
                    </div>
                  </>
                )}
                <div
                  className="
                absolute
                inset-0
                flex
                items-center
                justify-center
                opacity-0
                transition-opacity
                bg-black/5
                group-hover:opacity-100
                duration-300
              "
                ></div>
                <div
                  style={{
                    position: "absolute",
                    bottom: "5px",
                    right: "5px",
                    backgroundColor: "rgba(0, 0, 0, 0.7)",
                    color: "white",
                    padding: "4px",
                    borderRadius: "4px",
                  }}
                >
                  {duration}
                </div>
              </a>
            </div>
            <div className="flex-1 self-center overflow-hidden min-w-0">
              <OverflowTooltip className="block max-w-[300px] font-medium truncate whitespace-nowrap overflow-hidden">
                {row.getValue("title")}
              </OverflowTooltip>
              <p className="max-w-[500px] overflow-hidden text-ellipsis break-word line-clamp-3">
                {row.original.description}
              </p>
            </div>
          </div>
        );
      },
      meta: {
        translatedTitle: "episodes:episodesTable.heading.video",
      },
    }),
    columnHelper.accessor("seriesName", {
      header: ({ column }: { column: Column<EventsDataFragment> }) => (
        <DataTableColumnHeader
          column={column}
          title={i18next.t("episodes:episodesTable.heading.series")}
        />
      ),
      cell: ({ row }: { row: Row<EventsDataFragment> }) => {
        return (
          <div className="flex space-x-2">
            <OverflowTooltip className="max-w-[200px] truncate">
              {row.getValue("seriesName")}
            </OverflowTooltip>
          </div>
        );
      },
      meta: {
        translatedTitle: "episodes:episodesTable.heading.series",
      },
    }),
    columnHelper.accessor("startDate", {
      header: ({ column }: { column: Column<EventsDataFragment> }) => (
        <DataTableColumnHeader
          column={column}
          title={i18next.t("episodes:episodesTable.heading.dateAndLocation")}
          className="grid justify-start space-x-2"
        />
      ),
      cell: ({ row }: { row: Row<EventsDataFragment> }) => {
        const value = new Intl.DateTimeFormat("de-DE", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(row.getValue("startDate") as string));
        return (
          <div className="grid items-center justify-start">
            <OverflowTooltip className="truncate text-center">{value}</OverflowTooltip>
            <p className="flex justify-start">{row.original.location}</p>
          </div>
        );
      },
      meta: {
        translatedTitle: "episodes:episodesTable.heading.startDate",
      },
    }),
    columnHelper.accessor("presenters", {
      header: ({ column }: { column: Column<EventsDataFragment> }) => (
        <DataTableColumnHeader
          column={column}
          title={i18next.t("episodes:episodesTable.heading.presenters")}
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
      meta: {
        translatedTitle: "episodes:episodesTable.heading.presenters",
      },
    }),
    columnHelper.display({
      id: "actions",
      header: () => (
        <span className="flex justify-center items-center">
          {i18next.t("episodes:episodesTable.heading.actions.title")}
        </span>
      ),
      cell: ({ row }: { row: Row<EventsDataFragment> }) => (
        <ActionsCell event={row.original} refetch={refetch} maxVisibleActions={3} />
      ),
      meta: {
        translatedTitle: "episodes:episodesTable.heading.actions.title",
      },
    }),
  ];

  return layout === "gallery" ? galleryColumns : listColumns;
};
