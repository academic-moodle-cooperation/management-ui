interface BuildDownloadFileNameOptions {
  title?: string | null | undefined;
  /** The path or URL the file is served from — `logicalName` or `uri` of a track. */
  source?: string | null | undefined;
  mimeType?: string | null | undefined;
}

/** Characters Windows rejects in file names, plus control characters. */
// eslint-disable-next-line no-control-regex
const ILLEGAL_FILENAME_CHARS = /[<>:"/\\|?*\x00-\x1f]/g;

/** Anything a browser would plausibly treat as a file extension. */
const EXTENSION_PATTERN = /\.([a-z0-9]{1,5})$/i;

const MIME_EXTENSIONS: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/ogg": "ogv",
  "video/quicktime": "mov",
  "video/x-matroska": "mkv",
  "video/x-msvideo": "avi",
  "video/mpeg": "mpeg",
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "audio/ogg": "oga",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/flac": "flac",
  "text/vtt": "vtt",
  "application/x-subrip": "srt",
};

/** Keep some headroom below the 255-byte limit most file systems enforce. */
const MAX_BASE_NAME_LENGTH = 150;

const decodeSafely = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const lastPathSegment = (source: string): string => {
  let path = source;

  try {
    path = new URL(source, "http://localhost").pathname;
  } catch {
    // Not a URL — treat the value as a plain path.
    path = source.split("?")[0] ?? source;
  }

  return decodeSafely(path.split("/").pop() ?? "");
};

const extensionFromMimeType = (mimeType: string): string | undefined => {
  const normalized = mimeType.split(";")[0]?.trim().toLowerCase() ?? "";
  const mapped = MIME_EXTENSIONS[normalized];
  if (mapped) return mapped;

  // `video/mp4` -> `mp4`, but never `video/x-matroska` -> `x-matroska`.
  const subtype = normalized.split("/")[1];
  return subtype && /^[a-z0-9]{1,5}$/.test(subtype) ? subtype : undefined;
};

const sanitize = (value: string): string =>
  value
    .replace(ILLEGAL_FILENAME_CHARS, "_")
    .replace(/\s+/g, " ")
    .trim()
    // Windows silently drops trailing dots and spaces.
    .replace(/[. ]+$/, "")
    .slice(0, MAX_BASE_NAME_LENGTH)
    .trim();

/**
 * Build the file name a browser should save a track under.
 *
 * The event title alone is not enough: a title such as `Vorlesung 3.2 Einführung`
 * ends in something that looks like an extension, so browsers keep it verbatim
 * and the download lands without `.mp4` — Windows then reports an unknown file
 * format. This appends the real extension (taken from the track path, falling
 * back to its MIME type) and strips characters Windows rejects.
 *
 * @example buildDownloadFileName({ title: "Vorlesung 3.2", source: "/media/video.mp4" })
 * // -> "Vorlesung 3.2.mp4"
 */
export function buildDownloadFileName({
  title,
  source,
  mimeType,
}: BuildDownloadFileNameOptions): string {
  const normalizedSource = source?.trim() ?? "";
  const sourceSegment = normalizedSource ? lastPathSegment(normalizedSource) : "";
  const extension =
    EXTENSION_PATTERN.exec(sourceSegment)?.[1]?.toLowerCase() ??
    (mimeType ? extensionFromMimeType(mimeType) : undefined);

  const baseName = sanitize(title ?? "") || sanitize(sourceSegment) || "download";

  if (!extension) return baseName;
  if (baseName.toLowerCase().endsWith(`.${extension}`)) return baseName;

  return `${baseName}.${extension}`;
}
