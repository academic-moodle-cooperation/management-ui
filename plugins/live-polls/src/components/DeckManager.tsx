import { Copy, Pencil, Play, Plus, Trash2, Vote } from "lucide-react";
import { useState } from "react";

import { useTranslation } from "@oc-mui/i18n";
import {
  AppHeading,
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@oc-mui/ui/components";

import type { Deck } from "../types";

interface DeckManagerProps {
  decks: Deck[];
  onNew: () => void;
  onEdit: (id: string) => void;
  onPresent: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

/** Landing view: the list of poll decks with create / edit / present actions. */
export function DeckManager({
  decks,
  onNew,
  onEdit,
  onPresent,
  onDuplicate,
  onDelete,
}: DeckManagerProps) {
  const { t } = useTranslation("live-polls");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <AppHeading heading={t("app.title")} description={t("app.subtitle")} />
        <Button onClick={onNew}>
          <Plus aria-hidden="true" />
          {t("manager.newDeck")}
        </Button>
      </div>

      {decks.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Vote className="size-10 text-muted-foreground" aria-hidden="true" />
            <div>
              <p className="font-medium">{t("manager.empty.title")}</p>
              <p className="text-sm text-muted-foreground">{t("manager.empty.body")}</p>
            </div>
            <Button onClick={onNew}>
              <Plus aria-hidden="true" />
              {t("manager.newDeck")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {decks.map((deck) => (
            <DeckCard
              key={deck.id}
              deck={deck}
              onEdit={onEdit}
              onPresent={onPresent}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DeckCard({
  deck,
  onEdit,
  onPresent,
  onDuplicate,
  onDelete,
}: Omit<DeckManagerProps, "decks" | "onNew"> & { deck: Deck }) {
  const { t } = useTranslation("live-polls");
  const [confirming, setConfirming] = useState(false);
  const count = deck.questions.length;

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="truncate">{deck.title || t("manager.newDeckTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-wrap content-start gap-2">
        <Badge variant="secondary">
          {count > 0 ? t("manager.deck.questions", { count }) : t("manager.deck.noQuestions")}
        </Badge>
        <Badge variant="outline">
          {deck.seriesId ? t("manager.deck.linkedSeries") : t("manager.deck.notLinked")}
        </Badge>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        {confirming ? (
          <>
            <span className="text-sm text-muted-foreground">{t("manager.confirmDelete")}</span>
            <div className="ml-auto flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
                {t("common.cancel")}
              </Button>
              <Button size="sm" variant="destructive" onClick={() => onDelete(deck.id)}>
                {t("common.delete")}
              </Button>
            </div>
          </>
        ) : (
          <>
            <Button size="sm" onClick={() => onPresent(deck.id)} disabled={count === 0}>
              <Play aria-hidden="true" />
              {t("manager.actions.present")}
            </Button>
            <Button size="sm" variant="outline" onClick={() => onEdit(deck.id)}>
              <Pencil aria-hidden="true" />
              {t("manager.actions.edit")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDuplicate(deck.id)}
              aria-label={t("manager.actions.duplicate")}
            >
              <Copy aria-hidden="true" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setConfirming(true)}
              aria-label={t("manager.actions.delete")}
            >
              <Trash2 aria-hidden="true" />
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
