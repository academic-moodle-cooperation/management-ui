import React from 'react';
import { createPlugin } from '@workspace/plugin-system';
import { PluginManager } from '@workspace/plugin-system';
import { Button, Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components';
import { MonitorPlay } from '@workspace/ui/components/icons';
import { createOrganizationNamespace, usePluginTranslation } from '@workspace/i18n';
import { Link } from '@workspace/router';
import { useAppConfig } from '@workspace/query';

// Custom TU Wien actions component that enhances the default actions
const TUWienEpisodesActions = ({
  event,
  refetch,
  maxVisibleActions,
  children,
  defaultRender
}: any) => {
  const { config } = useAppConfig();
  const namespace = createOrganizationNamespace('tuwien', 'episodes');
  const { t } = usePluginTranslation([
    'core-episodes',  // Reuse core translations where possible
    namespace       // Add TU Wien specific translations (tuwien-episodes)
  ]);

  // TU Wien Tobira action
  const customActions = [
    {
      id: 'tuwien-tobira',
      component: ({ event }: any) => (
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <Link
              to={`${config.tobiraUrl}/!v/:${event.id}`}
              className="flex items-center justify-end group"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
              }}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="ghost" size="icon" className="w-4 h-4">
                <MonitorPlay />
                <span className="sr-only">{t("tuwien-episodes:tobira")}</span>
              </Button>
            </Link>
          </TooltipTrigger>
          <TooltipContent>{t("tuwien-episodes:tobira")}</TooltipContent>
        </Tooltip>
      ),
      priority: 85,
    },
  ];

  // Render enhanced actions with TU Wien customizations
  return (
    <div className="relative">
      {/* Render the default actions with our custom actions injected */}
      {React.cloneElement(children, {
        ...children.props,
        customActions, // Pass our custom actions to be merged
        maxVisibleActions: maxVisibleActions || 4,
      })}
    </div>
  );
};

/**
 * TU Wien Episodes Actions Implementation Plugin
 * Adds Tobira video portal integration to the episodes table
 */
export const tuwienEpisodesActionsImplementation = createPlugin({
  namespace: 'tuwien',
  type: 'episodes-actions',
  version: '1.0.0',

  initialize(manager: PluginManager) {

    // Register TU Wien episodes actions with higher priority than core default
    manager.registerComponent(
      'episodes:table:actions',
      TUWienEpisodesActions,
      {
        key: 'tuwien-episodes-actions',
        order: 50 // Higher priority than core default (100)
      }
    );

  },

  activate() {

  },

  deactivate() {

  }
}); 