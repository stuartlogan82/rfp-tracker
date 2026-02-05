/**
 * Shared TypeScript types for the RFP Tracker application
 */

import { Rfp, Deadline, Document, RfpStatus } from '@prisma/client';

// Re-export Prisma types for convenience
export type { Rfp, Deadline, Document, RfpStatus };

/**
 * RFP with its related deadlines and documents (full nested structure)
 */
export type RfpWithRelations = Rfp & {
  deadlines: Deadline[];
  documents: Document[];
};

/**
 * Deadline flattened with RFP information for display in tables
 * Combines deadline data with the parent RFP's name, agency, and status
 */
export type DeadlineWithRfp = Deadline & {
  rfpName: string;
  rfpAgency: string;
  rfpStatus: RfpStatus;
};

/**
 * Urgency level for deadline visualization
 */
export type UrgencyLevel = 'overdue' | 'critical' | 'warning' | 'safe' | 'completed';
