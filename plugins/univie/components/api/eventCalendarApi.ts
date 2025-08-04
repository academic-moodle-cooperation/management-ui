import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { Room, Event, ParsedEvent, EventCalendarConfig } from '../types/eventCalendar';

/**
 * Default configuration for the event calendar
 * TODO: Future improvement - make this configurable via environment variables or settings
 */
const DEFAULT_CONFIG: EventCalendarConfig = {
  // Example room IDs - in production this should be configurable
  allowedRoomIds: [1001, 1002, 1003, 2001, 2002], 
  // This should be configurable via environment variable
  apiBaseUrl: process.env.VITE_UNIVIE_API_BASE_URL || 'https://api.example.com'
};

/**
 * Parse date and time strings from API format to Date objects
 */
export function parseEventDates(event: Event): ParsedEvent {
  // Parse date from "02.08.2025" format
  const [day, month, year] = event.datum.split('.');
  const baseDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  
  // Parse time from "08.00" format
  const [startHour, startMinute] = event.beginn.split('.');
  const [endHour, endMinute] = event.ende.split('.');
  
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
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

/**
 * Fetch all rooms from the API
 */
async function fetchRooms(config: EventCalendarConfig = DEFAULT_CONFIG): Promise<Room[]> {
  const response = await fetch(`${config.apiBaseUrl}/digitalsignage/v1/getAllRaeume`);
  if (!response.ok) {
    throw new Error(`Failed to fetch rooms: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  // Filter rooms to only allowed room IDs
  return data.filter((room: Room) => config.allowedRoomIds.includes(room.extRaumId));
}

/**
 * Fetch events by number of days from today
 */
async function fetchEventsByDays(
  days: number = 1, 
  config: EventCalendarConfig = DEFAULT_CONFIG
): Promise<ParsedEvent[]> {
  const response = await fetch(`${config.apiBaseUrl}/digitalsignage/v1/findRaumbelegungenByDays?days=${days}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch events: ${response.statusText}`);
  }
  
  const data: Event[] = await response.json();
  
  // Filter events to only allowed room IDs and parse dates
  return data
    .filter((event: Event) => config.allowedRoomIds.includes(event.extRaumId))
    .map(parseEventDates);
}

/**
 * Fetch events for a specific date
 */
async function fetchEventsByDate(
  date: Date,
  config: EventCalendarConfig = DEFAULT_CONFIG
): Promise<ParsedEvent[]> {
  // For now, we fetch 1 day and filter client-side
  // TODO: Future improvement - add endpoint to get events by room ID and date
  const events = await fetchEventsByDays(1, config);
  
  const targetDateStr = formatDateForApi(date);
  return events.filter(event => event.originalDatum === targetDateStr);
}

/**
 * React Query hook for fetching rooms
 */
export function useRooms(config?: EventCalendarConfig): UseQueryResult<Room[], Error> {
  return useQuery({
    queryKey: ['univie-rooms', config?.allowedRoomIds],
    queryFn: () => fetchRooms(config),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * React Query hook for fetching events by days
 */
export function useEventsByDays(
  days: number = 1, 
  config?: EventCalendarConfig
): UseQueryResult<ParsedEvent[], Error> {
  return useQuery({
    queryKey: ['univie-events-by-days', days, config?.allowedRoomIds],
    queryFn: () => fetchEventsByDays(days, config),
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * React Query hook for fetching events by specific date
 */
export function useEventsByDate(
  date: Date, 
  config?: EventCalendarConfig
): UseQueryResult<ParsedEvent[], Error> {
  return useQuery({
    queryKey: ['univie-events-by-date', formatDateForApi(date), config?.allowedRoomIds],
    queryFn: () => fetchEventsByDate(date, config),
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get events for a specific room
 */
export function getEventsForRoom(events: ParsedEvent[], roomId: number): ParsedEvent[] {
  return events.filter(event => event.extRaumId === roomId);
}

/**
 * Get room by ID
 */
export function getRoomById(rooms: Room[], roomId: number): Room | undefined {
  return rooms.find(room => room.extRaumId === roomId);
}