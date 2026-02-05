'use client';

import { useState, FormEvent } from 'react';

type RfpStatus = 'Active' | 'Won' | 'Lost' | 'NoBid' | 'Archived';

interface Rfp {
  id: number;
  name: string;
  agency: string;
  status: RfpStatus;
  createdAt: string;
  updatedAt: string;
}

interface RfpFormProps {
  onSuccess: (rfp: Rfp) => void;
  onCancel?: () => void;
}

export default function RfpForm({ onSuccess, onCancel }: RfpFormProps) {
  const [name, setName] = useState('');
  const [agency, setAgency] = useState('');
  const [status, setStatus] = useState<RfpStatus>('Active');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate required fields
    if (!name.trim() || !agency.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/rfps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          agency: agency.trim(),
          status,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create RFP');
      }

      const data = await response.json();
      onSuccess(data.rfp);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create RFP');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          RFP Name *
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label htmlFor="agency" className="block text-sm font-medium text-gray-700 mb-1">
          Agency *
        </label>
        <input
          type="text"
          id="agency"
          value={agency}
          onChange={(e) => setAgency(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
          Status
        </label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as RfpStatus)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isSubmitting}
        >
          <option value="Active">Active</option>
          <option value="Won">Won</option>
          <option value="Lost">Lost</option>
          <option value="NoBid">No Bid</option>
          <option value="Archived">Archived</option>
        </select>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-2 justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Creating...' : 'Create RFP'}
        </button>
      </div>
    </form>
  );
}
