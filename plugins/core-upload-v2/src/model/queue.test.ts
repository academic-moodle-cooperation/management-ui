import { beforeEach, describe, expect, it, vi } from "vitest";

import * as realIngest from "../ingest/client";
import { UploadAbortedError } from "../transport/types";

import { createUploadQueue } from "./queue";
import { itemPercent, itemProgress, MIXED, sharedValue } from "./types";

import type { QueueDeps } from "./queue";
import type { Track, UploadItem } from "./types";
import type * as IngestClient from "../ingest/client";
import type { SendContext } from "../transport/types";


/**
 * These tests pin the lifecycle, which is the whole point of v2: bytes move
 * while the user is still typing, and cancelling actually removes them.
 */

const mp = (id: string) => `<mediapackage id="${id}"><media/></mediapackage>`;

const fakeFile = (name: string, size: number): File =>
  // A real File would need the bytes; the queue only ever reads name/size and
  // hands the object to the transport, so a shaped stub is honest here.
  ({ name, size, type: "video/mp4" }) as File;

type Harness = {
  deps: Partial<QueueDeps>;
  ingest: typeof IngestClient;
  sent: Track[];
  releaseSend: () => void;
};

const harness = (options: { blockSend?: boolean } = {}): Harness => {
  const sent: Track[] = [];
  let release = () => {};

  // Start from the real module and replace only what talks to a server. A
  // hand-written fake drifts: it silently lacked `buildAccessPolicy` once, and
  // the resulting failure looked like a product bug rather than a stale double.
  const ingest = {
    ...realIngest,
    createMediaPackage: vi.fn(async () => mp("mp-1")),
    addDublinCore: vi.fn(async () => mp("mp-1-dc")),
    addAttachment: vi.fn(async () => mp("mp-1-att")),
    ingest: vi.fn(async () => "<workflow/>"),
    discardMediaPackage: vi.fn(async () => {}),
    discardViaBeacon: vi.fn(() => true),
  } as unknown as typeof IngestClient;

  const transport = {
    kind: "fake",
    capabilities: { resumable: false, pausable: false },
    async send(track: Track, ctx: SendContext) {
      sent.push(track);
      ctx.onProgress(track.file.size / 2);
      if (options.blockSend) {
        await new Promise<void>((resolve, reject) => {
          release = resolve;
          ctx.signal.addEventListener("abort", () => reject(new UploadAbortedError()), {
            once: true,
          });
        });
      }
      ctx.onProgress(track.file.size);
      return { mediaPackage: mp("mp-1-track") };
    },
  };

  let counter = 0;
  return {
    deps: { transport, ingest, newId: () => `id-${++counter}`, maxConcurrent: 2 },
    ingest,
    sent,
    releaseSend: () => release(),
  };
};

/** Narrows away `noUncheckedIndexedAccess` so assertions stay readable. */
const must = <T>(value: T | undefined, what: string): T => {
  if (value === undefined) throw new Error(`expected ${what}`);
  return value;
};

/** Lets queued microtasks settle — the queue pumps asynchronously. */
const settle = async () => {
  for (let i = 0; i < 20; i++) await Promise.resolve();
};

describe("upload queue", () => {
  let h: Harness;

  beforeEach(() => {
    h = harness();
  });

  it("moves a file to prepared without any user action", async () => {
    const queue = createUploadQueue(h.deps);
    queue.addFiles([fakeFile("lecture.mp4", 1000)]);

    await settle();

    const item = must(queue.getSnapshot().items[0], "first item");
    expect(item.state).toBe("prepared");
    expect(item.mediaPackageId).toBe("mp-1");
    expect(h.sent).toHaveLength(1);
  });

  it("derives the title from the filename without its extension", () => {
    const queue = createUploadQueue(h.deps);
    queue.addFiles([fakeFile("Vorlesung 03.mp4", 10)]);
    expect(must(queue.getSnapshot().items[0], "first item").settings.title).toBe("Vorlesung 03");
  });

  it("hands the File to the transport untouched", async () => {
    const queue = createUploadQueue(h.deps);
    const file = fakeFile("huge.mp4", 10_000_000_000);
    queue.addFiles([file]);
    await settle();
    // Identity, not equality: copying a 10 GB file into a Blob is exactly the
    // v1 bug this rewrite exists to fix.
    expect(must(h.sent[0], "a sent track").file).toBe(file);
  });

  it("respects the concurrency budget", async () => {
    const blocking = harness({ blockSend: true });
    const queue = createUploadQueue({ ...blocking.deps, maxConcurrent: 2 });
    queue.addFiles([
      fakeFile("a.mp4", 10),
      fakeFile("b.mp4", 10),
      fakeFile("c.mp4", 10),
      fakeFile("d.mp4", 10),
    ]);

    await settle();

    const preparing = queue.getSnapshot().items.filter((i) => i.state === "preparing");
    expect(preparing).toHaveLength(2);
    expect(queue.getSnapshot().items.filter((i) => i.state === "queued")).toHaveLength(2);
  });

  it("discards the media package server-side when a running upload is cancelled", async () => {
    const blocking = harness({ blockSend: true });
    const queue = createUploadQueue(blocking.deps);
    queue.addFiles([fakeFile("lecture.mp4", 1000)]);
    await settle();

    const id = must(queue.getSnapshot().items[0], "first item").id;
    expect(must(queue.getSnapshot().items[0], "first item").state).toBe("preparing");

    await queue.discard(id);

    expect(blocking.ingest.discardMediaPackage).toHaveBeenCalledOnce();
    expect(queue.getSnapshot().items).toHaveLength(0);
  });

  it("does not call Opencast when discarding a file that never started", async () => {
    const blocking = harness({ blockSend: true });
    const queue = createUploadQueue({ ...blocking.deps, maxConcurrent: 1 });
    queue.addFiles([fakeFile("a.mp4", 10), fakeFile("b.mp4", 10)]);
    await settle();

    const queued = must(
      queue.getSnapshot().items.find((i) => i.state === "queued"),
      "a still-queued item",
    );
    await queue.discard(queued.id);

    expect(blocking.ingest.discardMediaPackage).not.toHaveBeenCalled();
  });

  it("submits catalog before workflow and passes STT keys as workflow config", async () => {
    const queue = createUploadQueue(h.deps);
    queue.addFiles([fakeFile("lecture.mp4", 1000)]);
    await settle();

    const id = must(queue.getSnapshot().items[0], "first item").id;
    queue.updateSettings(id, { language: "de", transcribe: true, translate: false });

    await queue.submitOne(id, {
      presenter: "Ada Lovelace",
      username: "ada",
      location: "Upload",
      workflowIds: { publish: "ingest-upload", prepare: "ingest-prepare" },
      sttKeys: { transcribeKey: "transcribe", translateKey: "translate", languageKey: "lang" },
    });

    expect(h.ingest.addDublinCore).toHaveBeenCalledOnce();
    expect(h.ingest.ingest).toHaveBeenCalledWith(mp("mp-1-dc"), "ingest-upload", {
      transcribe: "true",
      translate: "false",
      lang: "de",
    });
    expect(must(queue.getSnapshot().items[0], "first item").state).toBe("done");
  });

  it("picks the prepare workflow when the user chose it", async () => {
    const queue = createUploadQueue(h.deps);
    queue.addFiles([fakeFile("lecture.mp4", 1000)]);
    await settle();

    const id = must(queue.getSnapshot().items[0], "first item").id;
    queue.updateSettings(id, { processing: "prepare" });
    await queue.submitOne(id, {
      presenter: "",
      username: "ada",
      location: "Upload",
      workflowIds: { publish: "ingest-upload", prepare: "ingest-prepare" },
    });

    expect(h.ingest.ingest).toHaveBeenCalledWith(expect.any(String), "ingest-prepare", {});
  });
});

describe("editing a selection", () => {
  it("writes a change to every selected item and leaves the rest alone", () => {
    const h = harness();
    const queue = createUploadQueue({ ...h.deps, maxConcurrent: 0 });
    queue.addFiles([fakeFile("a.mp4", 10), fakeFile("b.mp4", 10), fakeFile("c.mp4", 10)]);

    const [first, second, third] = queue.getSnapshot().items;
    queue.updateMany([must(first, "a").id, must(second, "b").id], { language: "de" });

    const items = queue.getSnapshot().items;
    expect(must(items[0], "a").settings.language).toBe("de");
    expect(must(items[1], "b").settings.language).toBe("de");
    expect(must(items[2], "c").settings.language).toBeUndefined();
    expect(must(third, "c").id).toBe(must(items[2], "c").id);
  });

  it("never rewrites an item that is already published", async () => {
    const h = harness();
    const queue = createUploadQueue(h.deps);
    queue.addFiles([fakeFile("a.mp4", 10)]);
    await settle();

    const id = must(queue.getSnapshot().items[0], "first item").id;
    await queue.submitOne(id, {
      presenter: "",
      username: "ada",
      location: "Upload",
      workflowIds: { publish: "ingest-upload", prepare: "" },
    });

    queue.updateMany([id], { language: "fr" });

    expect(must(queue.getSnapshot().items[0], "first item").settings.language).toBeUndefined();
  });
});

describe("dual stream", () => {
  it("uploads both tracks into a single media package", async () => {
    const h = harness();
    const queue = createUploadQueue(h.deps);
    queue.addPair(fakeFile("camera.mp4", 10), fakeFile("slides.mp4", 20));
    await settle();

    const item = must(queue.getSnapshot().items[0], "the pair");
    expect(item.state).toBe("prepared");
    expect(item.tracks.map((t) => t.flavor)).toEqual([
      "presenter/source",
      "presentation/source",
    ]);
    expect(h.sent).toHaveLength(2);
    // One package, created once — a second one would strand the first track.
    expect(h.ingest.createMediaPackage).toHaveBeenCalledOnce();
  });

  it("attaches a track added after the item was already prepared", async () => {
    const h = harness();
    const queue = createUploadQueue(h.deps);
    queue.addFiles([fakeFile("camera.mp4", 10)]);
    await settle();

    const id = must(queue.getSnapshot().items[0], "item").id;
    expect(queue.getSnapshot().items[0]?.state).toBe("prepared");

    queue.addTrackToItem(id, fakeFile("slides.mp4", 20), "presenter/source");
    await settle();

    const item = must(queue.getSnapshot().items[0], "item");
    expect(item.state).toBe("prepared");
    expect(item.tracks.every((t) => t.uploaded)).toBe(true);
    expect(h.sent).toHaveLength(2);
    expect(h.ingest.createMediaPackage).toHaveBeenCalledOnce();
  });

  it("refuses a third track", () => {
    const h = harness();
    const queue = createUploadQueue({ ...h.deps, maxConcurrent: 0 });
    const id = queue.addPair(fakeFile("a.mp4", 10), fakeFile("b.mp4", 10));

    expect(queue.addTrackToItem(id, fakeFile("c.mp4", 10), "presenter/source")).toBe(false);
    expect(must(queue.getSnapshot().items[0], "item").tracks).toHaveLength(2);
  });

  it("keeps the pair complementary when a flavor is swapped", () => {
    const h = harness();
    const queue = createUploadQueue({ ...h.deps, maxConcurrent: 0 });
    const id = queue.addPair(fakeFile("a.mp4", 10), fakeFile("b.mp4", 10));
    const [first] = must(queue.getSnapshot().items[0], "item").tracks;

    queue.setTrackFlavor(id, must(first, "first track").id, "presentation/source");

    expect(must(queue.getSnapshot().items[0], "item").tracks.map((t) => t.flavor)).toEqual([
      "presentation/source",
      "presenter/source",
    ]);
  });

  it("will not re-flavor or remove a track that is already on the server", async () => {
    const h = harness();
    const queue = createUploadQueue(h.deps);
    const id = queue.addPair(fakeFile("a.mp4", 10), fakeFile("b.mp4", 10));
    await settle();

    const track = must(must(queue.getSnapshot().items[0], "item").tracks[0], "track");
    expect(queue.setTrackFlavor(id, track.id, "presentation/source")).toBe(false);
    expect(queue.removeTrack(id, track.id)).toBe(false);
  });

  it("counts progress across both tracks", () => {
    const h = harness();
    const queue = createUploadQueue({ ...h.deps, maxConcurrent: 0 });
    queue.addPair(fakeFile("a.mp4", 30), fakeFile("b.mp4", 70));
    const item = must(queue.getSnapshot().items[0], "item");

    expect(itemProgress(item).total).toBe(100);
    expect(itemPercent(item)).toBe(0);
  });
});

describe("access rights at submit", () => {
  const submitCtx = {
    presenter: "",
    username: "ada",
    location: "Upload",
    workflowIds: { publish: "ingest-upload", prepare: "" },
  };

  it("attaches no policy when the user set no rights", async () => {
    const h = harness();
    const queue = createUploadQueue(h.deps);
    queue.addFiles([fakeFile("a.mp4", 10)]);
    await settle();

    const id = must(queue.getSnapshot().items[0], "item").id;
    await queue.submitOne(id, submitCtx);

    // Opencast then falls back to the series/workflow default, which is what
    // "I didn't touch permissions" has to mean.
    expect(h.ingest.addAttachment).not.toHaveBeenCalled();
  });

  it("attaches the XACML policy before starting the workflow", async () => {
    const h = harness();
    const queue = createUploadQueue(h.deps);
    queue.addFiles([fakeFile("a.mp4", 10)]);
    await settle();

    const id = must(queue.getSnapshot().items[0], "item").id;
    queue.updateSettings(id, {
      acl: { managedAclId: undefined, entries: [{ role: "ROLE_USER_ADA", action: ["read"] }] },
    });
    await queue.submitOne(id, submitCtx);

    expect(h.ingest.addAttachment).toHaveBeenCalledWith(
      expect.any(String),
      "security/xacml+episode",
      expect.any(Blob),
      "acl.xml",
    );
    // The policy has to be on the media package *before* the workflow starts;
    // afterwards is too late to matter.
    const attachOrder = must(
      vi.mocked(h.ingest.addAttachment).mock.invocationCallOrder[0],
      "addAttachment call",
    );
    const ingestOrder = must(
      vi.mocked(h.ingest.ingest).mock.invocationCallOrder[0],
      "ingest call",
    );
    expect(attachOrder).toBeLessThan(ingestOrder);
  });

  it("skips the attachment when the rules would be empty", async () => {
    const h = harness();
    const queue = createUploadQueue(h.deps);
    queue.addFiles([fakeFile("a.mp4", 10)]);
    await settle();

    const id = must(queue.getSnapshot().items[0], "item").id;
    queue.updateSettings(id, { acl: { managedAclId: undefined, entries: [] } });
    await queue.submitOne(id, submitCtx);

    expect(h.ingest.addAttachment).not.toHaveBeenCalled();
  });
});

describe("sharedValue", () => {
  const item = (language?: string) =>
    ({ settings: { title: "x", processing: "publish", language } }) as UploadItem;

  it("reports the common value when the selection agrees", () => {
    expect(sharedValue([item("de"), item("de")], "language")).toBe("de");
  });

  it("reports MIXED when it does not", () => {
    expect(sharedValue([item("de"), item("en")], "language")).toBe(MIXED);
  });

  it("treats 'unset everywhere' as agreement, not conflict", () => {
    expect(sharedValue([item(), item()], "language")).toBeUndefined();
  });
});
