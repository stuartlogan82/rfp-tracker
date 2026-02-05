/**
 * Tests for Sidebar component
 */

import { describe, it, expect, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Sidebar from './Sidebar';
import type { RfpWithRelations } from '@/types';

describe('Sidebar', () => {
  const mockRfps: RfpWithRelations[] = [
    {
      id: 1,
      name: 'NHS Digital Transformation',
      agency: 'NHS England',
      status: 'Active',
      createdAt: new Date('2026-01-15'),
      updatedAt: new Date('2026-01-15'),
      deadlines: [
        {
          id: 1,
          rfpId: 1,
          date: new Date('2026-02-20'),
          time: '17:00',
          label: 'Proposal deadline',
          context: null,
          completed: false,
          createdAt: new Date('2026-01-15'),
          updatedAt: new Date('2026-01-15'),
        },
        {
          id: 2,
          rfpId: 1,
          date: new Date('2026-02-25'),
          time: null,
          label: 'Demo presentation',
          context: null,
          completed: false,
          createdAt: new Date('2026-01-15'),
          updatedAt: new Date('2026-01-15'),
        },
      ],
      documents: [],
    },
    {
      id: 2,
      name: 'Ministry of Defence Cloud',
      agency: 'MOD',
      status: 'Won',
      createdAt: new Date('2026-01-10'),
      updatedAt: new Date('2026-01-10'),
      deadlines: [
        {
          id: 3,
          rfpId: 2,
          date: new Date('2026-03-01'),
          time: '12:00',
          label: 'Contract signing',
          context: null,
          completed: true,
          createdAt: new Date('2026-01-10'),
          updatedAt: new Date('2026-01-10'),
        },
      ],
      documents: [],
    },
    {
      id: 3,
      name: 'Transport for London Comms',
      agency: 'TfL',
      status: 'Lost',
      createdAt: new Date('2026-01-05'),
      updatedAt: new Date('2026-01-05'),
      deadlines: [],
      documents: [],
    },
    {
      id: 4,
      name: 'Birmingham Council Project',
      agency: 'Birmingham CC',
      status: 'NoBid',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
      deadlines: [],
      documents: [],
    },
  ];

  it('renders list of RFP names', () => {
    render(
      <Sidebar
        rfps={mockRfps}
        selectedRfpId={null}
        onSelectRfp={jest.fn()}
        onNewRfp={jest.fn()}
      />
    );

    expect(screen.getByText('NHS Digital Transformation')).toBeInTheDocument();
    expect(screen.getByText('Ministry of Defence Cloud')).toBeInTheDocument();
    expect(screen.getByText('Transport for London Comms')).toBeInTheDocument();
    expect(screen.getByText('Birmingham Council Project')).toBeInTheDocument();
  });

  it('displays agency for each RFP', () => {
    render(
      <Sidebar
        rfps={mockRfps}
        selectedRfpId={null}
        onSelectRfp={jest.fn()}
        onNewRfp={jest.fn()}
      />
    );

    expect(screen.getByText('NHS England')).toBeInTheDocument();
    expect(screen.getByText('MOD')).toBeInTheDocument();
    expect(screen.getByText('TfL')).toBeInTheDocument();
    expect(screen.getByText('Birmingham CC')).toBeInTheDocument();
  });

  it('displays status badge for each RFP', () => {
    render(
      <Sidebar
        rfps={mockRfps}
        selectedRfpId={null}
        onSelectRfp={jest.fn()}
        onNewRfp={jest.fn()}
      />
    );

    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Won')).toBeInTheDocument();
    expect(screen.getByText('Lost')).toBeInTheDocument();
    expect(screen.getByText('NoBid')).toBeInTheDocument();
  });

  it('shows deadline count per RFP', () => {
    render(
      <Sidebar
        rfps={mockRfps}
        selectedRfpId={null}
        onSelectRfp={jest.fn()}
        onNewRfp={jest.fn()}
      />
    );

    // NHS has 2 deadlines
    expect(screen.getByText(/2.*deadline/i)).toBeInTheDocument();
    // MOD has 1 deadline
    expect(screen.getByText(/1.*deadline/i)).toBeInTheDocument();
  });

  it('highlights the currently selected RFP', () => {
    const { container } = render(
      <Sidebar
        rfps={mockRfps}
        selectedRfpId={2}
        onSelectRfp={jest.fn()}
        onNewRfp={jest.fn()}
      />
    );

    // The selected RFP should have a visual indicator (e.g., different background or border)
    // We'll check for a specific class or aria-current attribute
    const selectedItem = screen.getByText('Ministry of Defence Cloud').closest('button');
    expect(selectedItem).toHaveAttribute('aria-current', 'true');
  });

  it('calls onSelectRfp callback when an RFP is clicked', async () => {
    const user = userEvent.setup();
    const mockOnSelectRfp = jest.fn();

    render(
      <Sidebar
        rfps={mockRfps}
        selectedRfpId={null}
        onSelectRfp={mockOnSelectRfp}
        onNewRfp={jest.fn()}
      />
    );

    const rfpItem = screen.getByText('NHS Digital Transformation');
    await user.click(rfpItem);

    expect(mockOnSelectRfp).toHaveBeenCalledWith(1);
  });

  it('renders a "New RFP" button', () => {
    render(
      <Sidebar
        rfps={mockRfps}
        selectedRfpId={null}
        onSelectRfp={jest.fn()}
        onNewRfp={jest.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /new rfp/i })).toBeInTheDocument();
  });

  it('calls onNewRfp callback when "New RFP" button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnNewRfp = jest.fn();

    render(
      <Sidebar
        rfps={mockRfps}
        selectedRfpId={null}
        onSelectRfp={jest.fn()}
        onNewRfp={mockOnNewRfp}
      />
    );

    const newRfpButton = screen.getByRole('button', { name: /new rfp/i });
    await user.click(newRfpButton);

    expect(mockOnNewRfp).toHaveBeenCalledTimes(1);
  });

  describe('status badge colors', () => {
    it('displays Active status with blue styling', () => {
      render(
        <Sidebar
          rfps={[mockRfps[0]]}
          selectedRfpId={null}
          onSelectRfp={jest.fn()}
          onNewRfp={jest.fn()}
        />
      );

      const activeBadge = screen.getByText('Active');
      // Check for blue color classes (exact classes will depend on implementation)
      expect(activeBadge.className).toMatch(/blue/i);
    });

    it('displays Won status with green styling', () => {
      render(
        <Sidebar
          rfps={[mockRfps[1]]}
          selectedRfpId={null}
          onSelectRfp={jest.fn()}
          onNewRfp={jest.fn()}
        />
      );

      const wonBadge = screen.getByText('Won');
      expect(wonBadge.className).toMatch(/green/i);
    });

    it('displays Lost status with red styling', () => {
      render(
        <Sidebar
          rfps={[mockRfps[2]]}
          selectedRfpId={null}
          onSelectRfp={jest.fn()}
          onNewRfp={jest.fn()}
        />
      );

      const lostBadge = screen.getByText('Lost');
      expect(lostBadge.className).toMatch(/red/i);
    });

    it('displays NoBid status with grey styling', () => {
      render(
        <Sidebar
          rfps={[mockRfps[3]]}
          selectedRfpId={null}
          onSelectRfp={jest.fn()}
          onNewRfp={jest.fn()}
        />
      );

      const noBidBadge = screen.getByText('NoBid');
      expect(noBidBadge.className).toMatch(/gray|grey/i);
    });
  });

  it('shows empty state when no RFPs', () => {
    render(
      <Sidebar
        rfps={[]}
        selectedRfpId={null}
        onSelectRfp={jest.fn()}
        onNewRfp={jest.fn()}
      />
    );

    expect(screen.getByText(/no rfps/i)).toBeInTheDocument();
  });
});
