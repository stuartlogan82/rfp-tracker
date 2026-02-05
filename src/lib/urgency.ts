/**
 * Urgency level calculations for deadline visualization
 * All date calculations use Europe/London timezone
 */

import { differenceInDays, parseISO, startOfDay } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import type { UrgencyLevel } from '@/types';

const LONDON_TZ = 'Europe/London';

/**
 * Calculate the urgency level for a deadline
 *
 * @param date - Deadline date in YYYY-MM-DD format
 * @param completed - Whether the deadline is completed
 * @param now - Current date/time for testing (defaults to current time)
 * @returns Urgency level: 'overdue' | 'critical' | 'warning' | 'safe' | 'completed'
 *
 * Rules:
 * - Completed deadlines always return 'completed'
 * - Past dates (before today) return 'overdue'
 * - Today or within 3 days returns 'critical'
 * - 4-7 days away returns 'warning'
 * - More than 7 days away returns 'safe'
 */
export function getUrgencyLevel(
  date: string,
  completed: boolean,
  now: Date = new Date()
): UrgencyLevel {
  // Completed deadlines always show as completed
  if (completed) {
    return 'completed';
  }

  // Convert current time to London timezone and get start of day
  const nowInLondon = toZonedTime(now, LONDON_TZ);
  const todayInLondon = startOfDay(nowInLondon);

  // Parse the deadline date and treat it as midnight London time
  const deadlineDate = parseISO(date);
  const deadlineInLondon = fromZonedTime(deadlineDate, LONDON_TZ);
  const deadlineDayStart = startOfDay(deadlineInLondon);

  // Calculate days difference
  const daysUntilDeadline = differenceInDays(deadlineDayStart, todayInLondon);

  // Determine urgency level
  if (daysUntilDeadline < 0) {
    return 'overdue';
  } else if (daysUntilDeadline <= 3) {
    return 'critical';
  } else if (daysUntilDeadline <= 7) {
    return 'warning';
  } else {
    return 'safe';
  }
}

/**
 * Get Tailwind CSS classes for urgency level visualization
 *
 * @param level - Urgency level
 * @returns Object with 'dot' and 'bg' Tailwind class strings
 */
export function getUrgencyColor(level: UrgencyLevel): { dot: string; bg: string } {
  switch (level) {
    case 'overdue':
      return { dot: 'bg-red-500', bg: 'bg-red-50' };
    case 'critical':
      return { dot: 'bg-red-500', bg: 'bg-red-50' };
    case 'warning':
      return { dot: 'bg-amber-500', bg: 'bg-amber-50' };
    case 'safe':
      return { dot: 'bg-green-500', bg: 'bg-green-50' };
    case 'completed':
      return { dot: 'bg-gray-400', bg: 'bg-gray-50' };
  }
}
