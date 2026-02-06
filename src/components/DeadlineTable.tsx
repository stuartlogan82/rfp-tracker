/**
 * DeadlineTable component - Sortable deadline list with urgency indicators
 */

'use client';

import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, parseISO } from 'date-fns';
import { getUrgencyLevel, getUrgencyColor } from '@/lib/urgency';
import type { DeadlineWithRfp } from '@/types';

interface DeadlineTableProps {
  deadlines: DeadlineWithRfp[];
  onSelectRfp: (rfpId: number) => void;
  onToggleComplete: (deadlineId: number, completed: boolean) => void;
  now?: Date;
}

type SortColumn = 'date' | 'time' | 'label' | 'rfp' | 'urgency' | 'completed';
type SortDirection = 'asc' | 'desc';

export default function DeadlineTable({
  deadlines,
  onSelectRfp,
  onToggleComplete,
  now = new Date(),
}: DeadlineTableProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Handle column header click for sorting
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, default to ascending
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Sort deadlines
  const sortedDeadlines = useMemo(() => {
    const sorted = [...deadlines].sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortColumn) {
        case 'date':
          aVal = new Date(a.date).getTime();
          bVal = new Date(b.date).getTime();
          break;
        case 'time':
          aVal = a.time || '';
          bVal = b.time || '';
          break;
        case 'label':
          aVal = a.label.toLowerCase();
          bVal = b.label.toLowerCase();
          break;
        case 'rfp':
          aVal = a.rfpName.toLowerCase();
          bVal = b.rfpName.toLowerCase();
          break;
        case 'urgency':
          const urgencyOrder = { overdue: 0, critical: 1, warning: 2, safe: 3, completed: 4 };
          const aDateString = typeof a.date === 'string' ? a.date.split('T')[0] : a.date.toISOString().split('T')[0];
          const bDateString = typeof b.date === 'string' ? b.date.split('T')[0] : b.date.toISOString().split('T')[0];
          aVal = urgencyOrder[getUrgencyLevel(aDateString, a.completed, now)];
          bVal = urgencyOrder[getUrgencyLevel(bDateString, b.completed, now)];
          break;
        case 'completed':
          aVal = a.completed ? 1 : 0;
          bVal = b.completed ? 1 : 0;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [deadlines, sortColumn, sortDirection, now]);

  if (deadlines.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No deadlines to display
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => handleSort('urgency')}
            >
              Urgency
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => handleSort('date')}
            >
              Date
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => handleSort('time')}
            >
              Time
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => handleSort('label')}
            >
              Label
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => handleSort('rfp')}
            >
              RFP
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => handleSort('completed')}
            >
              Completed
            </TableHead>
            <TableHead>
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedDeadlines.map((deadline) => {
            // Handle both Date objects and date strings
            const dateString = typeof deadline.date === 'string'
              ? deadline.date.split('T')[0]
              : deadline.date.toISOString().split('T')[0];

            const dateObj = typeof deadline.date === 'string'
              ? parseISO(deadline.date)
              : deadline.date;

            const urgencyLevel = getUrgencyLevel(
              dateString,
              deadline.completed,
              now
            );
            const colors = getUrgencyColor(urgencyLevel);

            return (
              <TableRow key={deadline.id} className={colors.bg}>
                {/* Urgency dot */}
                <TableCell>
                  <div className={`w-3 h-3 rounded-full ${colors.dot}`} />
                </TableCell>

                {/* Date */}
                <TableCell>{format(dateObj, 'dd MMM yyyy')}</TableCell>

                {/* Time */}
                <TableCell>{deadline.time || '—'}</TableCell>

                {/* Label */}
                <TableCell>{deadline.label}</TableCell>

                {/* RFP name (clickable) */}
                <TableCell>
                  <button
                    onClick={() => onSelectRfp(deadline.rfpId)}
                    className="text-blue-600 hover:text-blue-800 hover:underline text-left"
                  >
                    {deadline.rfpName}
                  </button>
                </TableCell>

                {/* Completed checkbox */}
                <TableCell>
                  <input
                    type="checkbox"
                    checked={deadline.completed}
                    onChange={(e) => onToggleComplete(deadline.id, e.target.checked)}
                    className="w-4 h-4 cursor-pointer"
                  />
                </TableCell>

                {/* Export button */}
                <TableCell>
                  <a
                    href={`/api/export?deadlineId=${deadline.id}`}
                    download
                    className="text-blue-600 hover:text-blue-800 text-sm inline-flex items-center gap-1"
                    aria-label={`Export ${deadline.label} to calendar`}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    Export
                  </a>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
