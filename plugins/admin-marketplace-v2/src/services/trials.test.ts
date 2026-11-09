// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";

import { findRouteCollisions, getTrials, isTrialActive } from "./trials";

describe("getTrials", () => {
  beforeEach(() => sessionStorage.clear());

  it("keeps a deployed plugin's trial even when it has no version", () => {
    sessionStorage.setItem(
      "mui.marketplace-v2.trials",
      JSON.stringify([
        { kind: "local", id: "other-org", name: "Other Org", version: "", startedAt: "2026-11-05T14:48:36.173Z" },
        { id: "legacy", name: "Legacy", version: "1.0.0", url: "https://x/y.mjs", startedAt: "2026-11-05T14:48:36.173Z" },
        { id: "broken", name: "Broken" },
      ]),
    );
    const trials = getTrials();
    expect(trials.map((t) => [t.id, t.kind])).toEqual([
      ["other-org", "local"],
      ["legacy", "remote"],
    ]);
    expect(isTrialActive("other-org")).toBe(true);
    expect(isTrialActive("broken")).toBe(false);
  });

  it("is empty for unset or malformed storage", () => {
    expect(getTrials()).toEqual([]);
    sessionStorage.setItem("mui.marketplace-v2.trials", "{nope");
    expect(getTrials()).toEqual([]);
  });
});

describe("findRouteCollisions", () => {
  const deployed = [
    { id: "core-episodes:episodes", routePath: "/episodes" },
    { id: "org-support:app", routePath: "/support" },
  ];

  it("names the deployed app that already serves the trial's route", () => {
    const collisions = findRouteCollisions(
      { "support-ui": [{ id: "support-ui:app", routePath: "/support/" }] },
      [...deployed, { id: "support-ui:app", routePath: "/support/" }],
    );
    expect(collisions).toEqual({
      "support-ui": 'Shares route /support with "org-support:app"; only one of them is reachable in this tab.',
    });
  });

  it("ignores routes that only the trial itself registers", () => {
    const collisions = findRouteCollisions(
      { polls: [{ id: "polls:app", routePath: "/polls" }, { id: "polls:results", routePath: "/polls" }] },
      [...deployed, { id: "polls:app", routePath: "/polls" }, { id: "polls:results", routePath: "/polls" }],
    );
    expect(collisions).toEqual({});
  });

  it("reports one collision per trial and leaves clean trials out", () => {
    const collisions = findRouteCollisions(
      {
        a: [
          { id: "a:one", routePath: "episodes" },
          { id: "a:two", routePath: "/support" },
        ],
        b: [{ id: "b:app", routePath: "/b" }],
      },
      [...deployed, { id: "a:one", routePath: "episodes" }, { id: "a:two", routePath: "/support" }, { id: "b:app", routePath: "/b" }],
    );
    expect(Object.keys(collisions)).toEqual(["a"]);
    expect(collisions["a"]).toContain("/episodes");
  });
});
