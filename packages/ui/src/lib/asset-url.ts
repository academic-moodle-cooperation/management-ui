/**
 * Resolve a possibly relative asset path against the app's base URL.
 * Keeps absolute http(s) and data: URLs unchanged.
 */
export function resolveAssetUrl(pathOrUrl?: string, fallbackRelative?: string): string {
  const candidate = pathOrUrl ?? fallbackRelative ?? "";
  if (!candidate) return "";
  if (/^(https?:)?\/\//i.test(candidate) || /^data:/i.test(candidate)) {
    return candidate;
  }
  const normalized = candidate.replace(/^\/+/, "");

  // Get base path: try import.meta.env first, then detect from DOM in browser
  let base = ((import.meta as any)?.env?.BASE_URL as string) || "/";
  if (typeof document !== 'undefined') {
    // In browser, detect base from script src if import.meta.env.BASE_URL is root
    if (base === "/" || base === "") {
      const scripts = document.querySelectorAll('script[src]');
      for (const script of Array.from(scripts)) {
        const src = script.getAttribute('src') || '';
        // Look for Vite's client script which includes the base path
        const match = src.match(/^(\/[^/]+)\/(@vite\/client|src\/)/);
        if (match) {
          base = match[1] + '/';
          break;
        }
      }
    }
  }

  const ensuredBase = base.endsWith("/") ? base : `${base}/`;
  const isDev = !!((import.meta as any)?.env?.DEV);
  // In dev, vite-plugin-static-copy serves under 'dist/' path. Align URLs accordingly.
  const needsDistPrefix = isDev && !normalized.startsWith('dist/') && (normalized.startsWith('assets/') || normalized.startsWith('locales/'));
  const withDistIfNeeded = needsDistPrefix ? `dist/${normalized}` : normalized;
  return `${ensuredBase}${withDistIfNeeded}`;
}

export function resolveFirstAssetUrl(
  candidates: Array<string | undefined>,
  fallbackRelative?: string
): string {
  const first = candidates.find(Boolean);
  return resolveAssetUrl(first, fallbackRelative);
}


