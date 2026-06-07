import { beforeEach, describe, expect, it } from "vitest";

import {
  createDeck,
  deleteDeck,
  duplicateDeck,
  loadDecks,
  newQuestion,
  saveDecks,
  upsertDeck,
} from "./deckStore";

import type { Deck } from "../types";


const baseDeck = (id: string, title: string): Deck => ({
  id,
  title,
  questions: [],
  createdAt: 0,
  updatedAt: 0,
});

describe("newQuestion", () => {
  it("creates choice questions with two starter options", () => {
    const single = newQuestion("single");
    expect(single.type).toBe("single");
    if (single.type === "single") expect(single.options).toHaveLength(2);
  });

  it("creates a quiz with the first option marked correct", () => {
    const quiz = newQuestion("quiz");
    if (quiz.type === "quiz") {
      expect(quiz.points).toBe(100);
      expect(quiz.correctOptionId).toBe(quiz.options[0]?.id);
    }
  });

  it("creates a 1–5 scale and a word cloud", () => {
    const scale = newQuestion("scale");
    if (scale.type === "scale") expect([scale.min, scale.max]).toEqual([1, 5]);
    const words = newQuestion("wordcloud");
    if (words.type === "wordcloud") expect(words.maxWords).toBe(3);
  });
});

describe("deck transforms", () => {
  it("inserts a new deck and updates an existing one", () => {
    const a = baseDeck("a", "A");
    const decks = upsertDeck([], a);
    expect(decks).toHaveLength(1);

    const updated = upsertDeck(decks, { ...a, title: "A2" });
    expect(updated).toHaveLength(1);
    expect(updated[0]?.title).toBe("A2");
  });

  it("deletes by id", () => {
    const decks = [baseDeck("a", "A"), baseDeck("b", "B")];
    expect(deleteDeck(decks, "a").map((d) => d.id)).toEqual(["b"]);
  });

  it("createDeck stamps timestamps", () => {
    const deck = createDeck("New", 1234);
    expect(deck.createdAt).toBe(1234);
    expect(deck.updatedAt).toBe(1234);
    expect(deck.title).toBe("New");
  });

  it("duplicateDeck deep-copies with fresh ids and remaps the quiz answer", () => {
    const source = baseDeck("src", "Quiz");
    source.questions = [newQuestion("quiz")];
    const decks = duplicateDeck([source], "src", 5);
    expect(decks).toHaveLength(2);

    const copy = decks[1];
    const original = source.questions[0];
    const copied = copy?.questions[0];
    expect(copy?.id).not.toBe("src");
    expect(copied?.id).not.toBe(original?.id);
    if (copied?.type === "quiz") {
      // the remapped correct option must point at one of the *new* option ids
      expect(copied.options.map((o) => o.id)).toContain(copied.correctOptionId);
    }
  });
});

describe("load/save", () => {
  beforeEach(() => localStorage.clear());

  it("round-trips through localStorage", () => {
    expect(loadDecks()).toEqual([]);
    const decks = [baseDeck("a", "A")];
    saveDecks(decks);
    expect(loadDecks()).toEqual(decks);
  });
});
