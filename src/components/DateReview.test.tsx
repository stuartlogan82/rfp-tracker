/**
 * @jest-environment jsdom
 */

import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DateReview from './DateReview';
import type { ExtractedDate } from '@/lib/openai';

// Mock fetch
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe('DateReview', () => {
  const mockDates: ExtractedDate[] = [
    {
      date: '2024-03-15',
      time: '14:00',
      label: 'Proposal submission',
      context: 'Final deadline for all proposals'
    },
    {
      date: '2024-03-10',
      time: null,
      label: 'Clarification deadline',
      context: 'Last day for questions'
    }
  ];

  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays extracted dates in a table', () => {
    render(
      <DateReview
        dates={mockDates}
        rfpId={1}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByDisplayValue('2024-03-15')).toBeInTheDocument();
    expect(screen.getByDisplayValue('14:00')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Proposal submission')).toBeInTheDocument();

    expect(screen.getByDisplayValue('2024-03-10')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Clarification deadline')).toBeInTheDocument();
  });

  it('allows editing date labels', async () => {
    const user = userEvent.setup();
    render(
      <DateReview
        dates={mockDates}
        rfpId={1}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const labelInput = screen.getAllByDisplayValue('Proposal submission')[0];
    await user.clear(labelInput);
    await user.type(labelInput, 'Updated submission deadline');

    expect(screen.getByDisplayValue('Updated submission deadline')).toBeInTheDocument();
  });

  it('allows editing dates', async () => {
    const user = userEvent.setup();
    render(
      <DateReview
        dates={mockDates}
        rfpId={1}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const dateInput = screen.getAllByDisplayValue('2024-03-15')[0];
    await user.clear(dateInput);
    await user.type(dateInput, '2024-03-20');

    expect(screen.getByDisplayValue('2024-03-20')).toBeInTheDocument();
  });

  it('allows editing time', async () => {
    const user = userEvent.setup();
    render(
      <DateReview
        dates={mockDates}
        rfpId={1}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const timeInput = screen.getAllByDisplayValue('14:00')[0];
    await user.clear(timeInput);
    await user.type(timeInput, '16:30');

    expect(screen.getByDisplayValue('16:30')).toBeInTheDocument();
  });

  it('allows deleting dates', async () => {
    const user = userEvent.setup();
    render(
      <DateReview
        dates={mockDates}
        rfpId={1}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.queryByDisplayValue('Proposal submission')).not.toBeInTheDocument();
    });
    expect(screen.getByDisplayValue('Clarification deadline')).toBeInTheDocument();
  });

  it('allows adding new dates', async () => {
    const user = userEvent.setup();
    render(
      <DateReview
        dates={mockDates}
        rfpId={1}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const addButton = screen.getByRole('button', { name: /add date/i });
    await user.click(addButton);

    // Find the newly added date row (will have empty values)
    const dateInputs = screen.getAllByPlaceholderText(/yyyy-mm-dd/i);
    expect(dateInputs.length).toBe(3); // 2 original + 1 new
  });

  it('saves deadlines to database on confirm', async () => {
    const user = userEvent.setup();
    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    render(
      <DateReview
        dates={mockDates}
        rfpId={1}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const confirmButton = screen.getByRole('button', { name: /confirm & save/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/deadlines',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('"rfpId":1'),
        })
      );
    });

    expect(mockOnSave).toHaveBeenCalled();
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <DateReview
        dates={mockDates}
        rfpId={1}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('shows loading state while saving', async () => {
    const user = userEvent.setup();
    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

    // Make fetch return a promise that we control
    let resolvePromise: (value: any) => void;
    const fetchPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    mockFetch.mockReturnValue(fetchPromise as any);

    render(
      <DateReview
        dates={mockDates}
        rfpId={1}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const confirmButton = screen.getByRole('button', { name: /confirm & save/i });
    await user.click(confirmButton);

    // Button should show loading state
    expect(screen.getByText(/saving/i)).toBeInTheDocument();

    // Resolve the promise
    resolvePromise!({
      ok: true,
      json: async () => ({ success: true }),
    });

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalled();
    });
  });

  it('shows error message when save fails', async () => {
    const user = userEvent.setup();
    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Failed to save' }),
    } as Response);

    render(
      <DateReview
        dates={mockDates}
        rfpId={1}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const confirmButton = screen.getByRole('button', { name: /confirm & save/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText(/failed to save/i)).toBeInTheDocument();
    });

    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('shows user-friendly error on network failure during save', async () => {
    const user = userEvent.setup();
    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockRejectedValue(new Error('Network error'));

    render(
      <DateReview
        dates={mockDates}
        rfpId={1}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    const confirmButton = screen.getByRole('button', { name: /confirm & save/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });

    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('displays empty state when no dates provided', () => {
    render(
      <DateReview
        dates={[]}
        rfpId={1}
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText(/no dates/i)).toBeInTheDocument();
  });
});
