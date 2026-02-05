/**
 * Temporary preview page for visualizing urgency levels and Sidebar
 * This page will be deleted after the dashboard is complete
 */

'use client';

import { useState } from 'react';
import { getUrgencyLevel, getUrgencyColor } from '@/lib/urgency';
import Sidebar from '@/components/Sidebar';
import SummaryCards from '@/components/SummaryCards';
import DeadlineTable from '@/components/DeadlineTable';
import NewRfpDialog from '@/components/NewRfpDialog';
import { Button } from '@/components/ui/button';
import type { RfpWithRelations, DeadlineWithRfp } from '@/types';

export default function PreviewPage() {
  const [dialogOpen, setDialogOpen] = useState(false);

  // Sample RFPs for Sidebar
  const sampleRfps: RfpWithRelations[] = [
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
      name: 'Ministry of Defence Cloud Infrastructure',
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
      name: 'Transport for London Communications System',
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

  // Sample dates for testing all urgency levels
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const twoDaysAway = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const fiveDaysAway = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const tenDaysAway = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const samples = [
    { date: yesterday, completed: false, label: 'Overdue deadline' },
    { date: today, completed: false, label: 'Critical - today' },
    { date: twoDaysAway, completed: false, label: 'Critical - 2 days' },
    { date: fiveDaysAway, completed: false, label: 'Warning - 5 days' },
    { date: tenDaysAway, completed: false, label: 'Safe - 10 days' },
    { date: yesterday, completed: true, label: 'Completed (overdue)' },
  ];

  // Sample deadlines for SummaryCards
  const sampleDeadlines: DeadlineWithRfp[] = [
    // Overdue
    {
      id: 101,
      rfpId: 1,
      date: new Date(yesterday),
      time: null,
      label: 'Overdue deadline',
      context: null,
      completed: false,
      createdAt: new Date('2026-01-15'),
      updatedAt: new Date('2026-01-15'),
      rfpName: 'NHS Digital Transformation',
      rfpAgency: 'NHS England',
      rfpStatus: 'Active',
    },
    // Due this week
    {
      id: 102,
      rfpId: 1,
      date: new Date(twoDaysAway),
      time: '17:00',
      label: 'Due this week',
      context: null,
      completed: false,
      createdAt: new Date('2026-01-15'),
      updatedAt: new Date('2026-01-15'),
      rfpName: 'NHS Digital Transformation',
      rfpAgency: 'NHS England',
      rfpStatus: 'Active',
    },
    // Upcoming 7 days
    {
      id: 103,
      rfpId: 2,
      date: new Date(fiveDaysAway),
      time: null,
      label: 'Upcoming deadline',
      context: null,
      completed: false,
      createdAt: new Date('2026-01-10'),
      updatedAt: new Date('2026-01-10'),
      rfpName: 'Ministry of Defence Cloud Infrastructure',
      rfpAgency: 'MOD',
      rfpStatus: 'Active',
    },
    // Far future
    {
      id: 104,
      rfpId: 3,
      date: new Date(tenDaysAway),
      time: null,
      label: 'Future deadline',
      context: null,
      completed: false,
      createdAt: new Date('2026-01-05'),
      updatedAt: new Date('2026-01-05'),
      rfpName: 'Transport for London Communications System',
      rfpAgency: 'TfL',
      rfpStatus: 'Won',
    },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        rfps={sampleRfps}
        selectedRfpId={2}
        onSelectRfp={(id) => console.log('Selected RFP:', id)}
        onNewRfp={() => console.log('New RFP clicked')}
      />

      {/* Main content */}
      <div className="flex-1 p-8">
        <div className="max-w-6xl">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Component Preview</h1>
            <Button onClick={() => setDialogOpen(true)}>
              Open New RFP Dialog
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Summary Cards</h2>
            <SummaryCards
              deadlines={sampleDeadlines}
              rfps={sampleRfps.map(rfp => ({
                id: rfp.id,
                name: rfp.name,
                agency: rfp.agency,
                status: rfp.status,
                createdAt: rfp.createdAt,
                updatedAt: rfp.updatedAt,
              }))}
              now={now}
            />
          </div>

          {/* Deadline Table */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Deadline Table</h2>
            <DeadlineTable
              deadlines={sampleDeadlines}
              onSelectRfp={(id) => console.log('Selected RFP:', id)}
              onToggleComplete={(id, completed) => console.log('Toggle deadline:', id, completed)}
              now={now}
            />
          </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Color Scheme Test</h2>
          <p className="text-gray-600 mb-6">
            Verify all 5 urgency levels display with correct colors
          </p>

          <div className="space-y-4">
            {samples.map((sample, index) => {
              const level = getUrgencyLevel(sample.date, sample.completed, now);
              const colors = getUrgencyColor(level);

              return (
                <div
                  key={index}
                  className={`flex items-center gap-4 p-4 rounded-lg border ${colors.bg}`}
                >
                  {/* Urgency dot */}
                  <div className="flex-shrink-0">
                    <div className={`w-3 h-3 rounded-full ${colors.dot}`} />
                  </div>

                  {/* Label and details */}
                  <div className="flex-1">
                    <div className="font-medium">{sample.label}</div>
                    <div className="text-sm text-gray-600">
                      Date: {sample.date} | Level: <span className="font-mono">{level}</span>
                    </div>
                  </div>

                  {/* Color classes for reference */}
                  <div className="text-xs text-gray-500 font-mono">
                    <div>dot: {colors.dot}</div>
                    <div>bg: {colors.bg}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">Expected Colors:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Overdue:</strong> Red dot, red background</li>
              <li>• <strong>Critical (0-3 days):</strong> Red dot, red background</li>
              <li>• <strong>Warning (4-7 days):</strong> Amber dot, amber background</li>
              <li>• <strong>Safe (&gt;7 days):</strong> Green dot, green background</li>
              <li>• <strong>Completed:</strong> Grey dot, grey background</li>
            </ul>
          </div>
        </div>

        {/* New RFP Dialog */}
        <NewRfpDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onComplete={() => {
            setDialogOpen(false);
            console.log('RFP creation completed!');
          }}
        />
      </div>
      </div>
    </div>
  );
}
