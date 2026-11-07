import { describe, expect, it, vi } from "vitest";

import { createUsertrackingProvider } from "./usertrackingProvider";

import type { EpisodeRef } from "./types";

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

const html = (): Response =>
  new Response("<!doctype html>", { status: 200, headers: { "content-type": "text/html" } });

const episode: EpisodeRef = { id: "mp-1", title: "Lecture 1", seriesName: null, durationMs: 40_000 };

describe("usertracking provider", () => {
  it("reports unavailable on 404 and on the dev server's HTML fallback", async () => {
    const notFound = createUsertrackingProvider("/usertracking", () =>
      Promise.resolve(new Response("", { status: 404 })),
    );
    await expect(notFound.isAvailable()).resolves.toBe(false);

    const spa = createUsertrackingProvider("/usertracking", () => Promise.resolve(html()));
    await expect(spa.isAvailable()).resolves.toBe(false);

    const down = createUsertrackingProvider("/usertracking", () => Promise.reject(new Error("net")));
    await expect(down.isAvailable()).resolves.toBe(false);
  });

  it("reads views and footprints into a usage record", async () => {
    const fetchImpl = vi.fn((input: string) => {
      if (input.startsWith("/usertracking/stats.json")) {
        return Promise.resolve(json({ stats: { views: "12" } }));
      }
      return Promise.resolve(
        json({
          footprints: {
            footprint: [
              { position: 0, views: 12 },
              { position: 20, views: 6 },
              { position: 39, views: 3 },
            ],
          },
        }),
      );
    });
    const provider = createUsertrackingProvider("/usertracking/", fetchImpl);

    const usage = await provider.fetchUsage(episode, 4);

    expect(fetchImpl).toHaveBeenCalledWith(
      "/usertracking/stats.json?id=mp-1",
      expect.objectContaining({ credentials: "same-origin" }),
    );
    expect(usage).toMatchObject({
      episodeId: "mp-1",
      views: 12,
      source: "usertracking",
      lastViewedAt: null,
      viewsOverTime: null,
    });
    expect(usage.watchProfile).toEqual([1, 0, 0.5, 0.25]);
  });

  it("accepts Opencast's single-object footprint serialisation", async () => {
    const provider = createUsertrackingProvider("/usertracking", (input) =>
      Promise.resolve(
        input.includes("stats.json")
          ? json({ stats: { views: 1 } })
          : json({ footprints: { footprint: { position: 0, views: 1 } } }),
      ),
    );
    const usage = await provider.fetchUsage(episode, 2);
    expect(usage.watchProfile).toEqual([1, 0]);
  });
});
