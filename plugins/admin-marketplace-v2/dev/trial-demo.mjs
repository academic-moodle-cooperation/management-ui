// Minimal remote plugin used to exercise the marketplace-v2 Try gesture in dev.
import { createPlugin } from "@oc-mui/plugin-system";
import { createElement } from "react";

const TrialDemoPage = () =>
  createElement(
    "div",
    { style: { padding: "3rem", textAlign: "center" } },
    createElement("h1", { style: { fontSize: "1.5rem", fontWeight: 700 } }, "Trial Demo plugin is running"),
    createElement(
      "p",
      { style: { marginTop: "0.5rem", opacity: 0.7 } },
      "Loaded ephemerally via the Try gesture — this tab only.",
    ),
  );

export default createPlugin({
  namespace: "trial-demo",
  type: "app",
  version: "1.0.0",
  initialize(manager) {
    manager.registerObject("apps:definitions", "trial-demo", {
      id: "trial-demo",
      name: "Trial Demo",
      routePath: "/trial-demo",
      component: TrialDemoPage,
    });
    manager.registerObject("sidebar:nav-items", "trial-demo", {
      title: "Trial Demo",
      path: "/trial-demo",
      order: 999,
      permissions: [],
      featureFlags: [],
      category: "content",
    });
  },
  activate() {},
  deactivate() {},
});
