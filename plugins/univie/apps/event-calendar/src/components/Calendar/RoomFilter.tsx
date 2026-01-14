import { Search, Building, MapPin } from "lucide-react";
import React, { useState } from "react";

import { Card, Button, Badge, Input } from "@workspace/ui/components";

import type { Room } from "../types/eventCalendar";

interface RoomFilterProps {
  rooms: Room[];
  selectedRoomIds: number[];
  onRoomToggle: (roomId: number) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
  className?: string;
}

export const RoomFilter: React.FC<RoomFilterProps> = ({
  rooms,
  selectedRoomIds,
  onRoomToggle,
  onSelectAll,
  onSelectNone,
  className,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRooms = rooms.filter((room) => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      room.nummer.toLowerCase().includes(searchLower) ||
      room.gebaeudeName.toLowerCase().includes(searchLower) ||
      room.raumArtNeuBezeichnung.toLowerCase().includes(searchLower) ||
      room.stockwerk.toLowerCase().includes(searchLower)
    );
  });

  const groupedRooms = filteredRooms.reduce(
    (acc, room) => {
      const building = room.gebaeudeName;
      if (!acc[building]) {
        acc[building] = [];
      }
      acc[building].push(room);
      return acc;
    },
    {} as Record<string, Room[]>,
  );

  const isRoomSelected = (roomId: number) => selectedRoomIds.includes(roomId);

  return (
    <Card className={`p-4 ${className || ""}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <Building className="h-5 w-5" />
            Room Filter
          </h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onSelectAll}
              disabled={selectedRoomIds.length === rooms.length}
            >
              All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onSelectNone}
              disabled={selectedRoomIds.length === 0}
            >
              None
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search rooms, buildings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Selected count */}
        <div className="text-sm text-muted-foreground">
          {selectedRoomIds.length} of {rooms.length} rooms selected
        </div>

        {/* Grouped rooms */}
        <div className="max-h-96 overflow-y-auto space-y-4">
          {Object.entries(groupedRooms).map(([building, buildingRooms]) => (
            <div key={building} className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {building}
              </h4>
              <div className="grid grid-cols-1 gap-2 pl-6">
                {buildingRooms.map((room) => (
                  <div
                    key={room.extRaumId}
                    className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-colors ${
                      isRoomSelected(room.extRaumId)
                        ? "bg-primary/10 border-primary/50"
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => onRoomToggle(room.extRaumId)}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isRoomSelected(room.extRaumId)}
                        onChange={() => onRoomToggle(room.extRaumId)}
                        className="rounded"
                      />
                      <div>
                        <div className="font-medium text-sm">Room {room.nummer}</div>
                        <div className="text-xs text-muted-foreground">
                          {room.raumArtNeuBezeichnung}
                          {room.stockwerk && ` • Floor ${room.stockwerk}`}
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {room.extRaumId}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {filteredRooms.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No rooms found matching &quot;{searchTerm}&quot;</p>
          </div>
        )}
      </div>
    </Card>
  );
};
