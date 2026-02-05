'use client';

import { useState } from 'react';
import type { ExtractedDate } from '@/lib/openai';

interface DateReviewProps {
  dates: ExtractedDate[];
  rfpId: number;
  onSave: () => void;
  onCancel: () => void;
}

interface EditableDate extends ExtractedDate {
  id: string;
}

export default function DateReview({ dates, rfpId, onSave, onCancel }: DateReviewProps) {
  const [editableDates, setEditableDates] = useState<EditableDate[]>(
    dates.map((date, index) => ({ ...date, id: `date-${index}` }))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFieldChange = (id: string, field: keyof ExtractedDate, value: string | null) => {
    setEditableDates((prev) =>
      prev.map((date) =>
        date.id === id ? { ...date, [field]: value } : date
      )
    );
  };

  const handleDelete = (id: string) => {
    setEditableDates((prev) => prev.filter((date) => date.id !== id));
  };

  const handleAdd = () => {
    const newDate: EditableDate = {
      id: `date-${Date.now()}`,
      date: '',
      time: null,
      label: '',
      context: ''
    };
    setEditableDates((prev) => [...prev, newDate]);
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      // Filter out empty dates
      const validDates = editableDates.filter(
        (date) => date.date && date.label
      );

      // Save each deadline
      for (const date of validDates) {
        const response = await fetch('/api/deadlines', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            rfpId,
            date: date.date,
            time: date.time,
            label: date.label,
            context: date.context,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to save deadlines');
        }
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save deadlines');
    } finally {
      setLoading(false);
    }
  };

  if (editableDates.length === 0) {
    return (
      <div className="p-4 border rounded bg-gray-50">
        <p className="text-gray-600 text-center">No dates extracted from document</p>
        <div className="mt-4 flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded">
      <h3 className="text-lg font-semibold mb-4">Review Extracted Dates</h3>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left border w-[140px]">Date</th>
              <th className="p-2 text-left border w-[100px]">Time</th>
              <th className="p-2 text-left border w-[200px]">Label</th>
              <th className="p-2 text-left border">Context</th>
              <th className="p-2 text-left border w-[80px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {editableDates.map((date) => (
              <tr key={date.id}>
                <td className="p-2 border">
                  <input
                    type="date"
                    value={date.date}
                    onChange={(e) => handleFieldChange(date.id, 'date', e.target.value)}
                    className="w-full p-1 border rounded text-sm"
                    placeholder="YYYY-MM-DD"
                  />
                </td>
                <td className="p-2 border">
                  <input
                    type="time"
                    value={date.time || ''}
                    onChange={(e) => handleFieldChange(date.id, 'time', e.target.value || null)}
                    className="w-full p-1 border rounded text-sm"
                  />
                </td>
                <td className="p-2 border">
                  <input
                    type="text"
                    value={date.label}
                    onChange={(e) => handleFieldChange(date.id, 'label', e.target.value)}
                    className="w-full p-1 border rounded text-sm"
                  />
                </td>
                <td className="p-2 border">
                  <textarea
                    value={date.context}
                    onChange={(e) => handleFieldChange(date.id, 'context', e.target.value)}
                    className="w-full p-1 border rounded text-sm min-h-[60px] resize-y"
                    rows={2}
                  />
                </td>
                <td className="p-2 border text-center">
                  <button
                    onClick={() => handleDelete(date.id)}
                    className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
                    aria-label="Delete date"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={handleAdd}
          className="px-4 py-2 border rounded hover:bg-gray-100"
        >
          Add Date
        </button>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}

      <div className="mt-4 flex gap-2 justify-end">
        <button
          onClick={onCancel}
          className="px-4 py-2 border rounded hover:bg-gray-100"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Saving...' : 'Confirm & Save'}
        </button>
      </div>
    </div>
  );
}
