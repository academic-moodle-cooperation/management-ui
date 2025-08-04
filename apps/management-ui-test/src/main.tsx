import React from 'react';
import { bootstrapStandaloneApp } from '@workspace/app-runtime';
import App from './App';

const config = {
  baseUrl: "/test",
  appName: "management-ui-test",
}

// Bootstrap the app for standalone execution
bootstrapStandaloneApp(App, "root", config); 