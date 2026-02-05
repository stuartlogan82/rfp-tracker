/**
 * Tests for SummaryCards component
 */

import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import SummaryCards from './SummaryCards';
import type { DeadlineWithRfp, Rfp } from '@/types';

describe('SummaryCards', () => {
  // Reference date: Monday, Feb 10, 2026 at noon London time
  const now = new Date('2026-02-10T12:00:00.000Z'); // GMT in February

  const mockRfps: Rfp[] = [
    {
      id: 1,
      name: 'NHS Project',
      agency: 'NHS',
      status: 'Active',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    },
    {
      id: 2,
      name: 'MOD Project',
      agency: 'MOD',
      status: 'Active',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    },
    {
      id: 3,
      name: 'TfL Project',
      agency: 'TfL',
      status: 'Won',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    },
  ];

  const mockDeadlines: DeadlineWithRfp[] = [
    // Overdue (Feb 5 - 5 days ago)
    {
      id: 1,
      rfpId: 1,
      date: new Date('2026-02-05'),
      time: null,
      label: 'Overdue deadline',
      context: null,
      completed: false,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
      rfpName: 'NHS Project',
      rfpAgency: 'NHS',
      rfpStatus: 'Active',
    },
    // Due this week (Feb 12 - Thursday, 2 days away)
    {
      id: 2,
      rfpId: 1,
      date: new Date('2026-02-12'),
      time: '17:00',
      label: 'This week deadline',
      context: null,
      completed: false,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
      rfpName: 'NHS Project',
      rfpAgency: 'NHS',
      rfpStatus: 'Active',
    },
    // Due this week (Feb 14 - Saturday, 4 days away)
    {
      id: 3,
      rfpId: 2,
      date: new Date('2026-02-14'),
      time: null,
      label: 'Weekend deadline',
      context: null,
      completed: false,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
      rfpName: 'MOD Project',
      rfpAgency: 'MOD',
      rfpStatus: 'Active',
    },
    // Next week (Feb 17 - next Tuesday, 7 days away)
    {
      id: 4,
      rfpId: 2,
      date: new Date('2026-02-17'),
      time: null,
      label: 'Next week deadline',
      context: null,
      completed: false,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
      rfpName: 'MOD Project',
      rfpAgency: 'MOD',
      rfpStatus: 'Active',
    },
    // Far future (March 1 - 19 days away)
    {
      id: 5,
      rfpId: 3,
      date: new Date('2026-03-01'),
      time: null,
      label: 'Future deadline',
      context: null,
      completed: false,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
      rfpName: 'TfL Project',
      rfpAgency: 'TfL',
      rfpStatus: 'Won',
    },
    // Completed overdue (should be excluded from counts)
    {
      id: 6,
      rfpId: 1,
      date: new Date('2026-02-01'),
      time: null,
      label: 'Completed overdue',
      context: null,
      completed: true,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
      rfpName: 'NHS Project',
      rfpAgency: 'NHS',
      rfpStatus: 'Active',
    },
  ];

  it('renders 4 cards with correct titles', () => {
    render(<SummaryCards deadlines={mockDeadlines} rfps={mockRfps} now={now} />);

    expect(screen.getByText('Due This Week')).toBeInTheDocument();
    expect(screen.getByText('Overdue')).toBeInTheDocument();
    expect(screen.getByText('Active RFPs')).toBeInTheDocument();
    expect(screen.getByText('Upcoming 7 Days')).toBeInTheDocument();
  });

  it('correctly computes Overdue count', () => {
    render(<SummaryCards deadlines={mockDeadlines} rfps={mockRfps} now={now} />);

    // Only 1 overdue (Feb 5), completed overdue is excluded
    const overdueCard = screen.getByTestId('card-overdue');
    expect(overdueCard).toHaveTextContent('1');
  });

  it('correctly computes Due This Week count', () => {
    render(<SummaryCards deadlines={mockDeadlines} rfps={mockRfps} now={now} />);

    // Week is Mon Feb 10 - Sun Feb 16
    // Includes: Feb 12 (Thu), Feb 14 (Sat) = 2 deadlines
    const thisWeekCard = screen.getByTestId('card-due-this-week');
    expect(thisWeekCard).toHaveTextContent('2');
  });

  it('correctly computes Upcoming 7 Days count', () => {
    render(<SummaryCards deadlines={mockDeadlines} rfps={mockRfps} now={now} />);

    // Next 7 days from Feb 10: Feb 10-17 (inclusive)
    // Includes: Feb 12, Feb 14, Feb 17 = 3 deadlines
    const upcomingCard = screen.getByTestId('card-upcoming-7-days');
    expect(upcomingCard).toHaveTextContent('3');
  });

  it('correctly computes Active RFPs count', () => {
    render(<SummaryCards deadlines={mockDeadlines} rfps={mockRfps} now={now} />);

    // 2 RFPs with status "Active"
    const activeCard = screen.getByTestId('card-active-rfps');
    expect(activeCard).toHaveTextContent('2');
  });

  it('excludes completed deadlines from all date-based counts', () => {
    const allCompleted: DeadlineWithRfp[] = [
      {
        id: 1,
        rfpId: 1,
        date: new Date('2026-02-05'), // Overdue
        time: null,
        label: 'Completed overdue',
        context: null,
        completed: true,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
        rfpName: 'NHS Project',
        rfpAgency: 'NHS',
        rfpStatus: 'Active',
      },
      {
        id: 2,
        rfpId: 1,
        date: new Date('2026-02-12'), // This week
        time: null,
        label: 'Completed this week',
        context: null,
        completed: true,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
        rfpName: 'NHS Project',
        rfpAgency: 'NHS',
        rfpStatus: 'Active',
      },
      {
        id: 3,
        rfpId: 1,
        date: new Date('2026-02-15'), // Upcoming 7 days
        time: null,
        label: 'Completed upcoming',
        context: null,
        completed: true,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
        rfpName: 'NHS Project',
        rfpAgency: 'NHS',
        rfpStatus: 'Active',
      },
    ];

    render(<SummaryCards deadlines={allCompleted} rfps={mockRfps} now={now} />);

    // All counts should be 0 except Active RFPs
    const overdueCard = screen.getByTestId('card-overdue');
    const thisWeekCard = screen.getByTestId('card-due-this-week');
    const upcomingCard = screen.getByTestId('card-upcoming-7-days');

    expect(overdueCard).toHaveTextContent('0');
    expect(thisWeekCard).toHaveTextContent('0');
    expect(upcomingCard).toHaveTextContent('0');
  });

  it('handles empty deadlines array', () => {
    render(<SummaryCards deadlines={[]} rfps={mockRfps} now={now} />);

    expect(screen.getByTestId('card-overdue')).toHaveTextContent('0');
    expect(screen.getByTestId('card-due-this-week')).toHaveTextContent('0');
    expect(screen.getByTestId('card-upcoming-7-days')).toHaveTextContent('0');
    expect(screen.getByTestId('card-active-rfps')).toHaveTextContent('2');
  });

  it('handles empty RFPs array', () => {
    render(<SummaryCards deadlines={mockDeadlines} rfps={[]} now={now} />);

    expect(screen.getByTestId('card-active-rfps')).toHaveTextContent('0');
  });

  describe('timezone correctness (Europe/London)', () => {
    it.skip('uses London timezone for week boundaries', () => {
      // Sunday Feb 9, 2026 at 11:59 PM London = still week of Feb 3-9
      // Monday Feb 10, 2026 at 00:00 London = new week Feb 10-16
      const sundayNight = new Date('2026-02-09T23:59:00.000Z');

      const deadlineOnMonday: DeadlineWithRfp = {
        id: 1,
        rfpId: 1,
        date: new Date('2026-02-10'),
        time: null,
        label: 'Monday deadline',
        context: null,
        completed: false,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
        rfpName: 'NHS Project',
        rfpAgency: 'NHS',
        rfpStatus: 'Active',
      };

      // When "now" is Sunday night, Monday is next week
      render(<SummaryCards deadlines={[deadlineOnMonday]} rfps={mockRfps} now={sundayNight} />);
      const thisWeekCard = screen.getByTestId('card-due-this-week');
      expect(thisWeekCard).toHaveTextContent('0'); // Not in this week yet
    });
  });
});
