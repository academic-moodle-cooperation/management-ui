import { z } from "zod";

import { definePluginConfig } from "@oc-mui/query";

/**
 * Usage-stats plugin config.
 *
 * The Zod schema is the single source of truth for the slice shape.
 * Components obtain the validated, default-merged slice through
 * `usageStatsConfig.use()` — never via a raw `config.plugins["usage-stats"]`
 * read (the `local/no-cross-plugin-config` lint rule flags those).
 */

export const USAGE_STATS_PLUGIN_ID = "usage-stats";

export const usageStatsConfigSchema = z.object({
  /** Runtime switch — `false` hides the plugin without touching `enabledPlugins`. */
  enabled: z.boolean().optional(),
  /**
   * Where the numbers come from.
   * - `auto` (default): probe the Statistics External API (Matomo/InfluxDB
   *   providers), then the usertracking service; fall back to demo data.
   * - `statistics` / `usertracking`: always use that service (errors surface).
   * - `demo`: always generate deterministic demo data (useful for screenshots).
   */
  source: z.enum(["auto", "statistics", "usertracking", "demo"]).optional(),
  /** How many of the user's most recent episodes to analyse on the overview page. */
  limit: z.number().int().positive().max(200).optional(),
  /** Resolution of the "which parts were watched" profile (segments per video). */
  segments: z.number().int().min(5).max(100).optional(),
  /** How far back the "views over time" query reaches, in days. */
  historyDays: z.number().int().min(1).max(730).optional(),
  /** Base path of the Statistics External API, relative to the Opencast origin. */
  statisticsBaseUrl: z.string().optional(),
  /** Base path of the usertracking REST service, relative to the Opencast origin. */
  usertrackingBaseUrl: z.string().optional(),
});

export type UsageStatsConfig = z.infer<typeof usageStatsConfigSchema>;

export const usageStatsConfigDefaults = {
  source: "auto",
  limit: 50,
  segments: 20,
  historyDays: 90,
  statisticsBaseUrl: "/api/statistics",
  usertrackingBaseUrl: "/usertracking",
} satisfies UsageStatsConfig;

/**
 * Single reader for this plugin's slice. `.register(manager)` seeds the
 * defaults on `app:config:defaults`; `.use()` returns the validated slice
 * deep-merged over the defaults, so every key above is present at runtime.
 */
export const usageStatsConfig = definePluginConfig({
  id: USAGE_STATS_PLUGIN_ID,
  schema: usageStatsConfigSchema,
  defaults: usageStatsConfigDefaults,
});
