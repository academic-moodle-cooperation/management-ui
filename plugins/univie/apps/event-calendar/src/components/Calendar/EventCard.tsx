import { Clock, MapPin, Users } from "lucide-react";
import React from "react";

import { Card, Badge } from "@workspace/ui/components";

import type { ParsedEvent, Room } from "../types/eventCalendar";

interface EventCardProps {
  event: ParsedEvent;
  room?: Room | undefined;
  className?: string | undefined;
}

export const EventCard: React.FC<EventCardProps> = ({ event, room, className }) => {
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const getDuration = (): string => {
    const durationMs = event.endTime.getTime() - event.startTime.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}m`;
    }
  };

  const getBadgeVariant = (category: string) => {
    switch (category.toLowerCase()) {
      case "vorlesung":
        return "default";
      case "übung":
        return "secondary";
      case "seminar":
        return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <Card className={`p-4 hover:shadow-md transition-shadow ${className || ""}`}>
      <div className="space-y-3">
        {/* Event title and category */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm leading-tight line-clamp-2">{event.name}</h3>
          <Badge variant={getBadgeVariant(event.lvKategorie)} className="shrink-0 text-xs">
            {event.lvKategorie}
          </Badge>
        </div>

        {/* Time and duration */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>
            {formatTime(event.startTime)} - {formatTime(event.endTime)}
          </span>
          <span className="text-xs">({getDuration()})</span>
        </div>

        {/* Room information */}
        {room && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>
              {room.gebaeudeName} - {room.nummer}
            </span>
            {room.stockwerk && <span className="text-xs">(Floor {room.stockwerk})</span>}
          </div>
        )}

        {/* Relations/Participants */}
        {event.relationenName && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span className="line-clamp-1" title={event.relationenName}>
              {event.relationenName}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
};
