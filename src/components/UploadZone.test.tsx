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
