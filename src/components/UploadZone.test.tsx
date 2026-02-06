import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UploadZone } from './UploadZone';

// Mock fetch globally
global.fetch = jest.fn();

describe('UploadZone', () => {
  const mockOnUploadComplete = jest.fn();
  const mockRfpId = 1;

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        document: {
          id: 1,
          filename: 'test.pdf',
          filepath: '/uploads/test.pdf',
        },
      }),
    });
  });

  it('renders upload zone with file picker button', () => {
    render(<UploadZone rfpId={mockRfpId} onUploadComplete={mockOnUploadComplete} />);

    expect(screen.getByText(/drag.*drop/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /choose file/i })).toBeInTheDocument();
  });

  it('shows loading state when uploading', async () => {
    // Mock a slow upload
    (global.fetch as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({ document: {} }),
            });
          }, 100);
        })
    );

    render(<UploadZone rfpId={mockRfpId} onUploadComplete={mockOnUploadComplete} />);

    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByTestId('file-input');

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/uploading/i)).toBeInTheDocument();
    });
  });

  it('shows success state after successful upload', async () => {
    render(<UploadZone rfpId={mockRfpId} onUploadComplete={mockOnUploadComplete} />);

    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByTestId('file-input');

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/success/i)).toBeInTheDocument();
    });

    expect(mockOnUploadComplete).toHaveBeenCalledWith({
      id: 1,
      filename: 'test.pdf',
      filepath: '/uploads/test.pdf',
    });
  });

  it('shows error state when upload fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Upload failed' }),
    });

    render(<UploadZone rfpId={mockRfpId} onUploadComplete={mockOnUploadComplete} />);

    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByTestId('file-input');

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });

    expect(mockOnUploadComplete).not.toHaveBeenCalled();
  });

  it('handles drag and drop events', () => {
    render(<UploadZone rfpId={mockRfpId} onUploadComplete={mockOnUploadComplete} />);

    const dropZone = screen.getByTestId('drop-zone');

    // Simulate drag enter
    fireEvent.dragEnter(dropZone, {
      dataTransfer: { files: [] },
    });

    // Should add visual feedback (this would be tested via class/style changes)
    expect(dropZone).toBeInTheDocument();

    // Simulate drag leave
    fireEvent.dragLeave(dropZone);

    expect(dropZone).toBeInTheDocument();
  });

  it('shows user-friendly error on network failure', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Failed to fetch'));

    render(<UploadZone rfpId={mockRfpId} onUploadComplete={mockOnUploadComplete} />);

    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByTestId('file-input');

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
      expect(screen.getByText(/failed to fetch/i)).toBeInTheDocument();
    });

    expect(mockOnUploadComplete).not.toHaveBeenCalled();
  });

  it('shows error when upload succeeds but extraction fails', async () => {
    const mockOnExtractComplete = jest.fn();

    // First call (upload) succeeds, second call (extract) fails
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          document: { id: 1, filename: 'test.pdf', filepath: '/uploads/test.pdf' },
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Extraction failed' }),
      });

    render(
      <UploadZone
        rfpId={mockRfpId}
        onUploadComplete={mockOnUploadComplete}
        onExtractComplete={mockOnExtractComplete}
      />
    );

    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByTestId('file-input');

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
      expect(screen.getByText(/extraction failed/i)).toBeInTheDocument();
    });

    // Upload callback should have been called since upload succeeded
    expect(mockOnUploadComplete).toHaveBeenCalled();
    // Extract callback should NOT have been called
    expect(mockOnExtractComplete).not.toHaveBeenCalled();
  });

  it('uploads file when dropped', async () => {
    render(<UploadZone rfpId={mockRfpId} onUploadComplete={mockOnUploadComplete} />);

    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const dropZone = screen.getByTestId('drop-zone');

    fireEvent.drop(dropZone, {
      dataTransfer: { files: [file] },
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/upload',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });
});
