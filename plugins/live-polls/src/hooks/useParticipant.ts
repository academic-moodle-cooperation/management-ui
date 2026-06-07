import { useCallback, useMemo, useRef, useState, useSyncExternalStore } from "react";

import { newId } from "../lib/ids";
import { reduceEvents } from "../transport/aggregate";
import { localSessionTransport } from "../transport/LocalSessionTransport";

import type { SessionChannel } from "../transport/SessionTransport";
import type { AnswerValue, SessionState } from "../types";

/** A stable per-code participant id, so a reload keeps the same identity. */
function resolveParticipantId(code: string): string {
  const key = `live-polls:me:${code}`;
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const id = newId();
  localStorage.setItem(key, id);
  return id;
}

export interface ParticipantSession {
  state: SessionState;
  participantId: string;
  joined: boolean;
  join: (name: string) => void;
  submit: (questionId: string, value: AnswerValue) => void;
}

/**
 * Participant-side controller. Attaches to the same {@link SessionChannel} as
 * the presenter (one per join code) and derives the live state by reducing the
 * shared event log.
 */
export function useParticipant(code: string): ParticipantSession {
  const ref = useRef<{ code: string; channel: SessionChannel } | null>(null);
  if (!ref.current || ref.current.code !== code) {
    ref.current?.channel.dispose();
    ref.current = { code, channel: localSessionTransport.open(code) };
  }
  const channel = ref.current.channel;

  const [participantId] = useState(() => resolveParticipantId(code));

  const subscribe = useCallback((listener: () => void) => channel.subscribe(listener), [channel]);
  const getSnapshot = useCallback(() => channel.getEvents(), [channel]);
  const events = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const state = useMemo(() => reduceEvents(events), [events]);

  const joined = state.participants[participantId] !== undefined;

  const join = useCallback(
    (name: string) => {
      channel.append({
        type: "participant-joined",
        participant: { id: participantId, name },
        at: Date.now(),
      });
    },
    [channel, participantId],
  );

  const submit = useCallback(
    (questionId: string, value: AnswerValue) => {
      channel.append({
        type: "answer-submitted",
        participantId,
        questionId,
        value,
        at: Date.now(),
      });
    },
    [channel, participantId],
  );

  return { state, participantId, joined, join, submit };
}
