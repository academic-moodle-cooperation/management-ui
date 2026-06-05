import { useEffect, useState } from "react";

import { useTranslation } from "@oc-mui/i18n";

import {
  Icons,
  ArrowRight,
  ChevronRight,
  Info,
  Server,
  Code2,
  Star,
  Check,
  BookOpen,
  LifeBuoy,
  Sparkles,
  Settings,
  History,
  FileText,
  AlertCircle,
} from "../icons";
import { Button, Tabs, TabsList, TabsTrigger } from "../ui";

import type { LucideIcon } from "../icons";
import type { CSSProperties, FC, ReactNode } from "react";

/**
 * Default landing page — the pre-login front door of a Management UI instance.
 *
 * Three audience tabs (About · Operations · Developers), each with its own
 * layout: About is the centered launch masthead, Operations is editorial/left,
 * Developers is a split with a mock terminal. Everything uses semantic theme
 * tokens, so the palette follows whatever theme is active. Copy lives under the
 * `landing.*` i18n keys; terminal commands are intentionally untranslated.
 */

// Injected at build time via Vite `define` (see apps/shell/vite.config.ts).
// Declared here so this package type-checks/tests on its own; the `typeof`
// guard degrades to the current 1.x baseline when the define is absent.
declare const __APP_VERSION__: string;
const APP_VERSION = typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "1.0.0";

// External destinations. Adjust REPO_URL / DOCS_URL if the canonical homes move.
const REPO_URL = "https://github.com/academic-moodle-cooperation/management-tool";
const REPO_BLOB = `${REPO_URL}/blob/release/oss-1.0`;
const GITHUB_REPO = "academic-moodle-cooperation/management-tool"; // owner/repo for the Releases API
const REPO_ORG = "academic-moodle-cooperation";
const REPO_NAME = "management-tool";
const DOCS_URL = "https://eduardklinger.github.io/management-ui";
const CLONE_LABEL = "github.com/academic-moodle-cooperation/management-tool";

// The landing wears its own brand skin regardless of the active app theme — an
// indigo accent plus self-hosted Geist / Geist Mono (defined in globals.css).
// Scoped via CSS-var overrides so every `text-primary` / `bg-primary` /
// `font-heading` / `font-mono` inside the section follows it.
const landingStyle = {
  "--primary": "oklch(0.55 0.215 280)",
  "--primary-foreground": "oklch(0.99 0.005 285)",
  "--info": "oklch(0.55 0.215 280)",
  "--font-sans": '"Geist", ui-sans-serif, system-ui, sans-serif',
  "--font-heading": '"Geist", ui-sans-serif, system-ui, sans-serif',
  "--font-mono": '"Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
  fontFamily: "var(--font-sans)",
} as CSSProperties;

// --- Live update check (GitHub Releases) ------------------------------------
const UPDATE_CACHE_KEY = "mui:update-check";
const UPDATE_TTL_MS = 12 * 60 * 60 * 1000; // re-check at most ~twice a day per browser

const stripV = (v: string): string => v.replace(/^v/i, "").trim();

const partsOf = (v: string): number[] =>
  (stripV(v).split("-")[0] ?? "").split(".").map((n) => parseInt(n, 10) || 0);

/** Returns >0 if `a` is newer than `b`, <0 if older, 0 if equal. Pre-release suffixes ignored. */
const compareSemver = (a: string, b: string): number => {
  const pa = partsOf(a);
  const pb = partsOf(b);
  for (let i = 0; i < 3; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
};

type UpdateState = { tag: string | null; isNewer: boolean };

const readCachedTag = (): string | null | undefined => {
  try {
    const raw = localStorage.getItem(UPDATE_CACHE_KEY);
    if (!raw) return undefined;
    const cached = JSON.parse(raw) as { ts?: number; tag?: string | null };
    if (typeof cached.ts === "number" && Date.now() - cached.ts < UPDATE_TTL_MS) {
      return cached.tag ?? null;
    }
  } catch {
    /* malformed cache — fall through and refetch */
  }
  return undefined;
};

const writeCachedTag = (tag: string | null): void => {
  try {
    localStorage.setItem(UPDATE_CACHE_KEY, JSON.stringify({ ts: Date.now(), tag }));
  } catch {
    /* storage unavailable (e.g. private mode) — ignore */
  }
};

/**
 * Checks GitHub for a newer release than the running build, cached in
 * localStorage (TTL above) so a browser makes ~one request per day regardless
 * of reloads — well under GitHub's 60/hr unauthenticated limit. Any error
 * (offline, 403 rate limit, 404 no releases) is swallowed; the result only
 * upgrades the "what's new" badge and never surfaces an error.
 */
const useUpdateCheck = (currentVersion: string): UpdateState => {
  const [state, setState] = useState<UpdateState>({ tag: null, isNewer: false });

  useEffect(() => {
    let cancelled = false;

    const apply = (tag: string | null): void => {
      if (cancelled || !tag) return;
      setState({ tag, isNewer: compareSemver(tag, currentVersion) > 0 });
    };

    const cached = readCachedTag();
    if (cached !== undefined) {
      apply(cached);
      return;
    }

    void (async () => {
      try {
        const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
          headers: { Accept: "application/vnd.github+json" },
        });
        if (!res.ok) {
          writeCachedTag(null); // cache the miss so a 403/404 doesn't refetch on every load
          return;
        }
        const data = (await res.json()) as { tag_name?: string };
        const tag = typeof data.tag_name === "string" ? data.tag_name : null;
        writeCachedTag(tag);
        apply(tag);
      } catch {
        /* network/parse error — stay silent */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentVersion]);

  return state;
};

// --- Small presentational pieces --------------------------------------------

const Eyebrow: FC<{ children: ReactNode }> = ({ children }) => (
  <span className="inline-flex items-center gap-3 font-mono text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground before:h-px before:w-6 before:bg-primary before:content-['']">
    {children}
  </span>
);

const HelpLink: FC<{ href: string; icon: LucideIcon; label: string }> = ({
  href,
  icon: Icon,
  label,
}) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="group inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
  >
    <Icon className="size-[15px] opacity-70" />
    {label}
    <ArrowRight className="size-3 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-60" />
  </a>
);

const PrimaryCta: FC<{ href: string; label: string }> = ({ href, label }) => (
  <Button asChild size="lg" className="gap-2 px-5 font-semibold">
    <a href={href} target="_blank" rel="noopener noreferrer">
      {label}
      <ArrowRight className="size-4" />
    </a>
  </Button>
);

const OutlineCta: FC<{ href: string; label: string; icon?: ReactNode }> = ({
  href,
  label,
  icon,
}) => (
  <Button asChild variant="outline" size="lg" className="gap-2 px-5 font-semibold">
    <a href={href} target="_blank" rel="noopener noreferrer">
      {icon}
      {label}
    </a>
  </Button>
);

// shields.io-style badge for the project identity bar (key | value).
const Shield: FC<{ label: string; value: string; ok?: boolean }> = ({ label, value, ok }) => (
  <span className="inline-flex overflow-hidden rounded-md border font-mono text-[11px] font-semibold">
    <span className="bg-muted px-2 py-1 text-muted-foreground">{label}</span>
    <span
      className={
        ok ? "bg-ok px-2 py-1 text-ok-foreground" : "bg-primary px-2 py-1 text-primary-foreground"
      }
    >
      {value}
    </span>
  </span>
);

const pill =
  "inline-flex items-center gap-2 rounded-md border bg-card px-3 py-1.5 text-[12.5px] text-foreground shadow-sm transition-colors hover:bg-muted";

const TAB_TRIGGER =
  "gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-semibold text-muted-foreground data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm";

// All panels share one grid cell (constant height = tallest panel, so the tab
// bar never shifts). Visibility is driven by our own state — not Radix's
// Presence — so the swap is instant in a single commit, with no exit-frame
// overlap between the outgoing and incoming panel.
const panelClass = (active: boolean): string =>
  `col-start-1 row-start-1 flex flex-col justify-center outline-none${
    active ? "" : " invisible pointer-events-none"
  }`;

const DefaultLandingPage: FC = () => {
  const { t } = useTranslation();
  const update = useUpdateCheck(APP_VERSION);
  const [tab, setTab] = useState("about");

  const hasUpdate = update.isNewer && !!update.tag;
  const badgeText = hasUpdate
    ? `v${stripV(update.tag as string)} — ${t("landing.about.links.whatsNew")}`
    : `v${APP_VERSION} — ${t("landing.about.badgeFrozen")}`;
  const badgeHref = hasUpdate ? `${REPO_URL}/releases/tag/${update.tag}` : `${REPO_URL}/releases`;

  const metaPills: { label?: string; value: string }[] = [
    { value: `v${APP_VERSION}` },
    { label: "Manifest", value: "1.1" },
    { label: "Runtime API", value: "1.0" },
    { label: "Theme", value: "2.0" },
    { label: "Config", value: "1.0" },
    { label: "ECL", value: "2.0" },
  ];

  return (
    <section
      style={landingStyle}
      className="relative mx-auto flex min-h-full w-full max-w-[1040px] flex-col px-6 py-10 md:px-10"
    >
      {/* Soft primary glow behind the masthead */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[360px]"
        style={{
          background:
            "radial-gradient(58% 100% at 50% -8%, color-mix(in oklab, var(--primary) 13%, transparent), transparent 72%)",
        }}
      />

      {/* Subtle, persistent "Star on GitHub" in the top corner */}
      <a
        href={REPO_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute right-4 top-4 z-10 hidden items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:inline-flex"
      >
        <Star className="size-3.5" />
        {t("landing.starOnGithub")}
      </a>

      <Tabs value={tab} onValueChange={setTab} className="relative my-auto w-full">
        {/* Centered audience tabs on top */}
        <div className="flex justify-center">
          <TabsList className="h-auto gap-1 rounded-lg border bg-muted p-1">
            <TabsTrigger value="about" className={TAB_TRIGGER}>
              <Info className="size-3.5" />
              {t("landing.tabs.about")}
            </TabsTrigger>
            <TabsTrigger value="operations" className={TAB_TRIGGER}>
              <Server className="size-3.5" />
              {t("landing.tabs.operations")}
            </TabsTrigger>
            <TabsTrigger value="developers" className={TAB_TRIGGER}>
              <Code2 className="size-3.5" />
              {t("landing.tabs.developers")}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Panels share one grid cell, so the container is always as tall as the
            tallest panel. The centered block never shifts when switching tabs —
            at any viewport width. Inactive panels stay laid out but invisible. */}
        <div className="mt-7 grid">
          {/* ============ ABOUT — centered launch ============ */}
          <div role="tabpanel" aria-hidden={tab !== "about"} className={panelClass(tab === "about")}>
          <div className="mx-auto max-w-[760px] text-center">
            <a
              href={badgeHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 rounded-full border bg-card px-1.5 py-1 text-[13px] text-muted-foreground shadow-sm transition-colors hover:text-foreground"
            >
              <b className="rounded-full bg-primary px-2.5 py-[3px] text-[11.5px] font-bold text-primary-foreground">
                {t("landing.about.badgeNew")}
              </b>
              <span className="flex items-center gap-1.5 whitespace-nowrap pr-2">
                {badgeText}
                <ChevronRight className="size-3" />
              </span>
            </a>

            <h1 className="mt-6 font-heading text-5xl font-extrabold leading-[0.98] tracking-tight md:text-7xl">
              Management{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(100deg, var(--primary), color-mix(in oklab, var(--primary) 35%, var(--foreground)))",
                }}
              >
                UI
              </span>
            </h1>

            <p className="mt-6 text-xl font-semibold text-foreground md:text-2xl">
              {t("landing.about.lead")}
            </p>
            <p className="mx-auto mt-3.5 max-w-[56ch] text-base leading-relaxed text-muted-foreground md:text-[16.5px]">
              {t("landing.about.tagline")}
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <PrimaryCta
                href={`${DOCS_URL}/getting-started/what-is-management-ui`}
                label={t("landing.getStarted")}
              />
              <OutlineCta
                href={REPO_URL}
                label={t("landing.viewOnGithub")}
                icon={<Icons.gitHub className="size-4" />}
              />
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
              {[
                t("landing.about.checks.pluginFirst"),
                t("landing.about.checks.frozenContracts"),
                t("landing.about.checks.semanticTheming"),
              ].map((label, i) => (
                <span key={label} className="flex items-center gap-2">
                  {i > 0 && <span className="h-3 w-px bg-border" />}
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Check className="size-3.5 text-ok" />
                    {label}
                  </span>
                </span>
              ))}
            </div>

            <div className="mt-9 flex flex-wrap justify-center gap-1">
              <HelpLink
                href={`${DOCS_URL}/`}
                icon={BookOpen}
                label={t("landing.about.links.docs")}
              />
              <HelpLink
                href={`${REPO_URL}/discussions`}
                icon={LifeBuoy}
                label={t("landing.about.links.help")}
              />
              <HelpLink
                href={`${REPO_URL}/releases`}
                icon={Sparkles}
                label={t("landing.about.links.whatsNew")}
              />
            </div>
          </div>
          </div>

        {/* ============ OPERATIONS — editorial / left ============ */}
          <div role="tabpanel" aria-hidden={tab !== "operations"} className={panelClass(tab === "operations")}>
          <div className="max-w-[760px]">
            <Eyebrow>{t("landing.operations.eyebrow")}</Eyebrow>
            <h1 className="mt-6 max-w-[15ch] font-heading text-4xl font-extrabold leading-[1.04] tracking-tight md:text-5xl">
              {t("landing.operations.headline")}{" "}
              <span className="text-primary">{t("landing.operations.headlineEm")}</span>
            </h1>
            <p className="mt-6 max-w-[58ch] text-lg leading-relaxed text-muted-foreground md:text-[19px]">
              {t("landing.operations.tagline")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <PrimaryCta
                href={`${DOCS_URL}/getting-started/installation`}
                label={t("landing.getStarted")}
              />
              <OutlineCta href={`${DOCS_URL}/`} label={t("landing.operations.readDocs")} />
            </div>

            <div className="my-9 h-px bg-border" />

            <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              {t("landing.operations.resources")}
            </div>
            <div className="flex flex-wrap items-center gap-1">
              <HelpLink
                href={`${DOCS_URL}/`}
                icon={BookOpen}
                label={t("landing.operations.links.docs")}
              />
              <HelpLink
                href={`${DOCS_URL}/getting-started/configuration`}
                icon={Settings}
                label={t("landing.operations.links.config")}
              />
              <HelpLink
                href={`${REPO_URL}/releases`}
                icon={History}
                label={t("landing.operations.links.changelog")}
              />
            </div>

            <div className="mt-7 flex flex-wrap gap-2">
              {metaPills.map((p) => (
                <span
                  key={p.label ?? p.value}
                  className="rounded-full border bg-card px-3 py-1 font-mono text-[11.5px] text-muted-foreground"
                >
                  {p.label ? `${p.label} ` : ""}
                  <b className="font-semibold text-foreground">{p.value}</b>
                </span>
              ))}
            </div>
          </div>
          </div>

        {/* ============ DEVELOPERS — split with terminal ============ */}
          <div role="tabpanel" aria-hidden={tab !== "developers"} className={panelClass(tab === "developers")}>
          <div className="max-w-[940px]">
            <div className="grid items-center gap-8 md:grid-cols-[1fr_1.08fr] md:gap-10">
              <div className="flex flex-col items-start">
                <Eyebrow>{t("landing.developers.eyebrow")}</Eyebrow>
                <h1 className="mt-5 max-w-[18ch] font-heading text-3xl font-extrabold leading-[1.08] tracking-tight md:text-[40px]">
                  {t("landing.developers.headline")}
                </h1>
                <p className="mt-5 max-w-[60ch] text-base leading-relaxed text-muted-foreground md:text-[16.5px]">
                  {t("landing.developers.tagline")}
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <PrimaryCta
                    href={`${DOCS_URL}/plugins/creating-a-plugin`}
                    label={t("landing.getStarted")}
                  />
                  <OutlineCta
                    href={`${REPO_BLOB}/CONTRIBUTING.md`}
                    label={t("landing.developers.contribute")}
                    icon={<Code2 className="size-4" />}
                  />
                </div>
              </div>

              {/* Mock terminal */}
              <div className="overflow-hidden rounded-xl border bg-card shadow-md">
                <div className="flex items-center gap-2 border-b bg-muted px-3.5 py-3">
                  <span className="size-[11px] rounded-full bg-[#ef5f56]" />
                  <span className="size-[11px] rounded-full bg-[#f5bd4f]" />
                  <span className="size-[11px] rounded-full bg-[#61c554]" />
                  <span className="ml-2 font-mono text-xs text-muted-foreground">
                    management-ui — zsh
                  </span>
                </div>
                <div className="px-5 py-4 font-mono text-[13px] leading-[1.95] text-foreground">
                  <div>
                    <span className="font-semibold text-primary">$</span> git clone{" "}
                    <span className="text-info underline underline-offset-2">{CLONE_LABEL}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-primary">$</span> pnpm install
                  </div>
                  <div>
                    <span className="font-semibold text-primary">$</span> pnpm create-plugin{" "}
                    <span className="text-info">my-plugin</span>
                  </div>
                  <div>
                    <span className="text-ok">✔</span>{" "}
                    <span className="text-muted-foreground">
                      Scaffolded .local-plugins/my-plugin
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-primary">$</span> pnpm dev
                  </div>
                  <div>
                    <span className="text-muted-foreground">➜ Local:</span>{" "}
                    <span className="text-info underline underline-offset-2">
                      http://127.0.0.1:3000/management-ui/
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-primary">$</span>
                    <span className="ml-1.5 inline-block h-[15px] w-2 animate-pulse bg-primary align-[-3px]" />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-9 space-y-4 border-t pt-5">
              <div className="flex flex-wrap items-center gap-1">
                <HelpLink
                  href={`${DOCS_URL}/`}
                  icon={BookOpen}
                  label={t("landing.developers.links.docs")}
                />
                <HelpLink
                  href={`${REPO_BLOB}/CONTRIBUTING.md`}
                  icon={FileText}
                  label={t("landing.developers.links.contributing")}
                />
                <HelpLink
                  href={`${REPO_URL}/issues`}
                  icon={AlertCircle}
                  label={t("landing.developers.links.openIssue")}
                />
              </div>

              {/* Project identity bar */}
              <div className="flex flex-wrap items-center gap-2.5">
                <a
                  href={REPO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${pill} font-mono`}
                >
                  <Icons.gitHub className="size-[15px]" />
                  {REPO_ORG}
                  <span className="text-muted-foreground">/</span>
                  {REPO_NAME}
                </a>
                <Shield label="release" value={`v${APP_VERSION}`} />
                <Shield label="license" value="ECL-2.0" />
                <Shield label="contributions" value="welcome" ok />
              </div>
            </div>
          </div>
          </div>
        </div>
      </Tabs>
    </section>
  );
};

export { DefaultLandingPage };
