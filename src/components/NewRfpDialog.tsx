/**
 * NewRfpDialog component - Multi-step wizard for creating RFPs
 * Step 1: Create RFP (RfpForm)
 * Step 2: Upload Document (UploadZone)
 * Step 3: Review Dates (DateReview)
 */

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Rfp } from '@/types';
import RfpForm from './RfpForm';
import { UploadZone } from './UploadZone';
import DateReview from './DateReview';

interface NewRfpDialogProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function NewRfpDialog({ open, onClose, onComplete }: NewRfpDialogProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [createdRfpId, setCreatedRfpId] = useState<number | null>(null);
  const [extractedDates, setExtractedDates] = useState<any[]>([]);

  // Reset state when dialog closes
  const handleClose = () => {
    setStep(1);
    setCreatedRfpId(null);
    setExtractedDates([]);
    onClose();
  };

  // Step 1: RFP created, move to Step 2
  const handleRfpCreated = (rfp: { id: number }) => {
    setCreatedRfpId(rfp.id);
    setStep(2);
  };

  // Step 2: Document uploaded and dates extracted, move to Step 3
  const handleDatesExtracted = (dates: any[]) => {
    setExtractedDates(dates);
    setStep(3);
  };

  // Step 3: Dates saved, complete wizard
  const handleDatesSaved = () => {
    handleClose();
    onComplete();
  };

  // Get dialog title based on current step
  const getTitle = () => {
    switch (step) {
      case 1:
        return 'Create New RFP';
      case 2:
        return 'Upload Document';
      case 3:
        return 'Review Deadlines';
      default:
        return 'Create New RFP';
    }
  };

  // Get dialog description based on current step
  const getDescription = () => {
    switch (step) {
      case 1:
        return 'Enter the RFP details below, then you\'ll be able to upload documents and extract deadlines.';
      case 2:
        return 'Upload an RFP document to automatically extract deadline dates.';
      case 3:
        return 'Review and edit the extracted deadline dates before saving.';
      default:
        return '';
    }
  };

  // Get modal width based on step - wider for date review
  const getModalWidth = () => {
    if (step === 3) {
      // Override the default sm:max-w-lg with wider values
      return 'sm:max-w-[90vw] max-w-[90vw] w-[90vw]';
    }
    return 'sm:max-w-4xl max-w-4xl'; // Normal width for steps 1 & 2
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className={`${getModalWidth()} max-h-[90vh] overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {/* Step 1: Create RFP */}
          {step === 1 && (
            <RfpForm
              onSuccess={handleRfpCreated}
              onCancel={handleClose}
            />
          )}

          {/* Step 2: Upload Document */}
          {step === 2 && createdRfpId && (
            <UploadZone
              rfpId={createdRfpId}
              onExtractComplete={handleDatesExtracted}
            />
          )}

          {/* Step 3: Review and Save Dates */}
          {step === 3 && createdRfpId && (
            <DateReview
              rfpId={createdRfpId}
              dates={extractedDates}
              onSave={handleDatesSaved}
              onCancel={handleClose}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
