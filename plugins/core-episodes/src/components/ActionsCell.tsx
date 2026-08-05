import { Pencil, PlayCircle, Scissors, Trash2, ArrowDownToLine, MoreVertical } from "lucide-react";
import React, { useState } from "react";

import { i18next } from "@oc-mui/i18n";
import { PluginComponent } from "@oc-mui/plugin-system";
import { useAppConfig, useMuiDeleteEventMutation } from "@oc-mui/query";
import type { MuiEventsDataFragment } from "@oc-mui/query";
import { Link } from "@oc-mui/router";
import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogClose,
  DialogTitle,
  DialogFooter,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  toast,
} from "@oc-mui/ui/components";
import { buildDownloadFileName, resolveDownloadUrl } from "@oc-mui/utils";

import { useSidebarStore } from "../stores/sidebarStore";

export interface ActionItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  tooltip: string;
  onClick?: (event: MuiEventsDataFragment) => void;
  href?: string;
  target?: string;
  component?: React.ComponentType<{ event: MuiEventsDataFragment }>;
  menuItem?: React.ComponentType<{ event: MuiEventsDataFragment }>;
  condition?: (event: MuiEventsDataFragment) => boolean;
  priority?: number; // Higher priority = shown first
}

interface ActionsCellProps {
  event: MuiEventsDataFragment;
  refetch: () => void;
  maxVisibleActions?: number;
}

interface ExtendedActionsCellProps extends ActionsCellProps {
  customActions?: ActionItem[];
}

const DefaultActionsCell: React.FC<ExtendedActionsCellProps> = ({
  event,
  refetch,
  maxVisibleActions = 4,
  customActions = [],
}) => {
  const stopRowClick = (event: React.SyntheticEvent) => {
    event.stopPropagation();
  };

  const [dialogOpen, setDialogOpen] = useState(false);
  const deleteEvent = useMuiDeleteEventMutation();
  const { config } = useAppConfig();
  const { openSidebarWithData } = useSidebarStore();
  const downloadBaseUrl =
    typeof config.downloadBaseUrl === "string" ? config.downloadBaseUrl : undefined;

  const onDelete = (id: string) => {
    deleteEvent.mutate(
      { eventId: id },
      {
        onSuccess: () => {
          toast.success(i18next.t("episodes:episodesTable.notification.deleteSuccess"));
          refetch();
        },
        onError: () => {
          toast.error(i18next.t("episodes:episodesTable.notification.deleteError"));
        },
      },
    );
    setDialogOpen(false);
  };

  // Define default actions
  const defaultActions: ActionItem[] = [
    {
      id: "edit-data",
      icon: <Pencil />,
      label: i18next.t("episodes:episodesTable.action.editData"),
      tooltip: i18next.t("episodes:episodesTable.action.editData"),
      onClick: (event) => openSidebarWithData(event.id, true, {}),
      condition: (event) => {
        const status = event.eventStatus?.split(".").pop()?.toUpperCase();
        return !(
          status === "PROCESSING" ||
          status === "PENDING" ||
          status === "PROCESSING_FAILURE"
        );
      },
      priority: 100,
    },
    {
      id: "edit-video",
      icon: <Scissors />,
      label: i18next.t("episodes:episodesTable.action.editVideo"),
      tooltip: i18next.t("episodes:episodesTable.action.editVideo"),
      href: `/editor-ui/index.html?mediaPackageId=${event.id}`,
      target: "_blank",
      condition: (event) => !!event.hasPreview,
      priority: 90,
    },
    {
      id: "play",
      icon: <PlayCircle />,
      label: i18next.t("episodes:episodesTable.action.play"),
      tooltip: i18next.t("episodes:episodesTable.action.play"),
      href: event.muiEventInfo?.publishUrl || "",
      target: "_blank",
      condition: (event) => !!event.muiEventInfo?.publishUrl,
      priority: 80,
    },
    {
      id: "download",
      icon: <ArrowDownToLine />,
      label: i18next.t("episodes:episodesTable.action.download"),
      tooltip: i18next.t("episodes:episodesTable.action.download"),
      component: ({ event }) => (
        <DownloadDropdown event={event} downloadBaseUrl={downloadBaseUrl} />
      ),
      menuItem: ({ event }) => <DownloadMenuItem event={event} downloadBaseUrl={downloadBaseUrl} />,
      condition: (event) => !!event.muiEventInfo?.publishUrl,
      priority: 70,
    },
    {
      id: "delete",
      icon: <Trash2 />,
      label: i18next.t("common:delete"),
      tooltip: i18next.t("common:delete"),
      component: () => <DeleteAction onOpen={() => setDialogOpen(true)} />,
      menuItem: () => <DeleteMenuItem onOpen={() => setDialogOpen(true)} />,
      priority: 10, // Lower priority = shown later
    },
  ];

  // Merge default and custom actions
  const allActions = [...defaultActions, ...customActions];

  // Filter actions based on conditions and sort by priority
  const availableActions = allActions
    .filter((action) => !action.condition || action.condition(event))
    .sort((a, b) => (b.priority || 0) - (a.priority || 0));

  const visibleActions = availableActions.slice(0, maxVisibleActions);
  const hiddenActions = availableActions.slice(maxVisibleActions);

  const renderAction = (action: ActionItem) => {
    if (action.component) {
      return <action.component key={action.id} event={event} />;
    }

    const button = (
      <Button variant="ghost" size="icon" className="w-4 h-4">
        {action.icon}
        <span className="sr-only">{action.label}</span>
      </Button>
    );

    const actionElement = action.href ? (
      action.target ? (
        <a
          href={action.href}
          target={action.target}
          {...(action.target === "_blank" && { rel: "noopener noreferrer" })}
          className="flex items-center justify-end group"
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            action.onClick?.(event);
          }}
        >
          {button}
        </a>
      ) : (
        <Link
          to={action.href}
          className="flex items-center justify-end group"
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            action.onClick?.(event);
          }}
        >
          {button}
        </Link>
      )
    ) : (
      <div
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          action.onClick?.(event);
        }}
      >
        {button}
      </div>
    );

    return (
      <Tooltip key={action.id} delayDuration={300}>
        <TooltipTrigger className="flex" asChild>
          {actionElement}
        </TooltipTrigger>
        <TooltipContent>{action.tooltip}</TooltipContent>
      </Tooltip>
    );
  };

  return (
    <div
      className="flex items-center justify-center gap-2 p-3"
      onClick={stopRowClick}
      onPointerDown={stopRowClick}
    >
      {visibleActions.map(renderAction)}

      {hiddenActions.length > 0 && (
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="w-4 h-4">
                  <MoreVertical />
                  <span className="sr-only">More actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>More Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {hiddenActions.map((action) => {
                  if (action.menuItem) {
                    return <action.menuItem key={action.id} event={event} />;
                  }

                  if (action.href) {
                    const content = (
                      <>
                        {action.icon}
                        <span>{action.label}</span>
                      </>
                    );

                    return (
                      <DropdownMenuItem key={action.id} asChild className="gap-2 cursor-pointer">
                        {action.target ? (
                          <a
                            href={action.href}
                            target={action.target}
                            {...(action.target === "_blank" && { rel: "noopener noreferrer" })}
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                            className="flex items-center gap-2"
                          >
                            {content}
                          </a>
                        ) : (
                          <Link
                            to={action.href}
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                            className="flex items-center gap-2"
                          >
                            {content}
                          </Link>
                        )}
                      </DropdownMenuItem>
                    );
                  }

                  if (!action.onClick) {
                    return (
                      <DropdownMenuItem key={action.id} disabled className="gap-2">
                        {action.icon}
                        <span>{action.label}</span>
                      </DropdownMenuItem>
                    );
                  }

                  return (
                    <DropdownMenuItem
                      key={action.id}
                      onSelect={(e) => {
                        e.stopPropagation();
                        action.onClick?.(event);
                      }}
                      className="gap-2 cursor-pointer"
                    >
                      {action.icon}
                      <span>{action.label}</span>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </TooltipTrigger>
          <TooltipContent>More actions</TooltipContent>
        </Tooltip>
      )}
      <DeleteDialog
        event={event}
        onDelete={onDelete}
        dialogOpen={dialogOpen}
        setDialogOpen={setDialogOpen}
      />
    </div>
  );
};

const DeleteDialog: React.FC<{
  event: MuiEventsDataFragment;
  onDelete: (id: string) => void;
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
}> = ({ event, onDelete, dialogOpen, setDialogOpen }) => (
  <Dialog onOpenChange={setDialogOpen} open={dialogOpen}>
    <DeleteDialogContent event={event} onDelete={onDelete} setDialogOpen={setDialogOpen} />
  </Dialog>
);

const DeleteDialogContent: React.FC<{
  event: MuiEventsDataFragment;
  onDelete: (id: string) => void;
  setDialogOpen: (open: boolean) => void;
}> = ({ event, onDelete, setDialogOpen }) => (
  <DialogContent onClick={(e: React.MouseEvent) => e.stopPropagation()}>
    <DialogHeader>
      <DialogTitle>{i18next.t("episodes:episodesTable.deleteDialogue.heading")}</DialogTitle>
      <DialogDescription
        dangerouslySetInnerHTML={{
          // The translation carries trusted static <strong> markup, so it is
          // rendered as HTML. `event.title` is user-controlled, so escape the
          // interpolated value here (i18n runs with escapeValue:false globally)
          // to prevent stored XSS via a crafted event title.
          __html: i18next.t("episodesTable.deleteDialogue.text", {
            title: event.title || "",
            ns: "episodes",
            interpolation: { escapeValue: true },
          }),
        }}
      />
      <DialogClose
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          setDialogOpen(false);
        }}
      />
    </DialogHeader>
    <DialogFooter>
      <Button
        variant="destructive"
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          onDelete(event.id);
        }}
      >
        {i18next.t("common:delete")}
      </Button>
      <DialogClose asChild>
        <Button
          variant="secondary"
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            setDialogOpen(false);
          }}
        >
          {i18next.t("common:cancel")}
        </Button>
      </DialogClose>
    </DialogFooter>
  </DialogContent>
);

// Separate components for complex actions
const DeleteAction: React.FC<{
  onOpen: () => void;
  event?: MuiEventsDataFragment;
}> = ({ onOpen }) => (
  <Tooltip delayDuration={300}>
    <TooltipTrigger asChild>
      <Button
        variant="ghost"
        size="icon"
        className="w-4 h-4"
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          onOpen();
        }}
      >
        <Trash2 />
      </Button>
    </TooltipTrigger>
    <TooltipContent>{i18next.t("common:delete")}</TooltipContent>
  </Tooltip>
);

const DeleteMenuItem: React.FC<{
  onOpen: () => void;
  event?: MuiEventsDataFragment;
}> = ({ onOpen }) => (
  <DropdownMenuItem
    onSelect={(e) => {
      e.stopPropagation();
      onOpen();
    }}
    className="gap-2 cursor-pointer"
  >
    <Trash2 className="w-4 h-4" />
    <span>{i18next.t("common:delete")}</span>
  </DropdownMenuItem>
);

const addDownloadParam = (uri: string): string => {
  try {
    const url = new URL(uri);
    url.searchParams.set("download", "1");
    return url.toString();
  } catch {
    const separator = uri.includes("?") ? "&" : "?";
    return `${uri}${separator}download=1`;
  }
};

const renderDownloadMenuItems = (event: MuiEventsDataFragment, downloadBaseUrl?: string) =>
  event.publications?.[0]?.tracks
    ?.sort((t1, t2) => {
      const height1 = t1?.height ?? 0;
      const height2 = t2?.height ?? 0;
      return height1 > height2 ? -1 : height1 < height2 ? 1 : 0;
    })
    .map((track, index) => {
      const trackReferences = [track?.logicalName, track?.uri].filter((value): value is string =>
        Boolean(value),
      );
      if (
        trackReferences.some((value) =>
          [".m3u8", ".mpd", ".f4m", ".smil"].some((el) => value.includes(el)),
        )
      ) {
        return null;
      }

      const downloadUrl = resolveDownloadUrl({
        baseUrl: downloadBaseUrl,
        logicalName: track?.logicalName,
        fallbackUrl: track?.uri,
      });

      if (!downloadUrl) return null;

      const fileName = buildDownloadFileName({
        title: event.title,
        source: track?.logicalName ?? track?.uri,
        mimeType: track?.mimeType,
      });

      return (
        <DropdownMenuItem key={index} asChild className="gap-2 cursor-pointer">
          <a
            href={addDownloadParam(downloadUrl)}
            target="_blank"
            rel="noreferrer"
            download={fileName}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            className="flex items-center gap-2"
          >
            <ArrowDownToLine className="w-4 h-4" />
            <span>
              {track?.flavor === "presentation/delivery" &&
                i18next.t("episodes:episodesTable.action.flavor.presentation")}
              {track?.flavor === "presenter/delivery" &&
                i18next.t("episodes:episodesTable.action.flavor.presenter")}
              {track?.flavor === "captions/delivery" &&
                i18next.t("episodes:episodesTable.action.flavor.subtitles")}
              {track?.width && ` (${track?.width} x ${track?.height})`}
              {track?.mimeType?.includes("audio") && ` (Audio)`}
            </span>
          </a>
        </DropdownMenuItem>
      );
    })
    .filter((item): item is React.ReactElement => item !== null);

const DownloadMenuItem: React.FC<{
  event: MuiEventsDataFragment;
  downloadBaseUrl: string | undefined;
}> = ({ event, downloadBaseUrl }) => {
  const downloadItems = renderDownloadMenuItems(event, downloadBaseUrl);
  if (!downloadItems || downloadItems.length === 0) {
    return (
      <DropdownMenuItem disabled className="gap-2">
        <ArrowDownToLine className="w-4 h-4" />
        <span>{i18next.t("episodes:episodesTable.action.download")}</span>
      </DropdownMenuItem>
    );
  }

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className="gap-2">
        <ArrowDownToLine className="w-4 h-4" />
        <span>{i18next.t("episodes:episodesTable.action.download")}</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuLabel>
          {i18next.t("episodes:episodesTable.action.selectDownloadVersion")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {downloadItems}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
};

const DownloadDropdown: React.FC<{
  event: MuiEventsDataFragment;
  downloadBaseUrl: string | undefined;
}> = ({ event, downloadBaseUrl }) => (
  <Tooltip delayDuration={300}>
    <DropdownMenu>
      <TooltipTrigger asChild>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="w-4 h-4">
            <ArrowDownToLine />
            <span className="sr-only">{i18next.t("episodes:episodesTable.action.download")}</span>
          </Button>
        </DropdownMenuTrigger>
      </TooltipTrigger>
      <TooltipContent>{i18next.t("episodes:episodesTable.action.download")}</TooltipContent>
      <DropdownMenuContent>
        <DropdownMenuLabel>
          {i18next.t("episodes:episodesTable.action.selectDownloadVersion")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {renderDownloadMenuItems(event, downloadBaseUrl)}
      </DropdownMenuContent>
    </DropdownMenu>
  </Tooltip>
);

// Main pluggable component
export const ActionsCell: React.FC<ActionsCellProps> = (props) => {
  return (
    <PluginComponent
      componentType="episodes:table:actions"
      pluginProps={{
        event: props.event,
        refetch: props.refetch,
        maxVisibleActions: props.maxVisibleActions,
      }}
    >
      <DefaultActionsCell {...props} />
    </PluginComponent>
  );
};

export default ActionsCell;
