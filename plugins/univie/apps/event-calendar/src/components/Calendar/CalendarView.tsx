import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, RefreshCw } from "lucide-react";
import React, { useState, useMemo } from "react";

import { Card, Button, Skeleton, DatePicker } from "@workspace/ui/components";
import { logger } from "@workspace/utils";

import { useEventsByDate, useRooms, getRoomById } from "../api/eventCalendarApi";

import { EventCard } from "./EventCard";
import { RoomFilter } from "./RoomFilter";

import type { ParsedEvent } from "../types/eventCalendar";

interface CalendarViewProps {
  className?: string;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ className }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedRoomIds, setSelectedRoomIds] = useState<number[]>([]);
  const [showRoomFilter, setShowRoomFilter] = useState(false);

  // Fetch data
  const { data: rooms, isLoading: roomsLoading, error: roomsError } = useRooms();
  const {
    data: events,
    isLoading: eventsLoading,
    error: eventsError,
    refetch,
  } = useEventsByDate(selectedDate);

  // Debug logging
  React.useEffect(() => {
    if (rooms) {
      logger.debug("Rooms loaded", {
        totalRooms: rooms.length,
        roomIds: rooms.map((r) => r.extRaumId).sort((a, b) => a - b),
        sampleRoom: rooms[0],
      });
    }
  }, [rooms]);

  // Initialize selected rooms when rooms are loaded
  React.useEffect(() => {
    if (rooms && rooms.length > 0 && selectedRoomIds.length === 0) {
      setSelectedRoomIds(rooms.map((room) => room.extRaumId));
    }
  }, [rooms, selectedRoomIds.length]);

  // Filter events by selected rooms
  const filteredEvents = useMemo(() => {
    if (!events) return [];
    return events.filter((event) => selectedRoomIds.includes(event.extRaumId));
  }, [events, selectedRoomIds]);

  // Group events by room
  const eventsByRoom = useMemo(() => {
    const grouped: Record<number, ParsedEvent[]> = {};
    filteredEvents.forEach((event) => {
      if (!grouped[event.extRaumId]) {
        grouped[event.extRaumId] = [];
      }
      grouped[event.extRaumId]!.push(event);
    });

    // Sort events by start time within each room
    Object.keys(grouped).forEach((roomId) => {
      const roomEvents = grouped[parseInt(roomId)];
      if (roomEvents) {
        roomEvents.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
      }
    });

    return grouped;
  }, [filteredEvents]);

  // Date navigation
  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  // Room selection handlers
  const handleRoomToggle = (roomId: number) => {
    setSelectedRoomIds((prev) =>
      prev.includes(roomId) ? prev.filter((id) => id !== roomId) : [...prev, roomId],
    );
  };

  const handleSelectAllRooms = () => {
    if (rooms) {
      setSelectedRoomIds(rooms.map((room) => room.extRaumId));
    }
  };

  const handleSelectNoRooms = () => {
    setSelectedRoomIds([]);
  };

  const formatSelectedDate = (date: Date): string => {
    return date.toLocaleDateString("de-DE", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  if (roomsError || eventsError) {
    return (
      <Card className={`p-6 ${className || ""}`}>
        <div className="text-center space-y-4">
          <div className="text-destructive">
            Error loading data: {roomsError?.message || eventsError?.message}
          </div>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className || ""}`}>
      {/* Header with date navigation */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">UniVie Event Calendar</h1>
            <p className="text-muted-foreground">
              {formatSelectedDate(selectedDate)}
              {isToday(selectedDate) && (
                <span className="ml-2 text-sm font-medium text-primary">(Today)</span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={goToPreviousDay}>
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <DatePicker
                date={selectedDate}
                onDateChange={(date) => date && setSelectedDate(date)}
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                Select Date
              </DatePicker>

              <Button variant="outline" size="sm" onClick={goToNextDay}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              disabled={isToday(selectedDate)}
            >
              Today
            </Button>

            <Button variant="outline" size="sm" onClick={() => setShowRoomFilter(!showRoomFilter)}>
              Filter Rooms ({selectedRoomIds.length})
            </Button>

            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Room filter */}
      {showRoomFilter && rooms && (
        <RoomFilter
          rooms={rooms}
          selectedRoomIds={selectedRoomIds}
          onRoomToggle={handleRoomToggle}
          onSelectAll={handleSelectAllRooms}
          onSelectNone={handleSelectNoRooms}
        />
      )}

      {/* Events display */}
      <div className="space-y-6">
        {roomsLoading || eventsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-6 w-48 mb-4" />
                <div className="space-y-3">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {selectedRoomIds.length === 0 ? (
              <Card className="p-8 text-center">
                <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="font-semibold mb-2">No rooms selected</h3>
                <p className="text-muted-foreground mb-4">
                  Please select at least one room to view events.
                </p>
                <Button onClick={() => setShowRoomFilter(true)}>Select Rooms</Button>
              </Card>
            ) : filteredEvents.length === 0 ? (
              <Card className="p-8 text-center">
                <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="font-semibold mb-2">No events found</h3>
                <p className="text-muted-foreground">
                  No events scheduled for {formatSelectedDate(selectedDate)} in the selected rooms.
                </p>
              </Card>
            ) : (
              <div className="space-y-6">
                {selectedRoomIds.map((roomId) => {
                  const room = getRoomById(rooms || [], roomId);
                  const roomEvents = eventsByRoom[roomId] || [];

                  if (roomEvents.length === 0) return null;

                  return (
                    <Card key={roomId} className="p-6">
                      <div className="space-y-4">
                        <div className="border-b pb-3">
                          <h3 className="font-semibold text-lg">
                            {room ? `${room.gebaeudeName} - Room ${room.nummer}` : `Room ${roomId}`}
                          </h3>
                          {room && (
                            <p className="text-sm text-muted-foreground">
                              {room.raumArtNeuBezeichnung}
                              {room.stockwerk && ` • Floor ${room.stockwerk}`}
                              {room.gebaeudeStrasse &&
                                ` • ${room.gebaeudeStrasse}, ${room.gebaeudeOrt}`}
                            </p>
                          )}
                          <p className="text-sm text-muted-foreground">
                            {roomEvents.length} event{roomEvents.length !== 1 ? "s" : ""}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {roomEvents.map((event, index) => (
                            <EventCard
                              key={`${event.extRaumId}-${event.originalDatum}-${event.originalBeginn}-${index}`}
                              event={event}
                              room={room ?? undefined}
                            />
                          ))}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
