import type { AppConfig } from "@workspace/query";
import type { AppProtectionConfig } from "@workspace/router";

export interface UploadConfig {
  location: string;
  workflowId: string;
  whitelist: string[];
  protection?: AppProtectionConfig;
}

export const UPLOAD_PLUGIN_ID = "upload";

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

export function readUploadConfig(config: AppConfig | undefined): UploadConfig | undefined {
  return config?.plugins?.[UPLOAD_PLUGIN_ID] as UploadConfig | undefined;
}
