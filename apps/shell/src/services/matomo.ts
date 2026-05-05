import type { MatomoConfig } from "@workspace/ui-config";

type MatomoCommand = [string, ...unknown[]] | [() => void];

declare global {
  interface Window {
    _paq?: MatomoCommand[];
  }
}

interface EffectiveMatomoConfig {
  key: string;
  siteId: string | number;
  scriptUrl: string;
  trackerUrl: string;
  trackPageViews: boolean;
  enableLinkTracking: boolean;
  enableHeartBeatTimer: boolean | number | undefined;
  disableCookies: boolean;
  requireConsent: boolean;
  requireCookieConsent: boolean;
  includeSearch: boolean;
}

interface TrackPageViewOptions {
  href: string;
  previousHref?: string | undefined;
  title: string;
}

const MATOMO_SCRIPT_SELECTOR = "script[data-management-ui-matomo]";

let initializedKey: string | undefined;
let lastTrackedPageKey: string | undefined;

const hasWindow = (): boolean => typeof window !== "undefined" && typeof document !== "undefined";

const withTrailingSlash = (url: string): string => (url.endsWith("/") ? url : `${url}/`);

const getQueue = (): MatomoCommand[] => {
  window._paq = window._paq || [];
  return window._paq;
};

const resolveUrl = (url: string): string => {
  try {
    return new URL(url, document.baseURI).toString();
  } catch {
    return url;
  }
};

const normalizeMatomoConfig = (config?: MatomoConfig): EffectiveMatomoConfig | undefined => {
  if (!config?.enabled || !config.url || config.siteId === undefined || config.siteId === "") {
    return undefined;
  }

  const baseUrl = withTrailingSlash(config.url);
  const scriptUrl = config.scriptUrl ?? `${baseUrl}matomo.js`;
  const trackerUrl = config.trackerUrl ?? `${baseUrl}matomo.php`;
  const key = `${resolveUrl(scriptUrl)}|${resolveUrl(trackerUrl)}|${String(config.siteId)}`;

  return {
    key,
    siteId: config.siteId,
    scriptUrl,
    trackerUrl,
    trackPageViews: config.trackPageViews ?? true,
    enableLinkTracking: config.enableLinkTracking ?? true,
    enableHeartBeatTimer: config.enableHeartBeatTimer,
    disableCookies: config.disableCookies ?? false,
    requireConsent: config.requireConsent ?? false,
    requireCookieConsent: config.requireCookieConsent ?? false,
    includeSearch: config.includeSearch ?? true,
  };
};

const loadMatomoScript = (scriptUrl: string): void => {
  const resolvedScriptUrl = resolveUrl(scriptUrl);
  const existingScript = document.querySelector<HTMLScriptElement>(MATOMO_SCRIPT_SELECTOR);

  if (existingScript?.src === resolvedScriptUrl) return;
  existingScript?.remove();

  const script = document.createElement("script");
  script.async = true;
  script.src = scriptUrl;
  script.dataset["managementUiMatomo"] = "true";
  document.head.appendChild(script);
};

const stripSearch = (href: string): string => {
  try {
    const url = new URL(href, window.location.origin);
    url.search = "";
    return url.toString();
  } catch {
    return href;
  }
};

const getTrackedUrl = (href: string, includeSearch: boolean): string => {
  return includeSearch ? href : stripSearch(href);
};

export const initializeMatomo = (config?: MatomoConfig): void => {
  if (!hasWindow()) return;

  const matomo = normalizeMatomoConfig(config);
  if (!matomo || initializedKey === matomo.key) return;

  const paq = getQueue();

  if (matomo.disableCookies) paq.push(["disableCookies"]);
  if (matomo.requireConsent) paq.push(["requireConsent"]);
  if (matomo.requireCookieConsent) paq.push(["requireCookieConsent"]);
  if (matomo.enableHeartBeatTimer !== undefined && matomo.enableHeartBeatTimer !== false) {
    if (typeof matomo.enableHeartBeatTimer === "number") {
      paq.push(["enableHeartBeatTimer", matomo.enableHeartBeatTimer]);
    } else {
      paq.push(["enableHeartBeatTimer"]);
    }
  }

  paq.push(["setTrackerUrl", matomo.trackerUrl]);
  paq.push(["setSiteId", matomo.siteId]);
  if (matomo.enableLinkTracking) paq.push(["enableLinkTracking"]);

  loadMatomoScript(matomo.scriptUrl);
  initializedKey = matomo.key;
  lastTrackedPageKey = undefined;
};

export const trackMatomoPageView = (
  config: MatomoConfig | undefined,
  options: TrackPageViewOptions,
): void => {
  if (!hasWindow()) return;

  const matomo = normalizeMatomoConfig(config);
  if (!matomo?.trackPageViews) return;

  const href = getTrackedUrl(options.href, matomo.includeSearch);
  const previousHref = options.previousHref
    ? getTrackedUrl(options.previousHref, matomo.includeSearch)
    : undefined;
  const pageKey = `${matomo.key}|${href}|${options.title}`;

  if (lastTrackedPageKey === pageKey) return;

  const paq = getQueue();
  if (previousHref && previousHref !== href) {
    paq.push(["setReferrerUrl", previousHref]);
  }
  paq.push(["setCustomUrl", href]);
  paq.push(["setDocumentTitle", options.title]);
  paq.push(["trackPageView"]);

  lastTrackedPageKey = pageKey;
};
