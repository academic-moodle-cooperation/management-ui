import { describe, expect, it } from "vitest";

import { resolveDownloadUrl } from "./downloadUrl";

describe("resolveDownloadUrl", () => {
  it("should return the fallback URL when no base URL is configured", () => {
    expect(
      resolveDownloadUrl({
        logicalName: "/u_stream/video.mp4",
        fallbackUrl: "https://media.oc.univie.ac.at/u_stream/video.mp4",
      }),
    ).toBe("https://media.oc.univie.ac.at/u_stream/video.mp4");
  });

  it("should return the fallback URL when logicalName is missing", () => {
    expect(
      resolveDownloadUrl({
        baseUrl: "https://admin.oc.univie.ac.at/static",
        fallbackUrl: "https://media.oc.univie.ac.at/u_stream/video.mp4",
      }),
    ).toBe("https://media.oc.univie.ac.at/u_stream/video.mp4");
  });

  it("should join the configured base URL with logicalName", () => {
    expect(
      resolveDownloadUrl({
        baseUrl: "https://admin.oc.univie.ac.at/static",
        logicalName:
          "/u_stream/engage-player/205cdefb-401e-4537-a0cb-6f204501ed40/de025e0e-6a90-4173-a641-fc158618ed9e/video.mp4",
        fallbackUrl: "https://media.oc.univie.ac.at/u_stream/video.mp4",
      }),
    ).toBe(
      "https://admin.oc.univie.ac.at/static/u_stream/engage-player/205cdefb-401e-4537-a0cb-6f204501ed40/de025e0e-6a90-4173-a641-fc158618ed9e/video.mp4",
    );
  });

  it("should normalize duplicate slashes between base URL and logicalName", () => {
    expect(
      resolveDownloadUrl({
        baseUrl: "https://admin.oc.univie.ac.at/static/",
        logicalName: "/u_stream/video.mp4",
      }),
    ).toBe("https://admin.oc.univie.ac.at/static/u_stream/video.mp4");
  });

  it("should return an empty string when neither configured nor fallback URL is available", () => {
    expect(resolveDownloadUrl({})).toBe("");
  });
});
