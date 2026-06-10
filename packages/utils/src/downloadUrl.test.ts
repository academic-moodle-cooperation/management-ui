import { describe, expect, it } from "vitest";

import { resolveDownloadUrl } from "./downloadUrl";

describe("resolveDownloadUrl", () => {
  it("should return the fallback URL when no base URL is configured", () => {
    expect(
      resolveDownloadUrl({
        logicalName: "/media/video.mp4",
        fallbackUrl: "https://media.example.org/media/video.mp4",
      }),
    ).toBe("https://media.example.org/media/video.mp4");
  });

  it("should return the fallback URL when logicalName is missing", () => {
    expect(
      resolveDownloadUrl({
        baseUrl: "https://opencast.example.org/static",
        fallbackUrl: "https://media.example.org/media/video.mp4",
      }),
    ).toBe("https://media.example.org/media/video.mp4");
  });

  it("should join the configured base URL with logicalName", () => {
    expect(
      resolveDownloadUrl({
        baseUrl: "https://opencast.example.org/static",
        logicalName:
          "/media/engage-player/205cdefb-401e-4537-a0cb-6f204501ed40/de025e0e-6a90-4173-a641-fc158618ed9e/video.mp4",
        fallbackUrl: "https://media.example.org/media/video.mp4",
      }),
    ).toBe(
      "https://opencast.example.org/static/media/engage-player/205cdefb-401e-4537-a0cb-6f204501ed40/de025e0e-6a90-4173-a641-fc158618ed9e/video.mp4",
    );
  });

  it("should normalize duplicate slashes between base URL and logicalName", () => {
    expect(
      resolveDownloadUrl({
        baseUrl: "https://opencast.example.org/static/",
        logicalName: "/media/video.mp4",
      }),
    ).toBe("https://opencast.example.org/static/media/video.mp4");
  });

  it("should return an empty string when neither configured nor fallback URL is available", () => {
    expect(resolveDownloadUrl({})).toBe("");
  });
});
