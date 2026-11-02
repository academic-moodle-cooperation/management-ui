import { Compass, LibraryBig } from "lucide-react";
import { useEffect, useState } from "react";

import { TrialBanner } from "../components/TrialBanner";
import { useCatalog } from "../hooks/useCatalog";
import { useThemePreview } from "../hooks/useThemePreview";
import { getTrialErrors, getTrials } from "../services/trials";

import { Discover } from "./Discover";
import { Library } from "./Library";

import type { FC } from "react";

type Tab = "explore" | "library";

function tabFromHash(): Tab {
  return typeof window !== "undefined" && window.location.hash === "#library" ? "library" : "explore";
}

/**
 * The marketplace page: one route, two tabs (the V4 structure).
 * Explore = the showcase catalog; Library = this deployment's inventory.
 * The active tab lives in the URL hash so it survives reloads and can be linked.
 */
const Marketplace: FC = () => {
  const [tab, setTab] = useState<Tab>(tabFromHash);
  const catalog = useCatalog();
  // Trials only change via full page reloads, so a render-time read is stable.
  const [trials] = useState(getTrials);
  const [trialErrors] = useState(getTrialErrors);
  const themePreview = useThemePreview();

  useEffect(() => {
    const onHash = (): void => setTab(tabFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const select = (next: Tab): void => {
    setTab(next);
    const hash = next === "library" ? "#library" : "";
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${hash}`);
  };

  return (
    <div className="min-h-full bg-background text-foreground">
      <div className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center gap-1 px-8">
          {(
            [
              { key: "explore", label: "Explore", Icon: Compass },
              { key: "library", label: "Library", Icon: LibraryBig },
            ] as const
          ).map(({ key, label, Icon }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => select(key)}
                className={
                  active
                    ? "-mb-px flex items-center gap-2 border-b-2 border-primary px-3 py-3 text-sm font-semibold text-foreground"
                    : "-mb-px flex items-center gap-2 border-b-2 border-transparent px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                }
              >
                <Icon className="size-4" /> {label}
              </button>
            );
          })}
        </div>
      </div>

      {(trials.length > 0 || themePreview) && (
        <div className="mx-auto max-w-5xl px-8 pt-5">
          <TrialBanner trials={trials} errors={trialErrors} themePreview={themePreview} />
        </div>
      )}

      {tab === "explore" ? (
        <Discover catalog={catalog} />
      ) : (
        <div className="mx-auto max-w-5xl px-8">
          <Library catalog={catalog.plugins} />
        </div>
      )}
    </div>
  );
};

export { Marketplace };
