import { describe, expect, it } from "vitest";

import { claimUpload, isUploadInFlight, releaseUpload } from "./inFlight";

describe("inFlight register", () => {
  it("hands out exactly one claim per file id until it is released", () => {
    expect(claimUpload(7)).toBe(true);
    // A re-mounted upload app (route change and back) asks again for the same file.
    expect(claimUpload(7)).toBe(false);
    expect(isUploadInFlight(7)).toBe(true);

    releaseUpload(7);
    expect(isUploadInFlight(7)).toBe(false);
    expect(claimUpload(7)).toBe(true);
    releaseUpload(7);
  });

  it("keeps claims per file, not globally", () => {
    expect(claimUpload(1)).toBe(true);
    expect(claimUpload(2)).toBe(true);
    releaseUpload(1);
    expect(isUploadInFlight(1)).toBe(false);
    expect(isUploadInFlight(2)).toBe(true);
    releaseUpload(2);
  });

  it("tolerates releasing an id that was never claimed", () => {
    expect(() => releaseUpload(99)).not.toThrow();
    expect(isUploadInFlight(99)).toBe(false);
  });
});
