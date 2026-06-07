import { describe, expect, it } from "vitest";

import {
  getActiveQuestion,
  quizLeaderboard,
  reduceEvents,
  responseCount,
  tallyChoice,
  tallyScale,
  tallyWords,
} from "./aggregate";

import type {
  AnswerValue,
  Deck,
  MultipleChoiceQuestion,
  QuizQuestion,
  ScaleQuestion,
  SessionEvent,
  SingleChoiceQuestion,
  WordCloudQuestion,
} from "../types";


const single: SingleChoiceQuestion = {
  id: "q1",
  type: "single",
  prompt: "Favourite?",
  options: [
    { id: "a", text: "A" },
    { id: "b", text: "B" },
    { id: "c", text: "C" },
  ],
};

const multi: MultipleChoiceQuestion = {
  id: "q2",
  type: "multiple",
  prompt: "Pick any",
  options: [
    { id: "x", text: "X" },
    { id: "y", text: "Y" },
  ],
};

const scale: ScaleQuestion = { id: "q3", type: "scale", prompt: "Rate", min: 1, max: 5 };
const words: WordCloudQuestion = { id: "q4", type: "wordcloud", prompt: "Words", maxWords: 3 };
const quiz: QuizQuestion = {
  id: "q5",
  type: "quiz",
  prompt: "2 + 2?",
  points: 100,
  correctOptionId: "four",
  options: [
    { id: "three", text: "3" },
    { id: "four", text: "4" },
  ],
};

const deck: Deck = {
  id: "d1",
  title: "Demo deck",
  questions: [single, multi, scale, words, quiz],
  createdAt: 0,
  updatedAt: 0,
};

describe("reduceEvents", () => {
  const events: SessionEvent[] = [
    { type: "session-opened", deck, at: 1 },
    { type: "participant-joined", participant: { id: "p1", name: "Ann" }, at: 2 },
    { type: "participant-joined", participant: { id: "p2", name: "Bob" }, at: 3 },
    { type: "question-activated", index: 0, at: 4 },
    { type: "answer-submitted", participantId: "p1", questionId: "q1", value: { kind: "choice", optionIds: ["a"] }, at: 5 },
    { type: "answer-submitted", participantId: "p2", questionId: "q1", value: { kind: "choice", optionIds: ["a"] }, at: 6 },
    // p1 changes their mind — last write wins.
    { type: "answer-submitted", participantId: "p1", questionId: "q1", value: { kind: "choice", optionIds: ["b"] }, at: 7 },
  ];

  const state = reduceEvents(events);

  it("rebuilds deck, participants, and the active question", () => {
    expect(state.deck?.id).toBe("d1");
    expect(Object.keys(state.participants)).toEqual(["p1", "p2"]);
    expect(state.activeQuestionIndex).toBe(0);
    expect(getActiveQuestion(state)).toBe(single);
  });

  it("applies last-write-wins per participant per question", () => {
    expect(state.answers["q1"]?.["p1"]).toEqual({ kind: "choice", optionIds: ["b"] });
    expect(state.answers["q1"]?.["p2"]).toEqual({ kind: "choice", optionIds: ["a"] });
    expect(responseCount(state, "q1")).toBe(2);
  });

  it("marks the session closed", () => {
    const closed = reduceEvents([...events, { type: "session-closed", at: 8 }]);
    expect(closed.status).toBe("closed");
  });
});

describe("tallyChoice", () => {
  it("counts single-choice votes per option", () => {
    const answers: Record<string, AnswerValue> = {
      p1: { kind: "choice", optionIds: ["b"] },
      p2: { kind: "choice", optionIds: ["a"] },
    };
    const result = tallyChoice(single, answers);
    expect(result.total).toBe(2);
    expect(result.max).toBe(1);
    expect(result.entries).toEqual([
      { optionId: "a", text: "A", count: 1 },
      { optionId: "b", text: "B", count: 1 },
      { optionId: "c", text: "C", count: 0 },
    ]);
  });

  it("counts every selected option for multiple-choice", () => {
    const answers: Record<string, AnswerValue> = {
      p1: { kind: "choice", optionIds: ["x", "y"] },
      p2: { kind: "choice", optionIds: ["x"] },
    };
    const result = tallyChoice(multi, answers);
    expect(result.total).toBe(2); // two respondents
    expect(result.entries.find((e) => e.optionId === "x")?.count).toBe(2);
    expect(result.entries.find((e) => e.optionId === "y")?.count).toBe(1);
  });

  it("flags the correct option for quiz questions", () => {
    const result = tallyChoice(quiz, { p1: { kind: "choice", optionIds: ["four"] } });
    expect(result.entries.find((e) => e.optionId === "four")?.isCorrect).toBe(true);
    expect(result.entries.find((e) => e.optionId === "three")?.isCorrect).toBe(false);
  });
});

describe("tallyScale", () => {
  it("builds buckets across the range and computes the average", () => {
    const answers: Record<string, AnswerValue> = {
      p1: { kind: "scale", value: 2 },
      p2: { kind: "scale", value: 4 },
      p3: { kind: "scale", value: 4 },
    };
    const result = tallyScale(scale, answers);
    expect(result.buckets.map((b) => b.value)).toEqual([1, 2, 3, 4, 5]);
    expect(result.buckets.find((b) => b.value === 4)?.count).toBe(2);
    expect(result.total).toBe(3);
    expect(result.average).toBeCloseTo(10 / 3);
    expect(result.max).toBe(2);
  });

  it("returns a null average when there are no responses", () => {
    expect(tallyScale(scale, {}).average).toBeNull();
  });
});

describe("tallyWords", () => {
  it("merges words case-insensitively, keeping first-seen surface form", () => {
    const answers: Record<string, AnswerValue> = {
      p1: { kind: "words", words: ["React", " vue "] },
      p2: { kind: "words", words: ["react", "Svelte"] },
    };
    const result = tallyWords(answers);
    expect(result.total).toBe(4);
    expect(result.entries[0]).toEqual({ word: "React", count: 2 });
    expect(result.entries.map((e) => e.word)).toContain("vue");
    expect(result.entries.map((e) => e.word)).toContain("Svelte");
  });

  it("ignores blank words", () => {
    const result = tallyWords({ p1: { kind: "words", words: ["  ", ""] } });
    expect(result.total).toBe(0);
    expect(result.entries).toEqual([]);
  });
});

describe("quizLeaderboard", () => {
  it("scores correct single answers and sorts by score", () => {
    const events: SessionEvent[] = [
      { type: "session-opened", deck, at: 1 },
      { type: "participant-joined", participant: { id: "p1", name: "Ann" }, at: 2 },
      { type: "participant-joined", participant: { id: "p2", name: "Bob" }, at: 3 },
      { type: "answer-submitted", participantId: "p1", questionId: "q5", value: { kind: "choice", optionIds: ["four"] }, at: 4 },
      { type: "answer-submitted", participantId: "p2", questionId: "q5", value: { kind: "choice", optionIds: ["three"] }, at: 5 },
    ];
    const board = quizLeaderboard(reduceEvents(events));
    expect(board).toEqual([
      { participantId: "p1", name: "Ann", score: 100, correct: 1 },
      { participantId: "p2", name: "Bob", score: 0, correct: 0 },
    ]);
  });
});
