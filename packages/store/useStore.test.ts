import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";

import { useStore, type Store, type UploadFileBlob, type UploadListType } from "./useStore";

// Mock sessionStorage
const mockSessionStorage = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

// `persist` captured the real storage when the store module was created (imports
// are hoisted above this line), so the rehydration test has to write there.
const realSessionStorage = window.sessionStorage;

Object.defineProperty(window, "sessionStorage", {
  value: mockSessionStorage,
  writable: true,
});

/** A persisted file entry: what `JSON.stringify` leaves of an `UploadFileBlob`. */
const blobForStorage = (id: number) => ({
  file: {},
  id,
  src: `blob:test${id}`,
  name: `test${id}.txt`,
  uploadName: `test${id}.txt`,
  type: "text/plain",
  size: 5,
  progress: 0,
  status: "pending",
});

describe("useStore", () => {
  beforeEach(() => {
    mockSessionStorage.clear();
    // Reset store to initial state
    const { result } = renderHook(() => useStore());
    act(() => {
      result.current.resetUpload();
    });
  });

  describe("setUpload", () => {
    it("should set upload files and seriesId", () => {
      const { result } = renderHook(() => useStore());

      const mockFile: UploadFileBlob = {
        file: new Blob(["test"], { type: "text/plain" }),
        id: 1,
        src: "blob:test",
        name: "test.txt",
        uploadName: "test.txt",
        type: "text/plain",
        size: 4,
        progress: 0,
        status: "pending",
      };

      const upload: UploadListType = {
        files: [mockFile],
        seriesId: "series-123",
        pending: [],
        next: null,
        uploading: false,
        uploaded: [],
        status: "idle",
        uploadError: null,
      };

      act(() => {
        result.current.setUpload(upload);
      });

      expect(result.current.zustandupload.files).toEqual([mockFile]);
      expect(result.current.zustandupload.seriesId).toBe("series-123");
      expect(result.current.zustandupload.status).toBe("LOADED");
    });
  });

  describe("submitUpload", () => {
    it("should set uploading state and move files to pending", () => {
      const { result } = renderHook(() => useStore());

      const mockFile: UploadFileBlob = {
        file: new Blob(["test"], { type: "text/plain" }),
        id: 1,
        src: "blob:test",
        name: "test.txt",
        uploadName: "test.txt",
        type: "text/plain",
        size: 4,
        progress: 0,
        status: "pending",
      };

      act(() => {
        result.current.setUpload({
          files: [mockFile],
          seriesId: "series-123",
          pending: [],
          next: null,
          uploading: false,
          uploaded: [],
          status: "idle",
          uploadError: null,
        });
      });

      act(() => {
        result.current.submitUpload();
      });

      expect(result.current.zustandupload.uploading).toBe(true);
      expect(result.current.zustandupload.pending).toEqual([mockFile]);
      expect(result.current.zustandupload.status).toBe("INIT");
    });
  });

  describe("nextUpload", () => {
    it("should set next file to upload", () => {
      const { result } = renderHook(() => useStore());

      const mockFile: UploadFileBlob = {
        file: new Blob(["test"], { type: "text/plain" }),
        id: 1,
        src: "blob:test",
        name: "test.txt",
        uploadName: "test.txt",
        type: "text/plain",
        size: 4,
        progress: 0,
        status: "pending",
      };

      act(() => {
        result.current.nextUpload(mockFile);
      });

      expect(result.current.zustandupload.next).toEqual(mockFile);
      expect(result.current.zustandupload.status).toBe("PENDING");
    });
  });

  describe("deleteUpload", () => {
    it("should remove file by id", () => {
      const { result } = renderHook(() => useStore());

      const mockFile1: UploadFileBlob = {
        file: new Blob(["test1"], { type: "text/plain" }),
        id: 1,
        src: "blob:test1",
        name: "test1.txt",
        uploadName: "test1.txt",
        type: "text/plain",
        size: 5,
        progress: 0,
        status: "pending",
      };

      const mockFile2: UploadFileBlob = {
        file: new Blob(["test2"], { type: "text/plain" }),
        id: 2,
        src: "blob:test2",
        name: "test2.txt",
        uploadName: "test2.txt",
        type: "text/plain",
        size: 5,
        progress: 0,
        status: "pending",
      };

      act(() => {
        result.current.setUpload({
          files: [mockFile1, mockFile2],
          seriesId: "series-123",
          pending: [],
          next: null,
          uploading: false,
          uploaded: [],
          status: "idle",
          uploadError: null,
        });
      });

      act(() => {
        result.current.deleteUpload(1);
      });

      expect(result.current.zustandupload.files).toHaveLength(1);
      expect(result.current.zustandupload.files[0]?.id).toBe(2);
    });
  });

  describe("resetUpload", () => {
    it("should reset store to initial state", () => {
      const { result } = renderHook(() => useStore());

      const mockFile: UploadFileBlob = {
        file: new Blob(["test"], { type: "text/plain" }),
        id: 1,
        src: "blob:test",
        name: "test.txt",
        uploadName: "test.txt",
        type: "text/plain",
        size: 4,
        progress: 0,
        status: "pending",
      };

      act(() => {
        result.current.setUpload({
          files: [mockFile],
          seriesId: "series-123",
          pending: [],
          next: null,
          uploading: false,
          uploaded: [],
          status: "idle",
          uploadError: null,
        });
      });

      act(() => {
        result.current.resetUpload();
      });

      expect(result.current.zustandupload.files).toEqual([]);
      expect(result.current.zustandupload.seriesId).toBe("");
      expect(result.current.zustandupload.status).toBe("idle");
      expect(result.current.zustandupload.uploading).toBe(false);
    });
  });

  describe("updateFile", () => {
    it("should update file by id", () => {
      const { result } = renderHook(() => useStore());

      const mockFile: UploadFileBlob = {
        file: new Blob(["test"], { type: "text/plain" }),
        id: 1,
        src: "blob:test",
        name: "test.txt",
        uploadName: "test.txt",
        type: "text/plain",
        size: 4,
        progress: 0,
        status: "pending",
      };

      act(() => {
        result.current.setUpload({
          files: [mockFile],
          seriesId: "series-123",
          pending: [],
          next: null,
          uploading: false,
          uploaded: [],
          status: "idle",
          uploadError: null,
        });
      });

      const updatedFile: UploadFileBlob = {
        ...mockFile,
        progress: 50,
        status: "uploading",
      };

      act(() => {
        result.current.updateFile(updatedFile);
      });

      expect(result.current.zustandupload.files[0]?.progress).toBe(50);
      expect(result.current.zustandupload.files[0]?.status).toBe("uploading");
    });

    it("should not update if file id not found", () => {
      const { result } = renderHook(() => useStore());

      const mockFile: UploadFileBlob = {
        file: new Blob(["test"], { type: "text/plain" }),
        id: 1,
        src: "blob:test",
        name: "test.txt",
        uploadName: "test.txt",
        type: "text/plain",
        size: 4,
        progress: 0,
        status: "pending",
      };

      act(() => {
        result.current.setUpload({
          files: [mockFile],
          seriesId: "series-123",
          pending: [],
          next: null,
          uploading: false,
          uploaded: [],
          status: "idle",
          uploadError: null,
        });
      });

      const nonExistentFile: UploadFileBlob = {
        ...mockFile,
        id: 999,
        progress: 50,
      };

      act(() => {
        result.current.updateFile(nonExistentFile);
      });

      expect(result.current.zustandupload.files[0]?.progress).toBe(0);
    });
  });

  describe("fileUploaded", () => {
    const blob = (id: number, status = "pending"): UploadFileBlob => ({
      file: new Blob([`test${id}`], { type: "text/plain" }),
      id,
      src: `blob:test${id}`,
      name: `test${id}.txt`,
      uploadName: `test${id}.txt`,
      type: "text/plain",
      size: 5,
      progress: status === "completed" ? 100 : 0,
      status,
    });

    const queue = (result: { current: Store }, files: UploadFileBlob[]) => {
      act(() => {
        result.current.setUpload({
          files,
          seriesId: "series-123",
          pending: [],
          next: null,
          uploading: false,
          uploaded: [],
          status: "idle",
          uploadError: null,
        });
        result.current.submitUpload();
        result.current.nextUpload(files[0]!);
      });
    };

    it("moves the file to uploaded and derives pending from the store", () => {
      const { result } = renderHook(() => useStore());
      const [one, two] = [blob(1, "completed"), blob(2)];
      queue(result, [one, two]);

      act(() => {
        result.current.fileUploaded(one);
      });

      expect(result.current.zustandupload.next).toBeNull();
      expect(result.current.zustandupload.pending.map((f) => f.id)).toEqual([2]);
      expect(result.current.zustandupload.uploaded.map((f) => f.id)).toEqual([1]);
    });

    it("ignores a stale pending list handed in by the caller", () => {
      const { result } = renderHook(() => useStore());
      const [one, two, three] = [blob(1), blob(2), blob(3)];
      queue(result, [one, two, three]);

      // Two finished first, then a late completion of one reports the list it
      // captured when it started. The old implementation wrote that list back and
      // resurrected two.
      act(() => {
        result.current.fileUploaded(two);
      });
      act(() => {
        result.current.fileUploaded(one, [two, three]);
      });

      expect(result.current.zustandupload.pending.map((f) => f.id)).toEqual([3]);
      expect(result.current.zustandupload.uploaded.map((f) => f.id)).toEqual([2, 1]);
    });

    it("never appends a hole, and lists a file only once", () => {
      const { result } = renderHook(() => useStore());
      const one = blob(1);
      queue(result, [one]);

      // `filesUploaded` has already cleared `files`; a late completion must not
      // turn into `files[-1]` (undefined) in `uploaded`.
      act(() => {
        result.current.filesUploaded();
      });
      act(() => {
        result.current.fileUploaded(one);
        result.current.fileUploaded(one);
      });

      expect(result.current.zustandupload.uploaded).toHaveLength(1);
      expect(result.current.zustandupload.uploaded[0]?.id).toBe(1);
      expect(result.current.zustandupload.uploaded.every(Boolean)).toBe(true);
    });
  });

  describe("rehydration", () => {
    it("drops holes an older version persisted into the lists", async () => {
      const file = { ...blobForStorage(1), status: "completed" };
      realSessionStorage.setItem(
        "upload-store",
        JSON.stringify({
          state: {
            zustandupload: {
              files: [null, file],
              seriesId: "series-123",
              pending: [null],
              next: null,
              uploading: false,
              uploaded: [file, null],
              status: "FILES_UPLOADED",
              uploadError: null,
            },
          },
          version: 0,
        }),
      );

      await useStore.persist.rehydrate();

      const slice = useStore.getState().zustandupload;
      expect(slice.files.map((f) => f.id)).toEqual([1]);
      expect(slice.pending).toEqual([]);
      expect(slice.uploaded.map((f) => f.id)).toEqual([1]);
      expect(slice.seriesId).toBe("series-123");
    });

    it("fills in lists a persisted slice is missing", async () => {
      realSessionStorage.setItem(
        "upload-store",
        JSON.stringify({ state: { zustandupload: { seriesId: "series-9" } }, version: 0 }),
      );

      await useStore.persist.rehydrate();

      const slice = useStore.getState().zustandupload;
      expect(slice.seriesId).toBe("series-9");
      expect(slice.files).toEqual([]);
      expect(slice.pending).toEqual([]);
      expect(slice.uploaded).toEqual([]);
    });

    it("keeps the current state when nothing usable was persisted", async () => {
      const { result } = renderHook(() => useStore());
      act(() => {
        result.current.setUpload({
          files: [],
          seriesId: "series-current",
          pending: [],
          next: null,
          uploading: false,
          uploaded: [],
          status: "idle",
          uploadError: null,
        });
      });
      realSessionStorage.setItem("upload-store", JSON.stringify({ state: {}, version: 0 }));

      await useStore.persist.rehydrate();

      expect(useStore.getState().zustandupload.seriesId).toBe("series-current");
    });
  });

  describe("filesUploaded", () => {
    it("should reset uploading state and clear files", () => {
      const { result } = renderHook(() => useStore());

      const mockFile: UploadFileBlob = {
        file: new Blob(["test"], { type: "text/plain" }),
        id: 1,
        src: "blob:test",
        name: "test.txt",
        uploadName: "test.txt",
        type: "text/plain",
        size: 4,
        progress: 100,
        status: "completed",
      };

      act(() => {
        result.current.setUpload({
          files: [mockFile],
          seriesId: "series-123",
          pending: [],
          next: null,
          uploading: true,
          uploaded: [mockFile],
          status: "uploading",
          uploadError: null,
        });
      });

      act(() => {
        result.current.filesUploaded();
      });

      expect(result.current.zustandupload.uploading).toBe(false);
      expect(result.current.zustandupload.status).toBe("FILES_UPLOADED");
      expect(result.current.zustandupload.files).toEqual([]);
    });
  });

  describe("setUploadError", () => {
    it("should set upload error", () => {
      const { result } = renderHook(() => useStore());

      const error = new Error("Upload failed");

      act(() => {
        result.current.setUploadError(error);
      });

      expect(result.current.zustandupload.uploadError).toEqual(error);
    });
  });
});
