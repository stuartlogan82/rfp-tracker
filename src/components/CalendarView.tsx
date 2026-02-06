/**
 * CalendarView component - Calendar visualization of deadlines
 */

'use client';

import { useMemo } from 'react';
import { IlamyCalendar, useIlamyCalendarContext } from '@ilamy/calendar';
import dayjs from 'dayjs';
import type { DeadlineWithRfp } from '@/types';
import { getUrgencyLevel, getUrgencyColor } from '@/lib/urgency';
import { Button } from '@/components/ui/button';
import '@/lib/dayjs-setup'; // Initialize dayjs plugins

interface CalendarViewProps {
  deadlines: DeadlineWithRfp[];
  onSelectRfp: (rfpId: number) => void;
  onToggleComplete: (deadlineId: number, completed: boolean) => void;
  onDeadlineUpdate?: () => void;
  now?: Date;
}

// Custom header component for calendar navigation
function CalendarHeader() {
  const { currentDate, view, nextPeriod, prevPeriod, today, setView } = useIlamyCalendarContext();

  return (
    <div className="flex items-center justify-between p-4 border-b bg-white">
      {/* Navigation controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={prevPeriod}
          aria-label="Previous"
        >
          ←
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={today}
        >
          Today
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={nextPeriod}
          aria-label="Next"
        >
          →
        </Button>
      </div>

      {/* Current date/period display */}
      <h2 className="text-lg font-semibold">
        {currentDate.format('MMMM YYYY')}
      </h2>

      {/* View switcher */}
      <div className="flex items-center gap-2">
        <Button
          variant={view === 'month' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setView('month')}
        >
          Month
        </Button>
        <Button
          variant={view === 'week' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setView('week')}
        >
          Week
        </Button>
      </div>
    </div>
  );
}

export default function CalendarView({
  deadlines,
  onSelectRfp,
  onToggleComplete,
  onDeadlineUpdate,
  now = new Date(),
}: CalendarViewProps) {
  // Convert deadlines to calendar events
  const calendarEvents = useMemo(() => {
    return deadlines.map((deadline) => {
      const urgencyLevel = getUrgencyLevel(deadline.date, deadline.completed, now);
      const urgencyColors = getUrgencyColor(urgencyLevel);

      // Parse date and time
      const dateTime = deadline.time
        ? dayjs(`${deadline.date}T${deadline.time}`)
        : dayjs(deadline.date).startOf('day');

      // Determine end time (1 hour later for timed events, same day for all-day)
      const endDateTime = deadline.time
        ? dateTime.add(1, 'hour')
        : dateTime.endOf('day');

      // Map urgency dot color to event background color
      const bgColorMap: Record<string, string> = {
        'bg-red-500': '#fecaca', // red-200
        'bg-amber-500': '#fde68a', // amber-200
        'bg-green-500': '#bbf7d0', // green-200
        'bg-gray-400': '#e5e7eb', // gray-200
      };

      const textColorMap: Record<string, string> = {
        'bg-red-500': '#991b1b', // red-800
        'bg-amber-500': '#92400e', // amber-800
        'bg-green-500': '#166534', // green-800
        'bg-gray-400': '#1f2937', // gray-800
      };

      return {
        id: deadline.id.toString(),
        title: `${deadline.rfpName}: ${deadline.label}`,
        start: dateTime.toDate(),
        end: endDateTime.toDate(),
        allDay: !deadline.time,
        backgroundColor: bgColorMap[urgencyColors.dot] || '#e5e7eb',
        color: textColorMap[urgencyColors.dot] || '#1f2937',
        data: {
          deadline,
        },
      };
    });
  }, [deadlines, now]);

  const handleEventClick = (event: any) => {
    // Will be handled by CalendarEventPopup in a later task
    console.log('Event clicked:', event);
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <IlamyCalendar
        events={calendarEvents}
        initialView="month"
        timezone="Europe/London"
        timeFormat="24-hour"
        firstDayOfWeek="monday"
        headerComponent={<CalendarHeader />}
        onEventClick={handleEventClick}
        disableDragAndDrop={true}
      />
    </div>
  );
}
