import { bootstrapStandaloneApp } from "@opencast-mui/app-runtime";

import App from "./App";

bootstrapStandaloneApp(App, "root", {
  baseUrl: "/",
  appName: "playground",
});
