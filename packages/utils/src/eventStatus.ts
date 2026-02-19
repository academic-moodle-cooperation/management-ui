/**
 * Utility functions for checking event processing status
 */

/**
 * Processing states that indicate video processing is in progress or has failed
 */
const PROCESSING_STATES = ["PROCESSING", "PENDING", "PROCESSING_FAILURE"] as const;

/**
 * Extracts the status from an event status string
 * Event status format: "EVENTS.EVENTS.STATUS.PROCESSING" -> "PROCESSING"
 */
export function getEventStatus(eventStatus: string | undefined | null): string | null {
  if (!eventStatus) return null;
  return eventStatus.split(".").pop()?.toUpperCase() || null;
}

/**
 * Checks if a single event is in a processing state
 */
export function isEventProcessing(eventStatus: string | undefined | null): boolean {
  const status = getEventStatus(eventStatus);
  if (!status) return false;
  return PROCESSING_STATES.includes(status as typeof PROCESSING_STATES[number]);
}

/**
 * Checks if any events in an array are in a processing state
 */
export function hasProcessingEvents(
  events: Array<{ eventStatus?: string | null } | null> | undefined | null,
): boolean {
  if (!events) return false;
  return events.some((event) => isEventProcessing(event?.eventStatus));
}
