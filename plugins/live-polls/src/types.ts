/**
 * Domain model for the Live Polls (audience-response) plugin.
 *
 * Two halves:
 *  - **Authoring** — {@link Deck} / {@link Question}: what an instructor builds
 *    and persists locally (see `storage/deckStore.ts`).
 *  - **Live session** — {@link SessionEvent} / {@link SessionState}: an
 *    append-only event log produced while a session runs, reduced into a
 *    snapshot for rendering (see `transport/aggregate.ts`).
 *
 * Keeping the live session as an event log (rather than mutable state) is what
 * lets every browser tab — presenter and participants — converge on the same
 * picture: each tab reduces the same log. It also makes late-joiners and page
 * reloads "just work", and keeps the aggregation logic pure and unit-testable.
 */

export type QuestionType = "single" | "multiple" | "scale" | "wordcloud" | "quiz";

export interface ChoiceOption {
  id: string;
  text: string;
}

interface QuestionBase {
  id: string;
  prompt: string;
}

export interface SingleChoiceQuestion extends QuestionBase {
  type: "single";
  options: ChoiceOption[];
}

export interface MultipleChoiceQuestion extends QuestionBase {
  type: "multiple";
  options: ChoiceOption[];
}

export interface QuizQuestion extends QuestionBase {
  type: "quiz";
  options: ChoiceOption[];
  correctOptionId: string;
  points: number;
}

export interface ScaleQuestion extends QuestionBase {
  type: "scale";
  min: number;
  max: number;
  minLabel?: string;
  maxLabel?: string;
}

export interface WordCloudQuestion extends QuestionBase {
  type: "wordcloud";
  maxWords: number;
}

export type Question =
  | SingleChoiceQuestion
  | MultipleChoiceQuestion
  | QuizQuestion
  | ScaleQuestion
  | WordCloudQuestion;

/** Question kinds backed by a fixed list of options. */
export type ChoiceQuestion = SingleChoiceQuestion | MultipleChoiceQuestion | QuizQuestion;

export interface Deck {
  id: string;
  title: string;
  description?: string;
  /** Optional Opencast series this deck belongs to (course-level grouping). */
  seriesId?: string | null;
  questions: Question[];
  createdAt: number;
  updatedAt: number;
}

/** A single participant's answer to one question. Discriminated by `kind`. */
export type AnswerValue =
  | { kind: "choice"; optionIds: string[] }
  | { kind: "scale"; value: number }
  | { kind: "words"; words: string[] };

export type SessionStatus = "open" | "closed";

export interface Participant {
  id: string;
  name: string;
}

/**
 * The append-only log entries that drive a live session. The transport channel
 * is already scoped to one join code, so events don't repeat it.
 */
export type SessionEvent =
  | { type: "session-opened"; deck: Deck; at: number }
  | { type: "question-activated"; index: number | null; at: number }
  | { type: "results-revealed"; questionId: string; at: number }
  | { type: "participant-joined"; participant: Participant; at: number }
  | {
      type: "answer-submitted";
      participantId: string;
      questionId: string;
      value: AnswerValue;
      at: number;
    }
  | { type: "session-closed"; at: number };

/** The reduced snapshot of a session, derived from its event log. */
export interface SessionState {
  deck: Deck | null;
  status: SessionStatus;
  /** Index into `deck.questions`, or `null` while on the lobby/standby screen. */
  activeQuestionIndex: number | null;
  /** questionId → whether the presenter has revealed its results. */
  revealed: Record<string, boolean>;
  /** participantId → participant. */
  participants: Record<string, Participant>;
  /** questionId → participantId → their (last) answer. */
  answers: Record<string, Record<string, AnswerValue>>;
}
