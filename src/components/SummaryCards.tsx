/**
 * SummaryCards component - Dashboard summary statistics
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { startOfDay, endOfDay, endOfWeek, startOfWeek, isBefore, isWithinInterval, addDays, parseISO } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import type { DeadlineWithRfp, Rfp } from '@/types';

const LONDON_TZ = 'Europe/London';

interface SummaryCardsProps {
  deadlines: DeadlineWithRfp[];
  rfps: Rfp[];
  now?: Date;
}

export default function SummaryCards({ deadlines, rfps, now = new Date() }: SummaryCardsProps) {
  // Convert current time to London timezone
  const nowInLondon = toZonedTime(now, LONDON_TZ);
  const todayInLondon = startOfDay(nowInLondon);

  // Calculate week boundaries (Monday-Sunday) in London timezone
  const weekStart = startOfDay(startOfWeek(nowInLondon, { weekStartsOn: 1 })); // 1 = Monday
  const weekEnd = endOfDay(endOfWeek(nowInLondon, { weekStartsOn: 1 }));

  // Calculate upcoming 7 days range
  const sevenDaysFromNow = addDays(todayInLondon, 7);

  // Filter out completed deadlines for date-based counts
  const incompleteDeadlines = deadlines.filter((d) => !d.completed);

  // Helper to get deadline date in London timezone
  const getDeadlineDateInLondon = (date: Date): Date => {
    // Convert the deadline to London time and get start of that day
    return startOfDay(toZonedTime(date, LONDON_TZ));
  };

  // Count overdue deadlines (before today)
  const overdueCount = incompleteDeadlines.filter((deadline) => {
    const deadlineDate = getDeadlineDateInLondon(deadline.date);
    return isBefore(deadlineDate, todayInLondon);
  }).length;

  // Count deadlines due this week (within current Mon-Sun week)
  const thisWeekCount = incompleteDeadlines.filter((deadline) => {
    const deadlineDate = getDeadlineDateInLondon(deadline.date);
    return isWithinInterval(deadlineDate, { start: weekStart, end: weekEnd });
  }).length;

  // Count deadlines in next 7 days (including today)
  const upcomingCount = incompleteDeadlines.filter((deadline) => {
    const deadlineDate = getDeadlineDateInLondon(deadline.date);
    return isWithinInterval(deadlineDate, { start: todayInLondon, end: sevenDaysFromNow });
  }).length;

  // Count active RFPs
  const activeRfpsCount = rfps.filter((rfp) => rfp.status === 'Active').length;

  const cards = [
    {
      title: 'Due This Week',
      count: thisWeekCount,
      description: 'Deadlines this week',
    },
    {
      title: 'Overdue',
      count: overdueCount,
      description: 'Past deadlines',
    },
    {
      title: 'Active RFPs',
      count: activeRfpsCount,
      description: 'Currently active',
    },
    {
      title: 'Upcoming 7 Days',
      count: upcomingCount,
      description: 'Next week',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.title} data-testid={`card-${card.title.toLowerCase().replace(/\s+/g, '-')}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">{card.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{card.count}</div>
            <p className="text-xs text-gray-500 mt-1">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
