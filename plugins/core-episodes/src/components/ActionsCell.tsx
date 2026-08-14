import { Pencil, PlayCircle, Scissors, Trash2, ArrowDownToLine, MoreVertical } from "lucide-react";
import React, { useState } from "react";

import { i18next } from "@oc-mui/i18n";
import { PluginComponent } from "@oc-mui/plugin-system";
import {
  useAppConfig,
  useMuiDeleteEventMutation,
  useDeleteEventPermanentlyMutation,
  useGetUserInfo,
} from "@oc-mui/query";
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
  const [permanentDialogOpen, setPermanentDialogOpen] = useState(false);
  const deleteEvent = useMuiDeleteEventMutation();
  const deleteEventPermanently = useDeleteEventPermanentlyMutation();
  // Admin gate, matching AppProtection and the sidebar rather than inventing a
  // third variant: authorize against the *granted* roles array (Opencast's
  // `userRole` is the per-user `ROLE_USER_<name>` identity, not a privilege), and
  // treat the organization's configured `org.adminRole` as equivalent to the
  // canonical `ROLE_ADMIN` — a deployment that renamed its admin role must not
  // silently lose the permanent-delete action.
  const { data: userInfo } = useGetUserInfo();
  const userRoles = userInfo?.roles ?? [];
  const orgAdminRole = userInfo?.org?.adminRole;
  const isAdmin =
    userRoles.includes("ROLE_ADMIN") ||
    (orgAdminRole !== undefined && userRoles.includes(orgAdminRole));
  const { config } = useAppConfig();
  const { openSidebarWithData } = useSidebarStore();
  const downloadBaseUrl =
    typeof config.downloadBaseUrl === "string" ? config.downloadBaseUrl : undefined;

  // Default delete is a soft delete: the backend moves the event into the trash
  // series (mui.deleteEvent → configured trash workflow), hiding it from regular
  // users while keeping it recoverable.
  const onDelete = (id: string) => {
    deleteEvent.mutate(
      { eventId: id },
      {
        onSuccess: () => {
          toast.success(i18next.t("episodes:episodesTable.notification.trashSuccess"));
          refetch();
        },
        onError: () => {
          toast.error(i18next.t("episodes:episodesTable.notification.trashError"));
        },
      },
    );
    setDialogOpen(false);
  };

  // Permanent delete is admin-only: it removes the event from the index for good
  // (top-level deleteEvent → IndexService.removeEvent). Irreversible.
  const onDeletePermanently = (id: string) => {
    deleteEventPermanently.mutate(
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
    setPermanentDialogOpen(false);
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
      label: i18next.t("episodes:episodesTable.action.moveToTrash"),
      tooltip: i18next.t("episodes:episodesTable.action.moveToTrash"),
      component: () => <DeleteAction onOpen={() => setDialogOpen(true)} />,
      menuItem: () => <DeleteMenuItem onOpen={() => setDialogOpen(true)} />,
      priority: 10, // Lower priority = shown later
    },
    {
      id: "delete-permanently",
      icon: <Trash2 />,
      label: i18next.t("episodes:episodesTable.action.deletePermanently"),
      tooltip: i18next.t("episodes:episodesTable.action.deletePermanently"),
      component: () => <DeletePermanentlyAction onOpen={() => setPermanentDialogOpen(true)} />,
      menuItem: () => <DeletePermanentlyMenuItem onOpen={() => setPermanentDialogOpen(true)} />,
      condition: () => isAdmin, // admin-only, irreversible
      priority: 5, // Lowest priority → overflow menu, after soft delete
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
        onConfirm={onDelete}
        dialogOpen={dialogOpen}
        setDialogOpen={setDialogOpen}
        heading={i18next.t("episodes:episodesTable.trashDialogue.heading")}
        bodyKey="episodesTable.trashDialogue.text"
        confirmLabel={i18next.t("episodes:episodesTable.action.moveToTrash")}
      />
      {isAdmin && (
        <DeleteDialog
          event={event}
          onConfirm={onDeletePermanently}
          dialogOpen={permanentDialogOpen}
          setDialogOpen={setPermanentDialogOpen}
          heading={i18next.t("episodes:episodesTable.deleteDialogue.heading")}
          bodyKey="episodesTable.deleteDialogue.text"
          confirmLabel={i18next.t("common:delete")}
        />
      )}
    </div>
  );
};

const DeleteDialog: React.FC<{
  event: MuiEventsDataFragment;
  onConfirm: (id: string) => void;
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  heading: string;
  /** i18n key inside the `episodes` namespace; interpolated with the title. */
  bodyKey: string;
  confirmLabel: string;
}> = ({ event, onConfirm, dialogOpen, setDialogOpen, heading, bodyKey, confirmLabel }) => (
  <Dialog onOpenChange={setDialogOpen} open={dialogOpen}>
    <DeleteDialogContent
      event={event}
      onConfirm={onConfirm}
      setDialogOpen={setDialogOpen}
      heading={heading}
      bodyKey={bodyKey}
      confirmLabel={confirmLabel}
    />
  </Dialog>
);

const DeleteDialogContent: React.FC<{
  event: MuiEventsDataFragment;
  onConfirm: (id: string) => void;
  setDialogOpen: (open: boolean) => void;
  heading: string;
  /** i18n key inside the `episodes` namespace; interpolated with the title. */
  bodyKey: string;
  confirmLabel: string;
}> = ({ event, onConfirm, setDialogOpen, heading, bodyKey, confirmLabel }) => (
  <DialogContent onClick={(e: React.MouseEvent) => e.stopPropagation()}>
    <DialogHeader>
      <DialogTitle>{heading}</DialogTitle>
      <DialogDescription
        dangerouslySetInnerHTML={{
          // The translations carry trusted static <strong> markup, so they are
          // rendered as HTML. `event.title` is user-controlled, so the
          // interpolated value is escaped here — i18n runs with
          // escapeValue:false globally, and this would otherwise be stored XSS
          // via a crafted event title.
          //
          // Rendered from a key rather than a ready-made `bodyHtml` string on
          // purpose: with two dialogs sharing this component, a caller passing
          // pre-rendered text is one forgotten `escapeValue` away from
          // reopening the hole. The invariant lives in one place instead.
          __html: i18next.t(bodyKey, {
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
          onConfirm(event.id);
        }}
      >
        {confirmLabel}
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
        <span className="sr-only">{i18next.t("episodes:episodesTable.action.moveToTrash")}</span>
      </Button>
    </TooltipTrigger>
    <TooltipContent>{i18next.t("episodes:episodesTable.action.moveToTrash")}</TooltipContent>
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
    <span>{i18next.t("episodes:episodesTable.action.moveToTrash")}</span>
  </DropdownMenuItem>
);

// Admin-only permanent delete (irreversible). Styled destructive to distinguish
// it from the default soft delete (move to trash).
const DeletePermanentlyAction: React.FC<{
  onOpen: () => void;
  event?: MuiEventsDataFragment;
}> = ({ onOpen }) => (
  <Tooltip delayDuration={300}>
    <TooltipTrigger asChild>
      <Button
        variant="ghost"
        size="icon"
        className="w-4 h-4 text-destructive hover:text-destructive"
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          onOpen();
        }}
      >
        <Trash2 />
        <span className="sr-only">
          {i18next.t("episodes:episodesTable.action.deletePermanently")}
        </span>
      </Button>
    </TooltipTrigger>
    <TooltipContent>{i18next.t("episodes:episodesTable.action.deletePermanently")}</TooltipContent>
  </Tooltip>
);

const DeletePermanentlyMenuItem: React.FC<{
  onOpen: () => void;
  event?: MuiEventsDataFragment;
}> = ({ onOpen }) => (
  <DropdownMenuItem
    onSelect={(e) => {
      e.stopPropagation();
      onOpen();
    }}
    className="gap-2 cursor-pointer text-destructive focus:text-destructive"
  >
    <Trash2 className="w-4 h-4" />
    <span>{i18next.t("episodes:episodesTable.action.deletePermanently")}</span>
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

/**
 * Body of the visible download dropdown. Without the empty case this rendered
 * a "select a version" label over an empty list — the same missing-track state
 * the overflow menu explains, but with no explanation at all.
 */
const renderDownloadDropdownBody = (
  event: MuiEventsDataFragment,
  downloadBaseUrl: string | undefined,
) => {
  const items = renderDownloadMenuItems(event, downloadBaseUrl);
  if (!items || items.length === 0) {
    return (
      <DropdownMenuItem disabled className="max-w-xs whitespace-normal">
        {i18next.t("episodes:episodesTable.action.downloadUnavailable")}
      </DropdownMenuItem>
    );
  }
  return (
    <>
      <DropdownMenuLabel>
        {i18next.t("episodes:episodesTable.action.selectDownloadVersion")}
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      {items}
    </>
  );
};

const DownloadMenuItem: React.FC<{
  event: MuiEventsDataFragment;
  downloadBaseUrl: string | undefined;
}> = ({ event, downloadBaseUrl }) => {
  const downloadItems = renderDownloadMenuItems(event, downloadBaseUrl);
  if (!downloadItems || downloadItems.length === 0) {
    // A disabled control with no reason is indistinguishable from a broken
    // one, so say why: the event carries no downloadable track (streaming-only
    // manifests are filtered out), or `downloadBaseUrl` is unset.
    return (
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          {/* A disabled item swallows pointer events, so the trigger wraps it. */}
          <div>
            <DropdownMenuItem disabled className="gap-2">
              <ArrowDownToLine className="w-4 h-4" />
              <span>{i18next.t("episodes:episodesTable.action.download")}</span>
            </DropdownMenuItem>
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          {i18next.t("episodes:episodesTable.action.downloadUnavailable")}
        </TooltipContent>
      </Tooltip>
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
      <DropdownMenuContent>{renderDownloadDropdownBody(event, downloadBaseUrl)}</DropdownMenuContent>
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
