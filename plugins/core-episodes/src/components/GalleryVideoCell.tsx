import React from "react";

import type { MuiEventsDataFragment } from "@oc-mui/query";
import { OverflowTooltip } from "@oc-mui/ui/components";
import { parseDuration } from "@oc-mui/utils";

import {
  EpisodeThumbnailStatusOverlay,
  hasThumbnailStatusOverlay,
  resolveIndicatorHref,
  useEpisodeStatusIndicator,
} from "./EpisodeStatus";

/**
 * The gallery view's combined cell: thumbnail (with status overlay and
 * duration badge) next to title and description. The thumbnail links to the
 * player when nothing covers it and the event has somewhere to play — or to
 * wherever a matching status indicator points (the editor, say).
 */
export const GalleryVideoCell: React.FC<{ event: MuiEventsDataFragment }> = ({ event }) => {
  const indicator = useEpisodeStatusIndicator(event);
  const covered = hasThumbnailStatusOverlay(event, indicator);
  const indicatorHref = resolveIndicatorHref(indicator, event);
  const publishUrl = event.muiEventInfo?.publishUrl;
  const link = indicatorHref
    ? { href: indicatorHref, target: indicator?.target ?? "_blank" }
    : !covered && publishUrl
      ? { href: publishUrl, target: "_blank" as const }
      : null;
  const thumbnail = event.muiEventInfo?.thumbnailUrl;
  const parsedDuration = parseDuration(event.duration);
  const duration = !parsedDuration || parsedDuration === "00:00:00" ? "∞" : parsedDuration;

  const thumbnailContent = (
    <>
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
      <EpisodeThumbnailStatusOverlay event={event} indicator={indicator} />
      {!covered && (
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
      )}
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
    </>
  );

  return (
    <div className="flex items-center h-[125px] w-[500px] space-x-2 group">
      <div className="relative my-2 me-2 group overflow-hidden rounded-lg">
        {link ? (
          <a
            href={link.href}
            target={link.target}
            rel="noopener noreferrer"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
            }}
          >
            {thumbnailContent}
          </a>
        ) : (
          thumbnailContent
        )}
      </div>
      <div className="flex-1 self-center overflow-hidden min-w-0">
        <OverflowTooltip className="block max-w-[300px] font-medium truncate whitespace-nowrap overflow-hidden">
          {event.title}
        </OverflowTooltip>
        <p className="max-w-[500px] overflow-hidden text-ellipsis break-word line-clamp-3">
          {event.description}
        </p>
      </div>
    </div>
  );
};
