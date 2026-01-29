import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { isSameOriginUrl } from "./loadAndRegister";
import { transformModuleSource, SHARED_MODULE_NAMES } from "./transform";

describe("transformModuleSource", () => {
  const sharedModules: Record<string, unknown> = {
    react: { default: {}, createElement: vi.fn() },
    "react-dom": { render: vi.fn() },
    "@workspace/plugin-system": { createPlugin: vi.fn() },
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
    expect(SHARED_MODULE_NAMES).toContain("@workspace/plugin-system");
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
    const source = 'import { createPlugin } from "@workspace/plugin-system";';
    const result = transformModuleSource(source);
    for (const name of SHARED_MODULE_NAMES) {
      const varName = `__mod_${name.replace(/[^a-zA-Z0-9]/g, "_")}__`;
      expect(result).toContain(varName);
    }
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
