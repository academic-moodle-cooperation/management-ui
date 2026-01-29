#!/usr/bin/env node
/**
 * Validates registry.json: schema, unique IDs, and optional URL reachability.
 * Run: node validate-registry.js
 * Optional: SKIP_URL_CHECK=1 to skip HEAD requests to plugin URLs (e.g. in CI with private URLs).
 */
const fs = require("fs");
const path = require("path");

const registryPath = path.join(__dirname, "registry.json");
const skipUrlCheck = process.env.SKIP_URL_CHECK === "1";

async function validate() {
  const raw = fs.readFileSync(registryPath, "utf8");
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    throw new Error(`Invalid JSON: ${e.message}`);
  }

  if (!data.plugins || !Array.isArray(data.plugins)) {
    throw new Error("registry.json must have a 'plugins' array");
  }

  const ids = new Set();
  const categories = new Set(["feature", "theme", "integration", "utility", "experimental"]);

  for (const plugin of data.plugins) {
    if (!plugin.id || typeof plugin.id !== "string") {
      throw new Error(`Plugin missing required field 'id'`);
    }
    if (!plugin.name || typeof plugin.name !== "string") {
      throw new Error(`Plugin "${plugin.id}" missing required field 'name'`);
    }
    if (!plugin.description || typeof plugin.description !== "string") {
      throw new Error(`Plugin "${plugin.id}" missing required field 'description'`);
    }
    if (!plugin.version || typeof plugin.version !== "string") {
      throw new Error(`Plugin "${plugin.id}" missing required field 'version'`);
    }
    if (!plugin.author || typeof plugin.author !== "object" || !plugin.author.name) {
      throw new Error(`Plugin "${plugin.id}" missing required field 'author.name'`);
    }
    if (!plugin.url || typeof plugin.url !== "string") {
      throw new Error(`Plugin "${plugin.id}" missing required field 'url'`);
    }
    if (!plugin.category || !categories.has(plugin.category)) {
      throw new Error(
        `Plugin "${plugin.id}" must have 'category' one of: ${[...categories].join(", ")}`
      );
    }

    if (ids.has(plugin.id)) {
      throw new Error(`Duplicate plugin ID: ${plugin.id}`);
    }
    ids.add(plugin.id);

    if (!skipUrlCheck && plugin.url.startsWith("http")) {
      try {
        const res = await fetch(plugin.url, { method: "HEAD", redirect: "follow" });
        if (!res.ok) {
          throw new Error(`URL returned ${res.status}`);
        }
      } catch (err) {
        throw new Error(`Plugin "${plugin.id}" URL unreachable: ${err.message}`);
      }
    }
  }

  console.log("✅ Registry valid (" + data.plugins.length + " plugin(s)).");
}

validate().catch((err) => {
  console.error("❌ Validation failed:", err.message);
  process.exit(1);
});
