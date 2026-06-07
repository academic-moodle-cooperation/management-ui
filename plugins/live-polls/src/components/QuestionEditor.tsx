import { ArrowDown, ArrowUp, Check, Plus, Trash2, X } from "lucide-react";


import { useTranslation } from "@oc-mui/i18n";
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@oc-mui/ui/components";
import { cn } from "@oc-mui/ui/lib";

import { newOption } from "../storage/deckStore";

import type {
  MultipleChoiceQuestion,
  Question,
  QuestionType,
  QuizQuestion,
  ScaleQuestion,
  SingleChoiceQuestion,
  WordCloudQuestion,
} from "../types";
import type { ReactNode } from "react";

const QUESTION_TYPES: QuestionType[] = ["single", "multiple", "scale", "wordcloud", "quiz"];

interface QuestionEditorProps {
  question: Question;
  index: number;
  total: number;
  maxOptions: number;
  onChange: (question: Question) => void;
  onChangeType: (type: QuestionType) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
}

export function QuestionEditor({
  question,
  index,
  total,
  maxOptions,
  onChange,
  onChangeType,
  onRemove,
  onMove,
}: QuestionEditorProps) {
  const { t } = useTranslation("live-polls");

  return (
    <div className="rounded-lg border border-border bg-card p-4 text-card-foreground">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="grid size-7 place-items-center rounded-full bg-muted text-sm font-semibold">
          {index + 1}
        </span>
        <Select value={question.type} onValueChange={(value) => onChangeType(value as QuestionType)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {QUESTION_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {t(`questionTypes.${type}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto flex gap-1">
          <Button
            size="icon"
            variant="ghost"
            disabled={index === 0}
            onClick={() => onMove(-1)}
            aria-label={t("editor.moveUp")}
          >
            <ArrowUp aria-hidden="true" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            disabled={index === total - 1}
            onClick={() => onMove(1)}
            aria-label={t("editor.moveDown")}
          >
            <ArrowDown aria-hidden="true" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onRemove}
            aria-label={t("editor.removeQuestion")}
          >
            <Trash2 aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`prompt-${question.id}`}>{t("editor.questionPrompt")}</Label>
        <Textarea
          id={`prompt-${question.id}`}
          value={question.prompt}
          placeholder={t("editor.questionPromptPlaceholder")}
          rows={2}
          onChange={(event) => onChange({ ...question, prompt: event.target.value })}
        />
      </div>

      <div className="mt-4">
        {question.type === "quiz" ? (
          <QuizFields question={question} maxOptions={maxOptions} onChange={onChange} />
        ) : question.type === "single" || question.type === "multiple" ? (
          <PlainChoiceFields question={question} maxOptions={maxOptions} onChange={onChange} />
        ) : question.type === "scale" ? (
          <ScaleFields question={question} onChange={onChange} />
        ) : (
          <WordCloudFields question={question} onChange={onChange} />
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function OptionRow({
  text,
  placeholder,
  removeLabel,
  canRemove,
  leading,
  onTextChange,
  onRemove,
}: {
  text: string;
  placeholder: string;
  removeLabel: string;
  canRemove: boolean;
  leading?: ReactNode;
  onTextChange: (text: string) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      {leading}
      <Input
        value={text}
        placeholder={placeholder}
        onChange={(event) => onTextChange(event.target.value)}
      />
      <Button
        size="icon"
        variant="ghost"
        onClick={onRemove}
        disabled={!canRemove}
        aria-label={removeLabel}
      >
        <X aria-hidden="true" />
      </Button>
    </div>
  );
}

function PlainChoiceFields({
  question,
  maxOptions,
  onChange,
}: {
  question: SingleChoiceQuestion | MultipleChoiceQuestion;
  maxOptions: number;
  onChange: (question: Question) => void;
}) {
  const { t } = useTranslation("live-polls");
  const setText = (id: string, text: string) =>
    onChange({
      ...question,
      options: question.options.map((option) => (option.id === id ? { ...option, text } : option)),
    });
  const remove = (id: string) =>
    onChange({ ...question, options: question.options.filter((option) => option.id !== id) });
  const add = () => onChange({ ...question, options: [...question.options, newOption()] });

  return (
    <div className="flex flex-col gap-2">
      {question.options.map((option) => (
        <OptionRow
          key={option.id}
          text={option.text}
          placeholder={t("editor.optionPlaceholder")}
          removeLabel={t("editor.removeOption")}
          canRemove={question.options.length > 2}
          onTextChange={(text) => setText(option.id, text)}
          onRemove={() => remove(option.id)}
        />
      ))}
      <div>
        <Button
          size="sm"
          variant="outline"
          onClick={add}
          disabled={question.options.length >= maxOptions}
        >
          <Plus aria-hidden="true" />
          {t("editor.addOption")}
        </Button>
      </div>
    </div>
  );
}

function QuizFields({
  question,
  maxOptions,
  onChange,
}: {
  question: QuizQuestion;
  maxOptions: number;
  onChange: (question: Question) => void;
}) {
  const { t } = useTranslation("live-polls");

  const setText = (id: string, text: string) =>
    onChange({
      ...question,
      options: question.options.map((option) => (option.id === id ? { ...option, text } : option)),
    });
  const remove = (id: string) => {
    const options = question.options.filter((option) => option.id !== id);
    const correctOptionId =
      question.correctOptionId === id ? (options[0]?.id ?? "") : question.correctOptionId;
    onChange({ ...question, options, correctOptionId });
  };
  const add = () => onChange({ ...question, options: [...question.options, newOption()] });
  const setCorrect = (id: string) => onChange({ ...question, correctOptionId: id });

  return (
    <div className="flex flex-col gap-2">
      {question.options.map((option) => {
        const correct = question.correctOptionId === option.id;
        return (
          <OptionRow
            key={option.id}
            text={option.text}
            placeholder={t("editor.optionPlaceholder")}
            removeLabel={t("editor.removeOption")}
            canRemove={question.options.length > 2}
            leading={
              <Button
                size="icon"
                variant={correct ? "default" : "outline"}
                className={cn(correct && "bg-ok hover:bg-ok/90")}
                onClick={() => setCorrect(option.id)}
                aria-label={t("editor.correctAnswer")}
                aria-pressed={correct}
              >
                <Check aria-hidden="true" />
              </Button>
            }
            onTextChange={(text) => setText(option.id, text)}
            onRemove={() => remove(option.id)}
          />
        );
      })}
      <div className="flex flex-wrap items-end gap-4">
        <Button
          size="sm"
          variant="outline"
          onClick={add}
          disabled={question.options.length >= maxOptions}
        >
          <Plus aria-hidden="true" />
          {t("editor.addOption")}
        </Button>
        <div className="w-28">
          <Field label={t("editor.points")}>
            <Input
              type="number"
              min={0}
              value={question.points}
              onChange={(event) =>
                onChange({ ...question, points: Number(event.target.value) || 0 })
              }
            />
          </Field>
        </div>
      </div>
    </div>
  );
}

function ScaleFields({
  question,
  onChange,
}: {
  question: ScaleQuestion;
  onChange: (question: Question) => void;
}) {
  const { t } = useTranslation("live-polls");
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Field label={t("editor.scaleMin")}>
        <Input
          type="number"
          value={question.min}
          onChange={(event) => onChange({ ...question, min: Number(event.target.value) || 0 })}
        />
      </Field>
      <Field label={t("editor.scaleMax")}>
        <Input
          type="number"
          value={question.max}
          onChange={(event) => onChange({ ...question, max: Number(event.target.value) || 0 })}
        />
      </Field>
      <Field label={t("editor.scaleMinLabel")}>
        <Input
          value={question.minLabel ?? ""}
          onChange={(event) => onChange({ ...question, minLabel: event.target.value })}
        />
      </Field>
      <Field label={t("editor.scaleMaxLabel")}>
        <Input
          value={question.maxLabel ?? ""}
          onChange={(event) => onChange({ ...question, maxLabel: event.target.value })}
        />
      </Field>
    </div>
  );
}

function WordCloudFields({
  question,
  onChange,
}: {
  question: WordCloudQuestion;
  onChange: (question: Question) => void;
}) {
  const { t } = useTranslation("live-polls");
  return (
    <div className="w-40">
      <Field label={t("editor.maxWords")}>
        <Input
          type="number"
          min={1}
          value={question.maxWords}
          onChange={(event) =>
            onChange({ ...question, maxWords: Math.max(1, Number(event.target.value) || 1) })
          }
        />
      </Field>
    </div>
  );
}
