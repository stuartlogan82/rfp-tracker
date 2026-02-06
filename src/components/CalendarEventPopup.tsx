/**
 * CalendarEventPopup component - Detail dialog for calendar events with inline editing
 */

'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import type { DeadlineWithRfp, Deadline } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface CalendarEventPopupProps {
  deadline: DeadlineWithRfp | null;
  open: boolean;
  onClose: () => void;
  onSelectRfp: (rfpId: number) => void;
  onUpdate: (deadlineId: number, data: Partial<Deadline>) => Promise<void>;
  now?: Date;
}

export default function CalendarEventPopup({
  deadline,
  open,
  onClose,
  onSelectRfp,
  onUpdate,
  now = new Date(),
}: CalendarEventPopupProps) {
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit form state
  const [editedLabel, setEditedLabel] = useState('');
  const [editedDate, setEditedDate] = useState('');
  const [editedCompleted, setEditedCompleted] = useState(false);

  // Don't render if no deadline or not open
  if (!deadline || !open) {
    return null;
  }

  const handleEdit = () => {
    // Initialize edit form with current values
    setEditedLabel(deadline.label);
    setEditedDate(typeof deadline.date === 'string' ? deadline.date : format(deadline.date, 'yyyy-MM-dd'));
    setEditedCompleted(deadline.completed);
    setError(null);
    setEditMode(true);
  };

  const handleCancel = () => {
    setEditMode(false);
    setError(null);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      await onUpdate(deadline.id, {
        label: editedLabel,
        date: editedDate as unknown as Date,
        completed: editedCompleted,
      });

      setEditMode(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update deadline');
    } finally {
      setSaving(false);
    }
  };

  const handleViewRfp = () => {
    onSelectRfp(deadline.rfpId);
    onClose();
  };

  const formattedDate = format(typeof deadline.date === 'string' ? parseISO(deadline.date) : deadline.date, 'dd MMMM yyyy');
  const formattedTime = deadline.time || null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editMode ? 'Edit Deadline' : deadline.label}
          </DialogTitle>
          {!editMode && (
            <DialogDescription>
              <Badge variant="secondary" className="mt-2">
                {deadline.rfpName}
              </Badge>
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Error message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Read-only mode */}
        {!editMode && (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Date & Time</h4>
              <p className="text-gray-900">
                {formattedDate}
                {formattedTime && <span className="ml-2">{formattedTime}</span>}
              </p>
            </div>

            {deadline.context && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Context</h4>
                <p className="text-gray-900 text-sm">{deadline.context}</p>
              </div>
            )}

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Status</h4>
              <p className="text-gray-900 text-sm">
                {deadline.completed ? (
                  <span className="text-green-600 font-medium">Completed</span>
                ) : (
                  <span className="text-gray-600">Not completed</span>
                )}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">RFP</h4>
              <p className="text-gray-900 text-sm">{deadline.rfpName}</p>
            </div>
          </div>
        )}

        {/* Edit mode */}
        {editMode && (
          <div className="space-y-4">
            <div>
              <label htmlFor="label" className="block text-sm font-medium text-gray-700 mb-1">
                Label
              </label>
              <input
                id="label"
                type="text"
                value={editedLabel}
                onChange={(e) => setEditedLabel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={saving}
              />
            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                id="date"
                type="date"
                value={editedDate}
                onChange={(e) => setEditedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={saving}
              />
            </div>

            <div className="flex items-center">
              <input
                id="completed"
                type="checkbox"
                checked={editedCompleted}
                onChange={(e) => setEditedCompleted(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                disabled={saving}
              />
              <label htmlFor="completed" className="ml-2 text-sm text-gray-700">
                Mark as completed
              </label>
            </div>
          </div>
        )}

        <DialogFooter>
          {!editMode ? (
            <div className="flex gap-2 w-full justify-between">
              <Button variant="outline" onClick={handleViewRfp}>
                View RFP
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
                <Button onClick={handleEdit}>
                  Edit
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2 w-full justify-end">
              <Button variant="outline" onClick={handleCancel} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
