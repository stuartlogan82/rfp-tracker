/**
 * Dashboard component tests
 */

import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dashboard from './Dashboard';

// Mock child components
jest.mock('./Sidebar', () => {
  return function MockSidebar({ rfps, selectedRfpId, onSelectRfp, onNewRfp }: any) {
    return (
      <div data-testid="sidebar">
        <button onClick={onNewRfp} data-testid="new-rfp-button">New RFP</button>
        {rfps.map((rfp: any) => (
          <button
            key={rfp.id}
            onClick={() => onSelectRfp(rfp.id)}
            data-testid={`rfp-${rfp.id}`}
            aria-current={selectedRfpId === rfp.id ? 'true' : undefined}
          >
            {rfp.name}
          </button>
        ))}
      </div>
    );
  };
});

jest.mock('./SummaryCards', () => {
  return function MockSummaryCards({ deadlines, rfps }: any) {
    return (
      <div data-testid="summary-cards">
        Deadlines: {deadlines.length}, RFPs: {rfps.length}
      </div>
    );
  };
});

jest.mock('./DeadlineTable', () => {
  return function MockDeadlineTable({ deadlines, onSelectRfp, onToggleComplete }: any) {
    return (
      <div data-testid="deadline-table">
        {deadlines.map((deadline: any) => (
          <div key={deadline.id} data-testid={`deadline-${deadline.id}`}>
            <span>{deadline.label}</span>
            <button onClick={() => onSelectRfp(deadline.rfpId)}>
              {deadline.rfpName}
            </button>
            <input
              type="checkbox"
              checked={deadline.completed}
              onChange={() => onToggleComplete(deadline.id, !deadline.completed)}
              data-testid={`toggle-${deadline.id}`}
            />
          </div>
        ))}
      </div>
    );
  };
});

jest.mock('./RfpDetail', () => {
  return function MockRfpDetail({ rfp, onUpdate, onDelete }: any) {
    const handleDelete = async () => {
      // Simulate the DELETE API call that RfpDetail makes
      const response = await fetch(`/api/rfps/${rfp.id}`, {
        method: 'DELETE',
      });
      if (response.ok && onDelete) {
        onDelete();
      }
    };

    return (
      <div data-testid="rfp-detail">
        <h2>{rfp.name}</h2>
        <button onClick={onUpdate} data-testid="update-button">Update</button>
        {onDelete && <button onClick={handleDelete} data-testid="delete-button">Delete</button>}
      </div>
    );
  };
});

jest.mock('./NewRfpDialog', () => {
  return function MockNewRfpDialog({ open, onClose, onComplete }: any) {
    if (!open) return null;
    return (
      <div data-testid="new-rfp-dialog">
        <button onClick={onClose} data-testid="dialog-close">Close</button>
        <button onClick={onComplete} data-testid="dialog-complete">Complete</button>
      </div>
    );
  };
});

describe('Dashboard', () => {
  const mockRfps = [
    {
      id: 1,
      name: 'Active RFP 1',
      agency: 'Agency A',
      status: 'Active',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      deadlines: [
        {
          id: 1,
          rfpId: 1,
          date: '2024-03-15T00:00:00Z',
          time: '14:00',
          label: 'Submission deadline',
          context: null,
          completed: false,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ],
      documents: [],
    },
    {
      id: 2,
      name: 'Won RFP',
      agency: 'Agency B',
      status: 'Won',
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
      deadlines: [
        {
          id: 2,
          rfpId: 2,
          date: '2024-03-20T00:00:00Z',
          time: null,
          label: 'Follow-up',
          context: null,
          completed: false,
          createdAt: '2024-01-02T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z',
        },
      ],
      documents: [],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn() as any;
  });

  describe('initial data fetching', () => {
    it('fetches data from GET /api/rfps on mount and renders Sidebar, SummaryCards, and DeadlineTable', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ rfps: mockRfps }),
      });

      render(<Dashboard />);

      // Wait for components to appear (loading completes)
      await waitFor(() => {
        expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      });

      // Verify all three main components are rendered
      expect(screen.getByTestId('summary-cards')).toBeInTheDocument();
      expect(screen.getByTestId('deadline-table')).toBeInTheDocument();
      expect(global.fetch).toHaveBeenCalledWith('/api/rfps');
    });

    it('displays loading state while fetching data', () => {
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<Dashboard />);

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('displays error state when fetch fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Active only filter', () => {
    it('default view shows "Active only" filter — deadlines from non-Active RFPs are hidden', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ rfps: mockRfps }),
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('deadline-table')).toBeInTheDocument();
      });

      // Only deadline from Active RFP should be visible
      expect(screen.getByTestId('deadline-1')).toBeInTheDocument();
      expect(screen.queryByTestId('deadline-2')).not.toBeInTheDocument();

      // Summary cards should only count Active RFP deadlines
      const summaryCards = screen.getByTestId('summary-cards');
      expect(summaryCards).toHaveTextContent('Deadlines: 1');
    });

    it('toggling the filter shows/hides deadlines from non-Active RFPs, and summary cards update accordingly', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ rfps: mockRfps }),
      });

      render(<Dashboard />);
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByTestId('deadline-table')).toBeInTheDocument();
      });

      // Find and click the "Show All" toggle
      const showAllToggle = screen.getByTestId('show-all-toggle');
      await user.click(showAllToggle);

      // Now both deadlines should be visible
      expect(screen.getByTestId('deadline-1')).toBeInTheDocument();
      expect(screen.getByTestId('deadline-2')).toBeInTheDocument();

      // Summary cards should count all deadlines
      const summaryCards = screen.getByTestId('summary-cards');
      expect(summaryCards).toHaveTextContent('Deadlines: 2');

      // Toggle back to Active only
      await user.click(showAllToggle);

      // Back to only Active deadline
      expect(screen.getByTestId('deadline-1')).toBeInTheDocument();
      expect(screen.queryByTestId('deadline-2')).not.toBeInTheDocument();
    });
  });

  describe('RFP detail view', () => {
    it('clicking an RFP in the sidebar shows the RfpDetail view', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ rfps: mockRfps }),
      });

      render(<Dashboard />);
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      });

      // Click on RFP in sidebar
      await user.click(screen.getByTestId('rfp-1'));

      // RfpDetail should be shown instead of deadline table
      await waitFor(() => {
        expect(screen.getByTestId('rfp-detail')).toBeInTheDocument();
      });
      expect(screen.queryByTestId('deadline-table')).not.toBeInTheDocument();
    });

    it('clicking an RFP name in the deadline table shows the RfpDetail view', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ rfps: mockRfps }),
      });

      render(<Dashboard />);
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByTestId('deadline-table')).toBeInTheDocument();
      });

      // Click on RFP name in deadline table (within the deadline-table)
      const deadlineTable = screen.getByTestId('deadline-table');
      const rfpNameButton = within(deadlineTable).getByText('Active RFP 1');
      await user.click(rfpNameButton);

      // RfpDetail should be shown
      expect(screen.getByTestId('rfp-detail')).toBeInTheDocument();
    });

    it('"Back to Dashboard" returns to the deadline table', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ rfps: mockRfps }),
      });

      render(<Dashboard />);
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      });

      // Navigate to detail view
      await user.click(screen.getByTestId('rfp-1'));
      expect(screen.getByTestId('rfp-detail')).toBeInTheDocument();

      // Click back button
      const backButton = screen.getByTestId('back-to-dashboard');
      await user.click(backButton);

      // Should return to deadline table view
      expect(screen.getByTestId('deadline-table')).toBeInTheDocument();
      expect(screen.queryByTestId('rfp-detail')).not.toBeInTheDocument();
    });
  });

  describe('New RFP dialog', () => {
    it('clicking "New RFP" opens the NewRfpDialog', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ rfps: mockRfps }),
      });

      render(<Dashboard />);
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      });

      // Dialog should not be visible initially
      expect(screen.queryByTestId('new-rfp-dialog')).not.toBeInTheDocument();

      // Click New RFP button
      await user.click(screen.getByTestId('new-rfp-button'));

      // Dialog should be visible
      expect(screen.getByTestId('new-rfp-dialog')).toBeInTheDocument();
    });

    it('completing the wizard refreshes dashboard data', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ rfps: mockRfps }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ rfps: [...mockRfps, { id: 3, name: 'New RFP', deadlines: [] }] }),
        });

      render(<Dashboard />);
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      });

      // Open dialog
      await user.click(screen.getByTestId('new-rfp-button'));

      // Complete wizard
      await user.click(screen.getByTestId('dialog-complete'));

      // Should refetch data
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2);
        expect(global.fetch).toHaveBeenNthCalledWith(2, '/api/rfps');
      });
    });

    it('closing the dialog without completing does not refresh data', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ rfps: mockRfps }),
      });

      render(<Dashboard />);
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      });

      // Open dialog
      await user.click(screen.getByTestId('new-rfp-button'));

      // Close dialog without completing
      await user.click(screen.getByTestId('dialog-close'));

      // Should NOT refetch data
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('deadline completion toggle', () => {
    it('toggling a deadline\'s completed checkbox calls PUT /api/deadlines/[id] and refreshes data', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ rfps: mockRfps }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ deadline: { ...mockRfps[0].deadlines[0], completed: true } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ rfps: mockRfps }),
        });

      render(<Dashboard />);
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByTestId('deadline-table')).toBeInTheDocument();
      });

      // Toggle deadline completion
      const checkbox = screen.getByTestId('toggle-1');
      await user.click(checkbox);

      // Should call PUT /api/deadlines/1
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/deadlines/1',
          expect.objectContaining({
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ completed: true }),
          })
        );
      });

      // Should refetch data
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(3);
        expect(global.fetch).toHaveBeenNthCalledWith(3, '/api/rfps');
      });
    });

    it('displays error message when toggle fails', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ rfps: mockRfps }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Update failed' }),
        });

      render(<Dashboard />);
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByTestId('deadline-table')).toBeInTheDocument();
      });

      // Toggle deadline completion
      const checkbox = screen.getByTestId('toggle-1');
      await user.click(checkbox);

      // Should display error message
      await waitFor(() => {
        expect(screen.getByText(/update failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('RFP deletion', () => {
    it('deleting an RFP from detail view returns to dashboard and refreshes data', async () => {
      // Mock window.confirm to return true
      global.confirm = jest.fn(() => true) as any;

      // Use implementation-based mocking for more control
      (global.fetch as jest.Mock).mockImplementation((url: string, options?: any) => {
        const method = options?.method || 'GET';

        // GET /api/rfps - initial load
        if (url === '/api/rfps' && method === 'GET') {
          // First call returns all RFPs
          if ((global.fetch as jest.Mock).mock.calls.filter((call: any) => call[0] === '/api/rfps').length === 1) {
            return Promise.resolve({
              ok: true,
              json: async () => ({ rfps: mockRfps }),
            });
          }
          // Second GET call (after deletion) returns filtered list
          return Promise.resolve({
            ok: true,
            json: async () => ({ rfps: [mockRfps[1]] }),
          });
        }

        // DELETE /api/rfps/1
        if (url === '/api/rfps/1' && method === 'DELETE') {
          return Promise.resolve({
            ok: true,
            json: async () => ({}),
          });
        }

        return Promise.reject(new Error(`Unexpected fetch: ${method} ${url}`));
      });

      render(<Dashboard />);
      const user = userEvent.setup();

      await waitFor(() => {
        expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      });

      // Navigate to detail view
      await user.click(screen.getByTestId('rfp-1'));

      await waitFor(() => {
        expect(screen.getByTestId('rfp-detail')).toBeInTheDocument();
      });

      // Delete RFP
      await user.click(screen.getByTestId('delete-button'));

      // Should return to dashboard and refetch data
      await waitFor(() => {
        expect(screen.getByTestId('deadline-table')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Verify fetch was called for initial load, delete, and refresh
      const fetchCalls = (global.fetch as jest.Mock).mock.calls;
      expect(fetchCalls.some((call: any) => call[0] === '/api/rfps' && (!call[1] || call[1].method === 'GET'))).toBe(true);
      expect(fetchCalls.some((call: any) => call[0] === '/api/rfps/1' && call[1]?.method === 'DELETE')).toBe(true);
    });
  });
});
