/**
 * Unit tests for ICS (iCalendar) file generation
 * Tests the generateIcsForDeadline and generateIcsForDeadlines functions
 */

import { describe, it, expect } from '@jest/globals';
import { generateIcsForDeadline, generateIcsForDeadlines } from './ics-generator';

describe('generateIcsForDeadline', () => {
  it('returns a string containing BEGIN:VCALENDAR and END:VCALENDAR for a timed deadline', () => {
    const deadline = {
      date: new Date('2026-03-15T00:00:00.000Z'),
      time: '14:00',
      label: 'Proposal Due',
      context: null,
      rfpName: 'NHS RFP',
    };

    const result = generateIcsForDeadline(deadline);

    expect(result).toContain('BEGIN:VCALENDAR');
    expect(result).toContain('END:VCALENDAR');
  });

  it('includes SUMMARY field with both label and RFP name', () => {
    const deadline = {
      date: new Date('2026-03-15T00:00:00.000Z'),
      time: '14:00',
      label: 'Proposal Due',
      context: null,
      rfpName: 'NHS RFP',
    };

    const result = generateIcsForDeadline(deadline);

    expect(result).toContain('SUMMARY:Proposal Due - NHS RFP');
  });

  it('creates an all-day event when time is null', () => {
    const deadline = {
      date: new Date('2026-03-15T00:00:00.000Z'),
      time: null,
      label: 'Final Submission',
      context: null,
      rfpName: 'Transport Scotland RFP',
    };

    const result = generateIcsForDeadline(deadline);

    // All-day events should have VALUE=DATE or no time component in DTSTART
    expect(result).toMatch(/DTSTART[^:]*[:;].*20260315/);
    // Should not have a timestamp (no T character followed by time)
    expect(result).not.toMatch(/DTSTART[^:]*:20260315T\d{6}/);
  });

  it('includes a VALARM with 24-hour (1 day) reminder', () => {
    const deadline = {
      date: new Date('2026-03-15T14:00:00.000Z'),
      time: '14:00',
      label: 'Proposal Due',
      context: null,
      rfpName: 'NHS RFP',
    };

    const result = generateIcsForDeadline(deadline);

    expect(result).toContain('BEGIN:VALARM');
    expect(result).toContain('TRIGGER:-P1D'); // -P1D = 1 day before
  });

  it('includes DESCRIPTION field when context is provided', () => {
    const deadline = {
      date: new Date('2026-03-15T14:00:00.000Z'),
      time: '14:00',
      label: 'Proposal Due',
      context: 'Submit via procurement portal by 2pm',
      rfpName: 'NHS RFP',
    };

    const result = generateIcsForDeadline(deadline);

    expect(result).toContain('DESCRIPTION:Submit via procurement portal by 2pm');
  });

  it('does not include event DESCRIPTION field when context is null', () => {
    const deadline = {
      date: new Date('2026-03-15T14:00:00.000Z'),
      time: '14:00',
      label: 'Proposal Due',
      context: null,
      rfpName: 'NHS RFP',
    };

    const result = generateIcsForDeadline(deadline);

    // Extract the VEVENT section (between BEGIN:VEVENT and BEGIN:VALARM)
    const eventSection = result.substring(
      result.indexOf('BEGIN:VEVENT'),
      result.indexOf('BEGIN:VALARM')
    );

    // The event section should not have a DESCRIPTION field
    expect(eventSection).not.toContain('DESCRIPTION:');
  });
});

describe('generateIcsForDeadlines', () => {
  it('generates a single ICS file with multiple VEVENT blocks for multiple deadlines', () => {
    const deadlines = [
      {
        date: new Date('2026-03-15T14:00:00.000Z'),
        time: '14:00',
        label: 'Proposal Due',
        context: null,
        rfpName: 'NHS RFP',
      },
      {
        date: new Date('2026-04-20T00:00:00.000Z'),
        time: null,
        label: 'Final Submission',
        context: 'All-day deadline',
        rfpName: 'Transport Scotland RFP',
      },
      {
        date: new Date('2026-05-10T09:30:00.000Z'),
        time: '09:30',
        label: 'Presentation',
        context: null,
        rfpName: 'Ministry of Defence RFP',
      },
    ];

    const result = generateIcsForDeadlines(deadlines);

    // Should contain BEGIN:VCALENDAR once
    expect(result).toContain('BEGIN:VCALENDAR');
    expect(result).toContain('END:VCALENDAR');

    // Should contain BEGIN:VEVENT exactly 3 times (one per deadline)
    const eventMatches = result.match(/BEGIN:VEVENT/g);
    expect(eventMatches).toHaveLength(3);

    // Verify all three summaries are present
    expect(result).toContain('SUMMARY:Proposal Due - NHS RFP');
    expect(result).toContain('SUMMARY:Final Submission - Transport Scotland RFP');
    expect(result).toContain('SUMMARY:Presentation - Ministry of Defence RFP');
  });

  it('handles empty array gracefully', () => {
    expect(() => generateIcsForDeadlines([])).toThrow();
  });
});
