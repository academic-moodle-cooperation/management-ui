import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { copyText } from "./index";

// Mock navigator and document
const mockClipboard = {
  writeText: vi.fn().mockResolvedValue(undefined),
};

const mockPermissions = {
  query: vi.fn().mockResolvedValue({ state: "granted" }),
};

describe("copyText", () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock global objects
    Object.defineProperty(global, "navigator", {
      value: {
        clipboard: mockClipboard,
        permissions: mockPermissions,
        userAgent: "test-agent",
      },
      writable: true,
      configurable: true,
    });

    Object.defineProperty(global, "document", {
      value: {
        createElement: vi.fn(() => ({
          setAttribute: vi.fn(),
          value: "",
          focus: vi.fn(),
          select: vi.fn(),
          setSelectionRange: vi.fn(),
        })),
        body: {
          appendChild: vi.fn(),
          removeChild: vi.fn(),
        },
        execCommand: vi.fn().mockReturnValue(true),
      },
      writable: true,
      configurable: true,
    });

    Object.defineProperty(global, "window", {
      value: {
        getSelection: vi.fn(() => ({
          removeAllRanges: vi.fn(),
          addRange: vi.fn(),
        })),
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should copy text to clipboard using modern API when permission is granted", async () => {
    mockPermissions.query.mockResolvedValue({ state: "granted" });
    mockClipboard.writeText.mockResolvedValue(undefined);

    const result = await copyText("test text");

    expect(result).toBe(true);
    expect(mockClipboard.writeText).toHaveBeenCalledWith("test text");
  });

  it("should fallback to execCommand when permission is denied", async () => {
    mockPermissions.query.mockResolvedValue({ state: "denied" });

    const result = await copyText("test text");

    expect(result).toBe(true);
    expect(mockClipboard.writeText).not.toHaveBeenCalled();
    expect(global.document.execCommand).toHaveBeenCalledWith("copy");
  });

  it("should fallback to execCommand when permission query fails", async () => {
    mockPermissions.query.mockRejectedValue(new Error("Permission query failed"));

    const result = await copyText("test text");

    expect(result).toBe(true);
    expect(global.document.execCommand).toHaveBeenCalledWith("copy");
  });

  it("should fallback to execCommand when clipboard.writeText fails", async () => {
    mockPermissions.query.mockResolvedValue({ state: "granted" });
    mockClipboard.writeText.mockRejectedValue(new Error("Write failed"));

    const result = await copyText("test text");

    expect(result).toBe(true);
    expect(global.document.execCommand).toHaveBeenCalledWith("copy");
  });

  it("should handle missing navigator.permissions gracefully", async () => {
    Object.defineProperty(global, "navigator", {
      value: {
        clipboard: mockClipboard,
        userAgent: "test-agent",
      },
      writable: true,
      configurable: true,
    });

    const result = await copyText("test text");

    expect(result).toBe(true);
    expect(global.document.execCommand).toHaveBeenCalledWith("copy");
  });

  it("should handle missing navigator gracefully", async () => {
    Object.defineProperty(global, "navigator", {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const result = await copyText("test text");

    expect(result).toBe(true);
    expect(global.document.execCommand).toHaveBeenCalledWith("copy");
  });
});
