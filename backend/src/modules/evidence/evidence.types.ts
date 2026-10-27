/**
 * 5TOT ĐHĐN — Private Evidence Storage & Pipeline Types (Backend V2)
 */

export type EvidenceScanStatus =
  | 'PENDING_UPLOAD'
  | 'PENDING_SCAN'
  | 'CLEAN'
  | 'QUARANTINED'
  | 'SCAN_FAILED';

export type ApplicationTrack = 'INDIVIDUAL' | 'COLLECTIVE';

export interface EvidenceObjectDto {
  id: string;
  ownerUserId: string;
  track: ApplicationTrack;
  individualAppId?: string | null;
  collectiveAppId?: string | null;
  currentVersionNo: number;
  originalFileName: string;
  mimeType: string;
  extension: string;
  sizeBytes: number;
  sha256Checksum: string;
  bucketName: string;
  objectKey: string;
  scanStatus: EvidenceScanStatus;
  isFinalized: boolean;
  uploadedAt: Date;
  finalizedAt?: Date | null;
  deletedAt?: Date | null;
}

export interface EvidenceObjectVersionDto {
  id: string;
  evidenceObjectId: string;
  versionNumber: number;
  originalFileName: string;
  mimeType: string;
  sizeBytes: number;
  sha256Checksum: string;
  bucketName: string;
  objectKey: string;
  scanStatus: EvidenceScanStatus;
  uploadedByUserId: string;
  uploadedAt: Date;
  changeReason?: string | null;
}

export interface ApplicationEvidenceLinkDto {
  id: string;
  evidenceObjectId: string;
  individualDeclarationItemId?: string | null;
  collectiveRequirementId?: string | null;
  linkedByUserId: string;
  linkedAt: Date;
  unlinkedAt?: Date | null;
  evidenceObject?: EvidenceObjectDto;
}

export interface UploadIntentRequest {
  track: ApplicationTrack;
  applicationId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

export interface UploadIntentResponse {
  evidenceObjectId: string;
  objectKey: string;
  uploadUrl: string;
  headers: Record<string, string>;
  expiresInSeconds: number;
}

export interface FinalizeUploadRequest {
  evidenceObjectId: string;
  sha256Checksum: string;
  actualSizeBytes: number;
  headerMagicBytesHex?: string;
}

export interface ViewUrlResponse {
  evidenceObjectId?: string;
  viewUrl: string;
  expiresInSeconds: number;
  fileName: string;
  mimeType: string;
  cacheControl?: string;
}

export interface BatchViewUrlItemDto extends ViewUrlResponse {
  evidenceObjectId: string;
}

