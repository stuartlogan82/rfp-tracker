/**
 * Dashboard component - Main orchestrator for RFP tracking
 * Fetches RFPs, manages state, and coordinates child components
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import type { RfpWithRelations, DeadlineWithRfp } from '@/types';
import Sidebar from './Sidebar';
import SummaryCards from './SummaryCards';
import DeadlineTable from './DeadlineTable';
import CalendarView from './CalendarView';
import RfpDetail from './RfpDetail';
import NewRfpDialog from './NewRfpDialog';
import NotificationBanner from './NotificationBanner';
import ViewToggle, { type ViewMode } from './ViewToggle';

export default function Dashboard() {
  // State management
  const [rfps, setRfps] = useState<RfpWithRelations[]>([]);
  const [selectedRfpId, setSelectedRfpId] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false); // Default: Active only
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('table'); // Default: Table view

  // Fetch RFPs from API
  const refreshData = async () => {
    try {
      setError(null);
      const response = await fetch('/api/rfps');

      if (!response.ok) {
        throw new Error('Failed to fetch RFPs');
      }

      const data = await response.json();
      setRfps(data.rfps);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on mount
  useEffect(() => {
    refreshData();
  }, []);

  // Flatten deadlines with RFP info
  const flattenDeadlines = (rfpList: RfpWithRelations[]): DeadlineWithRfp[] => {
    const flattened: DeadlineWithRfp[] = [];

    for (const rfp of rfpList) {
      for (const deadline of rfp.deadlines) {
        flattened.push({
          ...deadline,
          rfpName: rfp.name,
          rfpAgency: rfp.agency,
          rfpStatus: rfp.status,
        });
      }
    }

    return flattened;
  };

  // Apply Active filter to RFPs
  const getFilteredRfps = (): RfpWithRelations[] => {
    if (!rfps || rfps.length === 0) {
      return [];
    }
    if (showAll) {
      return rfps;
    }
    return rfps.filter(rfp => rfp.status === 'Active');
  };

  // Get filtered deadlines based on Active filter
  const getFilteredDeadlines = (): DeadlineWithRfp[] => {
    const filteredRfps = getFilteredRfps();
    return flattenDeadlines(filteredRfps);
  };

  // Handle selecting an RFP from sidebar or table
  const handleSelectRfp = (rfpId: number) => {
    setSelectedRfpId(rfpId);
    setUpdateError(null);
  };

  // Handle back to dashboard
  const handleBackToDashboard = () => {
    setSelectedRfpId(null);
    setUpdateError(null);
  };

  // Handle opening new RFP dialog
  const handleNewRfp = () => {
    setDialogOpen(true);
  };

  // Handle closing dialog without completing
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  // Handle completing wizard - refresh data
  const handleCompleteDialog = () => {
    setDialogOpen(false);
    refreshData();
  };

  // Handle toggling deadline completion
  const handleToggleComplete = async (deadlineId: number, completed: boolean) => {
    try {
      setUpdateError(null);

      const response = await fetch(`/api/deadlines/${deadlineId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update deadline');
      }

      // Refresh data after successful update
      await refreshData();
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  // Handle RFP update from detail view
  const handleRfpUpdate = () => {
    refreshData();
  };

  // Handle RFP deletion from detail view
  const handleRfpDelete = () => {
    setSelectedRfpId(null);
    refreshData();
  };

  // Get selected RFP for detail view
  const selectedRfp = selectedRfpId ? rfps.find(rfp => rfp.id === selectedRfpId) : null;

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <Button onClick={refreshData}>Retry</Button>
        </div>
      </div>
    );
  }

  const filteredDeadlines = getFilteredDeadlines();
  const filteredRfps = getFilteredRfps();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        rfps={rfps || []}
        selectedRfpId={selectedRfpId}
        onSelectRfp={handleSelectRfp}
        onNewRfp={handleNewRfp}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-6">
          {/* Header with filter toggle */}
          {!selectedRfp && (
            <div className="mb-6 flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

              <div className="flex items-center gap-4">
                <a
                  href="/api/export"
                  download="rfp-deadlines.ics"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                  aria-label="Export all deadlines to calendar"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Export All
                </a>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showAll}
                    onChange={(e) => setShowAll(e.target.checked)}
                    data-testid="show-all-toggle"
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Show all RFPs</span>
                </label>
              </div>
            </div>
          )}

          {/* Update error banner */}
          {updateError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm">{updateError}</p>
            </div>
          )}

          {/* Dashboard view - Summary cards and deadline table/calendar */}
          {!selectedRfp && (
            <>
              {/* Notification Banner for urgent deadlines */}
              <NotificationBanner deadlines={filteredDeadlines} />

              <div className="mb-6">
                <SummaryCards
                  deadlines={filteredDeadlines}
                  rfps={filteredRfps}
                />
              </div>

              {/* View Toggle */}
              <div className="mb-4">
                <ViewToggle activeView={viewMode} onViewChange={setViewMode} />
              </div>

              {/* Conditional rendering: Table or Calendar */}
              {viewMode === 'table' ? (
                <DeadlineTable
                  deadlines={filteredDeadlines}
                  onSelectRfp={handleSelectRfp}
                  onToggleComplete={handleToggleComplete}
                />
              ) : (
                <div data-testid="calendar-view">
                  <CalendarView
                    deadlines={filteredDeadlines}
                    onSelectRfp={handleSelectRfp}
                    onToggleComplete={handleToggleComplete}
                    onDeadlineUpdate={refreshData}
                  />
                </div>
              )}
            </>
          )}

          {/* Detail view - RfpDetail component */}
          {selectedRfp && (
            <div>
              <Button
                onClick={handleBackToDashboard}
                variant="outline"
                className="mb-4"
                data-testid="back-to-dashboard"
              >
                ← Back to Dashboard
              </Button>

              <RfpDetail
                rfp={selectedRfp}
                onUpdate={handleRfpUpdate}
                onDelete={handleRfpDelete}
              />
            </div>
          )}
        </div>
      </div>

      {/* New RFP Dialog */}
      <NewRfpDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onComplete={handleCompleteDialog}
      />
    </div>
  );
}
