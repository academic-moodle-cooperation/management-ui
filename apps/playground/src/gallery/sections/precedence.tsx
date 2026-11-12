import { useEffect } from "react";

import { Button, Card, CardContent, Input } from "@oc-mui/ui/components";

import { Row, Section } from "../Section";

/**
 * Not a component: a fixture for the cascade. It answers two questions about
 * any change to how the base components are styled:
 *
 * 1. Does a `className` passed by the caller still override the component?
 * 2. Does a class that exists only in a remote plugin's stylesheet (loaded
 *    into the `plugins` cascade layer) still override the component?
 *
 * `scripts/check-precedence.mjs` reads the computed values of the elements
 * marked with `data-precedence`.
 */

// Arbitrary-value utilities as a remote plugin's own Tailwind build would emit
// them. The class names are assembled at runtime on purpose: the host's
// Tailwind scan must not see them, otherwise the host would generate the same
// rules in its `utilities` layer and the test would prove nothing.
const arbitrary = (utility: string, value: string) => `${utility}-[${value}]`;
const escaped = (className: string) => className.replace(/[[\]]/g, "\\$&");

const PLUGIN_RULES: [className: string, declaration: string][] = [
  [arbitrary("h", "53px"), "height: 53px"],
  [arbitrary("px", "37px"), "padding-inline: 37px"],
  [arbitrary("py", "9px"), "padding-block: 9px"],
  [arbitrary("gap", "7px"), "gap: 7px"],
  [arbitrary("rounded", "3px"), "border-radius: 3px"],
];
const [PLUGIN_H, PLUGIN_PX, PLUGIN_PY, PLUGIN_GAP, PLUGIN_ROUNDED] = PLUGIN_RULES.map(
  ([className]) => className,
) as [string, string, string, string, string];

/** Loads the fixture sheet exactly the way the remote plugin loader does. */
function usePluginStylesheet() {
  useEffect(() => {
    const css = PLUGIN_RULES.map(
      ([className, declaration]) => `.${escaped(className)} { ${declaration} }`,
    ).join("\n");
    const url = URL.createObjectURL(new Blob([css], { type: "text/css" }));
    const style = document.createElement("style");
    style.dataset["precedenceFixture"] = "";
    style.textContent = `@import url(${JSON.stringify(url)}) layer(plugins);`;
    document.head.appendChild(style);
    return () => {
      style.remove();
      URL.revokeObjectURL(url);
    };
  }, []);
}

export function PrecedenceSection() {
  usePluginStylesheet();

  return (
    <Section id="precedence" title="Precedence (fixture)">
      <Row label="Caller className, classes from the host's own build">
        <Button data-precedence="host-button" className="h-12 rounded-none px-8">
          h-12 rounded-none px-8
        </Button>
        <Button data-precedence="host-button-sm" variant="outline" size="sm" className="h-12 gap-4">
          sm + h-12 gap-4
        </Button>
        <Input
          data-precedence="host-input"
          className="h-12 w-64 rounded-none px-6"
          defaultValue="h-12 rounded-none px-6"
        />
        <Card data-precedence="host-card" className="w-64 gap-2 rounded-none py-2 shadow-none">
          <CardContent data-precedence="host-card-content" className="px-2 text-sm">
            gap-2 rounded-none py-2, content px-2
          </CardContent>
        </Card>
      </Row>
      <Row label="Classes that exist only in a plugin stylesheet (cascade layer plugins)">
        <Button
          data-precedence="plugin-button"
          className={`${PLUGIN_H} ${PLUGIN_PX} ${PLUGIN_ROUNDED}`}
        >
          height 53, padding 37, radius 3
        </Button>
        <Input
          data-precedence="plugin-input"
          className={`w-64 ${PLUGIN_H} ${PLUGIN_PX} ${PLUGIN_ROUNDED}`}
          defaultValue="height 53, padding 37, radius 3"
        />
        <Card
          data-precedence="plugin-card"
          className={`w-64 ${PLUGIN_GAP} ${PLUGIN_PY} ${PLUGIN_ROUNDED}`}
        >
          <CardContent data-precedence="plugin-card-content" className={`text-sm ${PLUGIN_PX}`}>
            gap 7, padding 9, radius 3, content padding 37
          </CardContent>
        </Card>
      </Row>
    </Section>
  );
}
