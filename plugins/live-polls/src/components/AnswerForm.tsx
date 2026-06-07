import { Check, X } from "lucide-react";
import { useState } from "react";

import { useTranslation } from "@oc-mui/i18n";
import { Button, Input } from "@oc-mui/ui/components";
import { cn } from "@oc-mui/ui/lib";

import type {
  AnswerValue,
  MultipleChoiceQuestion,
  Question,
  QuizQuestion,
  ScaleQuestion,
  SingleChoiceQuestion,
  WordCloudQuestion,
} from "../types";

interface AnswerFormProps {
  question: Question;
  current: AnswerValue | undefined;
  onSubmit: (value: AnswerValue) => void;
}

/**
 * The participant's answer control for the active question. Render with
 * `key={question.id}` so local draft state resets when the host advances.
 */
export function AnswerForm({ question, current, onSubmit }: AnswerFormProps) {
  const { t } = useTranslation("live-polls");
  const [editing, setEditing] = useState(current === undefined);

  if (!editing) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <span className="flex items-center gap-2 text-ok">
          <Check aria-hidden="true" />
          {t("join.submitted")}
        </span>
        <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
          {t("join.changeAnswer")}
        </Button>
      </div>
    );
  }

  const handleSubmit = (value: AnswerValue) => {
    onSubmit(value);
    setEditing(false);
  };

  switch (question.type) {
    case "single":
    case "quiz":
      return <SingleAnswer question={question} current={current} onSubmit={handleSubmit} />;
    case "multiple":
      return <MultiAnswer question={question} current={current} onSubmit={handleSubmit} />;
    case "scale":
      return <ScaleAnswer question={question} current={current} onSubmit={handleSubmit} />;
    case "wordcloud":
      return <WordsAnswer question={question} current={current} onSubmit={handleSubmit} />;
  }
}

interface SubProps<Q> {
  question: Q;
  current: AnswerValue | undefined;
  onSubmit: (value: AnswerValue) => void;
}

const optionButton = (active: boolean) =>
  cn(
    "rounded-lg border p-3 text-left transition-colors",
    active ? "border-primary bg-primary/10" : "border-border hover:bg-accent",
  );

function SingleAnswer({
  question,
  current,
  onSubmit,
}: SubProps<SingleChoiceQuestion | QuizQuestion>) {
  const { t } = useTranslation("live-polls");
  const [selected, setSelected] = useState<string | null>(
    current?.kind === "choice" ? (current.optionIds[0] ?? null) : null,
  );

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">{t("join.selectOne")}</p>
      <div className="grid gap-2">
        {question.options.map((option) => (
          <button
            key={option.id}
            type="button"
            className={optionButton(selected === option.id)}
            onClick={() => setSelected(option.id)}
          >
            {option.text || "—"}
          </button>
        ))}
      </div>
      <Button
        disabled={selected === null}
        onClick={() => selected !== null && onSubmit({ kind: "choice", optionIds: [selected] })}
      >
        {t("join.submit")}
      </Button>
    </div>
  );
}

function MultiAnswer({ question, current, onSubmit }: SubProps<MultipleChoiceQuestion>) {
  const { t } = useTranslation("live-polls");
  const [selected, setSelected] = useState<string[]>(
    current?.kind === "choice" ? current.optionIds : [],
  );

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">{t("join.selectMany")}</p>
      <div className="grid gap-2">
        {question.options.map((option) => (
          <button
            key={option.id}
            type="button"
            className={optionButton(selected.includes(option.id))}
            onClick={() => toggle(option.id)}
            aria-pressed={selected.includes(option.id)}
          >
            {option.text || "—"}
          </button>
        ))}
      </div>
      <Button
        disabled={selected.length === 0}
        onClick={() => onSubmit({ kind: "choice", optionIds: selected })}
      >
        {t("join.submit")}
      </Button>
    </div>
  );
}

function ScaleAnswer({ question, current, onSubmit }: SubProps<ScaleQuestion>) {
  const { t } = useTranslation("live-polls");
  const [value, setValue] = useState<number | null>(
    current?.kind === "scale" ? current.value : null,
  );

  const values: number[] = [];
  for (let v = question.min; v <= question.max; v += 1) values.push(v);

  return (
    <div className="flex flex-col gap-3">
      {(question.minLabel || question.maxLabel) && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{question.minLabel}</span>
          <span>{question.maxLabel}</span>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {values.map((candidate) => (
          <button
            key={candidate}
            type="button"
            className={cn(
              "size-12 rounded-lg border text-lg font-semibold tabular-nums transition-colors",
              value === candidate
                ? "border-primary bg-primary/10"
                : "border-border hover:bg-accent",
            )}
            onClick={() => setValue(candidate)}
          >
            {candidate}
          </button>
        ))}
      </div>
      <Button
        disabled={value === null}
        onClick={() => value !== null && onSubmit({ kind: "scale", value })}
      >
        {t("join.submit")}
      </Button>
    </div>
  );
}

function WordsAnswer({ question, current, onSubmit }: SubProps<WordCloudQuestion>) {
  const { t } = useTranslation("live-polls");
  const [words, setWords] = useState<string[]>(current?.kind === "words" ? current.words : []);
  const [input, setInput] = useState("");
  const left = question.maxWords - words.length;

  const add = () => {
    const word = input.trim();
    if (!word || left <= 0) return;
    setWords((prev) => [...prev, word]);
    setInput("");
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">{t("join.wordsLeft", { count: Math.max(0, left) })}</p>
      {words.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {words.map((word, index) => (
            <li
              key={`${word}-${index}`}
              className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm"
            >
              {word}
              <button
                type="button"
                onClick={() => setWords((prev) => prev.filter((_, i) => i !== index))}
                aria-label={t("editor.removeOption")}
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <Input
          value={input}
          placeholder={t("join.typeWord")}
          disabled={left <= 0}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add();
            }
          }}
        />
        <Button variant="outline" onClick={add} disabled={left <= 0 || input.trim() === ""}>
          {t("join.addWord")}
        </Button>
      </div>
      <Button disabled={words.length === 0} onClick={() => onSubmit({ kind: "words", words })}>
        {t("join.submit")}
      </Button>
    </div>
  );
}
