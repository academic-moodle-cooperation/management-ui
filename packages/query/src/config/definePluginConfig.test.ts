import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { z } from "zod";

import type { PluginManager } from "@oc-mui/plugin-system";
import type { AppConfig } from "@oc-mui/ui-config";

import { definePluginConfig } from "./definePluginConfig";

const sampleSchema = z.object({
  label: z.string(),
  enabled: z.boolean().optional(),
});
type SampleConfig = z.infer<typeof sampleSchema>;

const defaults: SampleConfig = { label: "default", enabled: true };

const makeManager = (): PluginManager & {
  registered: Array<{ ext: string; id: string; obj: unknown }>;
} => {
  const registered: Array<{ ext: string; id: string; obj: unknown }> = [];
  return {
    registered,
    registerObject: vi.fn((ext: string, id: string, obj: unknown) => {
      registered.push({ ext, id, obj });
    }),
  } as unknown as PluginManager & { registered: typeof registered };
};

describe("definePluginConfig", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    warnSpy.mockRestore();
  });

  it("registers the defaults under `app:config:defaults` keyed by plugin id", () => {
    const reader = definePluginConfig({ id: "sample", schema: sampleSchema, defaults });
    const manager = makeManager();

    reader.register(manager);

    expect(manager.registered).toEqual([
      {
        ext: "app:config:defaults",
        id: "sample-defaults",
        obj: { plugins: { sample: defaults } },
      },
    ]);
  });

  it("`read` returns validated slice when the config matches the schema", () => {
    const reader = definePluginConfig({ id: "sample", schema: sampleSchema, defaults });
    const config = {
      plugins: { sample: { label: "real", enabled: false } },
    } as unknown as AppConfig;

    expect(reader.read(config)).toEqual({ label: "real", enabled: false });
  });

  it("`read` falls back to defaults and warns when the slice fails validation", () => {
    const reader = definePluginConfig({ id: "sample", schema: sampleSchema, defaults });
    const config = {
      plugins: { sample: { label: 42 } },
    } as unknown as AppConfig;

    const result = reader.read(config);
    expect(result).toEqual(defaults);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    const [message, meta] = warnSpy.mock.calls[0] ?? [];
    expect(message).toContain("plugin:sample");
    expect(message).toContain("validation failed");
    expect(meta).toHaveProperty("issues");
  });

  it("`read` returns defaults silently when the slice is missing", () => {
    const reader = definePluginConfig({ id: "sample", schema: sampleSchema, defaults });
    expect(reader.read({ plugins: {} } as unknown as AppConfig)).toEqual(defaults);
    expect(reader.read(undefined)).toEqual(defaults);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("exposes the raw schema and defaults for introspection", () => {
    const reader = definePluginConfig({ id: "sample", schema: sampleSchema, defaults });
    expect(reader.id).toBe("sample");
    expect(reader.schema).toBe(sampleSchema);
    expect(reader.defaults).toEqual(defaults);
  });
});
