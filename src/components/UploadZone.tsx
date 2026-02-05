'use client';

import React, { useState, useRef } from 'react';

interface UploadZoneProps {
  rfpId: number;
  onUploadComplete: (document: any) => void;
}

type UploadState = 'idle' | 'uploading' | 'success' | 'error';

export function UploadZone({ rfpId, onUploadComplete }: UploadZoneProps) {
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    setUploadState('uploading');
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('rfpId', rfpId.toString());

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setUploadState('success');
      onUploadComplete(data.document);

      // Reset to idle after 3 seconds
      setTimeout(() => {
        setUploadState('idle');
      }, 3000);
    } catch (error) {
      setUploadState('error');
      setErrorMessage(error instanceof Error ? error.message : 'Upload failed');
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragEnter = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      data-testid="drop-zone"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`
        border-2 border-dashed rounded-lg p-8 text-center transition-colors
        ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}
        ${uploadState === 'uploading' ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
      `}
    >
      <input
        ref={fileInputRef}
        data-testid="file-input"
        type="file"
        onChange={handleFileChange}
        className="hidden"
        accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg,.tiff"
        disabled={uploadState === 'uploading'}
      />

      {uploadState === 'idle' && (
        <>
          <p className="text-gray-600 mb-4">
            Drag and drop a file here, or click to choose a file
          </p>
          <button
            type="button"
            onClick={handleButtonClick}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Choose File
          </button>
          <p className="text-sm text-gray-500 mt-2">
            Supported: PDF, DOCX, XLSX, PNG, JPG, TIFF
          </p>
        </>
      )}

      {uploadState === 'uploading' && (
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Uploading...</p>
        </div>
      )}

      {uploadState === 'success' && (
        <div className="text-green-600">
          <svg
            className="w-12 h-12 mx-auto mb-2"
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
          <p>Upload successful!</p>
        </div>
      )}

      {uploadState === 'error' && (
        <div className="text-red-600">
          <svg
            className="w-12 h-12 mx-auto mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          <p>Error: {errorMessage}</p>
          <button
            type="button"
            onClick={() => setUploadState('idle')}
            className="mt-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
