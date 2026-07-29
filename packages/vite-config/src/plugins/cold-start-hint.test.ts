import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { coldStartHintPlugin } from "./cold-start-hint.js";

import type { ViteDevServer } from "vite";

// The hint exists because a cold `pnpm dev` blocks silently for 1–2 minutes
// during dependency pre-bundling before Vite prints anything. It must fire
// exactly when the deps cache is cold (metadata file missing) and stay quiet
// on warm starts, where Vite is fast and already talks on re-optimization.
describe("coldStartHintPlugin", () => {
  let cacheDir: string;
  const info = vi.fn();

  const runConfigureServer = () => {
    const plugin = coldStartHintPlugin();
    const configureServer = plugin.configureServer;
    if (typeof configureServer !== "function") {
      throw new Error("expected configureServer to be a function");
    }
    const server = { config: { cacheDir, logger: { info } } } as unknown as ViteDevServer;
    configureServer.call(plugin, server);
  };

  beforeEach(() => {
    cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), "cold-start-hint-"));
    info.mockClear();
  });

  afterEach(() => {
    fs.rmSync(cacheDir, { recursive: true, force: true });
  });

  it("logs one hint line when the deps cache is cold", () => {
    runConfigureServer();
    expect(info).toHaveBeenCalledTimes(1);
    expect(info.mock.calls[0]?.[0]).toContain("pre-bundling dependencies");
  });

  it("stays silent when the deps cache metadata exists", () => {
    const depsDir = path.join(cacheDir, "deps");
    fs.mkdirSync(depsDir, { recursive: true });
    fs.writeFileSync(path.join(depsDir, "_metadata.json"), "{}");
    runConfigureServer();
    expect(info).not.toHaveBeenCalled();
  });

  it("only applies to the dev server, never to builds", () => {
    expect(coldStartHintPlugin().apply).toBe("serve");
  });
});
