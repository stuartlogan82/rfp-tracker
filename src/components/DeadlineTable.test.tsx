/**
 * Tests for DeadlineTable component
 */

import { describe, it, expect, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DeadlineTable from './DeadlineTable';
import type { DeadlineWithRfp } from '@/types';

describe('DeadlineTable', () => {
  const now = new Date('2026-02-10T12:00:00.000Z');

  const mockDeadlines: DeadlineWithRfp[] = [
    {
      id: 1,
      rfpId: 1,
      date: new Date('2026-02-15'),
      time: '17:00',
      label: 'Proposal submission',
      context: 'Submit final proposal',
      completed: false,
      createdAt: new Date('2026-01-15'),
      updatedAt: new Date('2026-01-15'),
      rfpName: 'NHS Digital Transformation',
      rfpAgency: 'NHS England',
      rfpStatus: 'Active',
    },
    {
      id: 2,
      rfpId: 2,
      date: new Date('2026-02-05'),
      time: null,
      label: 'Overdue deadline',
      context: null,
      completed: false,
      createdAt: new Date('2026-01-10'),
      updatedAt: new Date('2026-01-10'),
      rfpName: 'MOD Cloud Project',
      rfpAgency: 'MOD',
      rfpStatus: 'Active',
    },
    {
      id: 3,
      rfpId: 1,
      date: new Date('2026-03-01'),
      time: '12:00',
      label: 'Demo presentation',
      context: null,
      completed: true,
      createdAt: new Date('2026-01-15'),
      updatedAt: new Date('2026-02-05'),
      rfpName: 'NHS Digital Transformation',
      rfpAgency: 'NHS England',
      rfpStatus: 'Active',
    },
  ];

  it('renders table headers', () => {
    render(
      <DeadlineTable
        deadlines={mockDeadlines}
        onSelectRfp={jest.fn()}
        onToggleComplete={jest.fn()}
        now={now}
      />
    );

    // Check for all column headers
    expect(screen.getByText('Urgency')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Time')).toBeInTheDocument();
    expect(screen.getByText('Label')).toBeInTheDocument();
    expect(screen.getByText('RFP')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('renders deadline rows with correct data', () => {
    render(
      <DeadlineTable
        deadlines={mockDeadlines}
        onSelectRfp={jest.fn()}
        onToggleComplete={jest.fn()}
        now={now}
      />
    );

    expect(screen.getByText('Proposal submission')).toBeInTheDocument();
    expect(screen.getByText('Overdue deadline')).toBeInTheDocument();
    expect(screen.getByText('Demo presentation')).toBeInTheDocument();
    expect(screen.getAllByText('NHS Digital Transformation').length).toBeGreaterThan(0);
    expect(screen.getByText('MOD Cloud Project')).toBeInTheDocument();
  });

  it('formats dates as dd MMM yyyy (UK format)', () => {
    render(
      <DeadlineTable
        deadlines={mockDeadlines}
        onSelectRfp={jest.fn()}
        onToggleComplete={jest.fn()}
        now={now}
      />
    );

    expect(screen.getByText('15 Feb 2026')).toBeInTheDocument();
    expect(screen.getByText('05 Feb 2026')).toBeInTheDocument();
    expect(screen.getByText('01 Mar 2026')).toBeInTheDocument();
  });

  it('shows "—" when time is null', () => {
    render(
      <DeadlineTable
        deadlines={mockDeadlines}
        onSelectRfp={jest.fn()}
        onToggleComplete={jest.fn()}
        now={now}
      />
    );

    // Find the row with null time (Overdue deadline)
    const table = screen.getByRole('table');
    expect(table).toHaveTextContent('—');
  });

  it('displays urgency colour dot for each deadline', () => {
    const { container } = render(
      <DeadlineTable
        deadlines={mockDeadlines}
        onSelectRfp={jest.fn()}
        onToggleComplete={jest.fn()}
        now={now}
      />
    );

    // Check for urgency dots (should have bg-red-500, bg-amber-500, etc.)
    const dots = container.querySelectorAll('[class*="rounded-full"]');
    expect(dots.length).toBeGreaterThan(0);
  });

  it('sorts rows by date ascending by default', () => {
    render(
      <DeadlineTable
        deadlines={mockDeadlines}
        onSelectRfp={jest.fn()}
        onToggleComplete={jest.fn()}
        now={now}
      />
    );

    const rows = screen.getAllByRole('row');
    // First row is header, then data rows should be sorted by date (earliest first)
    // Feb 5, Feb 15, Mar 1
    expect(rows[1]).toHaveTextContent('05 Feb 2026');
    expect(rows[2]).toHaveTextContent('15 Feb 2026');
    expect(rows[3]).toHaveTextContent('01 Mar 2026');
  });

  it('toggles sort direction when clicking the same column header', async () => {
    const user = userEvent.setup();
    render(
      <DeadlineTable
        deadlines={mockDeadlines}
        onSelectRfp={jest.fn()}
        onToggleComplete={jest.fn()}
        now={now}
      />
    );

    const dateHeader = screen.getByText('Date');

    // Default is ascending (Feb 5, Feb 15, Mar 1)
    let rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('05 Feb 2026');

    // Click to sort descending
    await user.click(dateHeader);
    rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('01 Mar 2026');

    // Click again to sort ascending
    await user.click(dateHeader);
    rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('05 Feb 2026');
  });

  it('sorts by a different column when clicking its header', async () => {
    const user = userEvent.setup();
    render(
      <DeadlineTable
        deadlines={mockDeadlines}
        onSelectRfp={jest.fn()}
        onToggleComplete={jest.fn()}
        now={now}
      />
    );

    const labelHeader = screen.getByText('Label');
    await user.click(labelHeader);

    // Should now be sorted by label alphabetically
    const rows = screen.getAllByRole('row');
    // "Demo presentation", "Overdue deadline", "Proposal submission"
    expect(rows[1]).toHaveTextContent('Demo presentation');
  });

  it('calls onSelectRfp when RFP name is clicked', async () => {
    const user = userEvent.setup();
    const mockOnSelectRfp = jest.fn();

    render(
      <DeadlineTable
        deadlines={mockDeadlines}
        onSelectRfp={mockOnSelectRfp}
        onToggleComplete={jest.fn()}
        now={now}
      />
    );

    const rfpNames = screen.getAllByText('NHS Digital Transformation');
    await user.click(rfpNames[0]);

    expect(mockOnSelectRfp).toHaveBeenCalledWith(1);
  });

  it('calls onToggleComplete when checkbox is clicked', async () => {
    const user = userEvent.setup();
    const mockOnToggleComplete = jest.fn();

    render(
      <DeadlineTable
        deadlines={mockDeadlines}
        onSelectRfp={jest.fn()}
        onToggleComplete={mockOnToggleComplete}
        now={now}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    // First unchecked checkbox (for incomplete deadline)
    await user.click(checkboxes[0]);

    expect(mockOnToggleComplete).toHaveBeenCalledWith(expect.any(Number), true);
  });

  it('shows empty state when no deadlines provided', () => {
    render(
      <DeadlineTable
        deadlines={[]}
        onSelectRfp={jest.fn()}
        onToggleComplete={jest.fn()}
        now={now}
      />
    );

    expect(screen.getByText(/no deadlines/i)).toBeInTheDocument();
  });

  it('applies urgency background colors to rows', () => {
    const { container } = render(
      <DeadlineTable
        deadlines={mockDeadlines}
        onSelectRfp={jest.fn()}
        onToggleComplete={jest.fn()}
        now={now}
      />
    );

    // Check that rows have urgency-based background colors
    const rows = container.querySelectorAll('tbody tr');
    // Overdue should have red background (bg-red-50)
    expect(rows[0].className).toMatch(/bg-red-50/);
  });

  it('renders export link for each deadline row', () => {
    render(
      <DeadlineTable
        deadlines={mockDeadlines}
        onSelectRfp={jest.fn()}
        onToggleComplete={jest.fn()}
        now={now}
      />
    );

    // Each deadline should have an export link
    const exportLinks = screen.getAllByRole('link', { name: /export/i });
    expect(exportLinks).toHaveLength(mockDeadlines.length);

    // Verify export links contain deadlineId params
    expect(exportLinks[0]).toHaveAttribute('href', expect.stringContaining('/api/export?deadlineId='));
    expect(exportLinks[0]).toHaveAttribute('download');
  });
});
