import { describe, expect, it } from "vitest";

import type { PluginManager } from "@workspace/plugin-system";

import { RemoteLoader } from "./remote-loader";

import type { RegistryPlugin } from "./registry-fetcher";

// We never reach the network call: `loadAndRegister` rejects on the
// apiVersion gate before delegating to `@workspace/remote-plugin-loader`,
// so a no-op manager stub is enough.
const fakeManager = {} as unknown as PluginManager;

const baseMetadata: RegistryPlugin = {
  id: "rejected-plugin",
  name: "Rejected Plugin",
  description: "Asks for a future major.",
  version: "1.0.0",
  author: { name: "Tests" },
  url: "https://cdn.jsdelivr.net/npm/rejected-plugin@1.0.0/dist/plugin.mjs",
  category: "feature",
};

describe("RemoteLoader.loadAndRegister apiVersion gate", () => {
  it("rejects a plugin whose apiVersion declares an incompatible major", async () => {
    const result = await RemoteLoader.loadAndRegister(baseMetadata.url, fakeManager, {
      ...baseMetadata,
      apiVersion: "2.0.0",
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/rejected/i);
    expect(result.error).toMatch(/major 2/);
  });

  it("rejects a plugin whose apiVersion declares an incompatible minor", async () => {
    const result = await RemoteLoader.loadAndRegister(baseMetadata.url, fakeManager, {
      ...baseMetadata,
      // 1.99 is well above the host's 1.x minor; rejected.
      apiVersion: "1.99.0",
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/minor/);
  });

  it("rejects a plugin whose apiVersion is not a valid semver", async () => {
    const result = await RemoteLoader.loadAndRegister(baseMetadata.url, fakeManager, {
      ...baseMetadata,
      apiVersion: "not-a-version",
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/not a valid semver/);
  });
});
