// Export University of Vienna implementations (production)
export * from "./implementations/index.js";

// Export University of Vienna apps
export { CalendarView as EventCalendarApp } from "./apps/event-calendar/src/index.js";

// Export the plugin for core shell integration
export { univieEventCalendarPlugin } from "./apps/event-calendar-plugin";
