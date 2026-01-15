import { bootstrapStandaloneApp } from "@workspace/app-runtime";

import { CalendarView } from "./src/components/Calendar/CalendarView";

const config = {
  baseUrl: "/univie-calendar",
  appName: "univie-event-calendar-app",
};

// Bootstrap the UniVie Event Calendar app for standalone execution
bootstrapStandaloneApp(CalendarView, "root", config);
