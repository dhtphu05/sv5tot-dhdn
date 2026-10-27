/**
 * 5TOT ĐHĐN — Query Projection Utilities
 * Enforces narrow projections to exclude heavy binary/file contents from list and queue queries.
 */

export const APPLICATION_QUEUE_PROJECTION = {
  id: true,
  applicationId: true,
  track: true,
  currentStage: true,
  status: true,
  submittedAt: true,
  updatedAt: true,
  studentId: true,
  collectiveId: true,
  version: true,
} as const;

export const EVIDENCE_METADATA_ONLY_PROJECTION = {
  id: true,
  originalFilename: true,
  mimeType: true,
  fileSizeBytes: true,
  uploadedAt: true,
  verificationStatus: true,
  // NEVER include binaryContent or storageObjectKey in public metadata projection
} as const;
