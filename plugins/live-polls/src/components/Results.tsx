import { Check } from "lucide-react";

import { useTranslation } from "@oc-mui/i18n";
import { cn } from "@oc-mui/ui/lib";

import { tallyChoice, tallyScale, tallyWords } from "../transport/aggregate";

import type { AnswerValue, ChoiceQuestion, Question, ScaleQuestion } from "../types";

interface ResultsProps {
  question: Question;
  answers: Record<string, AnswerValue> | undefined;
  /** Reveal correct answers (quiz) once the presenter has shown results. */
  revealed: boolean;
}

/** Live, type-specific visualisation of the responses to one question. */
export function Results({ question, answers, revealed }: ResultsProps) {
  switch (question.type) {
    case "single":
    case "multiple":
    case "quiz":
      return <BarResults question={question} answers={answers} revealed={revealed} />;
    case "scale":
      return <ScaleResults question={question} answers={answers} />;
    case "wordcloud":
      return <WordCloudResults answers={answers} />;
  }
}

function EmptyResults() {
  const { t } = useTranslation("live-polls");
  return (
    <p className="py-8 text-center text-sm text-muted-foreground">{t("results.noResponses")}</p>
  );
}

function BarResults({
  question,
  answers,
  revealed,
}: {
  question: ChoiceQuestion;
  answers: Record<string, AnswerValue> | undefined;
  revealed: boolean;
}) {
  const { t } = useTranslation("live-polls");
  const { entries, total, max } = tallyChoice(question, answers);
  if (total === 0) return <EmptyResults />;

  return (
    <ul className="flex flex-col gap-3">
      {entries.map((entry) => {
        const widthPct = max === 0 ? 0 : Math.round((entry.count / max) * 100);
        const sharePct = total === 0 ? 0 : Math.round((entry.count / total) * 100);
        const isCorrect = revealed && entry.isCorrect === true;
        const isWrongRevealed =
          revealed && question.type === "quiz" && entry.isCorrect === false;
        return (
          <li key={entry.optionId}>
            <div className="mb-1 flex items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-1.5 font-medium">
                {isCorrect && <Check className="size-4 text-ok" aria-hidden="true" />}
                {entry.text || "—"}
              </span>
              <span className="tabular-nums text-muted-foreground">
                {sharePct}% · {t("results.votes", { count: entry.count })}
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-[width] duration-500 ease-out",
                  isCorrect ? "bg-ok" : isWrongRevealed ? "bg-primary/30" : "bg-primary",
                )}
                style={{ width: `${widthPct}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function ScaleResults({
  question,
  answers,
}: {
  question: ScaleQuestion;
  answers: Record<string, AnswerValue> | undefined;
}) {
  const { t } = useTranslation("live-polls");
  const { buckets, total, average, max } = tallyScale(question, answers);
  if (total === 0) return <EmptyResults />;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex h-40 items-end justify-between gap-2">
        {buckets.map((bucket) => {
          const heightPct = max === 0 ? 0 : Math.round((bucket.count / max) * 100);
          return (
            <div key={bucket.value} className="flex flex-1 flex-col items-center gap-2">
              <span className="text-xs tabular-nums text-muted-foreground">{bucket.count}</span>
              <div className="flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-t-md bg-primary transition-[height] duration-500 ease-out"
                  style={{ height: `${heightPct}%` }}
                />
              </div>
              <span className="text-sm font-medium tabular-nums">{bucket.value}</span>
            </div>
          );
        })}
      </div>
      {(question.minLabel || question.maxLabel) && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{question.minLabel}</span>
          <span>{question.maxLabel}</span>
        </div>
      )}
      {average !== null && (
        <p className="text-sm text-muted-foreground">
          {t("present.average", { value: average.toFixed(1) })}
        </p>
      )}
    </div>
  );
}

function WordCloudResults({ answers }: { answers: Record<string, AnswerValue> | undefined }) {
  const { t } = useTranslation("live-polls");
  const { entries, total, max } = tallyWords(answers);
  if (total === 0) return <EmptyResults />;

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 py-6">
      {entries.map((entry) => {
        const scale = max === 0 ? 1 : entry.count / max;
        const fontSize = 0.95 + scale * 1.9;
        const opacity = 0.55 + scale * 0.45;
        return (
          <span
            key={entry.word}
            className="font-semibold leading-none text-primary"
            style={{ fontSize: `${fontSize}rem`, opacity }}
            title={t("results.votes", { count: entry.count })}
          >
            {entry.word}
          </span>
        );
      })}
    </div>
  );
}
