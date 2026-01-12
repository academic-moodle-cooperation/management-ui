import { createPlugin } from "@workspace/plugin-system";
import { config } from "./config";

export const tuwienConfigPlugin = createPlugin({
  namespace: "tuwien",
  type: "config",
  version: "1.0.0",
  initialize(manager) {
    manager.registerObject("app:config", "tuwien", config);
  },
  activate() {
    // Plugin activated
  },
  deactivate() {
    // Plugin deactivated
  },
});
