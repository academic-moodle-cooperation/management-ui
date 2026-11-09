import { isValidElement } from "react";
import { describe, expect, it } from "vitest";

import { rich } from "./rich";

import type { ReactElement } from "react";

const el = (node: unknown): ReactElement => {
  if (!isValidElement(node)) throw new Error("expected an element");
  return node;
};

describe("rich", () => {
  it("clones a paired tag with the translated text as its child", () => {
    const out = rich("Applied <b>only in this tab</b> for now.", { b: <b className="x" /> });
    expect(out).toHaveLength(3);
    expect(out[0]).toBe("Applied ");
    const bold = el(out[1]);
    expect(bold.type).toBe("b");
    expect(bold.props).toMatchObject({ className: "x", children: "only in this tab" });
    expect(out[2]).toBe(" for now.");
  });

  it("uses a self-closing tag's element as is, keeping its own children", () => {
    const out = rich("Code from <host/>.", { host: <b>evil<b>.example</b></b> });
    expect(out[0]).toBe("Code from ");
    expect(el(out[1]).props).toMatchObject({ children: expect.anything() });
    expect(out[2]).toBe(".");
  });

  it("never parses a value as markup, because values arrive as elements", () => {
    const name = "<script>alert(1)</script>";
    const out = rich("<name/> already fills the slot", { name: <b>{name}</b> });
    expect(el(out[0]).props).toMatchObject({ children: name });
    expect(out[1]).toBe(" already fills the slot");
  });

  it("renders an unknown tag as literal text", () => {
    expect(rich("Use <code>app.theme</code> here", {})).toEqual(["Use ", "<code>app.theme</code>", " here"]);
  });

  it("gives every element a key", () => {
    const out = rich("<a/> and <b>two</b> and <a/>", { a: <i />, b: <b /> });
    const keys = out.filter(isValidElement).map((node) => node.key);
    expect(keys).toHaveLength(3);
    expect(new Set(keys).size).toBe(3);
  });

  it("returns the plain string when there is no markup", () => {
    expect(rich("Nothing here", { b: <b /> })).toEqual(["Nothing here"]);
  });
});
