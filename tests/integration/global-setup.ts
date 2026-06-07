import { execFileSync } from "node:child_process";

import {
  HEALTH_TIMEOUT_MS,
  HINKELSTEIN_PODMAN_DIR,
  OPENCAST_AUTOSTART,
  OPENCAST_BASE_URL,
  OPENCAST_HEALTH_PATH,
  OPENCAST_VERSION,
} from "./opencast-env";

/**
 * Playwright globalSetup for the integration-E2E project.
 *
 * The contract is deliberately small: make sure a real Opencast is answering at
 * OPENCAST_BASE_URL before any spec runs. We do NOT build Hinkelstein from
 * sources here — that compiles Opencast (minutes to hours, and may need VPN
 * access to univie infra). The expectation is "your podman Opencast is already
 * up"; autostart is an opt-in convenience, not the default path.
 *
 * See docs/operations/test-automation-plan.md → "Fixture design".
 */

const HEALTH_URL = `${OPENCAST_BASE_URL}${OPENCAST_HEALTH_PATH}`;

async function probe(): Promise<boolean> {
  try {
    const res = await fetch(HEALTH_URL, {
      method: "GET",
      // /info/me.json is public; we only care that Opencast answers at all.
      redirect: "manual",
      signal: AbortSignal.timeout(5_000),
    });
    return res.status >= 200 && res.status < 400;
  } catch {
    return false;
  }
}

async function waitForHealthy(timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  let attempt = 0;
  while (Date.now() < deadline) {
    if (await probe()) return true;
    attempt += 1;
    if (attempt % 5 === 0) {
      const left = Math.round((deadline - Date.now()) / 1000);
      console.log(`[integration] waiting for Opencast at ${HEALTH_URL} (~${left}s left)`);
    }
    await new Promise((r) => setTimeout(r, 2_000));
  }
  return false;
}

function tryAutostart(): void {
  if (!HINKELSTEIN_PODMAN_DIR) {
    throw new Error(
      "OPENCAST_AUTOSTART is set but HINKELSTEIN_PODMAN_DIR is not — " +
        "point it at your hinkelstein-podman checkout so I can run runtime.sh.",
    );
  }
  if (!OPENCAST_VERSION) {
    throw new Error(
      "OPENCAST_AUTOSTART is set but OPENCAST_VERSION is not — " +
        "set it to the Opencast major version you run (e.g. 18).",
    );
  }
  console.log(
    `[integration] Opencast not up; running runtime.sh start ${OPENCAST_VERSION} ` +
      `in ${HINKELSTEIN_PODMAN_DIR}`,
  );
  // runtime.sh backgrounds podman-compose itself; this returns once the stack
  // is launching. We then fall back to polling the health endpoint below.
  execFileSync("./runtime.sh", ["start", OPENCAST_VERSION], {
    cwd: HINKELSTEIN_PODMAN_DIR,
    stdio: "inherit",
  });
}

export default async function globalSetup(): Promise<void> {
  if (await probe()) {
    console.log(`[integration] Opencast healthy at ${HEALTH_URL}`);
    return;
  }

  if (OPENCAST_AUTOSTART) {
    tryAutostart();
  }

  const healthy = await waitForHealthy(HEALTH_TIMEOUT_MS);
  if (!healthy) {
    throw new Error(
      [
        `Opencast is not reachable at ${HEALTH_URL}.`,
        "",
        "Start your podman Opencast first, e.g.:",
        "  cd hinkelstein-podman && ./runtime.sh start <version>",
        "",
        "If 'opencast-runtime' doesn't resolve, add to /etc/hosts:",
        "  127.0.0.1 opencast-runtime",
        "",
        "Or point the suite elsewhere:  OPENCAST_BASE_URL=http://localhost:8080",
        "Or let me start it:            OPENCAST_AUTOSTART=1 HINKELSTEIN_PODMAN_DIR=... OPENCAST_VERSION=18",
      ].join("\n"),
    );
  }
  console.log(`[integration] Opencast healthy at ${HEALTH_URL}`);
}
