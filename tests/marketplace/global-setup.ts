import { execFileSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";

/**
 * §11 globalSetup — scaffold + build a real plugin BEFORE the dev server boots,
 * so the shell serves its bundle at /management-ui/local-plugins/<name>/<name>.mjs.
 * The marketplace's "custom URL" install then imports that same-origin URL.
 */
const NAME = "demo-mp";

export default function globalSetup(): void {
  rmSync(`.local-plugins/${NAME}`, { recursive: true, force: true });
  execFileSync("pnpm", ["create-plugin", NAME, "--no-pom"], {
    stdio: ["ignore", "ignore", "inherit"],
  });
  execFileSync("pnpm", ["--filter", `@opencast-mui/plugin-${NAME}`, "build"], {
    stdio: ["ignore", "ignore", "inherit"],
  });
  if (!existsSync(`.local-plugins/${NAME}/dist/${NAME}.mjs`)) {
    throw new Error(`build did not produce .local-plugins/${NAME}/dist/${NAME}.mjs`);
  }
}
