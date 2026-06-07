import { describe, expect, it, vi } from "vitest";

import { gravatarAvatarUrl } from "./gravatar";

// Mock the hashing collaborator: this unit only cares that the (normalized)
// email is what gets hashed into the URL. sha256's correctness is covered by
// packages/utils/src/sha256.test.ts.
vi.mock("@oc-mui/utils", () => ({
  sha256: (input: string) => `hash(${input})`,
}));

describe("gravatarAvatarUrl", () => {
  // Regression: an anonymous user arrives as a non-null `currentUser` with a
  // null email. We must NOT request gravatar.com in that state — hashing "" and
  // requesting with `d=404` is a guaranteed 404 and a console error.
  it.each([null, undefined, "", "   "])(
    "returns undefined for a missing/blank email (%p)",
    (email) => {
      expect(gravatarAvatarUrl(email)).toBeUndefined();
    },
  );

  it("builds a Gravatar URL from the normalized email for a real email", () => {
    expect(gravatarAvatarUrl("User@Example.com ")).toBe(
      "https://www.gravatar.com/avatar/hash(user@example.com)?s=64&d=404",
    );
  });
});
