import { execFileSync } from "node:child_process";
import { rmSync } from "node:fs";

const NAME = "demo-mp";

export default function globalTeardown(): void {
  rmSync(`.local-plugins/${NAME}`, { recursive: true, force: true });
  try {
    execFileSync("git", ["checkout", "--", "pnpm-lock.yaml"], { stdio: "ignore" });
  } catch {
    /* lockfile may be unchanged; ignore */
  }
}
