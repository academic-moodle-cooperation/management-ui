/**
 * Upload Store - Manages file upload state using Zustand with Immer
 * This store handles file upload queuing, progress tracking, and state persistence
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { produce } from "immer";

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
  fileUploaded: (uploadFile: UploadFileBlob, pending: UploadFileBlob[]) => void;
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
        (fileItem: UploadFileBlob) => fileItem?.id === updateFileInfo.id
      );

      if (updateFileIndex === -1) return state.zustandupload;

      state.zustandupload.files[updateFileIndex] = {
        ...state.zustandupload.files[updateFileIndex],
        ...updateFileInfo,
      };
    });
  },

  fileUploaded: (uploadFile: UploadFileBlob, pending: UploadFileBlob[]) => {
    const updateFileIndex = get().zustandupload?.files.findIndex(
      (fileItem) => fileItem?.id === uploadFile.id
    );

    return set((state: Store) => {
      state.zustandupload.next = null;
      state.zustandupload.pending = pending;
      state.zustandupload.uploaded = [
        ...state.zustandupload.uploaded,
        state.zustandupload.files[updateFileIndex] as UploadFileBlob,
      ];
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
  })
);

// Types and store are exported directly above
