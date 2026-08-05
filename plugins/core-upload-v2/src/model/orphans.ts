import { logger } from "@oc-mui/utils";

import { discardMediaPackage, discardViaBeacon, mediaPackageId } from "../ingest/client";

/**
 * Orphan protection.
 *
 * A media package that was created but never ingested keeps its transferred
 * bytes on the server. If the tab dies mid-transfer nobody would ever clean it
 * up, so we track every in-flight media package in `localStorage` and act on it
 * from two directions:
 *
 * 1. `beforeunload` fires a discard beacon — best effort, costs nothing.
 * 2. The next app start finds whatever the beacon missed and can offer to
 *    discard it.
 *
 * Neither replaces a server-side reaper; they just keep the common cases from
 * ever reaching it.
 */

const STORAGE_KEY = "oc-mui:upload-v2:pending-media-packages";

type OrphanRecord = {
  /** The media package XML — `discardMediaPackage` needs the document, not the ID. */
  xml: string;
  id?: string;
  createdAt: number;
};

const read = (): OrphanRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as OrphanRecord[]) : [];
  } catch {
    return [];
  }
};

const write = (records: OrphanRecord[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (error) {
    // A full or unavailable storage must not break uploading; we just lose the
    // safety net for this session.
    logger.warn("[upload-v2] could not persist pending media packages", { error });
  }
};

export const rememberOrphan = (xml: string) => {
  const id = mediaPackageId(xml);
  const records = id === undefined ? read() : read().filter((record) => record.id !== id);
  const record: OrphanRecord = { xml, createdAt: Date.now(), ...(id ? { id } : {}) };
  write([...records, record]);
};

export const forgetOrphan = (xml: string) => {
  const id = mediaPackageId(xml);
  write(read().filter((record) => (id ? record.id !== id : record.xml !== xml)));
};

export const listOrphans = (): OrphanRecord[] => read();

/** Discards every tracked orphan. Used by the recovery prompt on app start. */
export const discardAllOrphans = async () => {
  const records = read();
  write([]);
  for (const record of records) await discardMediaPackage(record.xml);
};

/**
 * Registers the unload handler. Returns a disposer.
 *
 * Only media packages that are still tracked get a beacon — anything already
 * ingested was removed from storage at submit time.
 */
export const installUnloadGuard = (): (() => void) => {
  const handler = () => {
    for (const record of read()) discardViaBeacon(record.xml);
  };
  window.addEventListener("beforeunload", handler);
  return () => window.removeEventListener("beforeunload", handler);
};
