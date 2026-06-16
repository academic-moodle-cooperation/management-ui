import { execFileSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";

/**
 * §9 globalSetup — scaffold + build a throwaway .local-plugin BEFORE Playwright
 * boots the shell dev server, so the dev server's local-plugins scan picks it
 * up. globalTeardown removes it again.
 */
const NAME = "demo-local";

export default function globalSetup(): void {
  rmSync(`.local-plugins/${NAME}`, { recursive: true, force: true });
  execFileSync("pnpm", ["create-plugin", NAME, "--no-pom"], {
    stdio: ["ignore", "ignore", "inherit"],
  });
  execFileSync("pnpm", ["--filter", `@opencast-mui/plugin-${NAME}`, "build"], {
    stdio: ["ignore", "ignore", "inherit"],
  });
  if (!existsSync(`.local-plugins/${NAME}/dist/${NAME}.mjs`)) {
    throw new Error(`§9.2: build did not produce .local-plugins/${NAME}/dist/${NAME}.mjs`);
  }
}
