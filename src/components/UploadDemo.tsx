'use client';

import React, { useState, useEffect } from 'react';
import { UploadZone } from './UploadZone';

export function UploadDemo() {
  const [rfpId, setRfpId] = useState<number | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Create a demo RFP on mount
    const createDemoRfp = async () => {
      try {
        const response = await fetch('/api/rfps', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: 'Demo RFP',
            agency: 'Demo Agency',
            status: 'Active',
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create demo RFP');
        }

        const data = await response.json();
        setRfpId(data.rfp.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize');
      } finally {
        setIsLoading(false);
      }
    };

    createDemoRfp();
  }, []);

  const handleUploadComplete = (document: any) => {
    setDocuments((prev) => [...prev, document]);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Initializing...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
        <p className="text-red-600">Error: {error}</p>
        <p className="text-sm text-gray-600 mt-2">
          Make sure the database is set up and the API routes are working.
        </p>
      </div>
    );
  }

  if (!rfpId) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Upload Document
        </h2>
        <UploadZone rfpId={rfpId} onUploadComplete={handleUploadComplete} />
      </div>

      {documents.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Uploaded Documents
          </h2>
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <svg
                    className="w-5 h-5 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900">{doc.filename}</p>
                    <p className="text-sm text-gray-500">{doc.mimeType}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">ID: {doc.id}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Demo Info</h3>
        <p className="text-sm text-blue-700">
          RFP ID: {rfpId} | Documents: {documents.length}
        </p>
        <p className="text-xs text-blue-600 mt-2">
          Try uploading a PDF, DOCX, XLSX, or image file!
        </p>
      </div>
    </div>
  );
}
