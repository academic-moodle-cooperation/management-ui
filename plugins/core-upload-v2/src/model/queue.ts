import { logger } from "@oc-mui/utils";

import * as defaultIngest from "../ingest/client";
import { ingestXhrTransport } from "../transport/ingestXhr";

import { rememberOrphan, forgetOrphan } from "./orphans";
import { isTerminal, otherFlavor } from "./types";

import type { ItemSettings, ItemState, Track, TrackFlavor, UploadItem } from "./types";
import type { EpisodeMetadata } from "../ingest/client";
import type { UploadTransport } from "../transport/types";

/**
 * The upload queue.
 *
 * Deliberately a plain module-level store rather than React state: preparing an
 * upload must survive the user navigating away from the upload screen. React
 * state dies with the component tree; this does not. Components subscribe via
 * `useSyncExternalStore` (see `useUploadQueue`).
 *
 * The whole lifecycle hangs off one observation about Opencast's ingest API:
 * the track can be attached to a media package at any point, but the workflow
 * only starts at `/ingest/ingest`. So bytes move immediately ("preparing")
 * while title, language, processing options and ACL are collected at leisure
 * and applied just before the final call.
 */

export type QueueDeps = {
  transport: UploadTransport;
  ingest: typeof defaultIngest;
  maxConcurrent: number;
  /** Injected so tests don't need a crypto polyfill. */
  newId: () => string;
};

export type SubmitContext = {
  seriesId?: string;
  presenter: string;
  username: string;
  location: string;
  workflowIds: { publish: string; prepare: string };
  /**
   * Workflow property names for speech-to-text; absent keys are skipped.
   * Explicit `| undefined` so a config slice — where every field is genuinely
   * optional — can be passed straight through under `exactOptionalPropertyTypes`.
   */
  sttKeys?: {
    transcribeKey?: string | undefined;
    translateKey?: string | undefined;
    languageKey?: string | undefined;
  };
};

export type QueueSnapshot = {
  items: readonly UploadItem[];
  capabilities: UploadTransport["capabilities"];
};

const defaultDeps: QueueDeps = {
  transport: ingestXhrTransport,
  ingest: defaultIngest,
  maxConcurrent: 2,
  newId: () => crypto.randomUUID(),
};

export const createUploadQueue = (overrides: Partial<QueueDeps> = {}) => {
  const deps: QueueDeps = { ...defaultDeps, ...overrides };

  let items: UploadItem[] = [];
  let snapshot: QueueSnapshot = { items, capabilities: deps.transport.capabilities };
  const listeners = new Set<() => void>();
  const controllers = new Map<string, AbortController>();

  const emit = () => {
    // A fresh snapshot object every time — `useSyncExternalStore` compares by
    // identity, so mutating in place would render nothing.
    snapshot = { items, capabilities: deps.transport.capabilities };
    for (const listener of listeners) listener();
  };

  const patch = (id: string, change: Partial<UploadItem>) => {
    items = items.map((item) => (item.id === id ? { ...item, ...change } : item));
    emit();
  };

  const find = (id: string) => items.find((item) => item.id === id);

  // `exactOptionalPropertyTypes` is on, so an absent field and a field set to
  // `undefined` are different things — build the patch accordingly.
  const setState = (id: string, state: ItemState, error?: string) =>
    patch(id, error === undefined ? { state } : { state, error });

  // ---------------------------------------------------------------- preparing

  /**
   * Creates the media package if needed and streams every track that has not
   * been attached yet. On success the item sits in `prepared`, bytes on the
   * server, waiting for the user.
   *
   * Two details make dual-stream work: the media package is only created when
   * the item doesn't have one (a second track must join the *same* package),
   * and the loop re-reads the pending track from state on every pass rather
   * than iterating a snapshot — so a track added while this was running is
   * picked up instead of silently skipped.
   */
  const prepare = async (id: string) => {
    const controller = new AbortController();
    controllers.set(id, controller);
    setState(id, "preparing");

    try {
      let mediaPackage = find(id)?.mediaPackage;
      if (!mediaPackage) {
        mediaPackage = await deps.ingest.createMediaPackage(controller.signal);
        const mpId = deps.ingest.mediaPackageId(mediaPackage);
        patch(id, mpId === undefined ? { mediaPackage } : { mediaPackage, mediaPackageId: mpId });
        rememberOrphan(mediaPackage);
      }

      for (;;) {
        const track = find(id)?.tracks.find((candidate) => !candidate.uploaded);
        if (!track) break;

        const result = await deps.transport.send(track, {
          mediaPackage,
          signal: controller.signal,
          onProgress: (bytesSent) => {
            const current = find(id);
            if (!current) return;
            patch(id, {
              tracks: current.tracks.map((t) => (t.id === track.id ? { ...t, bytesSent } : t)),
            });
          },
        });
        mediaPackage = result.mediaPackage;
        const current = find(id);
        patch(id, {
          mediaPackage,
          tracks: (current?.tracks ?? []).map((t) =>
            t.id === track.id ? { ...t, bytesSent: t.file.size, uploaded: true } : t,
          ),
        });
      }

      setState(id, "prepared");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        // Cancellation already ran the discard path; nothing to report.
        return;
      }
      logger.error(
        "[upload-v2] preparing failed",
        error instanceof Error ? error : new Error(String(error)),
      );
      setState(id, "failed", error instanceof Error ? error.message : String(error));
    } finally {
      controllers.delete(id);
      pump();
    }
  };

  /** Starts as many queued items as the concurrency budget allows. */
  const pump = () => {
    const running = items.filter((item) => item.state === "preparing").length;
    const free = Math.max(0, deps.maxConcurrent - running);
    items
      .filter((item) => item.state === "queued")
      .slice(0, free)
      .forEach((item) => void prepare(item.id));
  };

  // ------------------------------------------------------------------ actions

  const addFiles = (files: File[], flavor: TrackFlavor = "presentation/source") => {
    const created = files.map<UploadItem>((file) => ({
      id: deps.newId(),
      tracks: [{ id: deps.newId(), file, flavor, bytesSent: 0 }],
      settings: {
        title: file.name.replace(/\.[^.]+$/, ""),
        // The file's own mtime is the recording time for anything a camera or
        // screen recorder produced. Zero means the browser withheld it.
        ...(file.lastModified
          ? { recordedAt: new Date(file.lastModified).toISOString() }
          : {}),
        presenters: [],
        processing: "publish",
      },
      state: "queued",
    }));
    items = [...items, ...created];
    emit();
    pump();
    return created.map((item) => item.id);
  };

  /** Creates one item carrying both halves of a dual-stream recording. */
  const addPair = (presenter: File, presentation: File) => {
    const item: UploadItem = {
      id: deps.newId(),
      tracks: [
        { id: deps.newId(), file: presenter, flavor: "presenter/source", bytesSent: 0 },
        { id: deps.newId(), file: presentation, flavor: "presentation/source", bytesSent: 0 },
      ],
      settings: {
        title: presenter.name.replace(/\.[^.]+$/, ""),
        ...(presenter.lastModified
          ? { recordedAt: new Date(presenter.lastModified).toISOString() }
          : {}),
        presenters: [],
        processing: "publish",
      },
      state: "queued",
    };
    items = [...items, item];
    emit();
    pump();
    return item.id;
  };

  /**
   * Adds a second track to an existing item — the per-item dual-stream path.
   *
   * Allowed right up until the item is submitted, including while it is still
   * transferring: `prepare` re-reads its pending track each pass, and an item
   * that had already finished is put back in the queue so the new track is
   * attached to the same media package.
   */
  const addTrackToItem = (itemId: string, file: File, flavor: TrackFlavor) => {
    const item = find(itemId);
    if (!item || item.tracks.length >= 2) return false;
    if (!["queued", "preparing", "prepared"].includes(item.state)) return false;

    const track: Track = { id: deps.newId(), file, flavor, bytesSent: 0 };
    patch(itemId, { tracks: [...item.tracks, track] });

    if (item.state === "prepared") {
      setState(itemId, "queued");
      pump();
    }
    return true;
  };

  /** Removes a track that has not been attached yet. */
  const removeTrack = (itemId: string, trackId: string) => {
    const item = find(itemId);
    const track = item?.tracks.find((candidate) => candidate.id === trackId);
    // An uploaded track lives inside the media package; taking it back out
    // would mean rebuilding the package, so we simply don't offer that.
    if (!item || !track || track.uploaded || item.tracks.length < 2) return false;
    patch(itemId, { tracks: item.tracks.filter((candidate) => candidate.id !== trackId) });
    return true;
  };

  /** Swaps which track is the presenter and which is the presentation. */
  const setTrackFlavor = (itemId: string, trackId: string, flavor: TrackFlavor) => {
    const item = find(itemId);
    const track = item?.tracks.find((candidate) => candidate.id === trackId);
    if (!item || !track || track.uploaded) return false;
    patch(itemId, {
      tracks: item.tracks.map((candidate) =>
        candidate.id === trackId
          ? { ...candidate, flavor }
          : // Keep the pair complementary: giving one track a flavor hands the
            // other the opposite one, so two presenters can never coexist.
            item.tracks.length === 2 && !candidate.uploaded
            ? { ...candidate, flavor: otherFlavor(flavor) }
            : candidate,
      ),
    });
    return true;
  };

  const updateSettings = (id: string, change: Partial<ItemSettings>) => updateMany([id], change);

  /**
   * Applies a settings change to every listed item that can still take one.
   *
   * This is the only write path for settings, whether the user edits one item
   * or fifty. "Apply to all" needs no special case and no overwrite warning:
   * the inspector shows disagreeing fields as "mixed" *before* the edit, so
   * there is nothing to confess afterwards.
   */
  const updateMany = (ids: readonly string[], change: Partial<ItemSettings>) => {
    const targets = new Set(ids);
    items = items.map((item) =>
      targets.has(item.id) && !isTerminal(item.state)
        ? { ...item, settings: { ...item.settings, ...change } }
        : item,
    );
    emit();
  };

  /**
   * Cancels an item and removes its bytes from the server. Safe in every state:
   * an in-flight transfer is aborted first, a prepared one is discarded
   * directly, and an item that never reached the server just disappears.
   */
  const discard = async (id: string) => {
    const item = find(id);
    if (!item) return;

    controllers.get(id)?.abort();
    controllers.delete(id);

    if (item.mediaPackage) {
      await deps.ingest.discardMediaPackage(item.mediaPackage);
      forgetOrphan(item.mediaPackage);
    }

    items = items.filter((candidate) => candidate.id !== id);
    emit();
    pump();
  };

  // ----------------------------------------------------------------- submit

  const workflowConfigFor = (item: UploadItem, ctx: SubmitContext) => {
    // A discovered workflow declares its own options, so its values are already
    // keyed correctly and need no translation. The configured STT keys below
    // are the fallback for installations we could not ask.
    if (item.settings.workflowId) return { ...(item.settings.workflowConfig ?? {}) };

    const config: Record<string, string> = {};
    const keys = ctx.sttKeys ?? {};
    if (keys.transcribeKey && item.settings.transcribe !== undefined) {
      config[keys.transcribeKey] = String(item.settings.transcribe);
    }
    if (keys.translateKey && item.settings.translate !== undefined) {
      config[keys.translateKey] = String(item.settings.translate);
    }
    if (keys.languageKey && item.settings.language) {
      config[keys.languageKey] = item.settings.language;
    }
    return config;
  };

  /**
   * Finalises one prepared item: catalog, attachments, then the workflow.
   * Anything before `ingest()` is reversible; `ingest()` is the point of no
   * return, which is why it is the last statement.
   */
  const submitOne = async (id: string, ctx: SubmitContext) => {
    const item = find(id);
    if (!item || item.state !== "prepared" || !item.mediaPackage) return;

    setState(id, "submitting");
    try {
      const s = item.settings;
      const meta: EpisodeMetadata = {
        title: s.title,
        // Nobody named means the uploader is the presenter; that is only a
        // sane guess, so an explicit list always wins.
        presenters: s.presenters.length > 0 ? s.presenters : [ctx.presenter],
        location: ctx.location,
        source: ctx.username,
        // Omitted rather than set to undefined: a missing value must not write
        // an empty Dublin Core element into the catalog.
        ...(ctx.seriesId ? { seriesId: ctx.seriesId } : {}),
        ...(s.recordedAt ? { recordedAt: s.recordedAt } : {}),
        ...(s.language ? { language: s.language } : {}),
        ...(s.description ? { description: s.description } : {}),
        ...(s.subject ? { subject: s.subject } : {}),
        ...(s.license ? { license: s.license } : {}),
        ...(s.rightsHolder ? { rightsHolder: s.rightsHolder } : {}),
        ...(s.contributors?.length ? { contributors: s.contributors } : {}),
      };

      let mediaPackage = await deps.ingest.addDublinCore(item.mediaPackage, meta);

      // Access policy before the workflow starts; skipped entirely when the
      // user set no rights, so Opencast keeps the series/workflow default.
      const acl = s.acl;
      if (acl) {
        const policy = deps.ingest.buildAccessPolicy([
          ...(acl.entries ?? []),
          ...(acl.managedAclEntries ?? []).map((entry) => ({
            role: entry.role ?? "",
            action: (entry.action ?? []).filter((a): a is string => a !== null),
          })),
        ]);
        if (policy) {
          mediaPackage = await deps.ingest.addAttachment(
            mediaPackage,
            "security/xacml+episode",
            new Blob([policy], { type: "text/xml" }),
            "acl.xml",
          );
        }
      }

      if (item.settings.previewImage) {
        mediaPackage = await deps.ingest.addAttachment(
          mediaPackage,
          "presenter/search+preview",
          item.settings.previewImage,
          item.settings.previewImage.name,
        );
      }

      // A workflow the user picked from the discovered list wins; otherwise
      // fall back to the pair of IDs the installation configured.
      const workflowId =
        item.settings.workflowId ??
        (item.settings.processing === "prepare" ? ctx.workflowIds.prepare : ctx.workflowIds.publish);

      await deps.ingest.ingest(mediaPackage, workflowId || undefined, workflowConfigFor(item, ctx));

      forgetOrphan(item.mediaPackage);
      patch(id, { state: "done", mediaPackage });
    } catch (error) {
      logger.error(
        "[upload-v2] submit failed",
        error instanceof Error ? error : new Error(String(error)),
      );
      setState(id, "failed", error instanceof Error ? error.message : String(error));
    }
  };

  const submitAll = async (ctx: SubmitContext) => {
    const ready = items.filter((item) => item.state === "prepared").map((item) => item.id);
    for (const id of ready) await submitOne(id, ctx);
  };

  const clearFinished = () => {
    items = items.filter((item) => item.state !== "done");
    emit();
  };

  const reset = () => {
    for (const controller of controllers.values()) controller.abort();
    controllers.clear();
    items = [];
    emit();
  };

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => snapshot,
    addFiles,
    addPair,
    addTrackToItem,
    removeTrack,
    setTrackFlavor,
    updateSettings,
    updateMany,
    discard,
    submitOne,
    submitAll,
    clearFinished,
    reset,
  };
};

export type UploadQueue = ReturnType<typeof createUploadQueue>;

/** The instance the UI talks to. Module-level so it outlives route changes. */
export const uploadQueue = createUploadQueue();
