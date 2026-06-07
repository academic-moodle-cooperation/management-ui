import { useEffect, useState } from "react";

import { useTranslation } from "@oc-mui/i18n";
import { useNavigate, useParams } from "@oc-mui/router";

import { DeckEditor } from "./components/DeckEditor";
import { DeckManager } from "./components/DeckManager";
import { ParticipantView } from "./components/ParticipantView";
import { PresenterView } from "./components/PresenterView";
import { useDecks } from "./hooks/useDecks";

import "./index.css";

const ACTIVE_DECK_KEY = "live-polls:active-deck";

/**
 * Single app component for the `/live-polls` route. The shell exposes one extra
 * URL segment as `$routeSubPath` (see DynamicRouterProvider), which selects the
 * internal view: list (default) · edit · present · join. All hooks run
 * unconditionally; only the rendered branch changes, so the component stays
 * mounted as the sub-path changes.
 */
export default function App() {
  const { t } = useTranslation("live-polls");
  const { routeSubPath } = useParams({ strict: false });
  const navigate = useNavigate();
  const { decks, create, save, remove, duplicate, get } = useDecks();

  const [activeDeckId, setActiveDeckId] = useState<string | null>(() =>
    localStorage.getItem(ACTIVE_DECK_KEY),
  );

  const activeDeck = get(activeDeckId);
  const needsDeck = routeSubPath === "edit" || routeSubPath === "present";
  const lostSelection = needsDeck && !activeDeck;

  // A hard reload of /edit or /present can arrive without a selection — bounce home.
  useEffect(() => {
    if (lostSelection) navigate({ to: `/live-polls` });
  }, [lostSelection, navigate]);

  const selectDeck = (id: string) => {
    setActiveDeckId(id);
    localStorage.setItem(ACTIVE_DECK_KEY, id);
  };
  const goHome = () => navigate({ to: `/live-polls` });

  let content: React.ReactNode;
  if (routeSubPath === "join") {
    content = <ParticipantView />;
  } else if (routeSubPath === "edit" && activeDeck) {
    content = (
      <DeckEditor
        deck={activeDeck}
        onChange={save}
        onBack={goHome}
        onPresent={() => navigate({ to: `/live-polls/present` })}
      />
    );
  } else if (routeSubPath === "present" && activeDeck) {
    content = <PresenterView deck={activeDeck} onBack={goHome} />;
  } else {
    content = (
      <DeckManager
        decks={decks}
        onNew={() => {
          const deck = create(t("manager.newDeckTitle"));
          selectDeck(deck.id);
          navigate({ to: `/live-polls/edit` });
        }}
        onEdit={(id) => {
          selectDeck(id);
          navigate({ to: `/live-polls/edit` });
        }}
        onPresent={(id) => {
          selectDeck(id);
          navigate({ to: `/live-polls/present` });
        }}
        onDuplicate={duplicate}
        onDelete={(id) => {
          remove(id);
          if (activeDeckId === id) setActiveDeckId(null);
        }}
      />
    );
  }

  return <div className="mx-auto w-full max-w-5xl p-4 md:p-6">{content}</div>;
}
