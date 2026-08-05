import type { AclData } from "@oc-mui/ui/components";

/**
 * The upload data model.
 *
 * An item holds one or two tracks. Both dual-stream entry paths — "add a second
 * track to this item" and the two-dropzone mode — produce the same shape, so
 * everything below the UI stays single-path.
 */

export type TrackFlavor = "presenter/source" | "presentation/source" | "audio/source";

/**
 * Opaque per-transport handle for an in-flight track. `ingestXhr` stores the
 * `XMLHttpRequest`; a tus transport would store its upload URL.
 */
export type TrackHandle = { readonly _brand: "TrackHandle" } & Record<string, unknown>;

export type Track = {
  id: string;
  /**
   * The browser `File`. Never copy this into a Blob or an ArrayBuffer — a 10 GB
   * file must stay a disk-backed reference, otherwise it lands in the JS heap.
   * This was the failure mode of upload v1 (`getMediaBlob`).
   */
  file: File;
  flavor: TrackFlavor;
  bytesSent: number;
  /**
   * Set once the track is attached to the media package. Its flavor is fixed
   * from then on — the flavor travels with the bytes in `addTrack`, so changing
   * it afterwards would need the whole media package rebuilt.
   */
  uploaded?: boolean;
  handle?: TrackHandle;
};

/**
 * Opencast's dual-stream convention: the speaker on one flavor, whatever they
 * were showing on the other. The player composes the two.
 */
export const DUAL_STREAM_FLAVORS = ["presenter/source", "presentation/source"] as const;

export const otherFlavor = (flavor: TrackFlavor): TrackFlavor =>
  flavor === "presenter/source" ? "presentation/source" : "presenter/source";

export type ProcessingMode = "publish" | "prepare";

/**
 * The clearable fields carry an explicit `| undefined` rather than being merely
 * optional: "inherit from the series" and "remove the preview image" are real
 * edits the inspector must be able to write, and under
 * `exactOptionalPropertyTypes` an absent key cannot express them.
 */
export type ItemSettings = {
  title: string;
  /**
   * When the recording was made, as an ISO string — *not* when it was
   * uploaded. Seeded from the file's own modification time, which for camera
   * and screen-capture output is the recording time and is very nearly always
   * a better answer than "now".
   */
  recordedAt?: string | undefined;
  /**
   * `dcterms:creator`. Empty means "fall back to the uploading user", which is
   * only right when someone uploads their own recording.
   */
  presenters: string[];
  /** BCP-47 code, or `undefined` to inherit whatever the series defines. */
  language?: string | undefined;
  transcribe?: boolean | undefined;
  translate?: boolean | undefined;
  processing: ProcessingMode;
  /**
   * Chosen workflow, when the installation's workflows were discovered from
   * Opencast. Absent means "use the configured publish/prepare IDs" — the
   * fallback for installations whose External API is not reachable.
   */
  workflowId?: string | undefined;
  /**
   * Values for the options that workflow declares, keyed by the field names it
   * declared. Sent verbatim as extra form fields to `/ingest/ingest`.
   */
  workflowConfig?: Record<string, string> | undefined;
  /** Custom poster image, uploaded as an attachment during submit. */
  previewImage?: File | undefined;
  /**
   * Access rights, attached as a XACML policy during submit. `undefined` means
   * "don't attach one" — Opencast then applies whatever the series or the
   * workflow dictates, which is the correct default rather than an empty
   * policy that would lock everyone out.
   */
  acl?: AclData | undefined;

  // Optional Dublin Core fields, shown only when listed in `visibleFields`.
  description?: string | undefined;
  subject?: string | undefined;
  license?: string | undefined;
  rightsHolder?: string | undefined;
  contributors?: string[] | undefined;
};

/** Fields an installation may switch on in its config slice. */
export const OPTIONAL_FIELDS = [
  "description",
  "subject",
  "license",
  "rightsHolder",
  "contributors",
] as const;

export type OptionalField = (typeof OPTIONAL_FIELDS)[number];

export type SettingsField = keyof ItemSettings;

/**
 * The shared value of one field across a selection, or `MIXED` when the
 * selected items disagree. Letting the inspector render disagreement honestly
 * is what replaces the "apply to all, then warn about overwrites" dance: the
 * conflict is visible before the edit, not confessed afterwards.
 */
export const MIXED = Symbol("mixed");

/** List fields hold equal *content*, never the same array instance. */
const sameValue = (a: unknown, b: unknown): boolean =>
  Array.isArray(a) && Array.isArray(b)
    ? a.length === b.length && a.every((entry, index) => entry === b[index])
    : a === b;

export const sharedValue = <K extends SettingsField>(
  items: readonly UploadItem[],
  field: K,
): ItemSettings[K] | typeof MIXED | undefined => {
  if (items.length === 0) return undefined;
  const [first, ...rest] = items;
  const value = first!.settings[field];
  return rest.every((item) => sameValue(item.settings[field], value)) ? value : MIXED;
};

/**
 * See `docs` in README: queued → preparing → prepared → submitting → done,
 * with `paused` hanging off preparing and `discarded`/`failed` reachable from
 * anywhere before `done`.
 */
export type ItemState =
  | "queued"
  | "preparing"
  | "paused"
  | "prepared"
  | "submitting"
  | "done"
  | "failed"
  | "discarded";

export type UploadItem = {
  id: string;
  tracks: Track[];
  /** Set once `createMediaPackage` returned; the key for discarding. */
  mediaPackageId?: string;
  /** The media package XML as Opencast hands it back and forth. */
  mediaPackage?: string;
  settings: ItemSettings;
  state: ItemState;
  error?: string;
};

export const isTerminal = (state: ItemState): boolean =>
  state === "done" || state === "discarded" || state === "failed";

/** Bytes sent across all tracks of an item, and the item's total size. */
export const itemProgress = (item: UploadItem): { sent: number; total: number } => {
  let sent = 0;
  let total = 0;
  for (const track of item.tracks) {
    sent += track.bytesSent;
    total += track.file.size;
  }
  return { sent, total };
};

/** 0–100, rounded. Returns 0 for a zero-byte item rather than NaN. */
export const itemPercent = (item: UploadItem): number => {
  const { sent, total } = itemProgress(item);
  return total === 0 ? 0 : Math.round((sent / total) * 100);
};
