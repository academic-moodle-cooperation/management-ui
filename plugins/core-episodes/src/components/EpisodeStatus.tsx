import {
  ArrowUpToLine,
  CalendarClock,
  CircleCheck,
  CircleEllipsis,
  CirclePause,
  CircleX,
  History,
  OctagonX,
  Videotape,
} from "lucide-react";
import React from "react";

import { i18next, useExtensionLabels } from "@oc-mui/i18n";
import {
  EPISODE_STATUS_INDICATORS,
  type EpisodeStatusIndicator,
  type EpisodeStatusTone,
} from "@oc-mui/plugin-core";
import { useRegistry } from "@oc-mui/plugin-system";
import type { MuiEventsDataFragment } from "@oc-mui/query";
import { Tooltip, TooltipContent, TooltipTrigger } from "@oc-mui/ui/components";
import { cn } from "@oc-mui/ui/lib";
import { logger } from "@oc-mui/utils";

/** The bare status name: `"…EventStatus.PROCESSED"` → `"PROCESSED"`. */
export const getEventStatus = (event: MuiEventsDataFragment): string =>
  event.eventStatus?.split(".").pop() || "";

export const isEventProcessed = (event: MuiEventsDataFragment): boolean =>
  getEventStatus(event) === "PROCESSED";

const TONE_CLASS: Record<EpisodeStatusTone, string> = {
  ok: "text-ok",
  info: "text-info",
  warning: "text-warning",
  error: "text-error",
};

type StatusIcon = { Icon: React.ComponentType<{ className?: string }>; className?: string };

const DEFAULT_STATUS_ICON: Record<string, StatusIcon> = {
  PENDING: { Icon: CircleEllipsis, className: "text-warning" },
  PROCESSING: { Icon: History, className: "scale-x-[-1] text-info" },
  PROCESSING_CANCELLED: { Icon: OctagonX, className: "text-warning" },
  PAUSED: { Icon: CirclePause, className: "text-info" },
  PROCESSED: { Icon: CircleCheck, className: "text-ok" },
  PROCESSING_FAILURE: { Icon: CircleX, className: "text-error" },
  SCHEDULED: { Icon: CalendarClock, className: "text-info" },
  INGESTING: { Icon: ArrowUpToLine, className: "text-info" },
  RECORDING: { Icon: Videotape, className: "text-error" },
};

const FALLBACK_STATUS_ICON: StatusIcon = { Icon: CircleEllipsis, className: "text-warning" };

const getDefaultStatusIcon = (status: string): StatusIcon =>
  DEFAULT_STATUS_ICON[status] ?? FALLBACK_STATUS_ICON;

const orderOf = (indicator: EpisodeStatusIndicator) =>
  typeof indicator.order === "number" ? indicator.order : 100;

/**
 * The first registered `episodes:table:status-indicators` entry (lowest
 * `order`) whose `matches` accepts the event, or null when the default
 * status display applies. A throwing `matches` is logged and skipped so one
 * misbehaving plugin cannot blank the table.
 */
export const useEpisodeStatusIndicator = (
  event: MuiEventsDataFragment,
): EpisodeStatusIndicator | null => {
  const { items } = useRegistry<EpisodeStatusIndicator>(EPISODE_STATUS_INDICATORS);

  return React.useMemo(() => {
    const sorted = [...items].sort((a, b) => orderOf(a) - orderOf(b));
    for (const indicator of sorted) {
      try {
        if (indicator.matches(event)) return indicator;
      } catch (error) {
        logger.warn(`[episodes] status indicator "${indicator.id}" threw and was skipped`, {
          indicatorId: indicator.id,
          eventId: event.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
    return null;
  }, [items, event]);
};

/**
 * The URL an indicator wants the row to point at (the editor, say), or null.
 * A throwing `href` is logged and treated as "no link", like `matches`.
 */
export const resolveIndicatorHref = (
  indicator: EpisodeStatusIndicator | null,
  event: MuiEventsDataFragment,
): string | null => {
  if (!indicator?.href) return null;
  try {
    return indicator.href(event) || null;
  } catch (error) {
    logger.warn(`[episodes] status indicator "${indicator.id}" href() threw and was ignored`, {
      indicatorId: indicator.id,
      eventId: event.id,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
};

/**
 * The list view's status column: an icon with a tooltip. A matching
 * indicator replaces both — and turns the icon into a link when it names an
 * `href`; otherwise the icon follows `eventStatus`.
 */
export const EpisodeStatusCell: React.FC<{ event: MuiEventsDataFragment }> = ({ event }) => {
  const status = getEventStatus(event);
  const indicator = useEpisodeStatusIndicator(event);
  // The caption lives outside the plugin's own component tree, so the host
  // resolves its translation key — same convention as sidebar tab labels.
  const labelFor = useExtensionLabels(
    indicator ? [{ key: indicator.id, label: indicator.label }] : [],
  );

  const { Icon, className } = indicator
    ? { Icon: indicator.icon, className: TONE_CLASS[indicator.tone ?? "warning"] }
    : getDefaultStatusIcon(status);
  const caption = indicator
    ? labelFor({ key: indicator.id, label: indicator.label })
    : i18next.t(`episodes:episodesTable.status.${status.toLowerCase()}`);
  const href = resolveIndicatorHref(indicator, event);

  const icon = <Icon className={cn("h-5 w-5", className)} />;

  return (
    <div className="flex justify-center space-x-2">
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          {href ? (
            <a
              href={href}
              target={indicator?.target ?? "_blank"}
              rel="noopener noreferrer"
              aria-label={caption}
              className="flex items-center"
              // The row itself opens the detail sidebar on click.
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              {icon}
            </a>
          ) : (
            <span className="flex items-center">{icon}</span>
          )}
        </TooltipTrigger>
        <TooltipContent>{caption}</TooltipContent>
      </Tooltip>
    </div>
  );
};

/**
 * Whether the gallery thumbnail is covered by a status overlay: every event
 * that is not simply "processed" — the default non-PROCESSED states and any
 * event a plugin indicator claims. The caller resolves `indicator` once via
 * {@link useEpisodeStatusIndicator} because it also decides the link target.
 */
export const hasThumbnailStatusOverlay = (
  event: MuiEventsDataFragment,
  indicator: EpisodeStatusIndicator | null,
): boolean => indicator !== null || !isEventProcessed(event);

/**
 * The gallery view's thumbnail overlay: a dimmed, blurred cover with a large
 * status icon. Renders nothing when {@link hasThumbnailStatusOverlay} is false.
 */
export const EpisodeThumbnailStatusOverlay: React.FC<{
  event: MuiEventsDataFragment;
  indicator: EpisodeStatusIndicator | null;
}> = ({ event, indicator }) => {
  if (!hasThumbnailStatusOverlay(event, indicator)) return null;

  const { Icon } = indicator ? { Icon: indicator.icon } : getDefaultStatusIcon(getEventStatus(event));

  return (
    <>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm grayscale" />
      <div className="absolute inset-0 flex items-center justify-center group-hover:scale-110">
        <Icon className="w-1/3 h-1/3 text-white drop-shadow-lg mix-blend-screen" />
      </div>
    </>
  );
};
