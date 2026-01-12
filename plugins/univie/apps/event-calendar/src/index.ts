// Export the main calendar component
export { CalendarView } from "./components/Calendar/CalendarView";

// Export individual components for granular usage
export { EventCard } from "./components/Calendar/EventCard";
export { RoomFilter } from "./components/Calendar/RoomFilter";

// Export API hooks and utilities
export {
  useRooms,
  useEventsByDate,
  useEventsByDays,
  getRoomById,
  getEventsForRoom,
  clearRoomsCache,
} from "./components/api/eventCalendarApi";

// Export types
export type {
  Room,
  Event,
  ParsedEvent,
  EventCalendarConfig,
} from "./components/types/eventCalendar";
