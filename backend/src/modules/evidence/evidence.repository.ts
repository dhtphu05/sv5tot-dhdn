/**
 * 5TOT ĐHĐN — Evidence Repository Interface (Backend V2)
 */

import type {
  EvidenceObjectDto,
  EvidenceObjectVersionDto,
  ApplicationEvidenceLinkDto,
  EvidenceScanStatus,
} from './evidence.types';

export interface IEvidenceRepository {
  createPendingObject(data: {
    ownerUserId: string;
    track: 'INDIVIDUAL' | 'COLLECTIVE';
    individualAppId?: string;
    collectiveAppId?: string;
    originalFileName: string;
    mimeType: string;
    extension: string;
    sizeBytes: number;
    sha256Checksum: string;
    bucketName: string;
    objectKey: string;
  }): Promise<EvidenceObjectDto>;

  findById(id: string): Promise<EvidenceObjectDto | null>;

  findByIds(ids: string[]): Promise<EvidenceObjectDto[]>;

  findByObjectKey(objectKey: string): Promise<EvidenceObjectDto | null>;

  finalizeObject(
    id: string,
    data: {
      sha256Checksum: string;
      sizeBytes: number;
      scanStatus: EvidenceScanStatus;
    }
  ): Promise<EvidenceObjectDto>;

  updateScanStatus?(
    id: string,
    scanStatus: EvidenceScanStatus
  ): Promise<EvidenceObjectDto>;

  finalizeObjectWithVersion?(
    id: string,
    data: {
      sha256Checksum: string;
      sizeBytes: number;
      scanStatus: EvidenceScanStatus;
      versionNumber: number;
      originalFileName: string;
      mimeType: string;
      bucketName: string;
      objectKey: string;
      uploadedByUserId: string;
      changeReason?: string;
    }
  ): Promise<EvidenceObjectDto>;

  createVersion(data: {
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
    changeReason?: string;
  }): Promise<EvidenceObjectVersionDto>;

  linkToIndividualDeclaration(data: {
    evidenceObjectId: string;
    individualDeclarationItemId: string;
    linkedByUserId: string;
  }): Promise<ApplicationEvidenceLinkDto>;

  linkToCollectiveRequirement(data: {
    evidenceObjectId: string;
    collectiveRequirementId: string;
    linkedByUserId: string;
  }): Promise<ApplicationEvidenceLinkDto>;

  unlink(linkId: string): Promise<void>;

  listLinksForDeclaration(declarationItemId: string): Promise<ApplicationEvidenceLinkDto[]>;

  listLinksForCollectiveRequirement(requirementId: string): Promise<ApplicationEvidenceLinkDto[]>;

  listOwnerEvidence(ownerUserId: string): Promise<EvidenceObjectDto[]>;
}
