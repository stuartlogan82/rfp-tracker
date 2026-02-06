/**
 * Mock for @ilamy/calendar used in tests
 */

import React from 'react';

export const IlamyCalendar = ({ events, onEventClick, headerComponent }: any) => (
  <div data-testid="ilamy-calendar">
    {headerComponent}
    <div data-testid="calendar-events">
      {events?.map((event: any) => (
        <div
          key={event.id}
          data-testid={`calendar-event-${event.id}`}
          onClick={() => onEventClick?.(event)}
          style={{ backgroundColor: event.backgroundColor }}
        >
          {event.title}
        </div>
      ))}
    </div>
  </div>
);

export const useIlamyCalendarContext = () => ({
  currentDate: { format: (fmt: string) => 'February 2026' },
  view: 'month',
  nextPeriod: jest.fn(),
  prevPeriod: jest.fn(),
  today: jest.fn(),
  setView: jest.fn(),
});
