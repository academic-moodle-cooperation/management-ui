import { Compass, LibraryBig, Search } from "lucide-react";
import { useEffect, useState } from "react";

import { useI18n } from "@oc-mui/i18n";
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

const LIBRARY_HASH = "#library";

/** `#library` opens the Installed tab; `#library=<namespace>` additionally focuses that row. */
function tabFromHash(): Tab {
  if (typeof window === "undefined") return "explore";
  const { hash } = window.location;
  return hash === LIBRARY_HASH || hash.startsWith(`${LIBRARY_HASH}=`) ? "library" : "explore";
}

function focusFromHash(): string | null {
  if (typeof window === "undefined") return null;
  const { hash } = window.location;
  if (!hash.startsWith(`${LIBRARY_HASH}=`)) return null;
  const raw = hash.slice(LIBRARY_HASH.length + 1);
  try {
    return decodeURIComponent(raw) || null;
  } catch {
    return null;
  }
}

/**
 * The marketplace page: one route, two tabs (the V4 structure), one header
 * line — Explore · Library as underline tabs (with the active count and an
 * attention dot for registry updates) and the search on the right. No
 * wordmark: the sidebar already says where you are.
 * The active tab lives in the URL hash so it survives reloads and can be linked;
 * `#library=<namespace>` also focuses one Installed row (the Explore pills link there).
 */
const Marketplace: FC = () => {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>(tabFromHash);
  const [focusNamespace, setFocusNamespace] = useState<string | null>(focusFromHash);
  const [query, setQuery] = useState("");
  const catalog = useCatalog();
  const inventory = useInventory(catalog.plugins);
  // Trials only change via full page reloads, so a render-time read is stable.
  const [trials] = useState(getTrials);
  const [trialErrors] = useState(getTrialErrors);
  const themePreview = useThemePreview();

  useEffect(() => {
    const onHash = (): void => {
      setTab(tabFromHash());
      setFocusNamespace(focusFromHash());
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const select = (next: Tab, focus: string | null = null): void => {
    setTab(next);
    setFocusNamespace(focus);
    const hash = next === "library" ? (focus ? `${LIBRARY_HASH}=${encodeURIComponent(focus)}` : LIBRARY_HASH) : "";
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${hash}`);
  };

  /** The Explore "Installed" pill: jump to that plugin's row. */
  const openInstalled = (namespace: string): void => select("library", namespace);

  const libraryCount = inventory.items.filter((i) => i.status === "active" && i.origin !== "shell").length;
  const libraryAttention = inventory.items.some((i) => i.registryNewer !== undefined);

  return (
    <div className="min-h-full bg-background text-foreground">
      <div className="border-b border-border">
        <div className="mx-auto flex max-w-[1180px] items-center gap-1 px-8">
          {(
            [
              { key: "explore", label: t("marketplace:header.explore"), Icon: Compass },
              { key: "library", label: t("marketplace:header.library"), Icon: LibraryBig },
            ] as const
          ).map(({ key, label, Icon }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => select(key)}
                className={`-mb-px flex items-center gap-2 border-b-2 px-3 py-3.5 text-sm transition-colors ${
                  active
                    ? "border-primary font-semibold text-foreground"
                    : "border-transparent font-medium text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="size-4" />
                {label}
                {key === "library" && !inventory.loading && (
                  <>
                    <span className="font-mono text-[11px] font-normal text-muted-foreground">{libraryCount}</span>
                    {libraryAttention && (
                      <span className="size-[7px] rounded-full bg-primary" title={t("marketplace:header.newerInRegistry")} />
                    )}
                  </>
                )}
              </button>
            );
          })}
          <div className="relative ml-auto w-80 max-w-full py-2">
            <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground/60" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (tab !== "explore") select("explore");
              }}
              placeholder={t("marketplace:header.search")}
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
        <Discover catalog={catalog} query={query} inventory={inventory} onOpenInstalled={openInstalled} />
      ) : (
        <div className="mx-auto max-w-[1180px] px-8">
          <Library inventory={inventory} focusNamespace={focusNamespace} />
        </div>
      )}
    </div>
  );
};

export { Marketplace };
