import { bootstrapStandaloneApp } from '@workspace/app-runtime';
import { EventCalendarApp } from './apps/EventCalendarApp';

const config = {
  baseUrl: "/univie-calendar",
  appName: "univie-event-calendar-app",
};

// Bootstrap the UniVie Event Calendar app for standalone execution
bootstrapStandaloneApp(EventCalendarApp, "root", config);