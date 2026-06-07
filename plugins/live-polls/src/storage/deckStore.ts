import { newId } from "../lib/ids";

import type { ChoiceOption, Deck, Question, QuestionType } from "../types";

/**
 * Local persistence + pure transforms for poll decks.
 *
 * `loadDecks` / `saveDecks` touch `localStorage`; everything else is a pure
 * function over a `Deck[]` (or a factory), which keeps the editing logic easy to
 * test and free of storage side effects. In a backend-backed deployment these
 * transforms stay the same — only load/save would change.
 */

const STORAGE_KEY = "live-polls:decks";

export function loadDecks(): Deck[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Deck[]) : [];
  } catch {
    return [];
  }
}

export function saveDecks(decks: Deck[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
  } catch {
    // Ignore — storage may be unavailable or full.
  }
}

export function newOption(text = ""): ChoiceOption {
  return { id: newId(), text };
}

/** Build a blank question of the given type with sensible defaults. */
export function newQuestion(type: QuestionType): Question {
  const id = newId();
  switch (type) {
    case "single":
      return { id, type, prompt: "", options: [newOption(), newOption()] };
    case "multiple":
      return { id, type, prompt: "", options: [newOption(), newOption()] };
    case "quiz": {
      const first = newOption();
      return {
        id,
        type,
        prompt: "",
        options: [first, newOption()],
        correctOptionId: first.id,
        points: 100,
      };
    }
    case "scale":
      return { id, type, prompt: "", min: 1, max: 5 };
    case "wordcloud":
      return { id, type, prompt: "", maxWords: 3 };
  }
}

export function createDeck(title: string, now: number): Deck {
  return { id: newId(), title, questions: [], createdAt: now, updatedAt: now };
}

export function upsertDeck(decks: Deck[], deck: Deck): Deck[] {
  const index = decks.findIndex((candidate) => candidate.id === deck.id);
  if (index === -1) return [...decks, deck];
  const next = decks.slice();
  next[index] = deck;
  return next;
}

export function deleteDeck(decks: Deck[], id: string): Deck[] {
  return decks.filter((deck) => deck.id !== id);
}

function cloneQuestion(question: Question): Question {
  switch (question.type) {
    case "single":
    case "multiple":
      return {
        ...question,
        id: newId(),
        options: question.options.map((option) => ({ ...option, id: newId() })),
      };
    case "quiz": {
      const idMap = new Map<string, string>();
      const options = question.options.map((option) => {
        const id = newId();
        idMap.set(option.id, id);
        return { ...option, id };
      });
      return {
        ...question,
        id: newId(),
        options,
        correctOptionId: idMap.get(question.correctOptionId) ?? options[0]?.id ?? "",
      };
    }
    case "scale":
    case "wordcloud":
      return { ...question, id: newId() };
  }
}

export function duplicateDeck(decks: Deck[], id: string, now: number): Deck[] {
  const source = decks.find((deck) => deck.id === id);
  if (!source) return decks;
  const copy: Deck = {
    ...source,
    id: newId(),
    title: `${source.title} (copy)`,
    questions: source.questions.map(cloneQuestion),
    createdAt: now,
    updatedAt: now,
  };
  return [...decks, copy];
}
