import type { SessionChannel, SessionTransport } from "./SessionTransport";
import type { SessionEvent } from "../types";

/**
 * Zero-backend {@link SessionTransport}: the event log lives in `localStorage`
 * and changes fan out across tabs/windows via `BroadcastChannel`, with the
 * `storage` event as a fallback where BroadcastChannel is unavailable.
 *
 * Within a single tab, handles for the same code also notify each other through
 * a module-level registry — this keeps React Strict Mode's double-mount and any
 * same-tab multi-view in sync (neither BroadcastChannel nor the `storage` event
 * fire for the tab that made the change).
 *
 * For a real classroom you would swap this for a WebSocket/REST transport; the
 * `SessionChannel` contract — and therefore the hooks and UI — stay identical.
 */

const STORAGE_PREFIX = "live-polls:session:";
const CHANNEL_PREFIX = "live-polls:channel:";

const storageKey = (code: string) => `${STORAGE_PREFIX}${code}`;

function readEvents(code: string): SessionEvent[] {
  try {
    const raw = localStorage.getItem(storageKey(code));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SessionEvent[]) : [];
  } catch {
    return [];
  }
}

function writeEvents(code: string, events: SessionEvent[]): void {
  try {
    localStorage.setItem(storageKey(code), JSON.stringify(events));
  } catch {
    // Storage full or unavailable — the in-memory copy still drives this tab.
  }
}

// code → handles attached in *this* tab.
const tabHandles = new Map<string, Set<LocalSessionChannel>>();

class LocalSessionChannel implements SessionChannel {
  readonly code: string;

  private events: SessionEvent[];
  private readonly listeners = new Set<() => void>();
  private readonly broadcast: BroadcastChannel | null;
  private readonly onStorage: ((event: StorageEvent) => void) | null;
  private disposed = false;

  constructor(code: string) {
    this.code = code;
    this.events = readEvents(code);

    const siblings = tabHandles.get(code) ?? new Set<LocalSessionChannel>();
    siblings.add(this);
    tabHandles.set(code, siblings);

    if (typeof BroadcastChannel !== "undefined") {
      this.broadcast = new BroadcastChannel(`${CHANNEL_PREFIX}${code}`);
      this.broadcast.onmessage = () => this.refreshFromStorage();
    } else {
      this.broadcast = null;
    }

    if (typeof window !== "undefined") {
      this.onStorage = (event: StorageEvent) => {
        if (event.key === storageKey(code)) this.refreshFromStorage();
      };
      window.addEventListener("storage", this.onStorage);
    } else {
      this.onStorage = null;
    }
  }

  private refreshFromStorage(): void {
    this.events = readEvents(this.code);
    this.emit();
  }

  private emit(): void {
    for (const listener of this.listeners) listener();
  }

  append(event: SessionEvent): void {
    this.events = [...this.events, event];
    writeEvents(this.code, this.events);

    // Same-tab siblings re-read from storage; this handle already has the
    // fresh array, so just notify its own listeners.
    const siblings = tabHandles.get(this.code);
    if (siblings) {
      for (const sibling of siblings) {
        if (sibling !== this) sibling.refreshFromStorage();
      }
    }
    this.emit();

    // Cross-tab notification (no-op for the originating tab).
    this.broadcast?.postMessage("changed");
  }

  getEvents(): SessionEvent[] {
    return this.events;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.listeners.clear();
    this.broadcast?.close();
    if (this.onStorage && typeof window !== "undefined") {
      window.removeEventListener("storage", this.onStorage);
    }
    const siblings = tabHandles.get(this.code);
    siblings?.delete(this);
    if (siblings && siblings.size === 0) tabHandles.delete(this.code);
  }
}

export class LocalSessionTransport implements SessionTransport {
  open(code: string): SessionChannel {
    return new LocalSessionChannel(code);
  }

  exists(code: string): boolean {
    return readEvents(code).length > 0;
  }
}

/** Shared singleton used by the hooks. */
export const localSessionTransport = new LocalSessionTransport();
