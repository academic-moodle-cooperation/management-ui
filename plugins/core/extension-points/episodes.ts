import { createPlugin, type PluginManager } from "@oc-mui/plugin-system";
import type { MuiEventsDataFragment } from "@oc-mui/query";

import type { ComponentType } from "react";

/**
 * Episodes Extension Points Plugin
 * Defines where and how the episodes table can be extended by plugins
 *
 * Extension Points Defined:
 * - episodes:table:actions - Replacement for the per-row actions cell
 * - episodes:table:status-indicators - Extra states shown in the status column
 */

/** Registry key for {@link EpisodeStatusIndicator} objects. */
export const EPISODE_STATUS_INDICATORS = "episodes:table:status-indicators";

/** Semantic colour of an indicator icon; mapped to the theme's status tokens by the host. */
export type EpisodeStatusTone = "ok" | "info" | "warning" | "error";

/**
 * A state the episodes table cannot derive from `eventStatus` alone — an
 * event that finished processing but was never published, say. Register one
 * with `manager.registerObject("episodes:table:status-indicators", id, …)`.
 *
 * The host consults every registered indicator for each row (lowest `order`
 * first) and renders the first whose `matches` returns true in place of the
 * default status icon — in the list view's status column and as the overlay
 * on the gallery thumbnail. When none matches, the default display stays.
 */
export interface EpisodeStatusIndicator {
  /** Unique within the plugin; the registry prefixes it with the plugin namespace. */
  id: string;
  /** Lower wins when several indicators match the same event. Defaults to 100. */
  order?: number;
  /** Whether this indicator applies to the given row. Must not throw; a throwing indicator is skipped. */
  matches: (event: MuiEventsDataFragment) => boolean;
  /** Rendered in place of the default status icon. Receives the size and colour classes. */
  icon: ComponentType<{ className?: string }>;
  /** Colour of the icon in the list view. Defaults to `"warning"`. */
  tone?: EpisodeStatusTone;
  /**
   * Tooltip caption. A translation key (`namespace:key`) the host resolves at
   * render time, so it follows a language switch; a string without a colon
   * is shown literally.
   */
  label: string;
  /**
   * Where the state can be resolved — the editor, say. When it returns a URL
   * for the event, the host renders the list icon as a link and points the
   * gallery thumbnail at it instead of the player. Must not throw.
   */
  href?: (event: MuiEventsDataFragment) => string | null | undefined;
  /** Link target for `href`. Defaults to `"_blank"`, like the row's own actions. */
  target?: "_blank" | "_self";
}

export const episodesExtensionPoints = createPlugin({
  namespace: "core",
  type: "episodes",
  version: "1.0.0",

  initialize(manager: PluginManager) {
    manager.registerObject("extension-points:documentation", "episodes:table:actions", {
      description:
        "Replacement for the per-row actions cell of the episodes table (registerComponent; lowest order wins)",
      expectedSchema: {
        event: "MuiEventsDataFragment - The row's event",
        refetch: "function - Refetch the episodes list after a mutation",
        maxVisibleActions: "number - Actions shown inline before the overflow menu",
        defaultRender: "function - Renders the default actions cell",
      },
      examples: [
        {
          placement: "Actions column, list and gallery view",
          description: "An org plugin adds a custom action and keeps the default ones",
        },
      ],
    });

    manager.registerObject("extension-points:documentation", EPISODE_STATUS_INDICATORS, {
      description:
        "Extra states for the episodes status column and the gallery thumbnail overlay (registerObject; first match by order wins)",
      expectedSchema: {
        id: "string - Unique indicator identifier",
        order: "number - Priority when several indicators match (lower wins)",
        matches: "(event: MuiEventsDataFragment) => boolean - Whether the indicator applies",
        icon: "React.ComponentType<{ className?: string }> - Icon shown instead of the default",
        tone: "'ok' | 'info' | 'warning' | 'error' - Icon colour in the list view",
        label: "string - Tooltip caption: translation key (namespace:key) or literal",
        href: "(event: MuiEventsDataFragment) => string | null | undefined - Optional link target (icon + gallery thumbnail)",
        target: "'_blank' | '_self' - Link target for href, default '_blank'",
      },
      examples: [
        {
          id: "publication-pending",
          order: 100,
          matches: "(event) => isProcessed(event) && !event.muiEventInfo?.publishUrl",
          icon: "CircleAlert",
          tone: "warning",
          label: "publication-status:pending",
          href: "(event) => `/editor-ui/index.html?mediaPackageId=${event.id}`",
        },
      ],
    });
  },

  activate() {},

  deactivate() {},
});
