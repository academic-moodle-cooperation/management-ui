import { createPlugin } from "@workspace/plugin-system";
import { logger } from "@workspace/utils";

import { CalendarView } from "./event-calendar/src/components/Calendar/CalendarView";

/**
 * UniVie Event Calendar plugin
 * This registers the calendar as a plugin app that can be used in the core shell
 */
export const univieEventCalendarPlugin = createPlugin({
  namespace: "univie",
  type: "app",
  version: "1.0.0",

  initialize(manager) {
    // Register the calendar app through the plugin system
    manager.registerObject("apps:definitions", "univie-event-calendar", {
      id: "univie-event-calendar",
      name: "UniVie Event Calendar",
      routePath: "/univie-calendar",
      component: CalendarView,
      navigation: {
        title: "Event Calendar",
        icon: "calendar",
        order: 100,
        permissions: ["access_univie_calendar"],
      },
      version: "1.0.0",
      description: "Event calendar application for University of Vienna",
    });

    logger.debug("UniVie Event Calendar plugin initialized");
  },

  activate() {
    logger.debug("UniVie Event Calendar plugin activated");
  },

  deactivate() {
    logger.debug("UniVie Event Calendar plugin deactivated");
  },
});
