import { useQuery, type UseQueryResult } from "@workspace/query";
import { logger } from "@workspace/utils";

import { allowedRoomIds } from "./allowedRoomIds";

import type { Room, Event, ParsedEvent, EventCalendarConfig } from "../types/eventCalendar";
/**
 * Default configuration for the event calendar
 * TODO: Future improvement - make this configurable via environment variables or settings
 */
const DEFAULT_CONFIG: EventCalendarConfig = {
  // Example room IDs - in production this should be configurable
  allowedRoomIds,
  // This should be configurable via environment variable
  // Set VITE_UNIVIE_API_BASE_URL to your real API URL to switch from mock data
  apiBaseUrl: import.meta.env?.["VITE_UNIVIE_API_BASE_URL"] || "https://api.example.com",
};

logger.debug("Event Calendar API Configuration", {
  apiBaseUrl: DEFAULT_CONFIG.apiBaseUrl,
  allowedRoomCount: DEFAULT_CONFIG.allowedRoomIds.length,
  usingMockData:
    !DEFAULT_CONFIG.apiBaseUrl || DEFAULT_CONFIG.apiBaseUrl === "https://api.example.com",
});

/**
 * Parse date and time strings from API format to Date objects
 */
export function parseEventDates(event: Event): ParsedEvent {
  // Parse date from "02.08.2025" format
  const dateParts = event.datum.split(".");
  if (dateParts.length !== 3) {
    throw new Error(`Invalid date format: ${event.datum}`);
  }
  const [day, month, year] = dateParts as [string, string, string];
  const baseDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

  // Parse time from "08.00" format
  const startParts = event.beginn.split(".");
  const endParts = event.ende.split(".");

  if (startParts.length !== 2 || endParts.length !== 2) {
    throw new Error(`Invalid time format: ${event.beginn} or ${event.ende}`);
  }

  const [startHour, startMinute] = startParts as [string, string];
  const [endHour, endMinute] = endParts as [string, string];

  const startTime = new Date(baseDate);
  startTime.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);

  const endTime = new Date(baseDate);
  endTime.setHours(parseInt(endHour), parseInt(endMinute), 0, 0);

  return {
    ...event,
    date: baseDate,
    startTime,
    endTime,
    originalDatum: event.datum,
    originalBeginn: event.beginn,
    originalEnde: event.ende,
  };
}

/**
 * Format date for API query parameter
 */
export function formatDateForApi(date: Date): string {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

/**
 * Fetch all rooms from the API
 */
async function fetchRooms(config: EventCalendarConfig = DEFAULT_CONFIG): Promise<Room[]> {
  // Check if we're in production mode (API URL is set)
  logger.debug("Fetching rooms", { apiBaseUrl: config.apiBaseUrl });
  if (config.apiBaseUrl && config.apiBaseUrl !== "https://api.example.com") {
    try {
      logger.debug("Fetching rooms from API");
      const response = await fetch(`${config.apiBaseUrl}/digitalsignage/v1/getAllRaeume`);

      if (!response.ok) {
        throw new Error(`Failed to fetch rooms: ${response.status} ${response.statusText}`);
      }

      const allRooms: Room[] = await response.json();
      logger.debug(`Fetched ${allRooms.length} rooms from API`, { roomCount: allRooms.length });

      // Filter rooms to only allowed room IDs
      const filteredRooms = allRooms.filter((room: Room) =>
        config.allowedRoomIds.includes(room.extRaumId),
      );

      logger.debug("Room filtering results", {
        totalFromAPI: allRooms.length,
        allowedRoomIds: config.allowedRoomIds.length,
        matchingRooms: filteredRooms.length,
        matchingRoomIds: filteredRooms.map((r) => r.extRaumId).sort((a, b) => a - b),
        missingRoomIds: config.allowedRoomIds.filter(
          (id) => !allRooms.find((r) => r.extRaumId === id),
        ),
      });

      return filteredRooms;
    } catch (error) {
      logger.error(
        "Error fetching rooms from API",
        error instanceof Error ? error : new Error(String(error)),
      );
      throw error;
    }
  }

  // Fallback to mock data for development/demo
  await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate loading

  const mockRooms: Room[] = [
    {
      extRaumId: 1001,
      nummer: "HS 1",
      stockwerk: "1",
      raumArtNeuCode: "HS",
      raumArtNeuBezeichnung: "Hörsaal",
      extGebaeudeId: 100,
      gebaeudeName: "Hauptgebäude",
      gebaeudeNummer: "01",
      gebaeudeStrasse: "Universitätsring 1",
      gebaeudePlz: "1010",
      gebaeudeOrt: "Wien",
      gebaeudeLand: "Austria",
      uscreenRaum: "main-hs1",
    },
    {
      extRaumId: 1002,
      nummer: "HS 2",
      stockwerk: "1",
      raumArtNeuCode: "HS",
      raumArtNeuBezeichnung: "Hörsaal",
      extGebaeudeId: 100,
      gebaeudeName: "Hauptgebäude",
      gebaeudeNummer: "01",
      gebaeudeStrasse: "Universitätsring 1",
      gebaeudePlz: "1010",
      gebaeudeOrt: "Wien",
      gebaeudeLand: "Austria",
      uscreenRaum: "main-hs2",
    },
    {
      extRaumId: 2001,
      nummer: "SR 101",
      stockwerk: "1",
      raumArtNeuCode: "SR",
      raumArtNeuBezeichnung: "Seminarraum",
      extGebaeudeId: 200,
      gebaeudeName: "Nebengebäude",
      gebaeudeNummer: "02",
      gebaeudeStrasse: "Universitätsring 2",
      gebaeudePlz: "1010",
      gebaeudeOrt: "Wien",
      gebaeudeLand: "Austria",
      uscreenRaum: "side-sr101",
    },
  ];

  // Filter rooms to only allowed room IDs
  return mockRooms.filter((room: Room) => config.allowedRoomIds.includes(room.extRaumId));
}

/**
 * Fetch events by number of days from today
 */
async function fetchEventsByDays(
  days: number = 1,
  config: EventCalendarConfig = DEFAULT_CONFIG,
): Promise<ParsedEvent[]> {
  // Check if we're in production mode (API URL is set)
  if (config.apiBaseUrl && config.apiBaseUrl !== "https://api.example.com") {
    try {
      const response = await fetch(
        `${config.apiBaseUrl}/digitalsignage/v1/findRaumbelegungenByDays?days=${days}`,
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.status} ${response.statusText}`);
      }

      const events: Event[] = await response.json();

      // Filter events to only allowed room IDs and parse dates
      return events
        .filter((event: Event) => config.allowedRoomIds.includes(event.extRaumId))
        .map(parseEventDates);
    } catch (error) {
      logger.error(
        "Error fetching events from API",
        error instanceof Error ? error : new Error(String(error)),
      );
      throw error;
    }
  }

  // Fallback to mock data for development/demo
  await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate loading

  const today = new Date();
  const mockEvents: Event[] = [];

  // Generate mock events for the requested number of days
  for (let dayOffset = 0; dayOffset < days; dayOffset++) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + dayOffset);
    const dateStr = formatDateForApi(targetDate);

    // Different event patterns for different days
    const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      // Monday to Friday
      mockEvents.push(
        {
          extRaumId: 1001,
          datum: dateStr,
          beginn: "09.00",
          ende: "11.00",
          relationenName: "Prof. Dr. Müller, Studiengang Informatik",
          name: "Einführung in die Informatik",
          lvKategorie: "Vorlesung",
        },
        {
          extRaumId: 1001,
          datum: dateStr,
          beginn: "14.00",
          ende: "16.00",
          relationenName: "Dr. Schmidt, Studiengang Mathematik",
          name: "Algorithmen und Datenstrukturen",
          lvKategorie: "Vorlesung",
        },
        {
          extRaumId: 1002,
          datum: dateStr,
          beginn: "10.00",
          ende: "12.00",
          relationenName: "Prof. Dr. Weber, Studiengang Physik",
          name: "Quantenmechanik",
          lvKategorie: "Vorlesung",
        },
      );

      // Tuesday, Thursday have additional events
      if (dayOfWeek === 2 || dayOfWeek === 4) {
        mockEvents.push(
          {
            extRaumId: 2001,
            datum: dateStr,
            beginn: "13.00",
            ende: "15.00",
            relationenName: "Mag. Fischer, Studiengang Psychologie",
            name: "Statistik für Psychologen",
            lvKategorie: "Seminar",
          },
          {
            extRaumId: 2001,
            datum: dateStr,
            beginn: "15.30",
            ende: "17.30",
            relationenName: "Dr. Bauer, Studiengang Psychologie",
            name: "Experimentalpsychologie Übung",
            lvKategorie: "Übung",
          },
        );
      }

      // Wednesday has different events
      if (dayOfWeek === 3) {
        mockEvents.push({
          extRaumId: 1002,
          datum: dateStr,
          beginn: "13.30",
          ende: "15.30",
          relationenName: "Prof. Dr. Wagner, Studiengang Biologie",
          name: "Molekularbiologie",
          lvKategorie: "Vorlesung",
        });
      }
    } else if (dayOfWeek === 6) {
      // Saturday
      // Limited weekend events
      mockEvents.push({
        extRaumId: 1001,
        datum: dateStr,
        beginn: "10.00",
        ende: "12.00",
        relationenName: "Dr. Klein, Weiterbildung",
        name: "Weekend Workshop",
        lvKategorie: "Workshop",
      });
    }
    // Sunday has no events
  }

  // Filter events to only allowed room IDs and parse dates
  return mockEvents
    .filter((event: Event) => config.allowedRoomIds.includes(event.extRaumId))
    .map(parseEventDates);
}

/**
 * Fetch events for a specific date
 */
async function fetchEventsByDate(
  date: Date,
  config: EventCalendarConfig = DEFAULT_CONFIG,
): Promise<ParsedEvent[]> {
  // Calculate days offset from today
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison

  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0); // Reset time to start of day

  // Calculate the difference in days
  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // The API uses 1-based indexing where 1 = today, 2 = tomorrow, etc.
  const apiDays = diffDays + 1;

  // For past dates (negative diffDays), we'll still try to fetch but it might return empty
  // For future dates, we use the calculated offset
  const daysToFetch = Math.max(1, apiDays);

  logger.debug("Fetching events for date", {
    date: formatDateForApi(date),
    calculatedDaysOffset: daysToFetch,
  });

  const events = await fetchEventsByDays(daysToFetch, config);

  const targetDateStr = formatDateForApi(date);
  return events.filter((event) => event.originalDatum === targetDateStr);
}

/**
 * React Query hook for fetching rooms
 */
export function useRooms(config?: EventCalendarConfig): UseQueryResult<Room[], Error> {
  return useQuery({
    queryKey: ["univie-rooms", config?.allowedRoomIds],
    queryFn: () => fetchRooms(config),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - rooms rarely change
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
  });
}

/**
 * React Query hook for fetching events by days
 */
export function useEventsByDays(
  days: number = 1,
  config?: EventCalendarConfig,
): UseQueryResult<ParsedEvent[], Error> {
  return useQuery({
    queryKey: ["univie-events-by-days", days, config?.allowedRoomIds],
    queryFn: () => fetchEventsByDays(days, config),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * React Query hook for fetching events by specific date
 */
export function useEventsByDate(
  date: Date,
  config?: EventCalendarConfig,
): UseQueryResult<ParsedEvent[], Error> {
  return useQuery({
    queryKey: ["univie-events-by-date", formatDateForApi(date), config?.allowedRoomIds],
    queryFn: () => fetchEventsByDate(date, config),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get events for a specific room
 */
export function getEventsForRoom(events: ParsedEvent[], roomId: number): ParsedEvent[] {
  return events.filter((event) => event.extRaumId === roomId);
}

/**
 * Get room by ID
 */
export function getRoomById(rooms: Room[], roomId: number): Room | undefined {
  return rooms.find((room) => room.extRaumId === roomId);
}

/**
 * Clear the rooms cache (useful for testing or manual refresh)
 * Note: This function is deprecated. Use TanStack Query's cache invalidation instead.
 * You can use queryClient.invalidateQueries(['univie-rooms']) to clear the cache.
 */
export function clearRoomsCache(): void {
  logger.warn("clearRoomsCache is deprecated. Use TanStack Query cache invalidation instead.");
}

/**
 * Helper function to analyze room ID mismatches
 */
export function analyzeRoomIdMismatches(
  apiRooms: Room[],
  allowedIds: number[],
): {
  found: number[];
  missing: number[];
  unexpected: number[];
} {
  const apiRoomIds = apiRooms.map((r) => r.extRaumId);

  return {
    found: allowedIds.filter((id) => apiRoomIds.includes(id)),
    missing: allowedIds.filter((id) => !apiRoomIds.includes(id)),
    unexpected: apiRoomIds.filter((id) => !allowedIds.includes(id)),
  };
}
