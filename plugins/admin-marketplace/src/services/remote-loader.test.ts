import { describe, expect, it } from "vitest";

import type { PluginManager } from "@opencast-mui/plugin-system";

import { RemoteLoader } from "./remote-loader";

import type { RegistryPlugin } from "./registry-fetcher";

// We never reach the network call: `loadAndRegister` rejects on the
// apiVersion gate before delegating to `@opencast-mui/remote-plugin-loader`,
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

describe("RemoteLoader.loadAndRegister shared-dependency gate", () => {
  // The marketplace gate now flows through `checkSharedDependencyCompatibility`
  // (the canonical checker shared with the JAR and .local-plugins loaders),
  // adapted via `securityService.checkVersionCompatibility`. As with the
  // apiVersion gate, these cases reject before the network call.
  it("rejects a plugin whose workspaceDependencies target an incompatible major", async () => {
    const result = await RemoteLoader.loadAndRegister(baseMetadata.url, fakeManager, {
      ...baseMetadata,
      // Host ships @opencast-mui/ui major 1; a plugin asking for major 2 is rejected.
      workspaceDependencies: { "@opencast-mui/ui": "^2.0.0" },
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/@opencast-mui\/ui/);
    expect(result.error).toMatch(/major 2/);
  });

  it("rejects a plugin that declares an unparseable shared-dependency range", async () => {
    const result = await RemoteLoader.loadAndRegister(baseMetadata.url, fakeManager, {
      ...baseMetadata,
      workspaceDependencies: { "@opencast-mui/ui": "not-a-range" },
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/unparseable/i);
  });
});
