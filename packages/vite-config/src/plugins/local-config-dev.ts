/**
 * Vite plugin: serve a committed default `config.json` in development.
 *
 * The shell fetches its deployment config from an origin-absolute path
 * (`/ui/config/management-ui/config.json` by default). In production that
 * file is served by the Opencast JAR; in dev it is normally proxied to a
 * backend. When no backend is configured, this plugin serves a committed
 * file from disk at the exact fetch path instead — so a developer can edit
 * `apps/shell/public/ui/config/management-ui/config.json` and reload to see
 * the change, with no backend running.
 *
 * Pair it with the proxy gating in `proxy.ts`: when a backend *is* configured
 * (`VITE_PROXY_TARGET`), the config path is proxied and this plugin should not
 * be registered, so the deployment's real config wins. See
 * `apps/shell/vite.config.ts`.
 *
 * Only active in dev (`apply: "serve"`).
 */

import fs from "node:fs";

import { CONFIG_JSON_PATH } from "../proxy.js";

import type { Plugin } from "vite";


export interface LocalConfigDevPluginOptions {
  /** Absolute path to the committed config.json to serve. */
  configFilePath: string;
  /**
   * Origin-absolute request path the shell fetches config from.
   * Defaults to the shell's `productionConfigUrl`.
   */
  requestPath?: string;
}

export function localConfigDevPlugin(options: LocalConfigDevPluginOptions): Plugin {
  const { configFilePath, requestPath = CONFIG_JSON_PATH } = options;

  return {
    name: "local-config-dev",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url?.split("?")[0] ?? "").replace(/\/+$/, "") || "/";
        if (url !== requestPath) {
          next();
          return;
        }

        if (!fs.existsSync(configFilePath) || !fs.statSync(configFilePath).isFile()) {
          // No committed config to serve — let the request fall through
          // (it will 404, surfacing that the file is missing).
          next();
          return;
        }

        try {
          const content = fs.readFileSync(configFilePath, "utf-8");
          res.setHeader("Content-Type", "application/json");
          // Always re-read on each request so edits show up on reload
          // without restarting the dev server.
          res.setHeader("Cache-Control", "no-store");
          res.end(content);
        } catch {
          next();
        }
      });
    },
  };
}
