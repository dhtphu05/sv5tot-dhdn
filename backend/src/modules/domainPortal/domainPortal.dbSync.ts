/**
 * 5TOT Đại học Đà Nẵng — Real Neon PostgreSQL Persistence & Hydration Engine for Domain Portal V2
 * Ensures 100% of student applications, declarations, evidence files, review workspaces,
 * collective applications, and registered accounts are durably stored in Neon PostgreSQL (DATABASE_URL),
 * not merely in temporary memory or local disk cache.
 */

import { getEnvironment } from '../../config/environment';
import { dbManager, executeWithNeonRetry } from '../../shared/database/prismaClient';
import { defaultPasswordHasher } from '../auth/passwordHasher';
import {
  portalState,
  SCHOOL_UNIT_MAP,
  createDefaultCriteriaList,
  isTestRuntime,
  isLegacyMockOrTestAppId,
  isNonUdnInstitutionRecord,
  inferInstitutionIdFromName,
  type PortalRegisteredStudent,
  type StoredEvidenceRecord,
  type PortalAuditLogRecord,
} from './domainPortal.state';

const CRITERION_ID_TO_CODE: Record<string, string> = {
  ethics: 'ETHICS',
  academic: 'ACADEMIC',
  physical: 'PHYSICAL',
  volunteer: 'VOLUNTEER',
  integration: 'INTEGRATION',
};

const CRITERION_CODE_TO_ID: Record<string, string> = {
  ETHICS: 'ethics',
  ACADEMIC: 'academic',
  PHYSICAL: 'physical',
  VOLUNTEER: 'volunteer',
  INTEGRATION: 'integration',
};

let schemaReadyPromise: Promise<void> | null = null;
let initialHydrationPromise: Promise<boolean> | null = null;
let isHydrated = false;
let lastHydratedAt = 0;
let cachedActiveSeasonId: string | null = null;
let syncTimer: NodeJS.Timeout | null = null;
let activeSyncPromise: Promise<void> | null = null;
const lastSyncedPayloadHash = new Map<string, string>();
const persistedEvidenceIds = new Set<string>();
const lastSyncedObjectRef = new Map<string, unknown>();

export function isNeonDbSyncEnabled(): boolean {
  if (isTestRuntime()) return false;
  try {
    const env = getEnvironment();
    return env.BACKEND_DATABASE_MODE !== 'offline' && Boolean(env.DATABASE_URL);
  } catch {
    return false;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function ensurePortalDbSchema(prisma: any): Promise<void> {
  if (!schemaReadyPromise) {
    schemaReadyPromise = executeWithNeonRetry(async () => {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "portal_persistent_records" (
          "collection" TEXT NOT NULL,
          "record_key" TEXT NOT NULL,
          "payload" JSONB NOT NULL,
          "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY ("collection", "record_key")
        )
      `);
    }).catch((err) => {
      schemaReadyPromise = null;
      throw err;
    });
  }
  return schemaReadyPromise;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function upsertPersistentRecord(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prisma: any,
  collection: string,
  recordKey: string,
  payload: unknown
): Promise<boolean> {
  const cacheKey = `${collection}:${recordKey}`;
  if (
    (collection === 'portal_session' || collection === 'evidence_record') &&
    payload &&
    lastSyncedObjectRef.get(cacheKey) === payload
  ) {
    return false;
  }
  const jsonText = JSON.stringify(payload ?? {});
  if (lastSyncedPayloadHash.get(cacheKey) === jsonText) {
    if (payload) lastSyncedObjectRef.set(cacheKey, payload);
    return false;
  }
  await prisma.$executeRawUnsafe(
    `
      INSERT INTO "portal_persistent_records" ("collection", "record_key", "payload", "updated_at")
      VALUES ($1, $2, $3::jsonb, NOW())
      ON CONFLICT ("collection", "record_key")
      DO UPDATE SET "payload" = EXCLUDED."payload", "updated_at" = NOW()
    `,
    collection,
    recordKey,
    jsonText
  );
  lastSyncedPayloadHash.set(cacheKey, jsonText);
  if (payload) lastSyncedObjectRef.set(cacheKey, payload);
  return true;
}

function isDraftAppStatus(status?: string | null, schoolPreliminaryStatus?: string | null): boolean {
  const s = String(status || '').trim();
  const sp = String(schoolPreliminaryStatus || '').trim();
  if (
    !s ||
    s === 'draft' ||
    s === 'Đang hoàn thiện' ||
    s === 'Đang hoàn thiện hồ sơ' ||
    s === 'Chưa bắt đầu'
  ) {
    return true;
  }
  if (
    sp === 'school_not_submitted' &&
    s !== 'under_review' &&
    s !== 'submitted' &&
    s !== 'supplement_required' &&
    s !== 'supplement_sent' &&
    s !== 'all_reviewed' &&
    s !== 'recognized' &&
    s !== 'not_recognized'
  ) {
    return true;
  }
  return false;
}

function mapReviewStageEnum(
  status?: string,
  reviewStage?: string,
  schoolPreliminaryStatus?: string
): 'STUDENT_DRAFT' | 'SCHOOL_PRELIMINARY' | 'CITY_REVIEW' | 'COMMITTEE_FINALIZATION' | 'COMPLETED' {
  if (status === 'recognized' || status === 'not_recognized') return 'COMPLETED';
  if (reviewStage === 'COMMITTEE' || status === 'all_reviewed') return 'COMMITTEE_FINALIZATION';
  if (reviewStage === 'CITY' || schoolPreliminaryStatus === 'forwarded_to_city') return 'CITY_REVIEW';
  if (isDraftAppStatus(status, schoolPreliminaryStatus)) return 'STUDENT_DRAFT';
  return 'SCHOOL_PRELIMINARY';
}

function mapSchoolPrelimEnum(
  schoolPreliminaryStatus?: string,
  status?: string,
  reviewStage?: string
):
  | 'NOT_SUBMITTED'
  | 'PENDING_SCHOOL_REVIEW'
  | 'SCHOOL_IN_REVIEW'
  | 'SCHOOL_SUPPLEMENT_REQUESTED'
  | 'SCHOOL_SUPPLEMENT_RESUBMITTED'
  | 'ELIGIBLE_FOR_CITY'
  | 'NOT_ELIGIBLE_AT_SCHOOL'
  | 'FORWARDED_TO_CITY' {
  if (isDraftAppStatus(status, schoolPreliminaryStatus)) {
    return 'NOT_SUBMITTED';
  }
  if (
    reviewStage === 'CITY' ||
    reviewStage === 'COMMITTEE' ||
    schoolPreliminaryStatus === 'school_forwarded' ||
    schoolPreliminaryStatus === 'forwarded_to_city'
  ) {
    return 'FORWARDED_TO_CITY';
  }
  switch (schoolPreliminaryStatus) {
    case 'pending_intake':
    case 'school_pending':
      return 'PENDING_SCHOOL_REVIEW';
    case 'in_review':
    case 'under_review':
    case 'preliminary_completed':
    case 'school_reviewing':
      return 'SCHOOL_IN_REVIEW';
    case 'supplement_requested':
    case 'school_supplement':
      return 'SCHOOL_SUPPLEMENT_REQUESTED';
    case 'supplement_returned':
      return 'SCHOOL_SUPPLEMENT_RESUBMITTED';
    case 'eligible_for_city':
    case 'recommended_forwarding':
      return 'ELIGIBLE_FOR_CITY';
    case 'not_eligible_at_school':
    case 'not_recommended':
    case 'school_rejected':
      return 'NOT_ELIGIBLE_AT_SCHOOL';
    default:
      return !isDraftAppStatus(status, schoolPreliminaryStatus) ? 'PENDING_SCHOOL_REVIEW' : 'NOT_SUBMITTED';
  }
}

function mapCityWorkflowEnum(
  status?: string,
  reviewStage?: string,
  workflowStatus?: string
):
  | 'NOT_AT_CITY'
  | 'CITY_UNASSIGNED'
  | 'CITY_ASSIGNED'
  | 'CITY_IN_REVIEW'
  | 'CITY_SUPPLEMENT_REQUESTED'
  | 'CITY_SUPPLEMENT_RESUBMITTED'
  | 'CITY_REVIEW_COMPLETED'
  | 'COMMITTEE_PENDING'
  | 'FINALIZED_RECOGNIZED'
  | 'FINALIZED_NOT_RECOGNIZED'
  | 'PUBLISHED' {
  if (status === 'recognized') return 'FINALIZED_RECOGNIZED';
  if (status === 'not_recognized') return 'FINALIZED_NOT_RECOGNIZED';
  if (reviewStage === 'COMMITTEE' || status === 'all_reviewed') return 'COMMITTEE_PENDING';
  if (reviewStage !== 'CITY') return 'NOT_AT_CITY';
  if (status === 'supplement_required' || workflowStatus === 'supplement_requested') {
    return 'CITY_SUPPLEMENT_REQUESTED';
  }
  if (status === 'supplement_sent' || workflowStatus === 'supplement_returned') {
    return 'CITY_SUPPLEMENT_RESUBMITTED';
  }
  if (workflowStatus === 'in_review') return 'CITY_IN_REVIEW';
  return 'CITY_ASSIGNED';
}

function mapJudgmentEnum(
  status?: string | null
): 'NOT_REVIEWED' | 'REVIEWING' | 'SUITABLE' | 'NEEDS_SUPPLEMENT' | 'UNSUITABLE' | 'NEEDS_CONSIDERATION' {
  switch (status) {
    case 'suitable':
    case 'approved':
      return 'SUITABLE';
    case 'needs_supplement':
    case 'supplement_requested':
      return 'NEEDS_SUPPLEMENT';
    case 'unsuitable':
    case 'rejected':
      return 'UNSUITABLE';
    case 'needs_consideration':
      return 'NEEDS_CONSIDERATION';
    case 'reviewing':
      return 'REVIEWING';
    default:
      return 'NOT_REVIEWED';
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function syncStudentApplicationToRelationalTables(prisma: any, app: Record<string, any>): Promise<void> {
  const appId = String(app?.applicationId || '').trim();
  const studentCode = String(app?.student?.studentId || '').trim();
  if (!appId || !studentCode) return;
  if (!isTestRuntime() && isLegacyMockOrTestAppId(appId)) return;

  const inferredByName = inferInstitutionIdFromName(
    app?.applicantProfileSnapshot?.institutionName ||
      app?.student?.university ||
      app?.trainingInstitutionName ||
      app?.schoolReviewUnitName
  );
  const byUnitId = Object.entries(SCHOOL_UNIT_MAP).find(
    ([, v]) => v.unitId === app?.schoolReviewUnitId
  )?.[0];
  const rawInstId =
    (byUnitId && byUnitId !== 'inst-dut' ? byUnitId : undefined) ||
    (inferredByName && inferredByName !== 'inst-dut' ? inferredByName : undefined) ||
    app?.applicantProfileSnapshot?.institutionId ||
    byUnitId ||
    inferredByName ||
    'inst-dut';
  const validInstId = SCHOOL_UNIT_MAP[rawInstId] ? rawInstId : 'inst-dut';
  const mappedUnit = SCHOOL_UNIT_MAP[validInstId] || SCHOOL_UNIT_MAP['inst-dut'];
  const validUnitId = mappedUnit.unitId;

  const email = String(
    app?.applicantProfileSnapshot?.email ||
      app?.student?.email ||
      `${studentCode.toLowerCase()}@sv.udn.vn`
  )
    .trim()
    .toLowerCase();
  const fullName = String(
    app?.student?.fullName ||
      app?.applicantProfileSnapshot?.fullName ||
      `Sinh viên ${studentCode}`
  ).trim();

  // 1. Ensure Active Season exists (cached after first lookup to avoid 2 DB round-trips per app)
  const seasonId = 'season-2025-2026';
  if (!cachedActiveSeasonId) {
    const upsertedSeason = await prisma.awardSeason
      .upsert({
        where: { code: '2025-2026' },
        update: {},
        create: {
          id: seasonId,
          code: '2025-2026',
          name: 'Năm học 2025 – 2026',
          isActive: true,
          individualSubmissionStart: new Date('2025-10-01T08:00:00+07:00'),
          individualSubmissionEnd: new Date('2026-11-10T20:00:00+07:00'),
          schoolForwardingDeadline: new Date('2026-11-20T17:00:00+07:00'),
          collectiveSubmissionStart: new Date('2025-10-01T08:00:00+07:00'),
          collectiveSubmissionEnd: new Date('2026-11-10T20:00:00+07:00'),
        },
      })
      .catch(() => null);
    cachedActiveSeasonId = upsertedSeason?.id || seasonId;
  }
  const effectiveSeasonId = cachedActiveSeasonId;

  // 2. Ensure Student User exists in PostgreSQL `User` table
  let user = await prisma.user.findFirst({
    where: {
      OR: [{ studentCode }, { email }],
    },
  });
  if (!user) {
    const regStudent =
      portalState.registeredStudents.get(email.toLowerCase()) ||
      Array.from(portalState.registeredStudents.values()).find(
        (st) =>
          st.email.toLowerCase() === email.toLowerCase() ||
          st.studentCode.toUpperCase() === studentCode.toUpperCase()
      );
    const defaultHash = await defaultPasswordHasher.hash(regStudent?.password || 'MatKhau@2026');
    user = await prisma.user.create({
      data: {
        email,
        passwordHash: defaultHash,
        fullName,
        studentCode,
        status: 'ACTIVE',
        institutionId: validInstId,
        profile: app.applicantProfileSnapshot || null,
      },
    });
    await prisma.userRoleAssignment
      .create({
        data: {
          userId: user.id,
          roleCode: 'STUDENT',
          isActive: true,
        },
      })
      .catch(() => {});
  } else if (app.applicantProfileSnapshot || fullName !== user.fullName) {
    user = await prisma.user
      .update({
        where: { id: user.id },
        data: {
          fullName,
          institutionId: validInstId,
          profile: app.applicantProfileSnapshot ?? user.profile,
        },
      })
      .catch(() => user);
  }

  // 3. Collect all declarations per criterion (handling both crit.groups and crit.requirements)
  const criteriaList = Array.isArray(app.criteria) ? app.criteria : [];
  let declaredCriteriaCount = 0;
  let totalEvidenceCount = 0;

  const criterionExtracted = criteriaList.map((crit: Record<string, any>) => {
    const critId = String(crit.id || 'ethics');
    const criterionCode = CRITERION_ID_TO_CODE[critId] || critId.toUpperCase();
    const allReqs = [
      ...(Array.isArray(crit.groups)
        ? crit.groups.flatMap((g: Record<string, any>) => g.requirements || [])
        : []),
      ...(Array.isArray(crit.requirements) ? crit.requirements : []),
    ];
    const seenDeclIds = new Set<string>();
    const declItems: Array<{
      reqId: string;
      decl: Record<string, any>;
    }> = [];

    for (const req of allReqs) {
      if (!req) continue;
      const reqId = String(req.id || 'general');
      const decls = Array.isArray(req.declarations) ? req.declarations : [];
      for (const d of decls) {
        if (!d) continue;
        const dId = String(d.id || `decl-${reqId}-${declItems.length}`);
        if (seenDeclIds.has(dId)) continue;
        seenDeclIds.add(dId);
        declItems.push({ reqId, decl: { ...d, id: dId } });
      }
    }

    const evCount = declItems.reduce(
      (sum, item) =>
        sum + (Array.isArray(item.decl.evidenceFiles) ? item.decl.evidenceFiles.length : 0),
      0
    );
    if (declItems.length > 0) {
      declaredCriteriaCount += 1;
    }
    totalEvidenceCount += evCount;

    return {
      critId,
      criterionCode,
      declItems,
      evCount,
    };
  });

  const otherAchievementsList = Array.isArray(app.otherAchievements)
    ? app.otherAchievements
    : [];
  if (otherAchievementsList.length > 0) {
    const seenOtherIds = new Set<string>();
    const otherDeclItems: Array<{
      reqId: string;
      decl: Record<string, any>;
    }> = [];
    for (const d of otherAchievementsList) {
      if (!d) continue;
      const dId = String(d.id || `decl-other-${otherDeclItems.length}`);
      if (seenOtherIds.has(dId)) continue;
      seenOtherIds.add(dId);
      otherDeclItems.push({
        reqId: 'other-achievements-general',
        decl: { ...d, id: dId },
      });
    }
    const otherEvCount = otherDeclItems.reduce(
      (sum, item) =>
        sum + (Array.isArray(item.decl.evidenceFiles) ? item.decl.evidenceFiles.length : 0),
      0
    );
    totalEvidenceCount += otherEvCount;
    criterionExtracted.push({
      critId: 'other_achievements',
      criterionCode: 'OTHER_ACHIEVEMENTS',
      declItems: otherDeclItems,
      evCount: otherEvCount,
    });
  }

  const staffRec = portalState.individualStaffRecords.find(
    (r) => r.applicationId === appId
  );

  // 4. Upsert IndividualApplication in Neon PostgreSQL
  const existingByUserSeason = await prisma.individualApplication.findUnique({
    where: {
      seasonId_applicantUserId: {
        seasonId: effectiveSeasonId,
        applicantUserId: user.id,
      },
    },
  });

  const targetDbAppId = existingByUserSeason?.id || appId;
  const dbApp = await prisma.individualApplication.upsert({
    where: { id: targetDbAppId },
    update: {
      applicationCode: appId,
      institutionId: validInstId,
      schoolReviewUnitId: validUnitId,
      facultyName: String(app?.student?.faculty || 'Khoa Đào tạo'),
      className: String(
        app?.applicantProfileSnapshot?.className || app?.student?.class || '22CLC1'
      ),
      academicYear: 'Năm học 2025–2026',
      studentCodeSnapshot: studentCode,
      fullNameSnapshot: fullName,
      applicantProfileSnapshot: app.applicantProfileSnapshot || null,
      declaredCriteriaCount,
      totalEvidenceCount,
      currentReviewStage: mapReviewStageEnum(
        app.status,
        app.reviewStage || staffRec?.currentReviewStage,
        app.schoolPreliminaryStatus
      ),
      schoolPreliminaryStatus: mapSchoolPrelimEnum(
        app.schoolPreliminaryStatus || staffRec?.schoolPreliminaryStatus,
        app.status,
        app.reviewStage || staffRec?.currentReviewStage
      ),
      cityWorkflowStatus: mapCityWorkflowEnum(
        app.status,
        app.reviewStage || staffRec?.currentReviewStage,
        staffRec?.workflowStatus
      ),
      submittedToSchoolAt: !isDraftAppStatus(app.status, app.schoolPreliminaryStatus)
        ? new Date()
        : undefined,
    },
    create: {
      id: targetDbAppId,
      applicationCode: appId,
      seasonId: effectiveSeasonId,
      applicantUserId: user.id,
      institutionId: validInstId,
      schoolReviewUnitId: validUnitId,
      facultyName: String(app?.student?.faculty || 'Khoa Đào tạo'),
      className: String(
        app?.applicantProfileSnapshot?.className || app?.student?.class || '22CLC1'
      ),
      academicYear: 'Năm học 2025–2026',
      studentCodeSnapshot: studentCode,
      fullNameSnapshot: fullName,
      applicantProfileSnapshot: app.applicantProfileSnapshot || null,
      declaredCriteriaCount,
      totalEvidenceCount,
      currentReviewStage: mapReviewStageEnum(
        app.status,
        app.reviewStage || staffRec?.currentReviewStage,
        app.schoolPreliminaryStatus
      ),
      schoolPreliminaryStatus: mapSchoolPrelimEnum(
        app.schoolPreliminaryStatus || staffRec?.schoolPreliminaryStatus,
        app.status,
        app.reviewStage || staffRec?.currentReviewStage
      ),
      cityWorkflowStatus: mapCityWorkflowEnum(
        app.status,
        app.reviewStage || staffRec?.currentReviewStage,
        staffRec?.workflowStatus
      ),
      submittedToSchoolAt: !isDraftAppStatus(app.status, app.schoolPreliminaryStatus)
        ? new Date()
        : null,
    },
  });

  // 5. Upsert IndividualCriterionSubmission & IndividualDeclarationItem rows in parallel per criterion
  const validDeclarationIds: string[] = [];

  await Promise.all(
    criterionExtracted.map(async (cExt) => {
      const selfStatus =
        cExt.declItems.length === 0
          ? 'INCOMPLETE'
          : cExt.evCount > 0
          ? 'READY'
          : 'DECLARED';

      const critSub = await prisma.individualCriterionSubmission.upsert({
        where: {
          individualApplicationId_criterionCode: {
            individualApplicationId: dbApp.id,
            criterionCode: cExt.criterionCode,
          },
        },
        update: {
          selfStatus,
          declarationCount: cExt.declItems.length,
          evidenceCount: cExt.evCount,
        },
        create: {
          individualApplicationId: dbApp.id,
          criterionCode: cExt.criterionCode,
          selfStatus,
          declarationCount: cExt.declItems.length,
          evidenceCount: cExt.evCount,
        },
      });

      await Promise.all(
        cExt.declItems.map(async ({ reqId, decl }) => {
          const dbDeclId = `${dbApp.id}__${decl.id}`;
          validDeclarationIds.push(dbDeclId);

          const title = String(decl.value || decl.title || 'Nội dung kê khai');
          const structuredAttributes = {
            originalDeclarationId: decl.id,
            value: decl.value || title,
            detail: decl.detail || decl.description || '',
            date: decl.date || '',
            evidenceFiles: Array.isArray(decl.evidenceFiles) ? decl.evidenceFiles : [],
            metadata: decl.metadata || {},
            reviewState: decl.reviewState || null,
            isNewlyAddedSupplement: Boolean(decl.isNewlyAddedSupplement),
          };

          await prisma.individualDeclarationItem.upsert({
            where: { id: dbDeclId },
            update: {
              criterionSubmissionId: critSub.id,
              criterionCode: cExt.criterionCode,
              requirementCode: reqId,
              title,
              activityDateOrPeriod: decl.date ? String(decl.date) : null,
              applicantNote: decl.detail ? String(decl.detail) : null,
              structuredAttributes,
              selfStatus:
                Array.isArray(decl.evidenceFiles) && decl.evidenceFiles.length > 0
                  ? 'READY'
                  : 'DECLARED',
            },
            create: {
              id: dbDeclId,
              individualApplicationId: dbApp.id,
              criterionSubmissionId: critSub.id,
              criterionCode: cExt.criterionCode,
              requirementCode: reqId,
              title,
              activityDateOrPeriod: decl.date ? String(decl.date) : null,
              applicantNote: decl.detail ? String(decl.detail) : null,
              structuredAttributes,
              selfStatus:
                Array.isArray(decl.evidenceFiles) && decl.evidenceFiles.length > 0
                  ? 'READY'
                  : 'DECLARED',
            },
          });
        })
      );
    })
  );

  // Delete any declaration items in DB that were removed by the student
  if (validDeclarationIds.length > 0) {
    await prisma.individualDeclarationItem
      .deleteMany({
        where: {
          individualApplicationId: dbApp.id,
          id: { notIn: validDeclarationIds },
        },
      })
      .catch(() => {});
  } else {
    await prisma.individualDeclarationItem
      .deleteMany({
        where: {
          individualApplicationId: dbApp.id,
        },
      })
      .catch(() => {});
  }

  // 6. Sync Officer Review Judgments if present on staffRec.workspaceState or staffRec.reviewWorkspace
  const workspace = staffRec?.workspaceState || staffRec?.reviewWorkspace;
  if (workspace && workspace.criteriaJudgments && typeof workspace.criteriaJudgments === 'object') {
    const isCityStage =
      staffRec?.currentReviewStage === 'CITY' ||
      staffRec?.currentReviewStage === 'COMMITTEE';
    await Promise.all(
      Object.entries(workspace.criteriaJudgments as Record<string, any>).map(
        async ([critId, jRaw]) => {
          if (!jRaw || !jRaw.status) return;
          const criterionCode = CRITERION_ID_TO_CODE[critId] || critId.toUpperCase();
          const judgmentStatus = mapJudgmentEnum(jRaw.status);
          const reviewerName = String(
            jRaw.updatedBy || staffRec?.assignment?.officerName || 'Cán bộ xét duyệt'
          );
          const reviewerNote = jRaw.reviewerNote ? String(jRaw.reviewerNote) : null;

          if (isCityStage) {
            await prisma.cityCriterionReviewJudgment
              .upsert({
                where: {
                  individualApplicationId_criterionCode: {
                    individualApplicationId: dbApp.id,
                    criterionCode,
                  },
                },
                update: {
                  judgmentStatus,
                  reviewerNameSnapshot: reviewerName,
                  reviewerNote,
                },
                create: {
                  individualApplicationId: dbApp.id,
                  criterionCode,
                  judgmentStatus,
                  reviewerUserId: 'staff-off-nam',
                  reviewerNameSnapshot: reviewerName,
                  reviewerNote,
                  flaggedEvidenceLinkIds: [],
                },
              })
              .catch(() => {});
          } else {
            await prisma.schoolCriterionReviewJudgment
              .upsert({
                where: {
                  individualApplicationId_criterionCode: {
                    individualApplicationId: dbApp.id,
                    criterionCode,
                  },
                },
                update: {
                  judgmentStatus,
                  reviewerNameSnapshot: reviewerName,
                  reviewerNote,
                },
                create: {
                  individualApplicationId: dbApp.id,
                  criterionCode,
                  judgmentStatus,
                  reviewerUserId: 'staff-sch-dut',
                  reviewerNameSnapshot: reviewerName,
                  reviewerNote,
                },
              })
              .catch(() => {});
          }
        }
      )
    );
  }
}

export async function flushPortalStateToNeonDbNow(): Promise<void> {
  if (!isNeonDbSyncEnabled()) return;
  if (syncTimer) {
    clearTimeout(syncTimer);
    syncTimer = null;
  }

  const runSync = async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prisma = (await dbManager.getClient()) as any;
      await ensurePortalDbSchema(prisma);

      // 1. Active Sessions, Registered Students & Student Profiles
      for (const [tokenKey, sessVal] of Array.from(portalState.sessions.entries()).slice(-200)) {
        await upsertPersistentRecord(prisma, 'portal_session', tokenKey, sessVal);
      }
      for (const [email, student] of portalState.registeredStudents.entries()) {
        const regChanged = await upsertPersistentRecord(
          prisma,
          'registered_student',
          email,
          student
        );
        const userSyncKey = `rel_user_sync:${email}`;
        const userSnapshot =
          lastSyncedPayloadHash.get(`registered_student:${email}`) || JSON.stringify(student);
        if (regChanged || lastSyncedPayloadHash.get(userSyncKey) !== userSnapshot) {
          const normEmail = (student.email || email).trim().toLowerCase();
          const normCode = (student.studentCode || '').trim().toUpperCase();
          const validInstId = SCHOOL_UNIT_MAP[student.institutionId]
            ? student.institutionId
            : 'inst-dut';
          let dbUser = await prisma.user
            .findFirst({
              where: {
                OR: [
                  { email: normEmail },
                  ...(normCode ? [{ studentCode: normCode }] : []),
                ],
              },
            })
            .catch(() => null);
          if (!dbUser) {
            const passwordHash = await defaultPasswordHasher.hash(
              student.password || 'MatKhau@2026'
            );
            dbUser = await prisma.user
              .create({
                data: {
                  email: normEmail,
                  passwordHash,
                  fullName: student.fullName || 'Sinh viên ĐHĐN',
                  studentCode: normCode || null,
                  status: 'ACTIVE',
                  institutionId: validInstId,
                  profile: student.profile || null,
                },
              })
              .catch(() => null);
          } else if (student.password) {
            const matches = await defaultPasswordHasher
              .verify(dbUser.passwordHash, student.password)
              .catch(() => false);
            if (!matches) {
              const nextHash = await defaultPasswordHasher.hash(student.password);
              await prisma.user
                .update({
                  where: { id: dbUser.id },
                  data: { passwordHash: nextHash },
                })
                .catch(() => {});
            }
          }
          if (dbUser) {
            const existingRole = await prisma.userRoleAssignment
              .findFirst({
                where: { userId: dbUser.id, roleCode: 'STUDENT', isActive: true },
              })
              .catch(() => null);
            if (!existingRole) {
              await prisma.userRoleAssignment
                .create({
                  data: {
                    userId: dbUser.id,
                    roleCode: 'STUDENT',
                    isActive: true,
                  },
                })
                .catch(() => {});
            }
          }
          lastSyncedPayloadHash.set(userSyncKey, userSnapshot);
        }
      }
      for (const [profileKey, profileVal] of portalState.studentProfiles.entries()) {
        await upsertPersistentRecord(prisma, 'student_profile', profileKey, profileVal);
      }

      // 2. Individual Staff Records (including reviewWorkspace) — synced first so hashes are ready in O(1)
      const currentStaffIds = portalState.individualStaffRecords
        .map((r) => String(r?.applicationId || ''))
        .filter((id) => Boolean(id) && (isTestRuntime() || !isLegacyMockOrTestAppId(id)));
      const changedStaffAppIds = new Set<string>();
      for (const rec of portalState.individualStaffRecords) {
        if (!rec?.applicationId) continue;
        const staffAppId = String(rec.applicationId);
        if (!isTestRuntime() && isLegacyMockOrTestAppId(staffAppId)) continue;
        const staffChanged = await upsertPersistentRecord(
          prisma,
          'staff_record',
          staffAppId,
          rec
        );
        if (staffChanged) {
          changedStaffAppIds.add(staffAppId);
        }
      }
      if (currentStaffIds.length === 0) {
        await prisma
          .$executeRawUnsafe(
            `DELETE FROM "portal_persistent_records" WHERE "collection" = 'staff_record'`
          )
          .catch(() => {});
      }

      // 3. Student Applications (JSONB + Relational Tables)
      const currentAppIds = Object.keys(portalState.studentApplications).filter(
        (id) => isTestRuntime() || !isLegacyMockOrTestAppId(id)
      );
      for (const [appId, app] of Object.entries(portalState.studentApplications)) {
        if (!isTestRuntime() && isLegacyMockOrTestAppId(appId)) continue;
        const appChanged = await upsertPersistentRecord(prisma, 'student_application', appId, app);
        const relCacheKey = `rel_sync:${appId}`;
        const appHash = lastSyncedPayloadHash.get(`student_application:${appId}`) || '';
        const staffHash = lastSyncedPayloadHash.get(`staff_record:${appId}`) || '';
        const relSnapshot = `${appHash}::${staffHash}`;
        if (
          appChanged ||
          changedStaffAppIds.has(appId) ||
          lastSyncedPayloadHash.get(relCacheKey) !== relSnapshot
        ) {
          await syncStudentApplicationToRelationalTables(prisma, app).catch(() => {});
          lastSyncedPayloadHash.set(relCacheKey, relSnapshot);
        }
      }
      if (currentAppIds.length === 0) {
        await prisma
          .$executeRawUnsafe(
            `DELETE FROM "portal_persistent_records" WHERE "collection" = 'student_application'`
          )
          .catch(() => {});
      }

      // 4. Collective Applications
      for (const col of portalState.collectiveApplications) {
        const colId = String(col?.id || col?.applicationId || '');
        if (!colId) continue;
        if (!isTestRuntime() && isLegacyMockOrTestAppId(colId)) continue;
        await upsertPersistentRecord(prisma, 'collective_application', colId, col);
      }

      // 5. Evidence Index — only persist newly added/modified evidence records (never re-stringify 68MB of already-persisted blobs)
      for (const [evId, ev] of portalState.evidenceIndex.entries()) {
        if (persistedEvidenceIds.has(evId)) continue;
        await upsertPersistentRecord(prisma, 'evidence_record', evId, ev);
        persistedEvidenceIds.add(evId);
      }

      // 6. Audit Logs Snapshot
      await upsertPersistentRecord(
        prisma,
        'audit_logs_snapshot',
        'latest',
        portalState.auditLogs.slice(0, 500)
      );
    } catch (err) {
      // Log non-fatally so API requests never crash on transient network hiccups
      console.warn(
        '[NeonDB Sync] Warning during portalState persistence:',
        err instanceof Error ? err.message : String(err)
      );
    }
  };

  activeSyncPromise = (activeSyncPromise || Promise.resolve()).then(runSync, runSync);
  return activeSyncPromise;
}

export function schedulePortalStateNeonDbSync(): void {
  if (!isNeonDbSyncEnabled()) return;
  if (syncTimer) {
    clearTimeout(syncTimer);
  }
  syncTimer = setTimeout(() => {
    syncTimer = null;
    void flushPortalStateToNeonDbNow();
  }, 350);
  if (syncTimer.unref) {
    syncTimer.unref();
  }
}

export async function persistEvidenceRecordToNeonDb(
  record: StoredEvidenceRecord
): Promise<void> {
  persistedEvidenceIds.add(record.id);
  if (!isNeonDbSyncEnabled()) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prisma = (await dbManager.getClient()) as any;
    await ensurePortalDbSchema(prisma);
    await upsertPersistentRecord(prisma, 'evidence_record', record.id, record);
  } catch (err) {
    console.warn(
      '[NeonDB Sync] Warning during direct evidence persistence:',
      err instanceof Error ? err.message : String(err)
    );
  }
}

export async function deleteEvidenceRecordFromNeonDb(
  evidenceId: string
): Promise<void> {
  persistedEvidenceIds.delete(evidenceId);
  lastSyncedPayloadHash.delete(`evidence_record:${evidenceId}`);
  lastSyncedObjectRef.delete(`evidence_record:${evidenceId}`);
  if (!isNeonDbSyncEnabled()) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prisma = (await dbManager.getClient()) as any;
    await ensurePortalDbSchema(prisma);
    await prisma.$executeRawUnsafe(
      `DELETE FROM "portal_persistent_records" WHERE "collection" = 'evidence_record' AND "record_key" = $1`,
      evidenceId
    );
  } catch {
    // ignore
  }
}

export async function clearPortalPersistentRecordsInNeonDb(): Promise<void> {
  lastSyncedPayloadHash.clear();
  lastSyncedObjectRef.clear();
  persistedEvidenceIds.clear();
  if (!isNeonDbSyncEnabled()) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prisma = (await dbManager.getClient()) as any;
    await ensurePortalDbSchema(prisma);
    await prisma.$executeRawUnsafe(`DELETE FROM "portal_persistent_records"`);
  } catch {
    // ignore
  }
}

export async function hydrateEvidenceRecordFromNeonDb(
  targetIdOrName: string
): Promise<StoredEvidenceRecord | null> {
  const existing = portalState.evidenceIndex.get(targetIdOrName);
  if (existing?.base64Content || existing?.r2ObjectKey) {
    return existing;
  }
  if (!isNeonDbSyncEnabled()) {
    return existing || null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prisma = (await dbManager.getClient()) as any;
    await ensurePortalDbSchema(prisma);
    let rows = (await prisma.$queryRawUnsafe(
      `SELECT "record_key", "payload" FROM "portal_persistent_records" WHERE "collection" = 'evidence_record' AND "record_key" = $1 LIMIT 1`,
      targetIdOrName
    )) as Array<{ record_key: string; payload: any }>;

    if ((!rows || rows.length === 0) && !existing) {
      rows = (await prisma.$queryRawUnsafe(
        `SELECT "record_key", "payload" FROM "portal_persistent_records" WHERE "collection" = 'evidence_record' AND "payload"->>'name' = $1 LIMIT 1`,
        targetIdOrName
      )) as Array<{ record_key: string; payload: any }>;
    }
    const row = rows?.[0];
    if (!row?.payload) return existing || null;
    const parsed = (
      typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload
    ) as StoredEvidenceRecord;
    // Keep only lightweight metadata in RAM (never retain multi-megabyte base64Content in Node.js heap in online mode)
    const { base64Content: _omittedFromRam, ...metadataOnly } = parsed;
    portalState.evidenceIndex.set(row.record_key, metadataOnly);
    persistedEvidenceIds.add(row.record_key);
    return parsed;
  } catch {
    return existing || null;
  }
}

export async function ensurePortalStateHydratedFromNeonDb(forceRefresh = false): Promise<boolean> {
  if (!isNeonDbSyncEnabled()) return false;
  if (isHydrated && !forceRefresh) {
    return true;
  }
  if (!initialHydrationPromise) {
    initialHydrationPromise = (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const prisma = (await dbManager.getClient()) as any;
        await ensurePortalDbSchema(prisma);

        // 1. Fetch all non-evidence records (~3 MB) + lightweight evidence metadata (excluding 68 MB of base64Content) in parallel
        const [rows, evidenceMetaRows] = await Promise.all([
          prisma.$queryRawUnsafe(
            `SELECT "collection", "record_key", "payload" FROM "portal_persistent_records" WHERE "collection" <> 'evidence_record' ORDER BY "updated_at" ASC`
          ) as Promise<
            Array<{
              collection: string;
              record_key: string;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              payload: any;
            }>
          >,
          !isHydrated
            ? (prisma
                .$queryRawUnsafe(
                  `SELECT "record_key", ("payload" - 'base64Content') AS "payload" FROM "portal_persistent_records" WHERE "collection" = 'evidence_record'`
                )
                .catch(() => []) as Promise<
                Array<{
                  record_key: string;
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  payload: any;
                }>
              >)
            : Promise.resolve([]),
        ]);

        let loadedCount = 0;

        for (const evRow of evidenceMetaRows || []) {
          const evData =
            typeof evRow.payload === 'string'
              ? JSON.parse(evRow.payload)
              : evRow.payload;
          if (!evData) continue;
          const { base64Content: _omitted, ...metadataOnly } = evData as StoredEvidenceRecord;
          portalState.evidenceIndex.set(evRow.record_key, metadataOnly);
          persistedEvidenceIds.add(evRow.record_key);
          loadedCount++;
        }

        for (const row of rows || []) {
          if (
            !isTestRuntime() &&
            (row.collection === 'student_application' ||
              row.collection === 'staff_record' ||
              row.collection === 'collective_application') &&
            isLegacyMockOrTestAppId(row.record_key)
          ) {
            continue;
          }
          const data =
            typeof row.payload === 'string'
              ? JSON.parse(row.payload)
              : row.payload;
          if (!data) continue;
          const serializedData = JSON.stringify(data);
          const cacheKey = `${row.collection}:${row.record_key}`;
          lastSyncedPayloadHash.set(cacheKey, serializedData);
          lastSyncedObjectRef.set(cacheKey, data);

          switch (row.collection) {
            case 'portal_session':
              portalState.sessions.set(row.record_key, data);
              loadedCount++;
              break;
            case 'registered_student':
              portalState.registeredStudents.set(
                row.record_key,
                data as PortalRegisteredStudent
              );
              lastSyncedPayloadHash.set(`rel_user_sync:${row.record_key}`, serializedData);
              loadedCount++;
              break;
            case 'student_profile':
              portalState.studentProfiles.set(
                row.record_key,
                data as Record<string, any>
              );
              loadedCount++;
              break;
            case 'student_application':
              if (isDraftAppStatus(data.status, data.schoolPreliminaryStatus)) {
                data.status = 'draft';
                data.schoolPreliminaryStatus = 'school_not_submitted';
              }
              portalState.studentApplications[row.record_key] = data;
              loadedCount++;
              break;
            case 'staff_record': {
              const idx = portalState.individualStaffRecords.findIndex(
                (r) => r.applicationId === row.record_key
              );
              if (idx >= 0) {
                portalState.individualStaffRecords[idx] = data;
              } else {
                portalState.individualStaffRecords.push(data);
              }
              loadedCount++;
              break;
            }
            case 'collective_application': {
              const colId = row.record_key;
              const idx = portalState.collectiveApplications.findIndex(
                (c) => (c.id || c.applicationId) === colId
              );
              if (idx >= 0) {
                portalState.collectiveApplications[idx] = data;
              } else {
                portalState.collectiveApplications.push(data);
              }
              loadedCount++;
              break;
            }
            case 'audit_logs_snapshot':
              if (Array.isArray(data) && data.length > 0) {
                portalState.auditLogs = data as PortalAuditLogRecord[];
              }
              break;
          }
        }

        // Remove any legacy mock/test records, non-UDN records, or staff_record whose corresponding student_application is still an un-submitted draft
        for (const [appId, app] of Object.entries(portalState.studentApplications)) {
          if (
            !isTestRuntime() &&
            (isLegacyMockOrTestAppId(appId) || isNonUdnInstitutionRecord(app))
          ) {
            delete portalState.studentApplications[appId];
          }
        }
        portalState.individualStaffRecords = portalState.individualStaffRecords.filter((rec) => {
          if (
            !isTestRuntime() &&
            (isLegacyMockOrTestAppId(rec?.applicationId) || isNonUdnInstitutionRecord(rec))
          ) {
            return false;
          }
          const matchingStudentApp = portalState.studentApplications[rec.applicationId];
          if (
            matchingStudentApp &&
            isDraftAppStatus(
              matchingStudentApp.status,
              matchingStudentApp.schoolPreliminaryStatus
            )
          ) {
            return false;
          }
          if (rec.schoolPreliminaryStatus === 'school_not_submitted') {
            return false;
          }
          return true;
        });
        portalState.collectiveApplications = portalState.collectiveApplications.filter(
          (col) =>
            isTestRuntime() ||
            (!isLegacyMockOrTestAppId(col?.id || col?.applicationId) &&
              !isNonUdnInstitutionRecord(col))
        );

        // Hydrate relational IndividualApplication and User rows in parallel
        const [relationalApps, relationalUsers] = await Promise.all([
          prisma.individualApplication
            .findMany({
              include: {
                applicant: true,
                declarations: true,
              },
            })
            .catch(() => []),
          prisma.user
            .findMany({
              where: { studentCode: { not: null } },
            })
            .catch(() => []),
        ]);

        for (const relApp of relationalApps || []) {
          const code = String(relApp.applicationCode || relApp.id);
          if (!isTestRuntime() && isLegacyMockOrTestAppId(code)) continue;
          if (portalState.studentApplications[code]) continue;

          const defaultCrit = createDefaultCriteriaList();
          const hydratedOtherAchievements: Record<string, any>[] = [];
          for (const dItem of relApp.declarations || []) {
            const attrs = (dItem.structuredAttributes || {}) as Record<string, any>;
            if (
              dItem.criterionCode === 'OTHER_ACHIEVEMENTS' ||
              dItem.requirementCode === 'other-achievements-general'
            ) {
              hydratedOtherAchievements.push({
                id: attrs.originalDeclarationId || dItem.id,
                value: attrs.value || dItem.title,
                title: dItem.title,
                detail: attrs.detail || dItem.applicantNote || '',
                date: attrs.date || dItem.activityDateOrPeriod || '10/10/2026',
                status: 'completed',
                evidenceFiles: Array.isArray(attrs.evidenceFiles)
                  ? attrs.evidenceFiles
                  : [],
                metadata: attrs.metadata || {
                  criterionId: 'other_achievements',
                  requirementId: 'other-achievements-general',
                },
                reviewState: attrs.reviewState || undefined,
              });
              continue;
            }
            const cId = CRITERION_CODE_TO_ID[dItem.criterionCode] || 'ethics';
            const critObj = defaultCrit.find((c) => c.id === cId);
            if (!critObj) continue;
            const reqId = String(dItem.requirementCode || 'ethics-score');
            let reqObj = (critObj.requirements as Record<string, any>[]).find(
              (r) => r.id === reqId
            );
            if (!reqObj) {
              reqObj = {
                id: reqId,
                criterionId: cId,
                status: 'completed',
                declarations: [],
              };
              (critObj.requirements as Record<string, any>[]).push(reqObj);
            }
            reqObj.declarations.push({
              id: attrs.originalDeclarationId || dItem.id,
              value: attrs.value || dItem.title,
              title: dItem.title,
              detail: attrs.detail || dItem.applicantNote || '',
              date: attrs.date || dItem.activityDateOrPeriod || '10/10/2026',
              status: 'completed',
              evidenceFiles: Array.isArray(attrs.evidenceFiles)
                ? attrs.evidenceFiles
                : [],
              metadata: attrs.metadata || {
                criterionId: cId,
                requirementId: reqId,
              },
              reviewState: attrs.reviewState || undefined,
            });
          }

          const mapped =
            SCHOOL_UNIT_MAP[relApp.institutionId] || SCHOOL_UNIT_MAP['inst-dut'];
          const mappedPrelim =
            relApp.schoolPreliminaryStatus === 'FORWARDED_TO_CITY'
              ? 'forwarded_to_city'
              : relApp.schoolPreliminaryStatus === 'ELIGIBLE_FOR_CITY'
              ? 'recommended_forwarding'
              : relApp.schoolPreliminaryStatus === 'NOT_ELIGIBLE_AT_SCHOOL'
              ? 'not_recommended'
              : relApp.schoolPreliminaryStatus === 'SCHOOL_SUPPLEMENT_REQUESTED'
              ? 'supplement_requested'
              : relApp.schoolPreliminaryStatus === 'SCHOOL_SUPPLEMENT_RESUBMITTED'
              ? 'supplement_returned'
              : relApp.schoolPreliminaryStatus === 'SCHOOL_IN_REVIEW'
              ? 'under_review'
              : relApp.currentReviewStage === 'STUDENT_DRAFT'
              ? 'school_not_submitted'
              : 'pending_intake';
          portalState.studentApplications[code] = {
            applicationId: code,
            season: 'Năm học 2025–2026',
            level: 'Cấp Đại học Đà Nẵng',
            status:
              relApp.currentReviewStage === 'STUDENT_DRAFT' ? 'draft' : 'under_review',
            reviewStage:
              relApp.currentReviewStage === 'CITY_REVIEW' ||
              relApp.schoolPreliminaryStatus === 'FORWARDED_TO_CITY'
                ? 'CITY'
                : relApp.currentReviewStage === 'COMMITTEE_FINALIZATION'
                ? 'COMMITTEE'
                : 'SCHOOL',
            schoolPreliminaryStatus: mappedPrelim,
            trainingInstitutionName: mapped.instName,
            schoolReviewUnitId: relApp.schoolReviewUnitId || mapped.unitId,
            schoolReviewUnitName: mapped.unitName,
            applicantProfileSnapshot: relApp.applicantProfileSnapshot || null,
            student: {
              fullName: relApp.fullNameSnapshot,
              studentId: relApp.studentCodeSnapshot,
              university: mapped.instName,
              faculty: relApp.facultyName,
              class: relApp.className,
              email: relApp.applicant?.email || `${relApp.studentCodeSnapshot}@sv.udn.vn`,
              academicYear: 'Năm học 2025–2026',
            },
            criteria: defaultCrit,
            otherAchievements: hydratedOtherAchievements,
            supplementRequests: [],
          };
          loadedCount++;
        }

        for (const relUser of relationalUsers || []) {
          const emailKey = String(relUser.email || '').trim().toLowerCase();
          const codeKey = String(relUser.studentCode || '').trim();
          if (!emailKey || !codeKey) continue;
          const instId = relUser.institutionId || 'inst-dut';
          const mappedInst =
            SCHOOL_UNIT_MAP[instId] || SCHOOL_UNIT_MAP['inst-dut'];
          const existingReg = portalState.registeredStudents.get(emailKey);
          const profileObj =
            relUser.profile && typeof relUser.profile === 'object'
              ? (relUser.profile as Record<string, any>)
              : existingReg?.profile;
          const hydratedReg: PortalRegisteredStudent = {
            id: relUser.id,
            fullName: existingReg?.fullName || relUser.fullName,
            email: emailKey,
            studentCode: existingReg?.studentCode || codeKey,
            institutionId: existingReg?.institutionId || instId,
            institutionName:
              existingReg?.institutionName ||
              profileObj?.institutionName ||
              mappedInst.instName,
            password: existingReg?.password,
            passwordHash: relUser.passwordHash || existingReg?.passwordHash,
            profile: profileObj,
          };
          portalState.registeredStudents.set(emailKey, hydratedReg);
          const regJson = JSON.stringify(hydratedReg);
          lastSyncedPayloadHash.set(`registered_student:${emailKey}`, regJson);
          lastSyncedPayloadHash.set(`rel_user_sync:${emailKey}`, regJson);
          if (profileObj) {
            const profJson = JSON.stringify(profileObj);
            portalState.studentProfiles.set(`id:${relUser.id}`, profileObj);
            portalState.studentProfiles.set(`email:${emailKey}`, profileObj);
            portalState.studentProfiles.set(`code:${codeKey.toUpperCase()}`, profileObj);
            lastSyncedPayloadHash.set(`student_profile:id:${relUser.id}`, profJson);
            lastSyncedPayloadHash.set(`student_profile:email:${emailKey}`, profJson);
            lastSyncedPayloadHash.set(`student_profile:code:${codeKey.toUpperCase()}`, profJson);
          }
          loadedCount++;
        }

        // Populate relational sync cache keys for all hydrated applications so startup does not re-sync 65 apps
        for (const [appId, app] of Object.entries(portalState.studentApplications)) {
          if (!lastSyncedPayloadHash.has(`student_application:${appId}`)) {
            lastSyncedPayloadHash.set(`student_application:${appId}`, JSON.stringify(app));
          }
          const appHash = lastSyncedPayloadHash.get(`student_application:${appId}`) || '';
          const staffHash = lastSyncedPayloadHash.get(`staff_record:${appId}`) || '';
          lastSyncedPayloadHash.set(`rel_sync:${appId}`, `${appHash}::${staffHash}`);
        }

        isHydrated = true;
        lastHydratedAt = Date.now();
        initialHydrationPromise = null;
        return loadedCount > 0;
      } catch (err) {
        console.warn(
          '[NeonDB Hydrate] Warning during startup hydration:',
          err instanceof Error ? err.message : String(err)
        );
        isHydrated = true;
        lastHydratedAt = Date.now();
        initialHydrationPromise = null;
        return false;
      }
    })();
  }
  return initialHydrationPromise;
}
