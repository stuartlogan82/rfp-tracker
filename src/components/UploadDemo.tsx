'use client';

import React, { useState } from 'react';
import { UploadZone } from './UploadZone';
import DateReview from './DateReview';
import RfpForm from './RfpForm';
import type { ExtractedDate } from '@/lib/openai';

export function UploadDemo() {
  const [rfpId, setRfpId] = useState<number | null>(null);
  const [rfpName, setRfpName] = useState<string>('');
  const [rfpAgency, setRfpAgency] = useState<string>('');
  const [documents, setDocuments] = useState<any[]>([]);
  const [error, setError] = useState<string>('');
  const [extractedDates, setExtractedDates] = useState<ExtractedDate[] | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [currentDocumentId, setCurrentDocumentId] = useState<number | null>(null);

  const handleRfpCreated = (rfp: any) => {
    setRfpId(rfp.id);
    setRfpName(rfp.name);
    setRfpAgency(rfp.agency);
  };

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

  // Show RFP creation form if no RFP exists yet
  if (!rfpId) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Create New RFP
          </h2>
          <p className="text-gray-600 mb-6">
            Enter the RFP details below, then you'll be able to upload documents and extract deadlines.
          </p>
          <RfpForm onSuccess={handleRfpCreated} />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Getting Started</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Enter the RFP name and customer/agency name</li>
            <li>• Upload RFP documents (PDF, DOCX, XLSX, or images)</li>
            <li>• AI will automatically extract deadline dates</li>
            <li>• Review and save the extracted dates</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* RFP Info Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{rfpName}</h2>
            <p className="text-gray-600 mt-1">Agency: {rfpAgency}</p>
            <p className="text-sm text-gray-500 mt-1">RFP ID: {rfpId}</p>
          </div>
          <button
            onClick={() => {
              if (confirm('Start over with a new RFP? Current data will remain saved.')) {
                setRfpId(null);
                setRfpName('');
                setRfpAgency('');
                setDocuments([]);
                setExtractedDates(null);
                setError('');
              }
            }}
            className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
          >
            New RFP
          </button>
        </div>
      </div>

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

      {/* Help Info */}
      {documents.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Next Steps</h3>
          <p className="text-sm text-blue-700 mb-2">
            Upload a document to automatically extract deadline dates!
          </p>
          <p className="text-xs text-blue-600">
            Supported formats: PDF, DOCX, XLSX, PNG, JPG, TIFF
          </p>
        </div>
      )}
    </div>
  );
}
