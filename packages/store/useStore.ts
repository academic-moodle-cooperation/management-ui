/**
 * Upload Store - Manages file upload state using Zustand with Immer
 * This store handles file upload queuing, progress tracking, and state persistence
 */

import { produce } from "immer";
import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Upload file data structure */
export type UploadFileBlob = {
  file: Blob;
  id: number;
  src: string;
  name: string;
  uploadName: string;
  type: string;
  displayType?: string;
  fileInfo?: unknown[];
  analyzed?: boolean;
  size: number;
  progress: number;
  status: string;
  request?: XMLHttpRequest;
};

const immer =
  (config: typeof store) => (set: (state: (state: Store) => void) => void, get: () => Store) =>
    config((fn) => set(produce(fn)), get);

/** Upload list state structure */
export type UploadListType = {
  files: UploadFileBlob[];
  seriesId: string;
  pending: UploadFileBlob[];
  next: UploadFileBlob | null;
  uploading: boolean;
  uploaded: UploadFileBlob[];
  status: string;
  uploadError: Error | null;
};

/** Upload store interface definition */
export type Store = {
  zustandupload: UploadListType;
  setUpload: (upload: UploadListType) => void;
  submitUpload: () => void;
  nextUpload: (uploadListFile: UploadFileBlob) => void;
  deleteUpload: (id: number) => void;
  resetUpload: () => void;
  updateFile: (updateFileInfo: UploadFileBlob) => void;
  /**
   * Marks `uploadFile` as finished: clears `next`, drops it from `pending` and
   * appends it to `uploaded`.
   *
   * @param _pending - Deprecated and ignored since 1.2: the remaining list is
   *   derived from the store. Passing a list captured when the upload started
   *   wrote stale state back once other uploads had finished in between.
   */
  fileUploaded: (uploadFile: UploadFileBlob, _pending?: UploadFileBlob[]) => void;
  filesUploaded: () => void;
  setUploadError: (uploadError: Error) => void;
};

const initialState: UploadListType = {
  files: [],
  seriesId: "",
  pending: [],
  next: null,
  uploading: false,
  uploaded: [],
  status: "idle",
  uploadError: null,
};

const store = (set: (state: (state: Store) => void) => void, get: () => Store) => ({
  zustandupload: initialState,
  setUpload: (upload: UploadListType) => {
    return set((state) => {
      state.zustandupload.files = upload.files;
      state.zustandupload.seriesId = upload.seriesId;
      state.zustandupload.status = "LOADED";
    });
  },
  submitUpload: () => {
    return set((state) => {
      state.zustandupload.uploading = true;
      state.zustandupload.pending = state.zustandupload.files.filter((n) => n);
      state.zustandupload.status = "INIT";
    });
  },
  nextUpload: (uploadListFile: UploadFileBlob) => {
    return set((state) => {
      state.zustandupload.next = uploadListFile;
      state.zustandupload.status = "PENDING";
    });
  },
  deleteUpload: (id: number) => {
    return set((state: Store) => {
      state.zustandupload.files = state?.zustandupload?.files.filter((file) => file.id !== id);
    });
  },
  resetUpload: () => {
    return set((state: Store) => {
      state.zustandupload = { ...initialState };
    });
  },
  updateFile: (updateFileInfo: UploadFileBlob) => {
    return set((state: Store) => {
      const updateFileIndex = get().zustandupload?.files.findIndex(
        (fileItem: UploadFileBlob) => fileItem?.id === updateFileInfo.id,
      );

      if (updateFileIndex === -1) return state.zustandupload;

      state.zustandupload.files[updateFileIndex] = {
        ...state.zustandupload.files[updateFileIndex],
        ...updateFileInfo,
      };
    });
  },

  fileUploaded: (uploadFile: UploadFileBlob) => {
    return set((state: Store) => {
      const { files, pending, uploaded } = state.zustandupload;

      state.zustandupload.next = null;
      // Derived from the store, never taken from the caller: a `pending` list captured
      // when the upload started is stale by the time it finishes if other uploads
      // completed in between, and writing it back resurrected files already done.
      state.zustandupload.pending = pending.filter((f) => f && f.id !== uploadFile.id);

      // Never append a hole. The file may be gone from `files` by now (a late
      // completion after `filesUploaded` cleared the list); the old `files[-1]`
      // lookup then persisted `undefined`, which crashed every later render of the
      // uploaded list until the session storage was cleared by hand.
      const finished = files.find((f) => f?.id === uploadFile.id) ?? uploadFile;
      const alreadyListed = uploaded.some((f) => f?.id === uploadFile.id);
      state.zustandupload.uploaded = alreadyListed
        ? uploaded.filter(Boolean)
        : [...uploaded.filter(Boolean), finished];
    });
  },
  filesUploaded: () => {
    return set((state: Store) => {
      state.zustandupload.uploading = false;
      state.zustandupload.status = "FILES_UPLOADED";
      state.zustandupload.files = [];
    });
  },
  setUploadError: (uploadError: Error) => {
    return set((state: Store) => {
      state.zustandupload.uploadError = uploadError;
    });
  },
});

/**
 * Upload store with persistence and state management
 * Uses sessionStorage to persist state across browser sessions
 */
export const useStore = create<Store>()(
  persist<Store>(immer(store), {
    name: "upload-store",
    getStorage: () => sessionStorage,
    // Drop holes a previous session may have persisted into the lists (see
    // `fileUploaded`); a `null` entry would otherwise crash the upload list on
    // every render, with no way to recover from inside the UI.
    merge: (persisted, current) => {
      const slice = (persisted as Partial<Store> | undefined)?.zustandupload;
      if (!slice) return current;
      return {
        ...current,
        zustandupload: {
          ...current.zustandupload,
          ...slice,
          files: (slice.files ?? []).filter(Boolean),
          pending: (slice.pending ?? []).filter(Boolean),
          uploaded: (slice.uploaded ?? []).filter(Boolean),
        },
      };
    },
  }),
);

// Types and store are exported directly above
