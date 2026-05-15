import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";

import { useMuiGetEventByIdQuery } from "../gql-generated";

/**
 * Hook to fetch event titles for a list of event IDs
 *
 * This hook efficiently fetches event titles by ID using parallel queries.
 * It's useful when you have a list of event IDs and need to display their titles
 * (e.g., in playlists, favorites, or any collection of events).
 *
 * @param eventIds - Array of event IDs to fetch titles for
 * @returns A Map from event ID to title (falls back to ID if title not found)
 *
 * @example
 * ```tsx
 * const eventIds = ['event-1', 'event-2', 'event-3'];
 * const eventTitleMap = useEventTitlesMap(eventIds);
 *
 * // Use in component
 * <div>{eventTitleMap.get('event-1') || 'Unknown'}</div>
 * ```
 */
export function useEventTitlesMap(eventIds: string[]): Map<string, string> {
  // Fetch events individually using useQueries
  // This scales because we only fetch events that are actually needed
  const eventQueries = useQueries({
    queries: eventIds.map((eventId) => ({
      queryKey: useMuiGetEventByIdQuery.getKey({ eventId }),
      queryFn: async () => {
        const fetcher = useMuiGetEventByIdQuery.fetcher({ eventId });
        return await fetcher();
      },
      enabled: eventIds.length > 0,
    })),
  });

  // Build the event title map
  return useMemo(() => {
    const map = new Map<string, string>();

    eventQueries.forEach((query, index) => {
      const eventId = eventIds[index];
      if (!eventId) return;

      // Use the simpler GetEventById query result (id and title directly)
      if (query.data?.eventById?.title) {
        map.set(eventId, query.data.eventById.title);
      } else {
        // Fallback to ID if title not found
        map.set(eventId, eventId);
      }
    });

    return map;
  }, [eventQueries, eventIds]);
}
