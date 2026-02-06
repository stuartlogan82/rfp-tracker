/**
 * ICS (iCalendar) file generation utilities
 * Converts deadline data into .ics calendar files for export
 */

import { createEvent, createEvents, EventAttributes } from 'ics';

/**
 * Deadline data shape for ICS generation
 */
export interface DeadlineForIcs {
  date: Date | string;
  time: string | null;
  label: string;
  context: string | null;
  rfpName: string;
}

/**
 * Generates an .ics file string for a single deadline
 * @param deadline - Deadline data with date, time, label, context, and RFP name
 * @returns ICS file content as a string
 * @throws Error if ICS generation fails
 */
export function generateIcsForDeadline(deadline: DeadlineForIcs): string {
  const event = buildEventAttributes(deadline);
  const { error, value } = createEvent(event);

  if (error || !value) {
    throw new Error(`Failed to generate ICS: ${error?.message || 'Unknown error'}`);
  }

  return value;
}

/**
 * Generates an .ics file string for multiple deadlines (bulk export)
 * @param deadlines - Array of deadline data
 * @returns ICS file content as a string containing all events
 * @throws Error if array is empty or ICS generation fails
 */
export function generateIcsForDeadlines(deadlines: DeadlineForIcs[]): string {
  if (deadlines.length === 0) {
    throw new Error('Cannot generate ICS for empty deadline list');
  }

  const events = deadlines.map(buildEventAttributes);
  const { error, value } = createEvents(events, {
    calName: 'RFP Deadline Tracker',
    productId: 'rfp-tracker/ics',
  });

  if (error || !value) {
    throw new Error(`Failed to generate ICS: ${error?.message || 'Unknown error'}`);
  }

  return value;
}

/**
 * Builds an EventAttributes object from deadline data
 * Handles both timed and all-day events, includes 24-hour reminder alarm
 */
function buildEventAttributes(deadline: DeadlineForIcs): EventAttributes {
  const date = deadline.date instanceof Date ? deadline.date : new Date(deadline.date);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1; // ics package uses 1-indexed months
  const day = date.getUTCDate();

  const event: EventAttributes = {
    title: `${deadline.label} - ${deadline.rfpName}`,
    startInputType: 'utc',
    startOutputType: 'utc',
    alarms: [
      {
        action: 'display',
        description: 'Deadline reminder',
        trigger: { days: 1, before: true },
      },
    ],
  };

  // Add description if context is provided
  if (deadline.context) {
    event.description = deadline.context;
  }

  // Handle timed vs all-day events
  if (deadline.time) {
    // Timed event: 1-hour duration starting at specified time
    const [hours, minutes] = deadline.time.split(':').map(Number);
    event.start = [year, month, day, hours, minutes];
    event.duration = { hours: 1 };
  } else {
    // All-day event: DTEND is exclusive, so end on next day
    event.start = [year, month, day];
    event.end = [year, month, day + 1];
  }

  return event;
}
