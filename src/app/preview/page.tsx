/**
 * Temporary preview page for visualizing urgency levels
 * This page will be deleted after the dashboard is complete
 */

import { getUrgencyLevel, getUrgencyColor } from '@/lib/urgency';
import type { UrgencyLevel } from '@/types';

export default function PreviewPage() {
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

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Urgency Level Preview</h1>

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
      </div>
    </div>
  );
}
