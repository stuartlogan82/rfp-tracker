import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotificationBanner from './NotificationBanner';
import type { DeadlineWithRfp } from '@/types';

describe('NotificationBanner', () => {
  const fixedNow = new Date('2026-03-10T12:00:00.000Z');

  const createDeadline = (overrides: Partial<DeadlineWithRfp> = {}): DeadlineWithRfp => ({
    id: 1,
    rfpId: 1,
    date: new Date('2026-03-12T00:00:00.000Z'), // 2 days away (critical)
    time: null,
    label: 'Test Deadline',
    context: null,
    completed: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    rfpName: 'Test RFP',
    rfpAgency: 'Test Agency',
    rfpStatus: 'Active',
    ...overrides,
  });

  it('renders banner with 1 critical deadline within 3 days', () => {
    const deadlines = [createDeadline()];

    render(<NotificationBanner deadlines={deadlines} now={fixedNow} />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/1 deadline/i)).toBeInTheDocument();
    expect(screen.getByText(/within 3 days/i)).toBeInTheDocument();
  });

  it('renders banner with multiple urgent deadlines (critical + overdue)', () => {
    const deadlines = [
      createDeadline({ id: 1, date: new Date('2026-03-12T00:00:00.000Z') }), // critical
      createDeadline({ id: 2, date: new Date('2026-03-11T00:00:00.000Z') }), // critical
      createDeadline({ id: 3, date: new Date('2026-03-08T00:00:00.000Z') }), // overdue
    ];

    render(<NotificationBanner deadlines={deadlines} now={fixedNow} />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/3 deadlines/i)).toBeInTheDocument();
    expect(screen.getByText(/within 3 days/i)).toBeInTheDocument();
  });

  it('does not render when only safe/warning deadlines exist', () => {
    const deadlines = [
      createDeadline({ date: new Date('2026-03-16T00:00:00.000Z') }), // 6 days (warning)
      createDeadline({ date: new Date('2026-03-20T00:00:00.000Z') }), // 10 days (safe)
    ];

    const { container } = render(<NotificationBanner deadlines={deadlines} now={fixedNow} />);

    expect(container.firstChild).toBeNull();
  });

  it('dismisses banner when dismiss button is clicked', async () => {
    const user = userEvent.setup();
    const deadlines = [createDeadline()];

    render(<NotificationBanner deadlines={deadlines} now={fixedNow} />);

    expect(screen.getByRole('alert')).toBeInTheDocument();

    const dismissButton = screen.getByRole('button', { name: /dismiss/i });
    await user.click(dismissButton);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('expands to show individual deadline labels when expand button is clicked', async () => {
    const user = userEvent.setup();
    const deadlines = [
      createDeadline({ id: 1, label: 'First Deadline', date: new Date('2026-03-12T00:00:00.000Z') }),
      createDeadline({ id: 2, label: 'Second Deadline', date: new Date('2026-03-11T00:00:00.000Z') }),
    ];

    render(<NotificationBanner deadlines={deadlines} now={fixedNow} />);

    // Labels should not be visible initially
    expect(screen.queryByText(/First Deadline/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Second Deadline/)).not.toBeInTheDocument();

    const expandButton = screen.getByRole('button', { name: /expand/i });
    await user.click(expandButton);

    // Labels should now be visible
    expect(screen.getByText(/First Deadline/)).toBeInTheDocument();
    expect(screen.getByText(/Second Deadline/)).toBeInTheDocument();
  });

  it('excludes completed deadlines even if within 3 days', () => {
    const deadlines = [
      createDeadline({ completed: true, date: new Date('2026-03-12T00:00:00.000Z') }),
    ];

    const { container } = render(<NotificationBanner deadlines={deadlines} now={fixedNow} />);

    expect(container.firstChild).toBeNull();
  });

  it('shows singular text for exactly 1 deadline', () => {
    const deadlines = [createDeadline()];

    render(<NotificationBanner deadlines={deadlines} now={fixedNow} />);

    // Should say "1 deadline is due" not "1 deadlines are due"
    expect(screen.getByText(/1 deadline is due/i)).toBeInTheDocument();
  });
});
