/**
 * Resolve a possibly relative asset path against the app's base URL.
 * Keeps absolute http(s) and data: URLs unchanged.
 *
 * This function runs in the browser and dynamically determines the base path
 * from the current script's URL or location.
 *
 * Examples:
 * - Dev:  'assets/logo.svg' -> '/management-ui/assets/logo.svg'
 * - Prod: 'assets/logo.svg' -> '/management-ui/assets/logo.svg'
 */
export function resolveAssetUrl(pathOrUrl?: string, fallbackRelative?: string): string {
  const candidate = pathOrUrl ?? fallbackRelative ?? "";
  if (!candidate) return "";

  // Return absolute URLs as-is
  if (/^(https?:)?\/\//i.test(candidate) || /^data:/i.test(candidate)) {
    return candidate;
  }

  // Remove leading slashes to normalize
  const normalized = candidate.replace(/^\/+/, "");

  // Dynamically detect base path from current script URL or location in browser
  // This works around import.meta.env not being reliably available in monorepo packages during dev
  let base = "/";

  if (typeof window !== "undefined") {
    // Method 1: Look for script tags to find the base path
    const scripts = Array.from(document.getElementsByTagName("script"));
    const appScript = scripts.find(
      (s) => s.src && (s.src.includes("/@vite/") || s.src.includes("/management-ui/")),
    );

    if (appScript && appScript.src) {
      const url = new URL(appScript.src);
      const pathname = url.pathname;

      // Extract base path (e.g., "/management-ui/" from "/management-ui/@vite/client")
      const match = pathname.match(/^(\/[^/]+\/)/);
      if (match?.[1] && match[1] !== "/src/" && match[1] !== "/@vite/") {
        base = match[1];
      }
    }

    // Method 2: Fallback to checking current location pathname
    if (base === "/" && window.location.pathname.startsWith("/management-ui")) {
      base = "/management-ui/";
    }
  }

  const ensuredBase = base.endsWith("/") ? base : `${base}/`;

  // Assets and locales are served at base + path in both dev and prod
  // (vite-plugin-static-copy and proxy/shell serve at /management-ui/assets/ etc.)
  return `${ensuredBase}${normalized}`;
}

/**
 * Picks the first non-empty candidate and resolves with base.
 * Usage: resolveFirstAssetUrl([orgLogoUrl, logoUrl], 'assets/favicon/favicon.svg')
 */
export function resolveFirstAssetUrl(
  candidates: Array<string | undefined>,
  fallbackRelative?: string,
): string {
  const first = candidates.find(Boolean);
  return resolveAssetUrl(first, fallbackRelative);
}
