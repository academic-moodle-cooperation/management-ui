import React from "react";

import { createOrganizationNamespace, usePluginTranslation } from "@workspace/i18n";
import { createPlugin } from "@workspace/plugin-system";
import type { PluginManager } from "@workspace/plugin-system";
import { useAppConfig, type SeriesDataFragment } from "@workspace/query";
import { Link } from "@workspace/router";
import { Button, Tooltip, TooltipContent, TooltipTrigger } from "@workspace/ui/components";
import { MonitorPlay } from "@workspace/ui/components/icons";
import { logger } from "@workspace/utils";

interface TUWienSeriesActionsProps {
  series: SeriesDataFragment;
  maxVisibleActions?: number;
  children: React.ReactNode;
}

// Custom TU Wien actions component that enhances the default series actions
const TUWienSeriesActions = ({ series, maxVisibleActions, children }: TUWienSeriesActionsProps) => {
  const { config } = useAppConfig();
  const namespace = createOrganizationNamespace("tuwien", "series");
  const { t } = usePluginTranslation([
    "core-series", // Reuse core translations where possible
    namespace, // Add TU Wien specific translations (tuwien-series)
  ]);

  // Define TU Wien custom actions
  const customActions = [
    {
      id: "tuwien-tobira",
      component: ({ series }: { series: SeriesDataFragment }) => (
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <Link
              to={`${config["tobiraUrl"]}/!s/:${series.id}`}
              className="flex items-center justify-end group"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
              }}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="ghost" size="icon" className="w-4 h-4">
                <MonitorPlay />
                <span className="sr-only">{t("tuwien-series:tobira")}</span>
              </Button>
            </Link>
          </TooltipTrigger>
          <TooltipContent>{t("tuwien-series:tobira")}</TooltipContent>
        </Tooltip>
      ),
      priority: 85,
    },
  ];

  // Render enhanced actions with TU Wien customizations
  return (
    <div className="relative">
      {React.cloneElement(children as React.ReactElement, {
        ...(children as React.ReactElement).props,
        customActions,
        maxVisibleActions,
      })}
    </div>
  );
};

/**
 * TU Wien Series Actions Implementation Plugin
 * Adds Tobira video portal integration to the series table
 */
export const tuwienSeriesActionsImplementation = createPlugin({
  namespace: "tuwien",
  type: "series-actions",
  version: "1.0.0",

  initialize(manager: PluginManager) {
    logger.debug("Initializing TU Wien Series Actions Implementation");

    // Register TU Wien series actions with higher priority than core default
    manager.registerComponent("series:table:actions", TUWienSeriesActions, {
      key: "tuwien-series-actions",
      order: 50, // Higher priority than core default (100)
    });

    logger.debug("TU Wien series actions implementation registered");
  },

  activate() {
    logger.debug("TU Wien Series Actions Implementation activated");
  },

  deactivate() {
    logger.debug("TU Wien Series Actions Implementation deactivated");
  },
});
