import { describe, expect, it } from "vitest";

import type { CreateSeriesVariant } from "@oc-mui/plugin-core";

import { selectCreateSeriesVariants } from "./createSeriesVariants";

const Noop = () => null;

const variant = (overrides: Partial<CreateSeriesVariant> & { id: string }): CreateSeriesVariant => ({
  label: `test:${overrides.id}`,
  component: Noop,
  ...overrides,
});

describe("selectCreateSeriesVariants", () => {
  const defaultVariant = variant({ id: "default", order: 100 });
  const course = variant({ id: "acme-course", order: 10, requiredRoles: ["ROLE_LECTURER"] });
  const custom = variant({ id: "acme-custom", order: 20 });

  it("returns every registered variant in order when nothing is configured", () => {
    expect(
      selectCreateSeriesVariants([defaultVariant, custom, course], undefined, [
        "ROLE_USER",
        "ROLE_LECTURER",
      ]).map((v) => v.id),
    ).toEqual(["acme-course", "acme-custom", "default"]);
  });

  it("returns nothing when the feature is switched off", () => {
    expect(
      selectCreateSeriesVariants([defaultVariant, custom], { enabled: false }, ["ROLE_USER"]),
    ).toEqual([]);
  });

  it("drops variants the config disables, including the core default", () => {
    expect(
      selectCreateSeriesVariants(
        [defaultVariant, custom],
        { variants: { default: { enabled: false } } },
        ["ROLE_USER"],
      ).map((v) => v.id),
    ).toEqual(["acme-custom"]);
  });

  it("hides a role-gated variant from users lacking every required role", () => {
    expect(
      selectCreateSeriesVariants([defaultVariant, course], undefined, ["ROLE_USER"]).map(
        (v) => v.id,
      ),
    ).toEqual(["default"]);
    // Unknown user (roles not loaded yet) counts as having no roles.
    expect(
      selectCreateSeriesVariants([course], undefined, undefined).map((v) => v.id),
    ).toEqual([]);
  });

  it("lets the config override the registered order", () => {
    expect(
      selectCreateSeriesVariants(
        [defaultVariant, custom],
        { variants: { default: { order: 1 } } },
        ["ROLE_USER"],
      ).map((v) => v.id),
    ).toEqual(["default", "acme-custom"]);
  });

  it("skips registrations without a component", () => {
    const broken = { ...variant({ id: "broken" }), component: undefined } as unknown as CreateSeriesVariant;
    expect(
      selectCreateSeriesVariants([broken, defaultVariant], undefined, ["ROLE_USER"]).map(
        (v) => v.id,
      ),
    ).toEqual(["default"]);
  });
});
