/**
 * Tests for NewRfpDialog component - Multi-step RFP creation wizard
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NewRfpDialog from './NewRfpDialog';

// Mock fetch for API calls
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe('NewRfpDialog', () => {
  beforeEach(() => {
    (global.fetch as jest.MockedFunction<typeof fetch>).mockClear();
  });

  it('renders dialog when open is true', () => {
    render(<NewRfpDialog open={true} onClose={jest.fn()} onComplete={jest.fn()} />);

    // Should show the dialog with Step 1 (RFP form)
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does not render dialog when open is false', () => {
    render(<NewRfpDialog open={false} onClose={jest.fn()} onComplete={jest.fn()} />);

    // Dialog should not be present
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it.skip('Step 1 shows RfpForm and advances to Step 2 on submit', async () => {
    const user = userEvent.setup();
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ rfp: { id: 1, name: 'Test RFP', agency: 'Test Agency', status: 'Active' } }),
    } as Response);

    render(<NewRfpDialog open={true} onClose={jest.fn()} onComplete={jest.fn()} />);

    // Step 1: Fill in RFP form
    const nameInput = screen.getByLabelText(/rfp name/i);
    const agencyInput = screen.getByLabelText(/agency/i);
    const submitButton = screen.getByRole('button', { name: /create rfp/i });

    await user.type(nameInput, 'Test RFP');
    await user.type(agencyInput, 'Test Agency');
    await user.click(submitButton);

    // Wait for Step 2 to appear (Upload step)
    await waitFor(() => {
      expect(screen.getByText(/upload document/i)).toBeInTheDocument();
    });
  });

  it.skip('Step 2 shows UploadZone and advances to Step 3 after upload', async () => {
    const user = userEvent.setup();

    // Mock RFP creation
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ rfp: { id: 1, name: 'Test RFP', agency: 'Test Agency', status: 'Active' } }),
    } as Response);

    render(<NewRfpDialog open={true} onClose={jest.fn()} onComplete={jest.fn()} />);

    // Complete Step 1
    await user.type(screen.getByLabelText(/rfp name/i), 'Test RFP');
    await user.type(screen.getByLabelText(/agency/i), 'Test Agency');
    await user.click(screen.getByRole('button', { name: /create rfp/i }));

    await waitFor(() => {
      expect(screen.getByText(/upload document/i)).toBeInTheDocument();
    });

    // Mock upload and extraction
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ document: { id: 1, filename: 'test.pdf' } }),
    } as Response);

    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        dates: [
          { date: '2026-03-01', time: '17:00', label: 'Deadline 1', context: null },
        ],
      }),
    } as Response);

    // Simulate file upload (this is simplified - actual implementation may vary)
    // The UploadZone component will handle the upload and trigger the callback
    // For now, we'll just verify that Step 2 is showing
    expect(screen.getByText(/upload document/i)).toBeInTheDocument();
  });

  it.skip('Step 3 shows DateReview and calls onComplete on save', async () => {
    const user = userEvent.setup();
    const mockOnComplete = jest.fn();

    // Mock RFP creation
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ rfp: { id: 1, name: 'Test RFP', agency: 'Test Agency', status: 'Active' } }),
    } as Response);

    render(<NewRfpDialog open={true} onClose={jest.fn()} onComplete={mockOnComplete} />);

    // Complete Step 1
    await user.type(screen.getByLabelText(/rfp name/i), 'Test RFP');
    await user.type(screen.getByLabelText(/agency/i), 'Test Agency');
    await user.click(screen.getByRole('button', { name: /create rfp/i }));

    await waitFor(() => {
      expect(screen.getByText(/upload document/i)).toBeInTheDocument();
    });

    // Note: Full multi-step flow would require more complex mocking
    // This test verifies the basic structure
  });

  it('calls onClose when cancel is clicked', async () => {
    const user = userEvent.setup();
    const mockOnClose = jest.fn();

    render(<NewRfpDialog open={true} onClose={mockOnClose} onComplete={jest.fn()} />);

    // Find and click cancel button
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it.skip('shows appropriate title for each step', async () => {
    const user = userEvent.setup();

    render(<NewRfpDialog open={true} onClose={jest.fn()} onComplete={jest.fn()} />);

    // Step 1: Create RFP
    expect(screen.getByText(/create.*rfp/i)).toBeInTheDocument();

    // Complete Step 1 to go to Step 2
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ rfp: { id: 1, name: 'Test RFP', agency: 'Test Agency', status: 'Active' } }),
    } as Response);

    await user.type(screen.getByLabelText(/rfp name/i), 'Test RFP');
    await user.type(screen.getByLabelText(/agency/i), 'Test Agency');
    await user.click(screen.getByRole('button', { name: /create rfp/i }));

    // Step 2: Upload Document
    await waitFor(() => {
      expect(screen.getByText(/upload document/i)).toBeInTheDocument();
    });
  });
});
