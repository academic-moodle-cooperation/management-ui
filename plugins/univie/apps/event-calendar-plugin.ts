import { createPlugin } from '@workspace/plugin-system';
import { EventCalendarApp } from './EventCalendarApp';

/**
 * UniVie Event Calendar Plugin
 * 
 * This plugin provides an event calendar for University of Vienna rooms.
 * It integrates with UniVie's digital signage API endpoints to display
 * room schedules and events in an intuitive calendar interface.
 * 
 * API Integration:
 * - GET /digitalsignage/v1/getAllRaeume - Fetch all rooms
 * - GET /digitalsignage/v1/findRaumbelegungenByDays?days=1 - Fetch events
 * 
 * Features:
 * - Room filtering by configurable room IDs
 * - Date-based event viewing
 * - Responsive calendar interface
 * - Event details with time, location, and participants
 * - Real-time data refresh
 */
export const eventCalendarPlugin = createPlugin({
  namespace: 'univie',
  type: 'app',
  version: '1.0.0',
  
  initialize(manager) {
    // Register the event calendar app through the plugin system
    manager.registerObject('apps:definitions', 'univie-event-calendar', {
      id: 'univie-event-calendar',
      name: 'UniVie Event Calendar',
      routePath: '/univie-calendar',
      component: EventCalendarApp,
      navigation: {
        title: 'Event Calendar',
        icon: 'calendar',
        order: 200,
        permissions: ['access_univie_calendar']
      },
      version: '1.0.0',
      description: 'Event calendar for University of Vienna rooms with real-time scheduling data'
    });

    console.log('UniVie Event Calendar plugin initialized');
  },
  
  activate() {
    console.log('UniVie Event Calendar plugin activated');
  },
  
  deactivate() {
    console.log('UniVie Event Calendar plugin deactivated');
  }
});