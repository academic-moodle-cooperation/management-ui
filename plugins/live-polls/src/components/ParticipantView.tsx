import { useState } from "react";


import { useTranslation } from "@oc-mui/i18n";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from "@oc-mui/ui/components";

import { livePollsConfig } from "../config";
import { useParticipant } from "../hooks/useParticipant";
import { readJoinCodeFromUrl } from "../lib/joinUrl";
import { getActiveQuestion } from "../transport/aggregate";

import { AnswerForm } from "./AnswerForm";
import { Results } from "./Results";

import type { ReactNode } from "react";

/** Audience view — open in a separate tab/window. Reads `?code=` from the URL. */
export function ParticipantView() {
  const [code, setCode] = useState(() => readJoinCodeFromUrl());
  if (!code) return <CodeEntry onSubmit={setCode} />;
  return <ParticipantSession code={code} />;
}

function CodeEntry({ onSubmit }: { onSubmit: (code: string) => void }) {
  const { t } = useTranslation("live-polls");
  const [code, setCode] = useState("");
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("join.title")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">{t("join.missingCode")}</p>
          <div className="flex gap-2">
            <Input
              value={code}
              placeholder={t("present.join.code")}
              className="font-mono tracking-widest"
              onChange={(event) => setCode(event.target.value.toUpperCase())}
            />
            <Button disabled={code.trim() === ""} onClick={() => onSubmit(code.trim().toUpperCase())}>
              {t("join.join")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ParticipantSession({ code }: { code: string }) {
  const { t } = useTranslation("live-polls");
  const { state, participantId, joined, join, submit } = useParticipant(code);
  const cfg = livePollsConfig.use();
  const allowAnonymous = cfg.allowAnonymous ?? true;

  const shell = (children: ReactNode) => (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <span>{t("join.title")}</span>
            <span className="font-mono text-base tracking-widest text-muted-foreground">{code}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );

  if (state.deck === null) {
    return shell(<p className="text-sm text-muted-foreground">{t("join.noSession", { code })}</p>);
  }
  if (state.status === "closed") {
    return shell(<p className="text-sm text-muted-foreground">{t("join.sessionClosed")}</p>);
  }
  if (!joined) {
    return shell(<JoinForm allowAnonymous={allowAnonymous} onJoin={join} />);
  }

  const question = getActiveQuestion(state);
  if (!question) {
    return shell(
      <p className="py-6 text-center text-sm text-muted-foreground">{t("join.standby")}</p>,
    );
  }

  const revealed = state.revealed[question.id] === true;
  const current = state.answers[question.id]?.[participantId];

  return shell(
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-semibold">{question.prompt || "—"}</h3>
      <AnswerForm
        key={question.id}
        question={question}
        current={current}
        onSubmit={(value) => submit(question.id, value)}
      />
      {revealed && (
        <div className="border-t border-border pt-4">
          <Results question={question} answers={state.answers[question.id]} revealed />
        </div>
      )}
    </div>,
  );
}

function JoinForm({
  allowAnonymous,
  onJoin,
}: {
  allowAnonymous: boolean;
  onJoin: (name: string) => void;
}) {
  const { t } = useTranslation("live-polls");
  const [name, setName] = useState("");

  return (
    <div className="flex flex-col gap-3">
      <Label htmlFor="join-name">{t("join.enterName")}</Label>
      <Input
        id="join-name"
        value={name}
        placeholder={t("join.namePlaceholder")}
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && name.trim() !== "") onJoin(name.trim());
        }}
      />
      <div className="flex gap-2">
        <Button disabled={name.trim() === ""} onClick={() => onJoin(name.trim())}>
          {t("join.join")}
        </Button>
        {allowAnonymous && (
          <Button variant="outline" onClick={() => onJoin("")}>
            {t("join.anonymous")}
          </Button>
        )}
      </div>
    </div>
  );
}
