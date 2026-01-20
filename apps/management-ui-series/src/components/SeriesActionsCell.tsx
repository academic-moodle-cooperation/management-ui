import { Pencil, UploadCloud, MoreVertical } from "lucide-react";
import React from "react";

import { i18next } from "@workspace/i18n";
import { PluginComponent } from "@workspace/plugin-system";
import type { SeriesDataFragment } from "@workspace/query";
import { useAppConfig } from "@workspace/query";
import { Link } from "@workspace/router";
import { 
  Button, 
  Tooltip, 
  TooltipContent, 
  TooltipTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components";

import { useSidebarStore } from "../stores/sidebarStore";

export interface SeriesActionItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  tooltip: string;
  onClick?: (series: SeriesDataFragment) => void;
  href?: string;
  target?: string;
  component?: React.ComponentType<{ series: SeriesDataFragment }>;
  condition?: (series: SeriesDataFragment) => boolean;
  priority?: number;
}

interface SeriesActionsCellProps {
  series: SeriesDataFragment;
  maxVisibleActions?: number;
}

interface ExtendedSeriesActionsCellProps extends SeriesActionsCellProps {
  customActions?: SeriesActionItem[];
}

const DefaultSeriesActionsCell: React.FC<ExtendedSeriesActionsCellProps> = ({ 
  series, 
  maxVisibleActions,
  customActions = [],
}) => {
  const { openSidebarWithData } = useSidebarStore();
  const { config } = useAppConfig();

  // Get configuration from app config
  const seriesTableConfig = config?.plugins?.["management-ui-series"]?.seriesTable as {
    actions?: {
      maxVisible?: number;
      order?: string[];
    };
  } | undefined;

  const actionsConfig = seriesTableConfig?.actions;
  const defaultMaxVisible = actionsConfig?.maxVisible ?? 2;
  const effectiveMaxVisible = maxVisibleActions ?? defaultMaxVisible;

  // Define default actions
  const defaultActions: SeriesActionItem[] = [
    {
      id: "edit",
      icon: <Pencil />,
      label: i18next.t("series:seriesTable.action.editData"),
      tooltip: i18next.t("series:seriesTable.action.editData"),
      onClick: (series) => openSidebarWithData(series.id, true, {}),
      priority: 100,
    },
    {
      id: "upload",
      icon: <UploadCloud />,
      label: "Upload",
      tooltip: "Upload",
      href: `${import.meta.env.BASE_URL}/upload/${series.id}`,
      priority: 90,
    },
  ];

  // Merge default and custom actions
  const allActions = [...defaultActions, ...customActions];

  // Filter actions based on conditions
  const filteredActions = allActions.filter((action) => !action.condition || action.condition(series));

  // Sort by configured order if provided, otherwise by priority
  const configOrder = actionsConfig?.order;
  const availableActions = configOrder && configOrder.length > 0
    ? filteredActions.sort((a, b) => {
        const indexA = configOrder.indexOf(a.id);
        const indexB = configOrder.indexOf(b.id);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return (b.priority || 0) - (a.priority || 0);
      })
    : filteredActions.sort((a, b) => (b.priority || 0) - (a.priority || 0));

  const visibleActions = availableActions.slice(0, effectiveMaxVisible);
  const hiddenActions = availableActions.slice(effectiveMaxVisible);

  const renderAction = (action: SeriesActionItem) => {
    if (action.component) {
      return <action.component key={action.id} series={series} />;
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
            action.onClick?.(series);
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
            action.onClick?.(series);
          }}
        >
          {button}
        </Link>
      )
    ) : (
      <div
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          action.onClick?.(series);
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

  const renderDropdownAction = (action: SeriesActionItem) => {
    // If the action has a component, render it directly (for complex actions)
    if (action.component) {
      return <div key={action.id}>{<action.component series={series} />}</div>;
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
              action.onClick?.(series);
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
            action.onClick?.(series);
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
          action.onClick?.(series);
        }}
        className="gap-2 cursor-pointer"
      >
        {action.icon}
        <span>{action.label}</span>
      </DropdownMenuItem>
    );
  };

  return (
    <div className="flex items-center justify-center gap-2">
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

// Main pluggable component
export const SeriesActionsCell: React.FC<SeriesActionsCellProps> = (props) => {
  return (
    <PluginComponent
      componentType="series:table:actions"
      pluginProps={{
        series: props.series,
        maxVisibleActions: props.maxVisibleActions,
      }}
    >
      <DefaultSeriesActionsCell {...props} />
    </PluginComponent>
  );
};

export default SeriesActionsCell;
