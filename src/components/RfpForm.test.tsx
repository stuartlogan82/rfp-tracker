import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RfpForm from './RfpForm';

// Mock fetch globally
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe('RfpForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders form fields', () => {
    const mockOnSuccess = jest.fn();
    render(<RfpForm onSuccess={mockOnSuccess} />);

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/agency/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create rfp/i })).toBeInTheDocument();
  });

  it('displays all status options in select', () => {
    const mockOnSuccess = jest.fn();
    render(<RfpForm onSuccess={mockOnSuccess} />);

    const statusSelect = screen.getByLabelText(/status/i) as HTMLSelectElement;
    const options = Array.from(statusSelect.options).map((opt) => opt.value);

    expect(options).toContain('Active');
    expect(options).toContain('Won');
    expect(options).toContain('Lost');
    expect(options).toContain('NoBid');
    expect(options).toContain('Archived');
  });

  it('defaults status to Active', () => {
    const mockOnSuccess = jest.fn();
    render(<RfpForm onSuccess={mockOnSuccess} />);

    const statusSelect = screen.getByLabelText(/status/i) as HTMLSelectElement;
    expect(statusSelect.value).toBe('Active');
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    const mockOnSuccess = jest.fn();
    const mockResponse = {
      rfp: {
        id: 1,
        name: 'Test RFP',
        agency: 'Test Agency',
        status: 'Active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    render(<RfpForm onSuccess={mockOnSuccess} />);

    const nameInput = screen.getByLabelText(/name/i);
    const agencyInput = screen.getByLabelText(/agency/i);
    const submitButton = screen.getByRole('button', { name: /create rfp/i });

    await user.type(nameInput, 'Test RFP');
    await user.type(agencyInput, 'Test Agency');
    await user.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/rfps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test RFP',
          agency: 'Test Agency',
          status: 'Active',
        }),
      });
    });

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith(mockResponse.rfp);
    });
  });

  it('shows error when name is empty', async () => {
    const user = userEvent.setup();
    const mockOnSuccess = jest.fn();

    render(<RfpForm onSuccess={mockOnSuccess} />);

    const agencyInput = screen.getByLabelText(/agency/i);
    const submitButton = screen.getByRole('button', { name: /create rfp/i });

    await user.type(agencyInput, 'Test Agency');
    await user.click(submitButton);

    // Should not call API
    expect(global.fetch).not.toHaveBeenCalled();
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('shows error when agency is empty', async () => {
    const user = userEvent.setup();
    const mockOnSuccess = jest.fn();

    render(<RfpForm onSuccess={mockOnSuccess} />);

    const nameInput = screen.getByLabelText(/name/i);
    const submitButton = screen.getByRole('button', { name: /create rfp/i });

    await user.type(nameInput, 'Test RFP');
    await user.click(submitButton);

    // Should not call API
    expect(global.fetch).not.toHaveBeenCalled();
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('displays error message when API call fails', async () => {
    const user = userEvent.setup();
    const mockOnSuccess = jest.fn();

    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Failed to create RFP' }),
    } as Response);

    render(<RfpForm onSuccess={mockOnSuccess} />);

    const nameInput = screen.getByLabelText(/name/i);
    const agencyInput = screen.getByLabelText(/agency/i);
    const submitButton = screen.getByRole('button', { name: /create rfp/i });

    await user.type(nameInput, 'Test RFP');
    await user.type(agencyInput, 'Test Agency');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/failed to create rfp/i)).toBeInTheDocument();
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('disables submit button while submitting', async () => {
    const user = userEvent.setup();
    const mockOnSuccess = jest.fn();

    // Mock a slow API response
    (global.fetch as jest.MockedFunction<typeof fetch>).mockImplementationOnce(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => ({ rfp: { id: 1 } }),
              } as Response),
            100
          )
        )
    );

    render(<RfpForm onSuccess={mockOnSuccess} />);

    const nameInput = screen.getByLabelText(/name/i);
    const agencyInput = screen.getByLabelText(/agency/i);
    const submitButton = screen.getByRole('button', { name: /create rfp/i });

    await user.type(nameInput, 'Test RFP');
    await user.type(agencyInput, 'Test Agency');
    await user.click(submitButton);

    // Button should be disabled while submitting
    expect(submitButton).toBeDisabled();

    // Wait for completion
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('allows changing status before submission', async () => {
    const user = userEvent.setup();
    const mockOnSuccess = jest.fn();

    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ rfp: { id: 1, status: 'Won' } }),
    } as Response);

    render(<RfpForm onSuccess={mockOnSuccess} />);

    const nameInput = screen.getByLabelText(/name/i);
    const agencyInput = screen.getByLabelText(/agency/i);
    const statusSelect = screen.getByLabelText(/status/i);
    const submitButton = screen.getByRole('button', { name: /create rfp/i });

    await user.type(nameInput, 'Test RFP');
    await user.type(agencyInput, 'Test Agency');
    await user.selectOptions(statusSelect, 'Won');
    await user.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/rfps',
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

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnSuccess = jest.fn();
    const mockOnCancel = jest.fn();

    render(<RfpForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
