import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

import { generateJoinCode } from "../lib/ids";
import { reduceEvents } from "../transport/aggregate";
import { localSessionTransport } from "../transport/LocalSessionTransport";

import type { SessionChannel } from "../transport/SessionTransport";
import type { Deck, SessionState } from "../types";

const activeSessionKey = (deckId: string) => `live-polls:active-session:${deckId}`;

/** Resume the deck's current session code if one exists, else mint a new one. */
function resolveCode(deck: Deck): string {
  const existing = localStorage.getItem(activeSessionKey(deck.id));
  if (existing && localSessionTransport.exists(existing)) return existing;
  const code = generateJoinCode();
  localStorage.setItem(activeSessionKey(deck.id), code);
  return code;
}

export interface PresenterSession {
  code: string;
  state: SessionState;
  setActiveQuestion: (index: number | null) => void;
  reveal: (questionId: string) => void;
  close: () => void;
  restart: () => void;
}

/**
 * Presenter-side session controller over a {@link SessionChannel}. The channel
 * is (re)opened whenever the join code changes (initial resume, or `restart`);
 * `useSyncExternalStore` keeps the reduced state live as events arrive from any
 * tab. `session-opened` is idempotent in the reducer, so a Strict-Mode double
 * render at most adds a harmless duplicate event.
 */
export function useSession(deck: Deck): PresenterSession {
  const [code, setCode] = useState(() => resolveCode(deck));

  // Open the channel during render when the code changes; dispose the previous.
  const ref = useRef<{ code: string; channel: SessionChannel } | null>(null);
  if (!ref.current || ref.current.code !== code) {
    ref.current?.channel.dispose();
    const channel = localSessionTransport.open(code);
    if (channel.getEvents().length === 0) {
      channel.append({ type: "session-opened", deck, at: Date.now() });
    }
    ref.current = { code, channel };
  }
  const channel = ref.current.channel;

  useEffect(
    () => () => {
      ref.current?.channel.dispose();
      ref.current = null;
    },
    [],
  );

  const subscribe = useCallback((listener: () => void) => channel.subscribe(listener), [channel]);
  const getSnapshot = useCallback(() => channel.getEvents(), [channel]);
  const events = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const state = useMemo(() => reduceEvents(events), [events]);

  const setActiveQuestion = useCallback(
    (index: number | null) => {
      channel.append({ type: "question-activated", index, at: Date.now() });
    },
    [channel],
  );

  const reveal = useCallback(
    (questionId: string) => {
      channel.append({ type: "results-revealed", questionId, at: Date.now() });
    },
    [channel],
  );

  const close = useCallback(() => {
    channel.append({ type: "session-closed", at: Date.now() });
  }, [channel]);

  const restart = useCallback(() => {
    const next = generateJoinCode();
    localStorage.setItem(activeSessionKey(deck.id), next);
    setCode(next);
  }, [deck.id]);

  return { code, state, setActiveQuestion, reveal, close, restart };
}
