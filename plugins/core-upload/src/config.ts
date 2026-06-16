import { z } from "zod";

import { definePluginConfig } from "@opencast-mui/query";

/**
 * Upload plugin config — same pattern as `plugins/core-episodes/config.ts`.
 */

export const UPLOAD_PLUGIN_ID = "upload";

export const uploadConfigSchema = z.object({
  location: z.string(),
  workflowId: z.string(),
  whitelist: z.array(z.string()),
  protection: z
    .object({
      public: z.boolean().optional(),
    })
    .optional(),
});

export type UploadConfig = z.infer<typeof uploadConfigSchema>;

export const uploadConfigDefaults: UploadConfig = {
  location: "Upload",
  workflowId: "ingest-upload",
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

export const uploadConfig = definePluginConfig({
  id: UPLOAD_PLUGIN_ID,
  schema: uploadConfigSchema,
  defaults: uploadConfigDefaults,
});
