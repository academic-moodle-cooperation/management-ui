import { Pencil, PlayCircle, Scissors, Trash2, ArrowDownToLine, MoreVertical } from "lucide-react";
import React, { useState } from "react";

import { i18next } from "@workspace/i18n";
import { PluginComponent } from "@workspace/plugin-system";
import { useDeleteEventMutation, useAppConfig } from "@workspace/query";
import type { EventsDataFragment } from "@workspace/query";
import { Link } from "@workspace/router";
import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  Dialog,
  DialogTrigger,
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
  DropdownMenuTrigger,
  toast,
} from "@workspace/ui/components";

import { useSidebarStore } from "../stores/sidebarStore";

export interface ActionItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  tooltip: string;
  onClick?: (event: EventsDataFragment) => void;
  href?: string;
  target?: string;
  component?: React.ComponentType<{ event: EventsDataFragment }>;
  condition?: (event: EventsDataFragment) => boolean;
  priority?: number; // Higher priority = shown first
}

interface ActionsCellProps {
  event: EventsDataFragment;
  refetch: () => void;
  maxVisibleActions?: number;
  layout?: "list" | "gallery";
}

interface ExtendedActionsCellProps extends ActionsCellProps {
  customActions?: ActionItem[];
}

const DefaultActionsCell: React.FC<ExtendedActionsCellProps> = ({
  event,
  refetch,
  maxVisibleActions,
  layout = "list",
  customActions = [],
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const deleteEvent = useDeleteEventMutation();
  const { openSidebarWithData } = useSidebarStore();
  const { config } = useAppConfig();

  // Get configuration from app config
  const episodesTableConfig = config?.plugins?.["management-ui-episodes"]?.episodesTable as {
    actions?: {
      maxVisibleInList?: number;
      maxVisibleInGallery?: number;
      order?: string[];
    };
  } | undefined;

  const actionsConfig = episodesTableConfig?.actions;

  // Determine max visible actions based on layout and config
  const defaultMaxVisible = layout === "gallery" 
    ? (actionsConfig?.maxVisibleInGallery ?? 2)
    : (actionsConfig?.maxVisibleInList ?? 3);
  
  const effectiveMaxVisible = maxVisibleActions ?? defaultMaxVisible;

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
      component: ({ event }) => <DownloadDropdown event={event} />,
      condition: (event) => !!event.muiEventInfo?.publishUrl,
      priority: 70,
    },
    {
      id: "delete",
      icon: <Trash2 />,
      label: i18next.t("common:delete"),
      tooltip: i18next.t("common:delete"),
      component: ({ event }) => (
        <DeleteAction
          event={event}
          onDelete={onDelete}
          dialogOpen={dialogOpen}
          setDialogOpen={setDialogOpen}
        />
      ),
      priority: 10, // Lower priority = shown later
    },
  ];

  // Merge default and custom actions
  const allActions = [...defaultActions, ...customActions];

  // Filter actions based on conditions
  const filteredActions = allActions.filter((action) => !action.condition || action.condition(event));

  // Sort by configured order if provided, otherwise by priority
  const configOrder = actionsConfig?.order;
  const availableActions = configOrder && configOrder.length > 0
    ? filteredActions.sort((a, b) => {
        const indexA = configOrder.indexOf(a.id);
        const indexB = configOrder.indexOf(b.id);
        // If both are in the order array, sort by position
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        // If only one is in the order array, prioritize it
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        // Otherwise, sort by priority
        return (b.priority || 0) - (a.priority || 0);
      })
    : filteredActions.sort((a, b) => (b.priority || 0) - (a.priority || 0));

  const visibleActions = availableActions.slice(0, effectiveMaxVisible);
  const hiddenActions = availableActions.slice(effectiveMaxVisible);

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

  const renderDropdownAction = (action: ActionItem) => {
    // If the action has a component, render it directly (for complex actions like Delete, Download)
    // Wrap it in a DropdownMenuItem with the action label for consistency
    if (action.component) {
      return (
        <div key={action.id} className="gap-2">
          <action.component event={event} />
        </div>
      );
    }

    // For actions with href
    if (action.href) {
      const content = (
        <>
          {action.icon}
          <span>{action.label}</span>
        </>
      );

      if (action.target) {
        return (
          <a
            key={action.id}
            href={action.href}
            target={action.target}
            {...(action.target === "_blank" && { rel: "noopener noreferrer" })}
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              action.onClick?.(event);
            }}
          >
            <DropdownMenuItem className="gap-2 cursor-pointer">
              {content}
            </DropdownMenuItem>
          </a>
        );
      }

      return (
        <Link
          key={action.id}
          to={action.href}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            action.onClick?.(event);
          }}
        >
          <DropdownMenuItem className="gap-2 cursor-pointer">
            {content}
          </DropdownMenuItem>
        </Link>
      );
    }

    // For actions with only onClick
    return (
      <DropdownMenuItem
        key={action.id}
        onClick={(e) => {
          e.stopPropagation();
          action.onClick?.(event);
        }}
        className="gap-2 cursor-pointer"
      >
        {action.icon}
        <span>{action.label}</span>
      </DropdownMenuItem>
    );
  };

  return (
    <div className="flex items-center justify-center gap-2 p-3">
      {visibleActions.map(renderAction)}

      {hiddenActions.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="w-4 h-4">
              <MoreVertical />
              <span className="sr-only">{i18next.t("common:moreActions")}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>{i18next.t("common:moreActions")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {hiddenActions.map(renderDropdownAction)}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};

// Separate components for complex actions
const DeleteAction: React.FC<{
  event: EventsDataFragment;
  onDelete: (id: string) => void;
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
}> = ({ event, onDelete, dialogOpen, setDialogOpen }) => (
  <Tooltip delayDuration={300}>
    <Dialog onOpenChange={(open) => !open && setDialogOpen(false)} open={dialogOpen}>
      <TooltipTrigger asChild>
        <DialogTrigger
          asChild
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            setDialogOpen(true);
          }}
        >
          <Button variant="ghost" size="icon" className="w-4 h-4">
            <Trash2 />
          </Button>
        </DialogTrigger>
      </TooltipTrigger>
      <TooltipContent>{i18next.t("common:delete")}</TooltipContent>
      <DialogContent onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>{i18next.t("episodes:episodesTable.deleteDialogue.heading")}</DialogTitle>
          <DialogDescription
            dangerouslySetInnerHTML={{
              __html: i18next.t("episodesTable.deleteDialogue.text", {
                title: event.title || "",
                ns: "episodes",
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
    </Dialog>
  </Tooltip>
);

const DownloadDropdown: React.FC<{ event: EventsDataFragment }> = ({ event }) => (
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
        {event.publications?.[0]?.tracks
          ?.sort((t1, t2) => {
            const height1 = t1?.height ?? 0;
            const height2 = t2?.height ?? 0;
            return height1 > height2 ? -1 : height1 < height2 ? 1 : 0;
          })
          .map((track, index) => {
            if ([".m3u8", ".mpd", ".f4m", ".smil"].some((el) => track?.uri?.includes(el)))
              return null;

            return (
              <a
                key={index}
                href={track?.uri || ""}
                download={event.title}
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
              >
                <DropdownMenuItem
                  className="gap-2 cursor-pointer"
                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
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
                </DropdownMenuItem>
              </a>
            );
          })}
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
        layout: props.layout,
      }}
    >
      <DefaultActionsCell {...props} />
    </PluginComponent>
  );
};

export default ActionsCell;
