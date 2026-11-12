// Pin the library's own stylesheet ahead of the playground build, exactly as
// the shell does (see apps/shell/src/app.css for why the order matters).
import "@oc-mui/ui/globals.css";
import "./app.css";

import { bootstrapStandaloneApp } from "@oc-mui/app-runtime";

import App from "./App";

bootstrapStandaloneApp(App, "root", {
  baseUrl: "/",
  appName: "playground",
});
