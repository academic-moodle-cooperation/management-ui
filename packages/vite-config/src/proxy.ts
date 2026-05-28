import type { IncomingMessage, ServerResponse } from "node:http";
import type { Socket } from "node:net";
import type { ProxyOptions } from "vite";

export interface CreateProxyConfigOptions {
  isProduction: boolean;
  target?: string;
  customProxies?: Record<string, string | ProxyOptions>;
}

const viteProxyTargetEnv =
  (typeof process !== "undefined" && process.env["VITE_PROXY_TARGET"]) || undefined;
const defaultBackendTarget = viteProxyTargetEnv || "http://localhost:8080";

// The path the shell fetches its deployment config from. Special-cased in
// createProxyConfig: when no backend is *explicitly* configured we leave this
// path un-proxied so `localConfigDevPlugin` can serve a committed default
// config.json locally — letting devs edit config + reload without a backend.
// When a backend is requested (VITE_PROXY_TARGET set, or an explicit target
// passed) the deployment's real config.json wins via the proxy as before.
export const CONFIG_JSON_PATH = "/ui/config/management-ui/config.json";

const defaultProxyPaths: Record<string, string | ProxyOptions> = {
  "/j_spring_security_login": "",
  "/j_spring_security_check": "",
  "/j_spring_security_logout": "",
  // Opencast's Spring Security login form. A GET to /j_spring_security_login
  // 302-redirects here, so without proxying it the browser lands on a
  // /login.html URL the Vite SPA fallback can't serve — which re-runs the
  // shell, re-triggers the auth redirect, and loops. Proxy it to the
  // backend, which serves the real form (runtime-info-ui module).
  "/login.html": "",
  "/management-tool/ui/config/plugins.json": "",
  "/info/me.json": "",
  "/ui/config/management-ui/config.json": "",
  "/admin-ng": "",
  "/graphql": "",
  "/graphql-ui": "",
  "/static": "", // This might need careful handling if apps have their own /static
  "/play": "",
  "/paella7": "",
  "/editor-ui": "",
  "/editor": "",
  "/studio": "",
  "/ingest": "",
  "/api": "",
};

/**
 * Narrow `error`'s `res` parameter — it can be either an HTTP response
 * (for normal requests) or a raw Socket (for websocket upgrades). Only
 * the HTTP response has `writeHead` / `end` and is safe to respond on.
 */
function isHttpResponse(res: ServerResponse | Socket): res is ServerResponse {
  return (
    typeof (res as ServerResponse).writeHead === "function" &&
    typeof (res as ServerResponse).end === "function"
  );
}

// Track which proxy targets have already had a "not reachable" message
// printed in this dev session. We only want to surface the friendly
// message once per target — every failed request would otherwise spam
// the terminal with the same notice.
const warnedTargets = new Set<string>();

/**
 * Attach a friendly error handler to a Vite proxy entry. Replaces
 * `http-proxy`'s default ECONNREFUSED noise (an AggregateError stack
 * trace, printed for every blocked request) with a single, actionable
 * message per unreachable backend target.
 *
 * For any other proxy error type, fall back to the default behaviour
 * so genuine bugs aren't silenced.
 */
function attachFriendlyErrorHandler(
  options: ProxyOptions,
  target: string,
): ProxyOptions {
  return {
    ...options,
    configure: (proxy) => {
      // Preserve a user-supplied `configure` if there is one.
      if (typeof options.configure === "function") {
        options.configure(proxy, options);
      }

      proxy.on(
        "error",
        (
          err: NodeJS.ErrnoException,
          _req: IncomingMessage,
          res: ServerResponse | Socket,
        ) => {
          const isConnRefused =
            err.code === "ECONNREFUSED" ||
            (err.message?.includes("ECONNREFUSED") ?? false);

          if (isConnRefused && !warnedTargets.has(target)) {
            warnedTargets.add(target);
            const lines = [
              "",
              "┌─ Backend not reachable " + "─".repeat(48),
              `│ Vite tried to proxy a request to: ${target}`,
              "│ Nothing is listening there. The shell can't load config.json,",
              "│ plugins.json, /info/me.json, or /graphql until a backend is up.",
              "│",
              "│ Two ways to fix:",
              "│",
              "│   1. Start your local Opencast (or whatever serves these endpoints).",
              "│      The shell will pick it up on the next request — no restart needed.",
              "│",
              "│   2. Point Vite at a different backend:",
              "│        VITE_PROXY_TARGET=https://your-staging.example.org pnpm dev",
              "│",
              "│ Or skip the backend entirely if you're only working on plugins:",
              "│ see docs/getting-started/installation.md → 'Configure the backend'.",
              "│",
              "│ Further ECONNREFUSED hits against this target will be silenced.",
              "└" + "─".repeat(72),
              "",
            ];
            console.warn(lines.join("\n"));

            // Best-effort: respond to the failed request with a 502 so
            // the browser stops hanging, instead of the default "no
            // response at all". Mirrors what http-proxy's default
            // handler does on ECONNREFUSED. Skip for websocket upgrades
            // (where `res` is a raw Socket without writeHead/end).
            if (isHttpResponse(res)) {
              try {
                res.writeHead(502, { "Content-Type": "application/json" });
                res.end(
                  JSON.stringify({
                    error: "Bad Gateway",
                    message: `Backend not reachable at ${target}`,
                    hint: "See terminal where `pnpm dev` is running for setup instructions.",
                  }),
                );
              } catch {
                /* response may already be closed; nothing to do */
              }
            }
            return;
          }

          // Either it's not ECONNREFUSED, or it's the same target we
          // already warned about. Either way, no extra noise from us —
          // let http-proxy's default handling continue.
        },
      );
    },
  };
}

export function createProxyConfig(
  options?: CreateProxyConfigOptions,
): Record<string, string | ProxyOptions> {
  // A backend is "explicitly configured" when the caller passes a target or
  // VITE_PROXY_TARGET is set. Absent that, the config path is served locally.
  const explicitTarget = options?.target ?? viteProxyTargetEnv;
  const target = explicitTarget || defaultBackendTarget;

  const resolvedProxies: Record<string, string | ProxyOptions> = {};

  // Populate default proxies with the target. Each entry gets the
  // friendly error handler attached so the ECONNREFUSED spam becomes
  // a single readable message.
  for (const path in defaultProxyPaths) {
    const pathConfig = defaultProxyPaths[path];
    if (pathConfig === undefined) continue;
    // Without an explicit backend, leave the config path un-proxied so the
    // committed default config.json is served locally (localConfigDevPlugin).
    if (path === CONFIG_JSON_PATH && !explicitTarget) continue;
    const baseOptions: ProxyOptions =
      typeof pathConfig === "string"
        ? { target }
        : { ...pathConfig, target: pathConfig.target ?? target };
    resolvedProxies[path] = attachFriendlyErrorHandler(baseOptions, target);
  }

  // Add or override with custom proxies. Friendly handler attaches to
  // these too — same UX whether the path is default or app-supplied.
  if (options?.customProxies) {
    for (const path in options.customProxies) {
      const customConfig = options.customProxies[path];
      const baseOptions: ProxyOptions =
        typeof customConfig === "string"
          ? { target: customConfig }
          : customConfig?.target
            ? customConfig
            : { ...(customConfig ?? {}), target };
      // ProxyOptions.target can be a URL or other shapes; the friendly
      // handler only needs a stable string for keying warnedTargets and
      // for printing.
      const targetForHandler =
        typeof baseOptions.target === "string"
          ? baseOptions.target
          : (baseOptions.target?.toString() ?? target);
      resolvedProxies[path] = attachFriendlyErrorHandler(baseOptions, targetForHandler);
    }
  }

  return resolvedProxies;
}
