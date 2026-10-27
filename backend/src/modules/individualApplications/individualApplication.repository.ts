/**
 * 5TOT ĐHĐN — Individual Application Repository Interface (Backend V2)
 */

import type {
  IndividualApplicationDto,
  IndividualDeclarationItemDto,
  ApplicationEvidenceLinkDto,
  EvidenceObjectMetadataDto,
  IndividualApplicationFilter,
} from './individualApplication.types';

export interface IIndividualApplicationRepository {
  findBySeasonAndApplicant(
    seasonId: string,
    applicantUserId: string
  ): Promise<IndividualApplicationDto | null>;

  findById(id: string): Promise<IndividualApplicationDto | null>;

  findByCode(code: string): Promise<IndividualApplicationDto | null>;

  list(filter: IndividualApplicationFilter): Promise<IndividualApplicationDto[]>;

  create(
    data: Omit<IndividualApplicationDto, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<IndividualApplicationDto>;

  update(
    id: string,
    data: Partial<IndividualApplicationDto>
  ): Promise<IndividualApplicationDto>;

  addDeclaration(
    declaration: Omit<IndividualDeclarationItemDto, 'id' | 'createdAt' | 'updatedAt'>,
    evidenceIds?: string[]
  ): Promise<IndividualDeclarationItemDto>;

  updateDeclaration(
    id: string,
    data: Partial<IndividualDeclarationItemDto>,
    evidenceIds?: string[]
  ): Promise<IndividualDeclarationItemDto>;

  deleteDeclaration(id: string): Promise<void>;

  findDeclarationById(id: string): Promise<IndividualDeclarationItemDto | null>;

  listDeclarationsByApplicationId(
    applicationId: string
  ): Promise<IndividualDeclarationItemDto[]>;

  addEvidenceLink(
    link: Omit<ApplicationEvidenceLinkDto, 'id' | 'linkedAt'>
  ): Promise<ApplicationEvidenceLinkDto>;

  removeEvidenceLink(id: string): Promise<void>;

  listEvidenceLinks(
    declarationItemId: string
  ): Promise<ApplicationEvidenceLinkDto[]>;

  findEvidenceObjectById(
    id: string
  ): Promise<EvidenceObjectMetadataDto | null>;

  recordAuditEvent(event: {
    actorUserId: string;
    applicationId: string;
    seasonId: string;
    institutionId: string;
    schoolReviewUnitId: string;
    action: string;
    metadata?: Record<string, unknown>;
  }): Promise<void>;

  recordOutboxEvent(event: {
    eventType: string;
    payload: Record<string, unknown>;
  }): Promise<void>;
}
