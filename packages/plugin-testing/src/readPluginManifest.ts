import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { validatePluginMetadata } from "@workspace/plugin-system";

import type { PluginManifest } from "./types";

/**
 * Read `<pluginDir>/plugin.json` from disk and run it through the shared
 * {@link validatePluginMetadata} runtime validator.
 *
 * Contract-test harness entry point. Throws with a single, aggregated error
 * message if the manifest is malformed, so that test failures point directly
 * at the offending plugin instead of a downstream ReferenceError.
 */
export async function readPluginManifest(pluginDir: string): Promise<PluginManifest> {
  const manifestPath = resolve(pluginDir, "plugin.json");
  let raw: string;
  try {
    raw = await readFile(manifestPath, "utf8");
  } catch (cause) {
    const reason = cause instanceof Error ? cause.message : String(cause);
    throw new Error(`Failed to read plugin manifest at ${manifestPath}: ${reason}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (cause) {
    const reason = cause instanceof Error ? cause.message : String(cause);
    throw new Error(`Plugin manifest at ${manifestPath} is not valid JSON: ${reason}`);
  }

  const result = validatePluginMetadata(parsed);
  if (!result.valid) {
    throw new Error(
      `Plugin manifest at ${manifestPath} failed validation:\n  - ${result.errors.join("\n  - ")}`,
    );
  }

  return parsed as PluginManifest;
}
