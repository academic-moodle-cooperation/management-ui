import type { AppDefinition } from "@oc-mui/plugin-system";
import { logger } from "@oc-mui/utils";


/** `/support/` and `support` are the same route to the router. */
const normalizeRoutePath = (routePath: string): string => {
  const trimmed = routePath.trim().replace(/\/+$/, "");
  if (trimmed === "") return "/";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
};

/**
 * Two apps on one `routePath` would make `createRouter` throw and leave the
 * shell without a router at all. Keep the first registration, drop the rest,
 * and say so — a deployed plugin and a tab-scoped trial of a newer build of
 * it are the usual way this happens.
 */
export const dedupeAppsByRoute = (apps: AppDefinition[]): AppDefinition[] => {
  const seen = new Map<string, AppDefinition>();
  const kept: AppDefinition[] = [];
  for (const app of apps) {
    const key = normalizeRoutePath(app.routePath);
    const first = seen.get(key);
    if (first) {
      logger.warn("Two apps register the same route; keeping the first", {
        routePath: key,
        kept: first.id,
        dropped: app.id,
      });
      continue;
    }
    seen.set(key, app);
    kept.push(app);
  }
  return kept;
};
