import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

/**
 * The package must never import itself by its own name (`@oc-mui/ui/...`).
 *
 * Such specifiers only resolve inside the monorepo via a tsconfig `paths`
 * alias; they survive into the emitted `.d.ts`, where API Extractor resolves
 * them back to source (#260) and standalone consumers resolve them against
 * their own node_modules copy. shadcn's generator writes imports in exactly
 * this form (see components.json), so newly added components trip this test
 * until their imports are rewritten to relative paths.
 */

const srcDir = resolve(fileURLToPath(import.meta.url), "..");

const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return walk(path);
    return /\.(ts|tsx)$/.test(entry.name) ? [path] : [];
  });

const importPattern = /^\s*(?:import|export)[^\n"']*["']@oc-mui\/ui(?:["'/])/m;

describe("no self-imports", () => {
  it("no source file imports @oc-mui/ui by package name", () => {
    const offenders = walk(srcDir)
      .filter((file) => importPattern.test(readFileSync(file, "utf8")))
      .map((file) => file.slice(srcDir.length + 1));
    expect(offenders).toEqual([]);
  });
});
