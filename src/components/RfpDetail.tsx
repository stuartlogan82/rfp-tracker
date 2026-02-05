'use client';

import { useState } from 'react';

type RfpStatus = 'Active' | 'Won' | 'Lost' | 'NoBid' | 'Archived';

interface Deadline {
  id: number;
  rfpId: number;
  date: string;
  time: string | null;
  label: string;
  context: string | null;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Document {
  id: number;
  rfpId: number;
  filename: string;
  filepath: string;
  mimeType: string;
  uploadedAt: string;
}

interface Rfp {
  id: number;
  name: string;
  agency: string;
  status: RfpStatus;
  createdAt: string;
  updatedAt: string;
  deadlines: Deadline[];
  documents: Document[];
}

interface RfpDetailProps {
  rfp: Rfp;
  onUpdate: () => void;
  onDelete?: () => void;
}

export default function RfpDetail({ rfp, onUpdate, onDelete }: RfpDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(rfp.name);
  const [editedAgency, setEditedAgency] = useState(rfp.agency);
  const [editedStatus, setEditedStatus] = useState(rfp.status);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEdit = () => {
    setEditedName(rfp.name);
    setEditedAgency(rfp.agency);
    setEditedStatus(rfp.status);
    setError(null);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
  };

  const handleSave = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/rfps/${rfp.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editedName,
          agency: editedAgency,
          status: editedStatus,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update RFP');
      }

      setIsEditing(false);
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update RFP');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${rfp.name}"? This will also delete all associated deadlines and documents.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/rfps/${rfp.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete RFP');
      }

      if (onDelete) {
        onDelete();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete RFP');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'Europe/London',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="border-b pb-4 mb-4">
        {isEditing ? (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Agency
              </label>
              <input
                type="text"
                value={editedAgency}
                onChange={(e) => setEditedAgency(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={editedStatus}
                onChange={(e) => setEditedStatus(e.target.value as RfpStatus)}
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
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleCancel}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{rfp.name}</h2>
              <p className="text-gray-600 mt-1">Agency: {rfp.agency}</p>
              <p className="text-sm text-gray-500 mt-1">Status: {rfp.status}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleEdit}
                className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Edit
              </button>
              {onDelete && (
                <button
                  onClick={handleDelete}
                  className="px-3 py-1 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Deadlines Section */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Deadlines</h3>
        {rfp.deadlines.length === 0 ? (
          <p className="text-gray-500 text-sm">No deadlines yet.</p>
        ) : (
          <div className="space-y-2">
            {rfp.deadlines.map((deadline) => (
              <div
                key={deadline.id}
                className="flex justify-between items-start p-3 border border-gray-200 rounded-md"
              >
                <div>
                  <p className="font-medium text-gray-900">{deadline.label}</p>
                  <p className="text-sm text-gray-600">
                    {formatDate(deadline.date)}
                    {deadline.time && ` at ${deadline.time}`}
                  </p>
                  {deadline.context && (
                    <p className="text-sm text-gray-500 mt-1">{deadline.context}</p>
                  )}
                </div>
                {deadline.completed && (
                  <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded">
                    Completed
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Documents Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Documents</h3>
        {rfp.documents.length === 0 ? (
          <p className="text-gray-500 text-sm">No documents uploaded yet.</p>
        ) : (
          <div className="space-y-2">
            {rfp.documents.map((doc) => (
              <div
                key={doc.id}
                className="flex justify-between items-center p-3 border border-gray-200 rounded-md"
              >
                <div>
                  <p className="font-medium text-gray-900">{doc.filename}</p>
                  <p className="text-sm text-gray-500">
                    Uploaded {formatDate(doc.uploadedAt)}
                  </p>
                </div>
                <span className="text-xs text-gray-500">{doc.mimeType}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
