import { z } from "zod";

import { definePluginConfig } from "@oc-mui/query";

import type { QuestionType } from "./types";

/**
 * Live Polls plugin config.
 *
 * The Zod schema is the single source of truth for the slice shape. Components
 * read the validated slice through `livePollsConfig.use()` (or
 * `livePollsConfig.read(config)` outside React); direct reads via
 * `useAppConfig().config.plugins["live-polls"]` bypass validation and are
 * flagged by lint. Defaults are contributed on `app:config:defaults` and merged
 * *below* the deployment `config.json`, so any key can be overridden per-install.
 */

export const LIVE_POLLS_PLUGIN_ID = "live-polls";

const questionTypeSchema = z.enum([
  "single",
  "multiple",
  "scale",
  "wordcloud",
  "quiz",
]) satisfies z.ZodType<QuestionType>;

export const livePollsConfigSchema = z.object({
  /** Master switch for the plugin (also gated by `app.enabledPlugins`). */
  enabled: z.boolean().optional(),
  /** Allow participants to join without entering a name. */
  allowAnonymous: z.boolean().optional(),
  /** Pre-selected question type when adding a new question in the editor. */
  defaultQuestionType: questionTypeSchema.optional(),
  /** Upper bound on options per choice/quiz question in the editor. */
  maxOptions: z.number().int().positive().optional(),
});

export type LivePollsConfig = z.infer<typeof livePollsConfigSchema>;

export const livePollsConfigDefaults: LivePollsConfig = {
  enabled: true,
  allowAnonymous: true,
  defaultQuestionType: "single",
  maxOptions: 8,
};

/**
 * Single reader for this plugin's slice. Call `.register(manager)` in
 * `initialize()` to seed defaults, and `.use()` / `.read(config)` to consume
 * the validated slice from component or non-React code.
 */
export const livePollsConfig = definePluginConfig({
  id: LIVE_POLLS_PLUGIN_ID,
  schema: livePollsConfigSchema,
  defaults: livePollsConfigDefaults,
});
