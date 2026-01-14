import { bootstrapStandaloneApp } from "@workspace/app-runtime";

import { TuWienCustomApp } from "./apps/TuWienCustomApp";

const config = {
  baseUrl: "/tuwien-custom",
  appName: "tuwien-custom-app",
};

// Bootstrap the TU Wien custom app for standalone execution
bootstrapStandaloneApp(TuWienCustomApp, "root", config);
