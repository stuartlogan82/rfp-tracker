/**
 * ViewToggle component tests
 */

import { describe, it, expect, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ViewToggle from './ViewToggle';

describe('ViewToggle', () => {
  it('renders Table and Calendar options', () => {
    const mockOnChange = jest.fn();
    render(<ViewToggle activeView="table" onViewChange={mockOnChange} />);

    expect(screen.getByText('Table')).toBeInTheDocument();
    expect(screen.getByText('Calendar')).toBeInTheDocument();
  });

  it('highlights the active view with aria-pressed', () => {
    const mockOnChange = jest.fn();
    render(<ViewToggle activeView="table" onViewChange={mockOnChange} />);

    const tableButton = screen.getByText('Table');
    const calendarButton = screen.getByText('Calendar');

    expect(tableButton).toHaveAttribute('aria-pressed', 'true');
    expect(calendarButton).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls onViewChange with "calendar" when Calendar is clicked', async () => {
    const user = userEvent.setup();
    const mockOnChange = jest.fn();
    render(<ViewToggle activeView="table" onViewChange={mockOnChange} />);

    const calendarButton = screen.getByText('Calendar');
    await user.click(calendarButton);

    expect(mockOnChange).toHaveBeenCalledWith('calendar');
  });

  it('calls onViewChange with "table" when Table is clicked', async () => {
    const user = userEvent.setup();
    const mockOnChange = jest.fn();
    render(<ViewToggle activeView="calendar" onViewChange={mockOnChange} />);

    const tableButton = screen.getByText('Table');
    await user.click(tableButton);

    expect(mockOnChange).toHaveBeenCalledWith('table');
  });

  it('applies active styling to the selected view', () => {
    const mockOnChange = jest.fn();
    render(<ViewToggle activeView="calendar" onViewChange={mockOnChange} />);

    const tableButton = screen.getByText('Table');
    const calendarButton = screen.getByText('Calendar');

    // Active button should have different styling
    expect(calendarButton).toHaveAttribute('aria-pressed', 'true');
    expect(tableButton).toHaveAttribute('aria-pressed', 'false');
  });

  it('does not call onViewChange when clicking the already active view', async () => {
    const user = userEvent.setup();
    const mockOnChange = jest.fn();
    render(<ViewToggle activeView="table" onViewChange={mockOnChange} />);

    const tableButton = screen.getByText('Table');
    await user.click(tableButton);

    expect(mockOnChange).not.toHaveBeenCalled();
  });
});
