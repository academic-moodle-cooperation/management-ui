import { ArrowLeft, ArrowRight, Eye, Flag, Play, Users } from "lucide-react";

import { useTranslation } from "@oc-mui/i18n";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@oc-mui/ui/components";

import { useSession } from "../hooks/useSession";
import { responseCount } from "../transport/aggregate";

import { JoinCode } from "./JoinCode";
import { Leaderboard } from "./Leaderboard";
import { Results } from "./Results";

import type { Deck } from "../types";

interface PresenterViewProps {
  deck: Deck;
  onBack: () => void;
}

/** The host's live control + projection screen for a running session. */
export function PresenterView({ deck, onBack }: PresenterViewProps) {
  const { t } = useTranslation("live-polls");
  const { code, state, setActiveQuestion, reveal, close } = useSession(deck);

  const total = deck.questions.length;
  const index = state.activeQuestionIndex;
  const participantCount = Object.keys(state.participants).length;
  const hasQuiz = deck.questions.some((question) => question.type === "quiz");

  const header = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft aria-hidden="true" />
        {t("editor.back")}
      </Button>
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="gap-1">
          <Users className="size-3.5" aria-hidden="true" />
          {t("present.participants", { count: participantCount })}
        </Badge>
        <Badge variant="outline" className="font-mono tracking-widest">
          {code}
        </Badge>
      </div>
    </div>
  );

  if (state.status === "closed") {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <Card>
          <CardHeader>
            <CardTitle>{t("present.closed")}</CardTitle>
          </CardHeader>
          {hasQuiz && (
            <CardContent>
              <Leaderboard state={state} />
            </CardContent>
          )}
        </Card>
      </div>
    );
  }

  // Lobby — waiting for the audience before the first question.
  if (index === null) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <div className="mx-auto flex w-full max-w-md flex-col items-center gap-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold">{deck.title || t("manager.newDeckTitle")}</h2>
            <p className="text-sm text-muted-foreground">{t("present.lobby.body")}</p>
          </div>
          <JoinCode code={code} />
          <Button size="lg" onClick={() => setActiveQuestion(0)} disabled={total === 0}>
            <Play aria-hidden="true" />
            {t("present.start")}
          </Button>
        </div>
      </div>
    );
  }

  const question = deck.questions[index];
  if (!question) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <p className="text-muted-foreground">{t("present.noDeck")}</p>
      </div>
    );
  }

  const revealed = state.revealed[question.id] === true;
  const responses = responseCount(state, question.id);

  return (
    <div className="flex flex-col gap-6">
      {header}

      <div className="flex flex-col gap-1">
        <span className="text-sm text-muted-foreground">
          {t("present.progress", { current: index + 1, total })}
        </span>
        <h2 className="text-2xl font-semibold">{question.prompt || "—"}</h2>
        <span className="text-sm text-muted-foreground">
          {t("present.responses", { count: responses })}
        </span>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Results question={question} answers={state.answers[question.id]} revealed={revealed} />
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => setActiveQuestion(index - 1)}
            disabled={index === 0}
          >
            <ArrowLeft aria-hidden="true" />
            {t("present.previous")}
          </Button>
          <Button
            variant="outline"
            onClick={() => setActiveQuestion(index + 1)}
            disabled={index >= total - 1}
          >
            {t("present.next")}
            <ArrowRight aria-hidden="true" />
          </Button>
          <Button onClick={() => reveal(question.id)} disabled={revealed}>
            <Eye aria-hidden="true" />
            {t("present.reveal")}
          </Button>
        </div>
        <Button variant="destructive" onClick={close}>
          <Flag aria-hidden="true" />
          {t("present.finish")}
        </Button>
      </div>

      {hasQuiz && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("present.leaderboard")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Leaderboard state={state} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
