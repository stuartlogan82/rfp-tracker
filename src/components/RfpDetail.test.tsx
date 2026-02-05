import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RfpDetail from './RfpDetail';

// Mock fetch globally
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

const mockRfp = {
  id: 1,
  name: 'Test RFP',
  agency: 'Test Agency',
  status: 'Active' as const,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  deadlines: [
    {
      id: 1,
      rfpId: 1,
      date: '2026-03-01T00:00:00.000Z',
      time: '14:00',
      label: 'Submission Deadline',
      context: 'Final submission',
      completed: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 2,
      rfpId: 1,
      date: '2026-02-15T00:00:00.000Z',
      time: null,
      label: 'Q&A Deadline',
      context: null,
      completed: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  documents: [
    {
      id: 1,
      rfpId: 1,
      filename: 'rfp-document.pdf',
      filepath: '/uploads/rfp-document.pdf',
      mimeType: 'application/pdf',
      uploadedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
};

describe('RfpDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays RFP information', () => {
    render(<RfpDetail rfp={mockRfp} onUpdate={jest.fn()} />);

    expect(screen.getByText('Test RFP')).toBeInTheDocument();
    expect(screen.getByText(/Test Agency/i)).toBeInTheDocument();
    expect(screen.getByText(/Active/i)).toBeInTheDocument();
  });

  it('displays all deadlines', () => {
    render(<RfpDetail rfp={mockRfp} onUpdate={jest.fn()} />);

    expect(screen.getByText('Submission Deadline')).toBeInTheDocument();
    expect(screen.getByText('Q&A Deadline')).toBeInTheDocument();
  });

  it('displays all documents', () => {
    render(<RfpDetail rfp={mockRfp} onUpdate={jest.fn()} />);

    expect(screen.getByText('rfp-document.pdf')).toBeInTheDocument();
  });

  it('allows editing RFP name', async () => {
    const user = userEvent.setup();
    const mockOnUpdate = jest.fn();

    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ rfp: { ...mockRfp, name: 'Updated RFP Name' } }),
    } as Response);

    render(<RfpDetail rfp={mockRfp} onUpdate={mockOnUpdate} />);

    const editButton = screen.getByRole('button', { name: /edit/i });
    await user.click(editButton);

    const nameInput = screen.getByDisplayValue('Test RFP');
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated RFP Name');

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/rfps/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Updated RFP Name',
          agency: 'Test Agency',
          status: 'Active',
        }),
      });
    });

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalled();
    });
  });

  it('allows changing status', async () => {
    const user = userEvent.setup();
    const mockOnUpdate = jest.fn();

    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ rfp: { ...mockRfp, status: 'Won' } }),
    } as Response);

    render(<RfpDetail rfp={mockRfp} onUpdate={mockOnUpdate} />);

    const editButton = screen.getByRole('button', { name: /edit/i });
    await user.click(editButton);

    const statusSelect = screen.getByDisplayValue('Active');
    await user.selectOptions(statusSelect, 'Won');

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/rfps/1',
        expect.objectContaining({
          body: JSON.stringify({
            name: 'Test RFP',
            agency: 'Test Agency',
            status: 'Won',
          }),
        })
      );
    });
  });

  it('can cancel editing', async () => {
    const user = userEvent.setup();
    const mockOnUpdate = jest.fn();

    render(<RfpDetail rfp={mockRfp} onUpdate={mockOnUpdate} />);

    const editButton = screen.getByRole('button', { name: /edit/i });
    await user.click(editButton);

    const nameInput = screen.getByDisplayValue('Test RFP');
    await user.clear(nameInput);
    await user.type(nameInput, 'Changed Name');

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    // Should revert to view mode without saving
    expect(global.fetch).not.toHaveBeenCalled();
    expect(mockOnUpdate).not.toHaveBeenCalled();

    // Original name should still be visible
    expect(screen.getByText('Test RFP')).toBeInTheDocument();
  });

  it('allows deleting RFP', async () => {
    const user = userEvent.setup();
    const mockOnDelete = jest.fn();

    // Mock window.confirm
    const originalConfirm = window.confirm;
    window.confirm = jest.fn(() => true) as unknown as typeof window.confirm;

    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      status: 204,
    } as Response);

    render(<RfpDetail rfp={mockRfp} onUpdate={jest.fn()} onDelete={mockOnDelete} />);

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/rfps/1', {
        method: 'DELETE',
      });
    });

    await waitFor(() => {
      expect(mockOnDelete).toHaveBeenCalled();
    });

    // Restore original confirm
    window.confirm = originalConfirm;
  });

  it('does not delete if user cancels confirmation', async () => {
    const user = userEvent.setup();
    const mockOnDelete = jest.fn();

    // Mock window.confirm to return false
    const originalConfirm = window.confirm;
    window.confirm = jest.fn(() => false) as unknown as typeof window.confirm;

    render(<RfpDetail rfp={mockRfp} onUpdate={jest.fn()} onDelete={mockOnDelete} />);

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await user.click(deleteButton);

    expect(global.fetch).not.toHaveBeenCalled();
    expect(mockOnDelete).not.toHaveBeenCalled();

    // Restore original confirm
    window.confirm = originalConfirm;
  });

  it('displays error message when update fails', async () => {
    const user = userEvent.setup();
    const mockOnUpdate = jest.fn();

    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Failed to update RFP' }),
    } as Response);

    render(<RfpDetail rfp={mockRfp} onUpdate={mockOnUpdate} />);

    const editButton = screen.getByRole('button', { name: /edit/i });
    await user.click(editButton);

    const nameInput = screen.getByDisplayValue('Test RFP');
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Name');

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/failed to update rfp/i)).toBeInTheDocument();
    });

    expect(mockOnUpdate).not.toHaveBeenCalled();
  });

  it('shows empty state when no deadlines exist', () => {
    const rfpWithoutDeadlines = {
      ...mockRfp,
      deadlines: [],
    };

    render(<RfpDetail rfp={rfpWithoutDeadlines} onUpdate={jest.fn()} />);

    expect(screen.getByText(/no deadlines/i)).toBeInTheDocument();
  });

  it('shows empty state when no documents exist', () => {
    const rfpWithoutDocuments = {
      ...mockRfp,
      documents: [],
    };

    render(<RfpDetail rfp={rfpWithoutDocuments} onUpdate={jest.fn()} />);

    expect(screen.getByText(/no documents/i)).toBeInTheDocument();
  });
});
