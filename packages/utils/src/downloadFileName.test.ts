import { describe, expect, it } from "vitest";

import { buildDownloadFileName } from "./downloadFileName";

describe("buildDownloadFileName", () => {
  it("should append the extension taken from the track path", () => {
    expect(
      buildDownloadFileName({
        title: "Einführung in die Informatik",
        source: "/media/engage-player/abc/def/video.mp4",
        mimeType: "video/mp4",
      }),
    ).toBe("Einführung in die Informatik.mp4");
  });

  it("should keep the extension when the title itself contains a dot", () => {
    // The reported bug: the browser reads `.2 Einführung` as the extension and
    // saves the file without `.mp4`.
    expect(
      buildDownloadFileName({
        title: "Vorlesung 3.2 Einführung",
        source: "/media/video.mp4",
      }),
    ).toBe("Vorlesung 3.2 Einführung.mp4");
  });

  it("should not append an extension the title already carries", () => {
    expect(
      buildDownloadFileName({
        title: "Vorlesung.mp4",
        source: "/media/video.mp4",
      }),
    ).toBe("Vorlesung.mp4");
  });

  it("should ignore query strings when reading the extension from a URL", () => {
    expect(
      buildDownloadFileName({
        title: "Vorlesung",
        source: "https://media.example.org/media/video.mp4?download=1",
      }),
    ).toBe("Vorlesung.mp4");
  });

  it("should fall back to the MIME type when the path has no extension", () => {
    expect(
      buildDownloadFileName({
        title: "Vorlesung",
        source: "https://media.example.org/api/track/9f2b",
        mimeType: "video/webm",
      }),
    ).toBe("Vorlesung.webm");
  });

  it("should map MIME types whose subtype is not a usable extension", () => {
    expect(buildDownloadFileName({ title: "Podcast", mimeType: "audio/mpeg" })).toBe("Podcast.mp3");
    expect(buildDownloadFileName({ title: "Aufnahme", mimeType: "video/x-matroska" })).toBe(
      "Aufnahme.mkv",
    );
  });

  it("should ignore MIME type parameters", () => {
    expect(buildDownloadFileName({ title: "Vorlesung", mimeType: "video/mp4; codecs=avc1" })).toBe(
      "Vorlesung.mp4",
    );
  });

  it("should replace characters Windows rejects in file names", () => {
    expect(
      buildDownloadFileName({
        title: 'Teil 1/2: "Grundlagen" <Wiederholung>',
        source: "/media/video.mp4",
      }),
    ).toBe("Teil 1_2_ _Grundlagen_ _Wiederholung_.mp4");
  });

  it("should drop trailing dots and spaces that Windows would strip", () => {
    expect(buildDownloadFileName({ title: "Vorlesung ... ", source: "/media/video.mp4" })).toBe(
      "Vorlesung.mp4",
    );
  });

  it("should fall back to the file name from the source when the title is empty", () => {
    expect(buildDownloadFileName({ title: "   ", source: "/media/presenter.mp4" })).toBe(
      "presenter.mp4",
    );
  });

  it("should fall back to a generic name when nothing usable is available", () => {
    expect(buildDownloadFileName({})).toBe("download");
  });

  it("should return the bare title when no extension can be determined", () => {
    expect(buildDownloadFileName({ title: "Vorlesung", source: "/media/track" })).toBe("Vorlesung");
  });

  it("should truncate very long titles", () => {
    const result = buildDownloadFileName({ title: "a".repeat(300), source: "/media/video.mp4" });
    expect(result).toBe(`${"a".repeat(150)}.mp4`);
  });
});
