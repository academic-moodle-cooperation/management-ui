import { useSyncExternalStore } from "react";

import { uploadQueue } from "./queue";

import type { QueueSnapshot } from "./queue";

/**
 * Subscribes a component to the module-level queue.
 *
 * The queue lives outside React on purpose — a transfer must keep running when
 * the user navigates away from the upload screen — so this is the seam that
 * brings it back in.
 */
export const useUploadQueue = (): QueueSnapshot =>
  useSyncExternalStore(uploadQueue.subscribe, uploadQueue.getSnapshot, uploadQueue.getSnapshot);
