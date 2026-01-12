import React from "react";
import { bootstrapStandaloneApp } from "@workspace/app-runtime";
import App from "./App";

const config = {
  baseUrl: "/series",
  appName: "management-ui-series",
};

// Bootstrap the app for standalone execution with full provider context
bootstrapStandaloneApp(App, "root", config);
