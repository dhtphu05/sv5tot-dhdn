/**
 * 5TOT ĐHĐN — Collective Application Repository Interface (Backend V2)
 */

import type { PaginatedResult } from '../../shared/query/pagination';
import type {
  CollectiveApplicationDto,
  CollectiveRequirementRecordDto,
  CollectiveMemberRosterEntryDto,
  CollectiveApplicationDetailDto,
  CollectiveQueueItemDto,
  CollectiveWorkflowStatus,
  CollectiveType,
  ViolationConfirmationStatus,
} from './collectiveApplication.types';

export interface CollectiveQueueFilter {
  seasonId?: string;
  institutionId?: string;
  status?: CollectiveWorkflowStatus;
  assignedOfficerId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ICollectiveApplicationRepository {
  findById(id: string): Promise<CollectiveApplicationDto | null>;

  findByUnitAndSeason(collectiveUnitId: string, seasonId: string): Promise<CollectiveApplicationDto | null>;

  getApplicationDetail(id: string): Promise<CollectiveApplicationDetailDto | null>;

  createDraft(data: {
    applicationCode: string;
    seasonId: string;
    collectiveUnitId: string;
    institutionId: string;
    schoolReviewUnitId: string;
    preparerUserId: string;
    collectiveNameSnapshot: string;
    collectiveTypeSnapshot: CollectiveType;
    academicYear: string;
  }): Promise<CollectiveApplicationDto>;

  updateApplication(
    id: string,
    data: Partial<CollectiveApplicationDto>,
    expectedVersion?: number
  ): Promise<CollectiveApplicationDto>;

  getRequirement(
    collectiveApplicationId: string,
    requirementCode: 'TT01' | 'TT02' | 'TT03' | 'TT04'
  ): Promise<CollectiveRequirementRecordDto | null>;

  upsertRequirement(
    collectiveApplicationId: string,
    data: Partial<CollectiveRequirementRecordDto> & { requirementCode: 'TT01' | 'TT02' | 'TT03' | 'TT04' }
  ): Promise<CollectiveRequirementRecordDto>;

  listRoster(
    collectiveApplicationId: string,
    options?: { page?: number; limit?: number; search?: string }
  ): Promise<PaginatedResult<CollectiveMemberRosterEntryDto>>;

  addRosterEntry(
    collectiveApplicationId: string,
    entry: Omit<CollectiveMemberRosterEntryDto, 'id' | 'collectiveApplicationId' | 'createdAt' | 'updatedAt'>
  ): Promise<CollectiveMemberRosterEntryDto>;

  updateRosterEntry(
    collectiveApplicationId: string,
    entryId: string,
    entry: Partial<CollectiveMemberRosterEntryDto>
  ): Promise<CollectiveMemberRosterEntryDto>;

  deleteRosterEntry(collectiveApplicationId: string, entryId: string): Promise<void>;

  batchImportRoster(
    collectiveApplicationId: string,
    entries: Array<Omit<CollectiveMemberRosterEntryDto, 'id' | 'collectiveApplicationId' | 'createdAt' | 'updatedAt'>>
  ): Promise<{ importedCount: number }>;

  recalculateRosterMetrics(collectiveApplicationId: string): Promise<{
    rosterRowCount: number;
    participatingMembers: number;
    recognizedMembers: number;
  }>;

  checkPreparerAuthorization(
    userId: string,
    collectiveUnitId: string,
    seasonId: string
  ): Promise<{ isAuthorized: boolean; authorizationId?: string; positionTitle?: string }>;

  listCityQueue(filter: CollectiveQueueFilter): Promise<PaginatedResult<CollectiveQueueItemDto>>;

  recordAuditEvent(event: {
    actorUserId: string;
    applicationId: string;
    seasonId: string;
    institutionId: string;
    action: string;
    metadata?: Record<string, unknown>;
  }): Promise<void>;
}
