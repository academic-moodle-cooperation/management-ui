#!/usr/bin/env ts-node
/* eslint-disable no-console */

/**
 * Simple CLI tool to generate a registry entry from a plugin's plugin-metadata.json.
 *
 * Usage:
 *   pnpm ts-node packages/plugin-system/scripts/export-registry.ts ./path/to/plugin-metadata.json
 *
 * This will print a JSON snippet suitable for inclusion in registry.json.
 */

import fs from "node:fs";
import path from "node:path";

import { validatePluginMetadata } from "../src/utils/pluginMetadataValidator";

async function main() {
  const [,, metadataPathArg] = process.argv;

  if (!metadataPathArg) {
    console.error("Usage: export-registry.ts <path-to-plugin-metadata.json>");
    process.exit(1);
  }

  const metadataPath = path.resolve(process.cwd(), metadataPathArg);

  if (!fs.existsSync(metadataPath)) {
    console.error(`File not found: ${metadataPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(metadataPath, "utf8");
  const metadata = JSON.parse(raw);

  const result = validatePluginMetadata(metadata);
  if (!result.valid) {
    console.error("plugin-metadata.json is invalid:");
    for (const err of result.errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }

  // Construct a registry entry according to REGISTRY_REPOSITORY_README.md
  const registryEntry = {
    id: metadata.id,
    name: metadata.name,
    description: metadata.description,
    version: metadata.version,
    author: metadata.author,
    url: metadata.url || "<ADD_CDN_URL_HERE>",
    category: metadata.category,
    icon: metadata.icon,
    tags: metadata.tags,
    repositoryUrl: metadata.repositoryUrl,
    homepageUrl: metadata.homepageUrl,
    license: metadata.license,
    workspaceDependencies: metadata.workspaceDependencies,
    verified: false,
  };

  console.log(JSON.stringify(registryEntry, null, 2));
}

void main();

