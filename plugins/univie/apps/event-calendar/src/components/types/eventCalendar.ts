/**
 * Room model based on API response from <IP>/digitalsignage/v1/getAllRaeume
 */
export interface Room {
  extRaumId: number;
  nummer: string;
  stockwerk: string;
  raumArtNeuCode: string;
  raumArtNeuBezeichnung: string;
  extGebaeudeId: number;
  gebaeudeName: string;
  gebaeudeNummer: string;
  gebaeudeStrasse: string;
  gebaeudePlz: string;
  gebaeudeOrt: string;
  gebaeudeLand: string;
  uscreenRaum: string;
}

/**
 * Event model based on API response from <IP>/digitalsignage/v1/findRaumbelegungenByDays?days=1
 */
export interface Event {
  extRaumId: number;
  datum: string; // Format: "02.08.2025"
  beginn: string; // Format: "08.00"
  ende: string; // Format: "20.00"
  relationenName: string;
  name: string;
  lvKategorie: string;
}

/**
 * Parsed event with Date objects for easier manipulation
 */
export interface ParsedEvent extends Omit<Event, "datum" | "beginn" | "ende"> {
  date: Date;
  startTime: Date;
  endTime: Date;
  originalDatum: string;
  originalBeginn: string;
  originalEnde: string;
}

/**
 * Configuration for allowed room IDs
 * Future improvement: make this configurable via environment variables or settings
 */
export interface EventCalendarConfig {
  allowedRoomIds: number[];
  apiBaseUrl: string;
}

/**
 * API response types
 */
export interface RoomsApiResponse {
  success: boolean;
  data: Room[];
}

export interface EventsApiResponse {
  success: boolean;
  data: Event[];
}
