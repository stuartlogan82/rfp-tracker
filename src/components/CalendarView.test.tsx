/**
 * CalendarView component tests
 */

import { describe, it, expect, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CalendarView from './CalendarView';
import type { DeadlineWithRfp } from '@/types';

// Mock @ilamy/calendar (see src/__mocks__/@ilamy/calendar.tsx)
jest.mock('@ilamy/calendar');

const mockDeadlines: DeadlineWithRfp[] = [
  {
    id: 1,
    rfpId: 1,
    date: '2026-02-15',
    time: '17:00',
    label: 'RFP Submission Deadline',
    context: 'Final deadline for submission',
    completed: false,
    createdAt: new Date('2026-01-01').toISOString(),
    updatedAt: new Date('2026-01-01').toISOString(),
    rfpName: 'NHS Digital Procurement',
    rfpAgency: 'NHS',
    rfpStatus: 'Active' as const,
  },
  {
    id: 2,
    rfpId: 1,
    date: '2026-02-10',
    time: null,
    label: 'Q&A Period Opens',
    context: null,
    completed: false,
    createdAt: new Date('2026-01-01').toISOString(),
    updatedAt: new Date('2026-01-01').toISOString(),
    rfpName: 'NHS Digital Procurement',
    rfpAgency: 'NHS',
    rfpStatus: 'Active' as const,
  },
  {
    id: 3,
    rfpId: 2,
    date: '2026-02-20',
    time: '09:00',
    label: 'Technical Demo',
    context: null,
    completed: true,
    createdAt: new Date('2026-01-01').toISOString(),
    updatedAt: new Date('2026-01-01').toISOString(),
    rfpName: 'Police Scotland RFP',
    rfpAgency: 'Police Scotland',
    rfpStatus: 'Active' as const,
  },
];

describe('CalendarView', () => {
  const mockOnSelectRfp = jest.fn();
  const mockOnToggleComplete = jest.fn();

  it('renders the IlamyCalendar component', () => {
    render(
      <CalendarView
        deadlines={mockDeadlines}
        onSelectRfp={mockOnSelectRfp}
        onToggleComplete={mockOnToggleComplete}
      />
    );

    expect(screen.getByTestId('ilamy-calendar')).toBeInTheDocument();
  });

  it('converts deadlines to calendar events with correct format', () => {
    render(
      <CalendarView
        deadlines={mockDeadlines}
        onSelectRfp={mockOnSelectRfp}
        onToggleComplete={mockOnToggleComplete}
      />
    );

    // All three deadlines should be rendered as events
    expect(screen.getByTestId('calendar-event-1')).toBeInTheDocument();
    expect(screen.getByTestId('calendar-event-2')).toBeInTheDocument();
    expect(screen.getByTestId('calendar-event-3')).toBeInTheDocument();
  });

  it('formats event titles with RFP name and deadline label', () => {
    render(
      <CalendarView
        deadlines={mockDeadlines}
        onSelectRfp={mockOnSelectRfp}
        onToggleComplete={mockOnToggleComplete}
      />
    );

    const event1 = screen.getByTestId('calendar-event-1');
    expect(event1).toHaveTextContent('NHS Digital Procurement: RFP Submission Deadline');
  });

  it('renders custom header with navigation controls', () => {
    render(
      <CalendarView
        deadlines={mockDeadlines}
        onSelectRfp={mockOnSelectRfp}
        onToggleComplete={mockOnToggleComplete}
      />
    );

    // Check for navigation buttons
    expect(screen.getByLabelText('Previous')).toBeInTheDocument();
    expect(screen.getByLabelText('Next')).toBeInTheDocument();
    expect(screen.getByText('Today')).toBeInTheDocument();
  });

  it('renders month and week view toggles', () => {
    render(
      <CalendarView
        deadlines={mockDeadlines}
        onSelectRfp={mockOnSelectRfp}
        onToggleComplete={mockOnToggleComplete}
      />
    );

    expect(screen.getByText('Month')).toBeInTheDocument();
    expect(screen.getByText('Week')).toBeInTheDocument();
  });

  it('handles empty deadlines array gracefully', () => {
    render(
      <CalendarView
        deadlines={[]}
        onSelectRfp={mockOnSelectRfp}
        onToggleComplete={mockOnToggleComplete}
      />
    );

    expect(screen.getByTestId('ilamy-calendar')).toBeInTheDocument();
    expect(screen.queryByTestId(/calendar-event-/)).not.toBeInTheDocument();
  });
});
