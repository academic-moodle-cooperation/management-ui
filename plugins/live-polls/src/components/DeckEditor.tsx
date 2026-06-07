import { ArrowLeft, Play, Plus } from "lucide-react";

import { useTranslation } from "@oc-mui/i18n";
import { OrderDirection, useMuiGetMySeriesNameAndIdQuery } from "@oc-mui/query";
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

import { livePollsConfig } from "../config";
import { newQuestion } from "../storage/deckStore";

import { QuestionEditor } from "./QuestionEditor";

import type { Deck, Question, QuestionType } from "../types";

const NO_SERIES = "__none__";

interface DeckEditorProps {
  deck: Deck;
  onChange: (deck: Deck) => void;
  onBack: () => void;
  onPresent: () => void;
}

/** Authoring view: edit deck metadata and its question list. */
export function DeckEditor({ deck, onChange, onBack, onPresent }: DeckEditorProps) {
  const { t } = useTranslation("live-polls");
  const cfg = livePollsConfig.use();
  const maxOptions = cfg.maxOptions ?? 8;
  const defaultType: QuestionType = cfg.defaultQuestionType ?? "single";

  // Optional Opencast integration: list the user's series so a deck can be
  // grouped under a course. Degrades gracefully to "not linked" with no backend.
  const { data: seriesData } = useMuiGetMySeriesNameAndIdQuery({
    orderBy: { title: OrderDirection.Asc },
  });
  const seriesList = (seriesData?.currentUser.mySeries.nodes ?? []).filter(
    (series): series is { id: string; title: string } => Boolean(series),
  );

  const setQuestions = (questions: Question[]) => onChange({ ...deck, questions });
  const updateQuestion = (id: string, next: Question) =>
    setQuestions(deck.questions.map((question) => (question.id === id ? next : question)));
  const changeType = (id: string, type: QuestionType) =>
    setQuestions(
      deck.questions.map((question) =>
        question.id === id
          ? { ...newQuestion(type), id: question.id, prompt: question.prompt }
          : question,
      ),
    );
  const removeQuestion = (id: string) =>
    setQuestions(deck.questions.filter((question) => question.id !== id));
  const moveQuestion = (id: string, direction: -1 | 1) => {
    const index = deck.questions.findIndex((question) => question.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= deck.questions.length) return;
    const next = deck.questions.slice();
    const [moved] = next.splice(index, 1);
    if (moved) next.splice(target, 0, moved);
    setQuestions(next);
  };
  const addQuestion = () => setQuestions([...deck.questions, newQuestion(defaultType)]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft aria-hidden="true" />
          {t("editor.back")}
        </Button>
        <Button onClick={onPresent} disabled={deck.questions.length === 0}>
          <Play aria-hidden="true" />
          {t("editor.present")}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="deck-title">{t("editor.deckTitle")}</Label>
          <Input
            id="deck-title"
            value={deck.title}
            placeholder={t("editor.deckTitlePlaceholder")}
            onChange={(event) => onChange({ ...deck, title: event.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="deck-series">{t("editor.linkSeries")}</Label>
          <Select
            value={deck.seriesId ?? NO_SERIES}
            onValueChange={(value) =>
              onChange({ ...deck, seriesId: value === NO_SERIES ? null : value })
            }
          >
            <SelectTrigger id="deck-series">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_SERIES}>{t("manager.deck.notLinked")}</SelectItem>
              {seriesList.map((series) => (
                <SelectItem key={series.id} value={series.id}>
                  {series.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{t("editor.linkSeriesHint")}</p>
        </div>
        <div className="flex flex-col gap-1.5 md:col-span-2">
          <Label htmlFor="deck-description">{t("editor.deckDescription")}</Label>
          <Textarea
            id="deck-description"
            value={deck.description ?? ""}
            placeholder={t("editor.deckDescriptionPlaceholder")}
            rows={2}
            onChange={(event) => onChange({ ...deck, description: event.target.value })}
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg font-semibold">{t("editor.questions")}</h3>
        <Button variant="outline" size="sm" onClick={addQuestion}>
          <Plus aria-hidden="true" />
          {t("editor.addQuestion")}
        </Button>
      </div>

      {deck.questions.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {t("editor.noQuestions")}
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {deck.questions.map((question, index) => (
            <QuestionEditor
              key={question.id}
              question={question}
              index={index}
              total={deck.questions.length}
              maxOptions={maxOptions}
              onChange={(next) => updateQuestion(question.id, next)}
              onChangeType={(type) => changeType(question.id, type)}
              onRemove={() => removeQuestion(question.id)}
              onMove={(direction) => moveQuestion(question.id, direction)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
