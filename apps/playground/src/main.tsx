import { bootstrapStandaloneApp } from "@oc-mui/app-runtime";

import App from "./App";

bootstrapStandaloneApp(App, "root", {
  baseUrl: "/",
  appName: "playground",
});
