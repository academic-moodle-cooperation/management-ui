/**
 * Vite plugin: announce a cold dependency pre-bundle before the silence.
 *
 * On a cold cache (`node_modules/.vite/deps/_metadata.json` missing), Vite
 * blocks `httpServer.listen()` on dependency scanning/pre-bundling of the
 * whole workspace before printing its `ready in … ms` line — with no output
 * in between. In this monorepo that silence is 1–2 minutes on first run
 * (observed ~100 s in a VM), and first-time testers read it as a hang.
 *
 * Vite 6 only logs the cold-start scan at debug level (`DEBUG=vite:deps`);
 * its info-level "Re-optimizing dependencies …" lines fire when a *stale*
 * cache exists, never on a truly cold one, and there is no public
 * optimizeDeps progress hook. So this plugin prints exactly one info line
 * from `configureServer` (which runs before the blocking `listen()`) when
 * the cache is cold. One line only — turbo interleaves output from the
 * whole workspace, so no spinner, no progress updates.
 *
 * Only active in dev (`apply: "serve"`).
 */

import fs from "node:fs";
import path from "node:path";

import type { Plugin } from "vite";

export function coldStartHintPlugin(): Plugin {
  return {
    name: "cold-start-hint",
    apply: "serve",
    configureServer(server) {
      const { cacheDir, logger } = server.config;
      const depsMetadataPath = path.join(cacheDir, "deps", "_metadata.json");
      if (!fs.existsSync(depsMetadataPath)) {
        logger.info(
          "pre-bundling dependencies — a cold first run can take a few minutes with no further output until the server is ready…",
          { timestamp: true },
        );
      }
    },
  };
}
