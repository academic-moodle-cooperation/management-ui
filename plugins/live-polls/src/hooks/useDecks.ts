import { useCallback, useEffect, useState } from "react";

import {
  createDeck,
  deleteDeck as removeDeckById,
  duplicateDeck as duplicateDeckById,
  loadDecks,
  saveDecks,
  upsertDeck,
} from "../storage/deckStore";

import type { Deck } from "../types";

export interface DecksApi {
  decks: Deck[];
  create: (title: string) => Deck;
  save: (deck: Deck) => void;
  remove: (id: string) => void;
  duplicate: (id: string) => void;
  get: (id: string | null) => Deck | null;
}

/**
 * Deck list state, persisted to `localStorage`. The pure transforms live in
 * `storage/deckStore.ts`; this hook only wires them to React state + persistence.
 */
export function useDecks(): DecksApi {
  const [decks, setDecks] = useState<Deck[]>(() => loadDecks());

  useEffect(() => {
    saveDecks(decks);
  }, [decks]);

  const create = useCallback((title: string) => {
    const deck = createDeck(title, Date.now());
    setDecks((prev) => upsertDeck(prev, deck));
    return deck;
  }, []);

  const save = useCallback((deck: Deck) => {
    setDecks((prev) => upsertDeck(prev, { ...deck, updatedAt: Date.now() }));
  }, []);

  const remove = useCallback((id: string) => {
    setDecks((prev) => removeDeckById(prev, id));
  }, []);

  const duplicate = useCallback((id: string) => {
    setDecks((prev) => duplicateDeckById(prev, id, Date.now()));
  }, []);

  const get = useCallback(
    (id: string | null) => (id ? (decks.find((deck) => deck.id === id) ?? null) : null),
    [decks],
  );

  return { decks, create, save, remove, duplicate, get };
}
