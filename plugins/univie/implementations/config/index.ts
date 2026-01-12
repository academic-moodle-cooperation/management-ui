import { createPlugin } from "@workspace/plugin-system";
import { config } from "./config";

export const univieConfigPlugin = createPlugin({
  namespace: "univie",
  type: "config",
  version: "1.0.0",
  initialize(manager) {
    manager.registerObject("app:config", "univie", config);
  },
  activate() {},
  deactivate() {},
});
