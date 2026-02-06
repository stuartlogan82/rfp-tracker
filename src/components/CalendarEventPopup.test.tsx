/**
 * CalendarEventPopup component tests
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CalendarEventPopup from './CalendarEventPopup';
import type { DeadlineWithRfp } from '@/types';

const mockDeadline: DeadlineWithRfp = {
  id: 1,
  rfpId: 42,
  date: '2026-02-15',
  time: '17:00',
  label: 'RFP Submission Deadline',
  context: 'Final deadline for submission of all documents',
  completed: false,
  createdAt: new Date('2026-01-01').toISOString(),
  updatedAt: new Date('2026-01-01').toISOString(),
  rfpName: 'NHS Digital Procurement',
  rfpAgency: 'NHS',
  rfpStatus: 'Active' as const,
};

describe('CalendarEventPopup', () => {
  const mockOnClose = jest.fn();
  const mockOnSelectRfp = jest.fn();
  const mockOnUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Read-only mode', () => {
    it('renders deadline details when open', () => {
      render(
        <CalendarEventPopup
          deadline={mockDeadline}
          open={true}
          onClose={mockOnClose}
          onSelectRfp={mockOnSelectRfp}
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.getByText('RFP Submission Deadline')).toBeInTheDocument();
      expect(screen.getByText(/15 February 2026/)).toBeInTheDocument();
      expect(screen.getByText(/17:00/)).toBeInTheDocument();
      expect(screen.getByText('Final deadline for submission of all documents')).toBeInTheDocument();
      expect(screen.getAllByText('NHS Digital Procurement').length).toBeGreaterThanOrEqual(1);
    });

    it('does not render when open is false', () => {
      render(
        <CalendarEventPopup
          deadline={mockDeadline}
          open={false}
          onClose={mockOnClose}
          onSelectRfp={mockOnSelectRfp}
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.queryByText('RFP Submission Deadline')).not.toBeInTheDocument();
    });

    it('does not render when deadline is null', () => {
      render(
        <CalendarEventPopup
          deadline={null}
          open={true}
          onClose={mockOnClose}
          onSelectRfp={mockOnSelectRfp}
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.queryByText('RFP Submission Deadline')).not.toBeInTheDocument();
    });

    it('shows "No time specified" when time is null', () => {
      const deadlineNoTime = { ...mockDeadline, time: null };

      render(
        <CalendarEventPopup
          deadline={deadlineNoTime}
          open={true}
          onClose={mockOnClose}
          onSelectRfp={mockOnSelectRfp}
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.queryByText(/17:00/)).not.toBeInTheDocument();
    });

    it('hides context section when context is null', () => {
      const deadlineNoContext = { ...mockDeadline, context: null };

      render(
        <CalendarEventPopup
          deadline={deadlineNoContext}
          open={true}
          onClose={mockOnClose}
          onSelectRfp={mockOnSelectRfp}
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.queryByText('Final deadline for submission of all documents')).not.toBeInTheDocument();
    });

    it('renders "View RFP" button that calls onSelectRfp and closes', async () => {
      const user = userEvent.setup();

      render(
        <CalendarEventPopup
          deadline={mockDeadline}
          open={true}
          onClose={mockOnClose}
          onSelectRfp={mockOnSelectRfp}
          onUpdate={mockOnUpdate}
        />
      );

      const viewRfpButton = screen.getByText('View RFP');
      await user.click(viewRfpButton);

      expect(mockOnSelectRfp).toHaveBeenCalledWith(42);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('shows completion status', () => {
      const completedDeadline = { ...mockDeadline, completed: true };

      render(
        <CalendarEventPopup
          deadline={completedDeadline}
          open={true}
          onClose={mockOnClose}
          onSelectRfp={mockOnSelectRfp}
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.getByText(/completed/i)).toBeInTheDocument();
    });
  });

  describe('Edit mode', () => {
    it('switches to edit mode when Edit button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <CalendarEventPopup
          deadline={mockDeadline}
          open={true}
          onClose={mockOnClose}
          onSelectRfp={mockOnSelectRfp}
          onUpdate={mockOnUpdate}
        />
      );

      const editButton = screen.getByText('Edit');
      await user.click(editButton);

      // Should show input fields
      expect(screen.getByLabelText(/label/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/completed/i)).toBeInTheDocument();
    });

    it('displays current values in edit form', async () => {
      const user = userEvent.setup();

      render(
        <CalendarEventPopup
          deadline={mockDeadline}
          open={true}
          onClose={mockOnClose}
          onSelectRfp={mockOnSelectRfp}
          onUpdate={mockOnUpdate}
        />
      );

      await user.click(screen.getByText('Edit'));

      const labelInput = screen.getByLabelText(/label/i) as HTMLInputElement;
      const dateInput = screen.getByLabelText(/date/i) as HTMLInputElement;
      const completedCheckbox = screen.getByLabelText(/completed/i) as HTMLInputElement;

      expect(labelInput.value).toBe('RFP Submission Deadline');
      expect(dateInput.value).toBe('2026-02-15');
      expect(completedCheckbox.checked).toBe(false);
    });

    it('calls onUpdate with modified values when Save is clicked', async () => {
      const user = userEvent.setup();
      mockOnUpdate.mockResolvedValue(undefined);

      render(
        <CalendarEventPopup
          deadline={mockDeadline}
          open={true}
          onClose={mockOnClose}
          onSelectRfp={mockOnSelectRfp}
          onUpdate={mockOnUpdate}
        />
      );

      await user.click(screen.getByText('Edit'));

      const labelInput = screen.getByLabelText(/label/i);
      await user.clear(labelInput);
      await user.type(labelInput, 'Updated Deadline');

      const saveButton = screen.getByText('Save');
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith(1, {
          label: 'Updated Deadline',
          date: '2026-02-15',
          completed: false,
        });
      });
    });

    it('reverts to read-only mode after successful save', async () => {
      const user = userEvent.setup();
      mockOnUpdate.mockResolvedValue(undefined);

      render(
        <CalendarEventPopup
          deadline={mockDeadline}
          open={true}
          onClose={mockOnClose}
          onSelectRfp={mockOnSelectRfp}
          onUpdate={mockOnUpdate}
        />
      );

      await user.click(screen.getByText('Edit'));
      await user.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(screen.queryByLabelText(/label/i)).not.toBeInTheDocument();
        expect(screen.getByText('Edit')).toBeInTheDocument();
      });
    });

    it('shows loading state while saving', async () => {
      const user = userEvent.setup();
      mockOnUpdate.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(
        <CalendarEventPopup
          deadline={mockDeadline}
          open={true}
          onClose={mockOnClose}
          onSelectRfp={mockOnSelectRfp}
          onUpdate={mockOnUpdate}
        />
      );

      await user.click(screen.getByText('Edit'));
      await user.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(screen.getByText(/saving/i)).toBeInTheDocument();
      });
    });

    it('displays error message when save fails', async () => {
      const user = userEvent.setup();
      mockOnUpdate.mockRejectedValue(new Error('Network error'));

      render(
        <CalendarEventPopup
          deadline={mockDeadline}
          open={true}
          onClose={mockOnClose}
          onSelectRfp={mockOnSelectRfp}
          onUpdate={mockOnUpdate}
        />
      );

      await user.click(screen.getByText('Edit'));
      await user.click(screen.getByText('Save'));

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    it('reverts to original values when Cancel is clicked', async () => {
      const user = userEvent.setup();

      render(
        <CalendarEventPopup
          deadline={mockDeadline}
          open={true}
          onClose={mockOnClose}
          onSelectRfp={mockOnSelectRfp}
          onUpdate={mockOnUpdate}
        />
      );

      await user.click(screen.getByText('Edit'));

      const labelInput = screen.getByLabelText(/label/i);
      await user.clear(labelInput);
      await user.type(labelInput, 'Modified Label');

      await user.click(screen.getByText('Cancel'));

      // Should return to read-only mode with original value
      expect(screen.getByText('RFP Submission Deadline')).toBeInTheDocument();
      expect(screen.queryByLabelText(/label/i)).not.toBeInTheDocument();
      expect(mockOnUpdate).not.toHaveBeenCalled();
    });
  });
});
