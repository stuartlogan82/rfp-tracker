/**
 * ViewToggle component - Segmented control for switching between Table and Calendar views
 */

'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type ViewMode = 'table' | 'calendar';

interface ViewToggleProps {
  activeView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export default function ViewToggle({ activeView, onViewChange }: ViewToggleProps) {
  const handleClick = (view: ViewMode) => {
    // Don't call onChange if clicking the already active view
    if (view === activeView) {
      return;
    }
    onViewChange(view);
  };

  return (
    <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1" role="group">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleClick('table')}
        aria-pressed={activeView === 'table'}
        className={cn(
          'rounded-md transition-colors',
          activeView === 'table'
            ? 'bg-white shadow-sm text-gray-900'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        )}
      >
        Table
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleClick('calendar')}
        aria-pressed={activeView === 'calendar'}
        className={cn(
          'rounded-md transition-colors',
          activeView === 'calendar'
            ? 'bg-white shadow-sm text-gray-900'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        )}
      >
        Calendar
      </Button>
    </div>
  );
}
