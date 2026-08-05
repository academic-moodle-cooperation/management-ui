import { z } from "zod";

import { definePluginConfig } from "@oc-mui/query";

/**
 * Upload v2 config — same pattern as `plugins/core-upload/src/config.ts`.
 *
 * Two groups of settings are deliberately config-driven rather than hardcoded:
 *
 * - `workflows` — which workflow definition runs for "publish now" vs. "prepare
 *   for the editor" differs per installation, so the IDs live here.
 * - `stt` — Opencast passes every extra form field of `/ingest/ingest` into the
 *   started workflow as a configuration property (see `getWorkflowConfig` in
 *   Opencast's `IngestRestService`). Which property names a workflow actually
 *   reads is a property of that workflow, not of Opencast, so the names are
 *   configurable instead of guessed.
 */

export const UPLOAD_V2_PLUGIN_ID = "upload-v2";

export const uploadV2ConfigSchema = z.object({
  /** `dcterms:spatial` value written into the episode Dublin Core catalog. */
  location: z.string(),

  workflows: z.object({
    /** Runs the full chain up to publication. */
    publish: z.string(),
    /**
     * Runs preparation steps only, leaving the episode for manual cutting and
     * subtitle review in the Opencast editor. Empty string disables the option
     * in the UI — installations without such a workflow simply don't offer it.
     */
    prepare: z.string(),
  }),

  /**
   * Workflow configuration property names for speech-to-text. Leave a name
   * empty to hide the corresponding control.
   */
  stt: z
    .object({
      transcribeKey: z.string(),
      translateKey: z.string(),
      /** Property carrying the spoken language, if the workflow branches on it. */
      languageKey: z.string(),
    })
    .partial()
    .optional(),

  transport: z
    .object({
      /**
       * `ingest` posts the file straight to `/ingest/addTrack` — no resume.
       * `tus` talks to a resumable endpoint that hands the finished file to
       * Opencast server-side.
       */
      kind: z.enum(["ingest", "tus"]),
      /** Only read when `kind` is `tus`. */
      endpoint: z.string().optional(),
    })
    .optional(),

  /**
   * Spoken languages offered per upload, as BCP-47 codes. Rendered with
   * `Intl.DisplayNames` in the user's locale, so no label table is needed.
   */
  languages: z.array(z.string()),

  /**
   * Which optional Dublin Core fields the inspector offers. Empty by default:
   * title, recording date, presenters, language and processing are useful
   * everywhere, the rest is strongly institution-specific and an unused field
   * is worse than a missing one.
   *
   * Ideally Opencast would describe its own episode catalog to us — it already
   * does for existing events (`MuiGetEventByIdInputFields` returns labels,
   * types, required flags and allowed values). That query needs an event id,
   * and during upload no event exists yet, so this list stands in until the
   * backend can serve the catalog definition without an instance.
   */
  visibleFields: z.array(
    z.enum(["description", "subject", "license", "rightsHolder", "contributors"]),
  ),

  /** How many files may be in `preparing` at the same time. */
  maxConcurrentUploads: z.number().int().positive(),

  /** Accepted file extensions, lower case, without a leading dot. */
  whitelist: z.array(z.string()),

  protection: z
    .object({
      public: z.boolean().optional(),
    })
    .optional(),
});

export type UploadV2Config = z.infer<typeof uploadV2ConfigSchema>;

export const uploadV2ConfigDefaults: UploadV2Config = {
  location: "Upload",
  workflows: {
    publish: "ingest-upload",
    prepare: "",
  },
  transport: {
    kind: "ingest",
  },
  languages: ["de", "en", "fr", "it", "es"],
  visibleFields: [],
  maxConcurrentUploads: 2,
  whitelist: [
    "h264",
    "mov",
    "mp4",
    "mp3",
    "wav",
    "avi",
    "m4a",
    "wmv",
    "mkv",
    "ac3",
    "webm",
    "ts",
    "ogg",
    "opus",
    "aiff",
    "hevc",
    "m2t",
    "mjp",
    "mts",
    "mxf",
    "ogv",
    "rm",
    "vob",
    "wtv",
    "swf",
    "3gp",
    "asf",
    "f4v",
    "m2v",
    "flv",
  ],
  protection: { public: false },
};

export const uploadV2Config = definePluginConfig({
  id: UPLOAD_V2_PLUGIN_ID,
  schema: uploadV2ConfigSchema,
  defaults: uploadV2ConfigDefaults,
});
