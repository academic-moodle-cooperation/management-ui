import { describe, expect, it, vi } from "vitest";

import { createStatisticsProvider } from "./statisticsProvider";

import type { EpisodeRef } from "./types";

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

const NOW = new Date("2026-10-12T12:00:00Z");
const episode: EpisodeRef = { id: "mp-1", title: "Lecture 1", seriesName: null, durationMs: null };

const providers = [
  { identifier: "episode.views.sum.matomo", type: "timeseries", resourceType: "episode" },
];

describe("statistics provider", () => {
  it("is unavailable without an episode-level timeseries provider, or on auth redirects", async () => {
    const none = createStatisticsProvider("/api/statistics", () => Promise.resolve(json([])));
    await expect(none.isAvailable()).resolves.toBe(false);

    const unauthorized = createStatisticsProvider("/api/statistics", () =>
      Promise.resolve(new Response("", { status: 401 })),
    );
    await expect(unauthorized.isAvailable()).resolves.toBe(false);
  });

  it("queries the provider for the configured history and folds the series", async () => {
    const fetchImpl = vi.fn((input: string, init?: RequestInit) => {
      if (input.includes("/providers")) return Promise.resolve(json(providers));
      expect(init?.method).toBe("POST");
      const data = JSON.parse(String((init?.body as URLSearchParams).get("data")));
      expect(data).toEqual([
        {
          provider: { identifier: "episode.views.sum.matomo" },
          parameters: {
            resourceId: "mp-1",
            from: "2026-10-05T12:00:00.000Z",
            to: "2026-10-12T12:00:00.000Z",
            dataResolution: "daily",
          },
        },
      ]);
      return Promise.resolve(
        json([
          {
            provider: providers[0],
            parameters: data[0].parameters,
            data: {
              labels: ["2026-10-10", "2026-10-11", "2026-10-12"],
              values: [4, 9, 0],
              total: 13,
            },
          },
        ]),
      );
    });
    const provider = createStatisticsProvider("/api/statistics/", fetchImpl, {
      historyDays: 7,
      now: () => NOW,
    });

    await expect(provider.isAvailable()).resolves.toBe(true);
    const usage = await provider.fetchUsage(episode, 20);

    expect(usage).toEqual({
      episodeId: "mp-1",
      views: 13,
      lastViewedAt: "2026-10-11",
      viewsOverTime: { labels: ["2026-10-10", "2026-10-11", "2026-10-12"], values: [4, 9, 0] },
      watchProfile: null,
      completion: null,
      source: "statistics",
    });
    // The provider list is fetched once and reused.
    expect(fetchImpl.mock.calls.filter(([url]) => url.includes("/providers"))).toHaveLength(1);
  });
});
