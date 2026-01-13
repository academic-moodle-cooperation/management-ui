import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";

import { useStore, type UploadFileBlob, type UploadListType } from "./useStore";

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

Object.defineProperty(window, "sessionStorage", {
  value: mockSessionStorage,
  writable: true,
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
    it("should move file to uploaded and update pending", () => {
      const { result } = renderHook(() => useStore());

      const mockFile1: UploadFileBlob = {
        file: new Blob(["test1"], { type: "text/plain" }),
        id: 1,
        src: "blob:test1",
        name: "test1.txt",
        uploadName: "test1.txt",
        type: "text/plain",
        size: 5,
        progress: 100,
        status: "completed",
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
          pending: [mockFile1, mockFile2],
          next: mockFile1,
          uploading: true,
          uploaded: [],
          status: "uploading",
          uploadError: null,
        });
      });

      act(() => {
        result.current.fileUploaded(mockFile1, [mockFile2]);
      });

      expect(result.current.zustandupload.next).toBeNull();
      expect(result.current.zustandupload.pending).toEqual([mockFile2]);
      expect(result.current.zustandupload.uploaded).toHaveLength(1);
      expect(result.current.zustandupload.uploaded[0]?.id).toBe(1);
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
