'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { getUrgencyLevel } from '@/lib/urgency';
import type { DeadlineWithRfp } from '@/types';

interface NotificationBannerProps {
  deadlines: DeadlineWithRfp[];
  now?: Date;
}

export default function NotificationBanner({ deadlines, now }: NotificationBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Filter to only critical and overdue deadlines (excludes completed)
  const urgentDeadlines = deadlines.filter((deadline) => {
    const urgency = getUrgencyLevel(
      deadline.date.toISOString().split('T')[0],
      deadline.completed,
      now
    );
    return urgency === 'critical' || urgency === 'overdue';
  });

  // Don't render if dismissed or no urgent deadlines
  if (dismissed || urgentDeadlines.length === 0) {
    return null;
  }

  const count = urgentDeadlines.length;
  const isPlural = count !== 1;

  return (
    <div
      role="alert"
      className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          {/* Warning icon */}
          <svg
            className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>

          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">
              {count} deadline{isPlural ? 's are' : ' is'} due within 3 days
            </p>

            {/* Expanded list of deadlines */}
            {expanded && (
              <ul className="mt-2 space-y-1 text-sm text-red-700">
                {urgentDeadlines.map((deadline) => (
                  <li key={deadline.id}>
                    {deadline.label} - {format(deadline.date, 'MMM d, yyyy')}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 ml-4">
          {/* Expand/collapse button */}
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-red-600 hover:text-red-800 p-1"
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            <svg
              className={`w-5 h-5 transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* Dismiss button */}
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="text-red-600 hover:text-red-800 p-1"
            aria-label="Dismiss"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
