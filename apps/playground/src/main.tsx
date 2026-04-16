import { bootstrapStandaloneApp } from "@workspace/app-runtime";

import App from "./App";

bootstrapStandaloneApp(App, "root", {
  baseUrl: "/",
  appName: "playground",
});
