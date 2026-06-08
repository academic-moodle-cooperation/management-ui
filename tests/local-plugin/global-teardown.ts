import { execFileSync } from "node:child_process";
import { rmSync } from "node:fs";

/** §9 globalTeardown — remove the scaffold and restore the lockfile that
 *  `pnpm create-plugin` touched. */
const NAME = "demo-local";

export default function globalTeardown(): void {
  rmSync(`.local-plugins/${NAME}`, { recursive: true, force: true });
  try {
    execFileSync("git", ["checkout", "--", "pnpm-lock.yaml"], { stdio: "ignore" });
  } catch {
    /* lockfile may be unchanged; ignore */
  }
}
