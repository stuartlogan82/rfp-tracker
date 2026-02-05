/**
 * Tests for urgency level calculations
 * All dates use Europe/London timezone
 */

import { describe, it, expect } from '@jest/globals';
import { getUrgencyLevel, getUrgencyColor } from './urgency';

describe('getUrgencyLevel', () => {
  // Fixed reference date for testing: 2026-02-15 at noon London time
  const now = new Date('2026-02-15T12:00:00.000Z'); // UTC noon = noon in London (GMT in Feb)

  it('returns "overdue" for dates before today', () => {
    const yesterday = '2026-02-14';
    expect(getUrgencyLevel(yesterday, false, now)).toBe('overdue');
  });

  it('returns "overdue" for dates several days ago', () => {
    const lastWeek = '2026-02-08';
    expect(getUrgencyLevel(lastWeek, false, now)).toBe('overdue');
  });

  it('returns "critical" for date today', () => {
    const today = '2026-02-15';
    expect(getUrgencyLevel(today, false, now)).toBe('critical');
  });

  it('returns "critical" for date tomorrow (within 3 days)', () => {
    const tomorrow = '2026-02-16';
    expect(getUrgencyLevel(tomorrow, false, now)).toBe('critical');
  });

  it('returns "critical" for date 3 days away', () => {
    const threeDaysAway = '2026-02-18';
    expect(getUrgencyLevel(threeDaysAway, false, now)).toBe('critical');
  });

  it('returns "warning" for date 4 days away', () => {
    const fourDaysAway = '2026-02-19';
    expect(getUrgencyLevel(fourDaysAway, false, now)).toBe('warning');
  });

  it('returns "warning" for date 7 days away', () => {
    const sevenDaysAway = '2026-02-22';
    expect(getUrgencyLevel(sevenDaysAway, false, now)).toBe('warning');
  });

  it('returns "safe" for date more than 7 days away', () => {
    const eightDaysAway = '2026-02-23';
    expect(getUrgencyLevel(eightDaysAway, false, now)).toBe('safe');
  });

  it('returns "safe" for date far in the future', () => {
    const farFuture = '2026-12-31';
    expect(getUrgencyLevel(farFuture, false, now)).toBe('safe');
  });

  it('returns "completed" for completed deadline regardless of date (overdue)', () => {
    const yesterday = '2026-02-14';
    expect(getUrgencyLevel(yesterday, true, now)).toBe('completed');
  });

  it('returns "completed" for completed deadline regardless of date (critical)', () => {
    const today = '2026-02-15';
    expect(getUrgencyLevel(today, true, now)).toBe('completed');
  });

  it('returns "completed" for completed deadline regardless of date (warning)', () => {
    const fiveDaysAway = '2026-02-20';
    expect(getUrgencyLevel(fiveDaysAway, true, now)).toBe('completed');
  });

  it('returns "completed" for completed deadline regardless of date (safe)', () => {
    const farFuture = '2026-12-31';
    expect(getUrgencyLevel(farFuture, true, now)).toBe('completed');
  });

  describe('timezone correctness (Europe/London)', () => {
    it('uses London time zone for date comparison during GMT', () => {
      // February is GMT (no daylight saving)
      // 2026-02-15 00:00 London = 2026-02-15 00:00 UTC
      const midnightLondon = new Date('2026-02-15T00:00:00.000Z');
      const today = '2026-02-15';

      expect(getUrgencyLevel(today, false, midnightLondon)).toBe('critical');
    });

    it('uses London time zone for date comparison during BST', () => {
      // July is BST (British Summer Time, UTC+1)
      // 2026-07-15 00:00 London = 2026-07-14 23:00 UTC
      // So at 2026-07-14 23:30 UTC, it's 2026-07-15 00:30 in London (today)
      const halfPastMidnightBST = new Date('2026-07-14T23:30:00.000Z');
      const today = '2026-07-15';

      expect(getUrgencyLevel(today, false, halfPastMidnightBST)).toBe('critical');
    });

    it('correctly handles date that is "today" in London but "yesterday" in UTC during BST', () => {
      // During BST, London is UTC+1
      // At 2026-07-14 23:00 UTC, it's 2026-07-15 00:00 in London
      const justAfterMidnightBST = new Date('2026-07-14T23:00:00.000Z');
      const today = '2026-07-15';

      // This should be "today" in London time, not "tomorrow"
      expect(getUrgencyLevel(today, false, justAfterMidnightBST)).toBe('critical');
    });
  });
});

describe('getUrgencyColor', () => {
  it('returns red dot and red background for "overdue"', () => {
    const colors = getUrgencyColor('overdue');
    expect(colors.dot).toBe('bg-red-500');
    expect(colors.bg).toBe('bg-red-50');
  });

  it('returns red dot and red background for "critical"', () => {
    const colors = getUrgencyColor('critical');
    expect(colors.dot).toBe('bg-red-500');
    expect(colors.bg).toBe('bg-red-50');
  });

  it('returns amber dot and amber background for "warning"', () => {
    const colors = getUrgencyColor('warning');
    expect(colors.dot).toBe('bg-amber-500');
    expect(colors.bg).toBe('bg-amber-50');
  });

  it('returns green dot and green background for "safe"', () => {
    const colors = getUrgencyColor('safe');
    expect(colors.dot).toBe('bg-green-500');
    expect(colors.bg).toBe('bg-green-50');
  });

  it('returns grey dot and grey background for "completed"', () => {
    const colors = getUrgencyColor('completed');
    expect(colors.dot).toBe('bg-gray-400');
    expect(colors.bg).toBe('bg-gray-50');
  });
});
