import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { isSameOriginUrl } from "./loadAndRegister";
import { transformModuleSource, SHARED_MODULE_NAMES } from "./transform";

describe("transformModuleSource", () => {
  const sharedModules: Record<string, unknown> = {
    react: { default: {}, createElement: vi.fn() },
    "react-dom": { render: vi.fn() },
    "@opencast-mui/plugin-system": { createPlugin: vi.fn() },
  };

  beforeEach(() => {
    (globalThis as unknown as { __SHARED_MODULES__?: Record<string, unknown> }).__SHARED_MODULES__ =
      sharedModules;
  });

  afterEach(() => {
    delete (globalThis as unknown as { __SHARED_MODULES__?: Record<string, unknown> }).__SHARED_MODULES__;
  });

  it("exports SHARED_MODULE_NAMES with expected modules", () => {
    expect(SHARED_MODULE_NAMES).toContain("react");
    expect(SHARED_MODULE_NAMES).toContain("react-dom");
    expect(SHARED_MODULE_NAMES).toContain("@opencast-mui/plugin-system");
  });

  it("returns source unchanged when __SHARED_MODULES__ is missing", () => {
    delete (globalThis as unknown as { __SHARED_MODULES__?: Record<string, unknown> }).__SHARED_MODULES__;
    const source = 'import { createElement } from "react";';
    expect(transformModuleSource(source)).toBe(source);
  });

  it("replaces named import from react with shim", () => {
    const source = 'import { createElement } from "react";';
    const result = transformModuleSource(source);
    expect(result).toContain("__SHARED_MODULES__");
    expect(result).toContain("const { createElement } = __mod_react__");
    expect(result).not.toMatch(/import\s+.*\s+from\s+["']react["']/);
  });

  it("replaces default import with .default fallback", () => {
    const source = 'import React from "react";';
    const result = transformModuleSource(source);
    expect(result).toContain("const React = __mod_react__.default || __mod_react__");
  });

  it("replaces namespace import", () => {
    const source = 'import * as React from "react";';
    const result = transformModuleSource(source);
    expect(result).toContain("const React = __mod_react__");
  });

  it("replaces mixed default + named import", () => {
    const source = 'import React, { createElement } from "react";';
    const result = transformModuleSource(source);
    expect(result).toContain("const React = __mod_react__.default || __mod_react__");
    expect(result).toContain("const { createElement } = __mod_react__");
  });

  it("includes preamble with all shared module vars", () => {
    const source = 'import { createPlugin } from "@opencast-mui/plugin-system";';
    const result = transformModuleSource(source);
    for (const name of SHARED_MODULE_NAMES) {
      const varName = `__mod_${name.replace(/[^a-zA-Z0-9]/g, "_")}__`;
      expect(result).toContain(varName);
    }
  });

  it("normalizes absolute plugin script URLs without prefixing origin twice", () => {
    const source = 'export default { name: "plugin" };';
    const result = transformModuleSource(
      source,
      "http://127.0.0.1:3000/management-ui/local-plugins/example-org/example-org.mjs",
    );

    expect(result).toContain(
      'const __PLUGIN_BASE_URL__ = "http://127.0.0.1:3000/management-ui/local-plugins/example-org/";',
    );
    expect(result).toContain("new URL(__PLUGIN_BASE_URL__, window.location.href).href");
    expect(result).not.toContain("window.location.origin + __PLUGIN_BASE_URL__");
  });

  it("normalizes relative plugin script URLs against the current location", () => {
    const source = 'export default { name: "plugin" };';
    const result = transformModuleSource(
      source,
      "/management-ui/static/plugins/example-org/example-org.mjs",
    );

    expect(result).toContain(
      'const __PLUGIN_BASE_URL__ = "/management-ui/static/plugins/example-org/";',
    );
    expect(result).toContain("new URL(__PLUGIN_BASE_URL__, window.location.href).href");
  });

  it("rewrites @opencast-mui/app-runtime imports (now a host-provided shared module)", () => {
    expect(SHARED_MODULE_NAMES).toContain("@opencast-mui/app-runtime");
    const source = 'import { AdaptiveAppWrapper } from "@opencast-mui/app-runtime";';
    const result = transformModuleSource(source);
    expect(result).toContain("AdaptiveAppWrapper } =");
    expect(result).not.toMatch(/import\s+\{[^}]*\}\s+from\s+["']@opencast-mui\/app-runtime["']/);
  });

  it("logs a clear error when a plugin imports an @opencast-mui package the host doesn't provide", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    transformModuleSource('import { useStore } from "@opencast-mui/store";');
    const logged = errorSpy.mock.calls.map((call) => String(call[0])).join("\n");
    expect(logged).toMatch(/does not provide.*@opencast-mui\/store/);
    errorSpy.mockRestore();
  });
});

describe("isSameOriginUrl", () => {
  it("returns true for same-origin or relative URL", () => {
    expect(isSameOriginUrl("/static/plugins/quiz/quiz.mjs")).toBe(true);
    expect(isSameOriginUrl(window.location.origin + "/foo")).toBe(true);
  });

  it("returns false for different-origin URL", () => {
    expect(isSameOriginUrl("https://cdn.jsdelivr.net/gh/org/plugin.mjs")).toBe(false);
  });
});
