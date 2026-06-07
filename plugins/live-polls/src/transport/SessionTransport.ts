import type { SessionEvent } from "../types";

/**
 * A synchronized, append-only event log for a single session (one join code).
 *
 * Both the presenter and every participant attach to the same channel and
 * converge by reducing the same events (see `aggregate.ts`). The interface is
 * deliberately transport-agnostic:
 *
 *  - {@link LocalSessionTransport} backs it with `localStorage` +
 *    `BroadcastChannel` for a zero-backend demo that is genuinely live across
 *    browser tabs/windows.
 *  - A future `WebSocketSessionTransport` (or a Java backend bundle, like the
 *    univie plugin ships) can implement the exact same shape — the hooks and UI
 *    never need to change.
 */
export interface SessionChannel {
  readonly code: string;
  /** Append an event, persist it, and notify all attached listeners. */
  append(event: SessionEvent): void;
  /**
   * The current event-log snapshot. The reference is stable until the next
   * change, so it is safe to feed into `useSyncExternalStore`.
   */
  getEvents(): SessionEvent[];
  /** Subscribe to changes; returns an unsubscribe function. */
  subscribe(listener: () => void): () => void;
  /** Detach this handle's listeners (does not delete the stored events). */
  dispose(): void;
}

export interface SessionTransport {
  /** Open — or attach to — the channel for a session code. */
  open(code: string): SessionChannel;
  /** Whether a session with this code already has any events (i.e. exists). */
  exists(code: string): boolean;
}
