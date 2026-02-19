/**
 * Fragment Extractor Vite Plugin
 *
 * Scans the plugin source for .graphql fragment files and injects them
 * into the bundle as `__injected_fragments__` export for automatic
 * registration with the FragmentRegistry at runtime.
 *
 * This enables zero-config GraphQL extension for community plugins.
 */
import fs from "node:fs";
import path from "node:path";

import type { Plugin } from "vite";

export interface ExtractedFragment {
  /** The GraphQL type this fragment extends (e.g., "Event", "Series") */
  targetType: string;
  /** The fragment name */
  fragmentName: string;
  /** The raw GraphQL fragment content */
  content: string;
}

export interface FragmentExtractorOptions {
  /** Directory to scan for .graphql files (default: "src") */
  srcDir?: string;
  ///** File pattern to match (default: "**/*.graphql" and "**/*.fragment.graphql") */
  patterns?: string[];
}

/**
 * Recursively find all files matching the given extension
 */
function findFiles(dir: string, extension: string): string[] {
  const results: string[] = [];

  if (!fs.existsSync(dir)) {
    return results;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findFiles(fullPath, extension));
    } else if (entry.isFile() && entry.name.endsWith(extension)) {
      results.push(fullPath);
    }
  }

  return results;
}

/**
 * Extract fragment information from GraphQL content
 */
function extractFragmentInfo(content: string): { fragmentName: string; targetType: string } | null {
  // Match: fragment FragmentName on TypeName { ... }
  const match = content.match(/fragment\s+(\w+)\s+on\s+(\w+)/);
  if (match && match[1] && match[2]) {
    return {
      fragmentName: match[1],
      targetType: match[2],
    };
  }
  return null;
}

/**
 * Creates a Vite plugin that extracts GraphQL fragments from source files
 * and injects them into the bundle for automatic runtime registration.
 */
export function fragmentExtractorPlugin(options: FragmentExtractorOptions = {}): Plugin {
  const srcDir = options.srcDir || "src";
  let extractedFragments: ExtractedFragment[] = [];
  let projectRoot = "";

  return {
    name: "community-plugin-fragment-extractor",

    configResolved(config) {
      projectRoot = config.root;
    },

    buildStart() {
      // Scan for .graphql files at build start
      const searchDir = path.resolve(projectRoot, srcDir);
      const graphqlFiles = findFiles(searchDir, ".graphql");

      extractedFragments = [];

      for (const filePath of graphqlFiles) {
        try {
          const content = fs.readFileSync(filePath, "utf8");
          const info = extractFragmentInfo(content);

          if (info) {
            extractedFragments.push({
              targetType: info.targetType,
              fragmentName: info.fragmentName,
              content: content.trim(),
            });
          }
        } catch (error) {
          console.warn(`[fragment-extractor] Failed to read ${filePath}:`, error);
        }
      }

      if (extractedFragments.length > 0) {
        console.log(
          `[fragment-extractor] Found ${extractedFragments.length} GraphQL fragment(s):`,
          extractedFragments.map((f) => `${f.fragmentName} on ${f.targetType}`).join(", "),
        );
      }
    },

    transform(code, id) {
      // Only transform the entry point (index.ts or main entry)
      if (!id.endsWith("index.ts") && !id.endsWith("index.tsx")) {
        return null;
      }

      // Only inject if we have fragments
      if (extractedFragments.length === 0) {
        return null;
      }

      // Inject the fragments as a named export
      const fragmentsJson = JSON.stringify(extractedFragments, null, 2);
      const injection = `\n\n// Auto-injected GraphQL fragments by fragment-extractor plugin\nexport const __injected_fragments__ = ${fragmentsJson};\n`;

      return {
        code: code + injection,
        map: null,
      };
    },
  };
}

export default fragmentExtractorPlugin;
