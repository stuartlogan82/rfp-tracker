'use client';

import React, { useState, useEffect } from 'react';
import { UploadZone } from './UploadZone';
import DateReview from './DateReview';
import type { ExtractedDate } from '@/lib/openai';

export function UploadDemo() {
  const [rfpId, setRfpId] = useState<number | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [extractedDates, setExtractedDates] = useState<ExtractedDate[] | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [currentDocumentId, setCurrentDocumentId] = useState<number | null>(null);

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

  const handleUploadComplete = async (document: any) => {
    setDocuments((prev) => [...prev, document]);
    setCurrentDocumentId(document.id);

    // Automatically extract dates after upload
    setExtracting(true);
    setError('');

    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documentId: document.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to extract dates');
      }

      const data = await response.json();
      setExtractedDates(data.dates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract dates');
    } finally {
      setExtracting(false);
    }
  };

  const handleDatesSaved = () => {
    setExtractedDates(null);
    setCurrentDocumentId(null);
    alert('Dates saved successfully!');
  };

  const handleCancelReview = () => {
    setExtractedDates(null);
    setCurrentDocumentId(null);
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
      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Upload Document
        </h2>
        <UploadZone rfpId={rfpId} onUploadComplete={handleUploadComplete} />
      </div>

      {/* Extracting Dates Loader */}
      {extracting && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Extracting dates with AI...</p>
          <p className="text-sm text-gray-500 mt-2">This may take a moment for large documents</p>
        </div>
      )}

      {/* Date Review Section */}
      {extractedDates && rfpId && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Review Extracted Dates
          </h2>
          <DateReview
            dates={extractedDates}
            rfpId={rfpId}
            onSave={handleDatesSaved}
            onCancel={handleCancelReview}
          />
        </div>
      )}

      {/* Uploaded Documents List */}
      {documents.length > 0 && !extractedDates && (
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

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-semibold text-red-900 mb-2">Error</h3>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Demo Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Demo Info</h3>
        <p className="text-sm text-blue-700">
          RFP ID: {rfpId} | Documents: {documents.length}
        </p>
        <p className="text-xs text-blue-600 mt-2">
          Upload a PDF, DOCX, XLSX, or image file to automatically extract deadline dates!
        </p>
      </div>
    </div>
  );
}
