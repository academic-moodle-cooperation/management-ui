import React from 'react';
import { CalendarView } from '../components/Calendar/CalendarView';
import { Container } from '@workspace/ui/components';
import { AdaptiveAppWrapper } from '@workspace/app-runtime';

/**
 * UniVie Event Calendar App
 * 
 * This component provides an event calendar for University of Vienna rooms.
 * It integrates with UniVie's REST endpoints to display room schedules and events.
 * 
 * Features:
 * - Calendar view for events
 * - Room filtering and selection
 * - Date navigation
 * - Event details display
 * - Responsive design
 * - Auto-refresh capabilities
 * 
 * The app can run both within the core shell and as a standalone application.
 */
export const EventCalendarApp: React.FC = () => {
  return (
    <AdaptiveAppWrapper>
      <Container className="p-6 max-w-7xl">
        <CalendarView />
      </Container>
    </AdaptiveAppWrapper>
  );
};