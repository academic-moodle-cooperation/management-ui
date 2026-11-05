import { Compass, LibraryBig, Search, Store } from "lucide-react";
import { useEffect, useState } from "react";

import { Input } from "@oc-mui/ui/components";

import { TrialBanner } from "../components/TrialBanner";
import { useCatalog } from "../hooks/useCatalog";
import { useInventory } from "../hooks/useInventory";
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
 * The marketplace page: one route, two tabs (the V4 structure), one header
 * line — wordmark, Explore · Library (with the active count and an
 * attention dot for registry updates), and the search on the right.
 * The active tab lives in the URL hash so it survives reloads and can be linked.
 */
const Marketplace: FC = () => {
  const [tab, setTab] = useState<Tab>(tabFromHash);
  const [query, setQuery] = useState("");
  const catalog = useCatalog();
  const inventory = useInventory(catalog.plugins);
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

  const libraryCount = inventory.items.filter((i) => i.status === "active" && i.origin !== "shell").length;
  const libraryAttention = inventory.items.some((i) => i.registryNewer !== undefined);

  return (
    <div className="min-h-full bg-background text-foreground">
      <div className="border-b border-border">
        <div className="mx-auto flex h-[58px] max-w-[1180px] items-center gap-5 px-8">
          <div className="flex items-center gap-2.5 text-[15px] font-semibold tracking-tight">
            <span className="flex size-[26px] items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Store className="size-3.5" strokeWidth={2.4} />
            </span>
            Marketplace
          </div>
          <nav className="flex gap-0.5">
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
                  className={`flex items-center gap-2 rounded-md px-3.5 py-[7px] text-[13.5px] font-semibold transition-colors ${
                    active ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-card hover:text-foreground"
                  }`}
                >
                  <Icon className="size-4" />
                  {label}
                  {key === "library" && !inventory.loading && (
                    <>
                      <span className="font-mono text-[11px] font-normal text-muted-foreground">{libraryCount}</span>
                      {libraryAttention && (
                        <span className="size-[7px] rounded-full bg-primary" title="A newer version is listed in the registry" />
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </nav>
          <div className="relative ml-auto w-80 max-w-full">
            <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground/60" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (tab !== "explore") select("explore");
              }}
              placeholder="Search plugins & themes"
              className="h-[38px] rounded-md bg-card pl-9 text-[13.5px]"
            />
          </div>
        </div>
      </div>

      {(trials.length > 0 || themePreview) && (
        <div className="mx-auto max-w-[1180px] px-8 pt-5">
          <TrialBanner trials={trials} errors={trialErrors} themePreview={themePreview} />
        </div>
      )}

      {tab === "explore" ? (
        <Discover catalog={catalog} query={query} />
      ) : (
        <div className="mx-auto max-w-[1180px] px-8">
          <Library inventory={inventory} />
        </div>
      )}
    </div>
  );
};

export { Marketplace };
