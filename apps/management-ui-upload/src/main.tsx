import React from "react";
import { bootstrapStandaloneApp } from "@workspace/app-runtime";
import App from "./App";

const config = {
  baseUrl: "/upload",
  appName: "management-ui-upload",
};

// Bootstrap the app for standalone execution with full provider context
bootstrapStandaloneApp(App, "root", config);
