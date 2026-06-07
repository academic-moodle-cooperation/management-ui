import type {
  AnswerValue,
  ChoiceQuestion,
  Question,
  QuizQuestion,
  ScaleQuestion,
  SessionEvent,
  SessionState,
} from "../types";

/**
 * Pure reducers and tallies over the session event log. Everything here is
 * deterministic and side-effect-free, which is what makes the live results
 * straightforward to unit-test (see `aggregate.test.ts`).
 */

export function initialSessionState(): SessionState {
  return {
    deck: null,
    status: "open",
    activeQuestionIndex: null,
    revealed: {},
    participants: {},
    answers: {},
  };
}

/** Apply a single event to a state snapshot, returning a new snapshot. */
export function reduceEvent(state: SessionState, event: SessionEvent): SessionState {
  switch (event.type) {
    case "session-opened":
      return { ...state, deck: event.deck, status: "open" };
    case "question-activated":
      return { ...state, activeQuestionIndex: event.index };
    case "results-revealed":
      return { ...state, revealed: { ...state.revealed, [event.questionId]: true } };
    case "participant-joined":
      return {
        ...state,
        participants: { ...state.participants, [event.participant.id]: event.participant },
      };
    case "answer-submitted": {
      const forQuestion = state.answers[event.questionId] ?? {};
      return {
        ...state,
        answers: {
          ...state.answers,
          [event.questionId]: { ...forQuestion, [event.participantId]: event.value },
        },
      };
    }
    case "session-closed":
      return { ...state, status: "closed" };
    default:
      return state;
  }
}

/** Reduce a whole event log into the current session snapshot. */
export function reduceEvents(events: SessionEvent[]): SessionState {
  return events.reduce(reduceEvent, initialSessionState());
}

export function getActiveQuestion(state: SessionState): Question | null {
  if (!state.deck || state.activeQuestionIndex === null) return null;
  return state.deck.questions[state.activeQuestionIndex] ?? null;
}

/** Number of participants who have answered a given question. */
export function responseCount(state: SessionState, questionId: string): number {
  return Object.keys(state.answers[questionId] ?? {}).length;
}

// ── Choice / multiple-choice / quiz ─────────────────────────────────────────

export interface ChoiceTally {
  optionId: string;
  text: string;
  count: number;
  isCorrect?: boolean;
}

export interface ChoiceResult {
  entries: ChoiceTally[];
  /** Number of respondents (distinct participants who answered). */
  total: number;
  /** Highest single-option count — handy for scaling bar widths. */
  max: number;
}

export function tallyChoice(
  question: ChoiceQuestion,
  answers: Record<string, AnswerValue> | undefined,
): ChoiceResult {
  const counts = new Map<string, number>();
  let total = 0;
  for (const value of Object.values(answers ?? {})) {
    if (value.kind !== "choice") continue;
    total += 1;
    for (const optionId of value.optionIds) {
      counts.set(optionId, (counts.get(optionId) ?? 0) + 1);
    }
  }
  let max = 0;
  const entries: ChoiceTally[] = question.options.map((option) => {
    const count = counts.get(option.id) ?? 0;
    if (count > max) max = count;
    const entry: ChoiceTally = { optionId: option.id, text: option.text, count };
    if (question.type === "quiz") {
      entry.isCorrect = option.id === question.correctOptionId;
    }
    return entry;
  });
  return { entries, total, max };
}

// ── Scale ───────────────────────────────────────────────────────────────────

export interface ScaleBucket {
  value: number;
  count: number;
}

export interface ScaleResult {
  buckets: ScaleBucket[];
  total: number;
  average: number | null;
  max: number;
}

export function tallyScale(
  question: ScaleQuestion,
  answers: Record<string, AnswerValue> | undefined,
): ScaleResult {
  const buckets: ScaleBucket[] = [];
  for (let value = question.min; value <= question.max; value += 1) {
    buckets.push({ value, count: 0 });
  }
  let sum = 0;
  let total = 0;
  for (const value of Object.values(answers ?? {})) {
    if (value.kind !== "scale") continue;
    const bucket = buckets.find((candidate) => candidate.value === value.value);
    if (!bucket) continue;
    bucket.count += 1;
    sum += value.value;
    total += 1;
  }
  const max = buckets.reduce((acc, bucket) => Math.max(acc, bucket.count), 0);
  return { buckets, total, average: total === 0 ? null : sum / total, max };
}

// ── Word cloud ────────────────────────────────────────────────────────────────

export interface WordTally {
  word: string;
  count: number;
}

export interface WordResult {
  entries: WordTally[];
  total: number;
  max: number;
}

export function tallyWords(answers: Record<string, AnswerValue> | undefined): WordResult {
  // Merge case-insensitively but keep the first-seen surface form for display.
  const byKey = new Map<string, WordTally>();
  let total = 0;
  for (const value of Object.values(answers ?? {})) {
    if (value.kind !== "words") continue;
    for (const raw of value.words) {
      const word = raw.trim();
      if (!word) continue;
      total += 1;
      const key = word.toLowerCase();
      const existing = byKey.get(key);
      if (existing) existing.count += 1;
      else byKey.set(key, { word, count: 1 });
    }
  }
  const entries = [...byKey.values()].sort(
    (a, b) => b.count - a.count || a.word.localeCompare(b.word),
  );
  const max = entries.reduce((acc, entry) => Math.max(acc, entry.count), 0);
  return { entries, total, max };
}

// ── Quiz leaderboard ──────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  participantId: string;
  name: string;
  score: number;
  correct: number;
}

/** Score every participant across all quiz questions in the deck. */
export function quizLeaderboard(state: SessionState): LeaderboardEntry[] {
  const deck = state.deck;
  if (!deck) return [];
  const quizQuestions = deck.questions.filter(
    (question): question is QuizQuestion => question.type === "quiz",
  );

  const entries = Object.values(state.participants).map((participant) => {
    let score = 0;
    let correct = 0;
    for (const question of quizQuestions) {
      const answer = state.answers[question.id]?.[participant.id];
      const isCorrect =
        answer?.kind === "choice" &&
        answer.optionIds.length === 1 &&
        answer.optionIds[0] === question.correctOptionId;
      if (isCorrect) {
        score += question.points;
        correct += 1;
      }
    }
    return { participantId: participant.id, name: participant.name, score, correct };
  });

  return entries.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}
