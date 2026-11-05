// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";

import { getTrials, isTrialActive } from "./trials";

describe("getTrials", () => {
  beforeEach(() => sessionStorage.clear());

  it("keeps a deployed plugin's trial even when it has no version", () => {
    sessionStorage.setItem(
      "mui.marketplace-v2.trials",
      JSON.stringify([
        { kind: "local", id: "tuwien", name: "Tuwien", version: "", startedAt: "2026-11-05T14:48:36.173Z" },
        { id: "legacy", name: "Legacy", version: "1.0.0", url: "https://x/y.mjs", startedAt: "2026-11-05T14:48:36.173Z" },
        { id: "broken", name: "Broken" },
      ]),
    );
    const trials = getTrials();
    expect(trials.map((t) => [t.id, t.kind])).toEqual([
      ["tuwien", "local"],
      ["legacy", "remote"],
    ]);
    expect(isTrialActive("tuwien")).toBe(true);
    expect(isTrialActive("broken")).toBe(false);
  });

  it("is empty for unset or malformed storage", () => {
    expect(getTrials()).toEqual([]);
    sessionStorage.setItem("mui.marketplace-v2.trials", "{nope");
    expect(getTrials()).toEqual([]);
  });
});
