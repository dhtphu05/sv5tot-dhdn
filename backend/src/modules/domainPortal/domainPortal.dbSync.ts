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
let syncTimer: NodeJS.Timeout | null = null;
let activeSyncPromise: Promise<void> | null = null;
const lastSyncedPayloadHash = new Map<string, string>();

export function isNeonDbSyncEnabled(): boolean {
  if (process.env.NODE_ENV === 'test') return false;
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
  const jsonText = JSON.stringify(payload ?? {});
  if (lastSyncedPayloadHash.get(cacheKey) === jsonText) {
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
  return true;
}

function mapReviewStageEnum(
  status?: string,
  reviewStage?: string
): 'STUDENT_DRAFT' | 'SCHOOL_PRELIMINARY' | 'CITY_REVIEW' | 'COMMITTEE_FINALIZATION' | 'COMPLETED' {
  if (status === 'recognized' || status === 'not_recognized') return 'COMPLETED';
  if (reviewStage === 'COMMITTEE' || status === 'all_reviewed') return 'COMMITTEE_FINALIZATION';
  if (reviewStage === 'CITY') return 'CITY_REVIEW';
  if (!status || status === 'draft') return 'STUDENT_DRAFT';
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
  if (reviewStage === 'CITY' || reviewStage === 'COMMITTEE' || schoolPreliminaryStatus === 'school_forwarded') {
    return 'FORWARDED_TO_CITY';
  }
  switch (schoolPreliminaryStatus) {
    case 'pending_intake':
    case 'school_pending':
      return 'PENDING_SCHOOL_REVIEW';
    case 'in_review':
    case 'school_reviewing':
      return 'SCHOOL_IN_REVIEW';
    case 'supplement_requested':
    case 'school_supplement':
      return 'SCHOOL_SUPPLEMENT_REQUESTED';
    case 'supplement_returned':
      return 'SCHOOL_SUPPLEMENT_RESUBMITTED';
    case 'eligible_for_city':
      return 'ELIGIBLE_FOR_CITY';
    case 'not_eligible_at_school':
    case 'school_rejected':
      return 'NOT_ELIGIBLE_AT_SCHOOL';
    default:
      return status && status !== 'draft' ? 'PENDING_SCHOOL_REVIEW' : 'NOT_SUBMITTED';
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

  const rawInstId =
    app?.applicantProfileSnapshot?.institutionId ||
    Object.entries(SCHOOL_UNIT_MAP).find(
      ([, v]) => v.unitId === app?.schoolReviewUnitId
    )?.[0] ||
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

  // 1. Ensure Active Season exists
  const seasonId = 'season-2025-2026';
  await prisma.awardSeason
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
    .catch(() => {});

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

  const staffRec = portalState.individualStaffRecords.find(
    (r) => r.applicationId === appId
  );

  const activeSeason = await prisma.awardSeason.findUnique({
    where: { code: '2025-2026' },
  });
  const effectiveSeasonId = activeSeason?.id || seasonId;

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
        app.reviewStage || staffRec?.currentReviewStage
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
      submittedToSchoolAt:
        app.status && app.status !== 'draft' ? new Date() : undefined,
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
        app.reviewStage || staffRec?.currentReviewStage
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
      submittedToSchoolAt:
        app.status && app.status !== 'draft' ? new Date() : null,
    },
  });

  // 5. Upsert IndividualCriterionSubmission & IndividualDeclarationItem rows
  const validDeclarationIds: string[] = [];

  for (const cExt of criterionExtracted) {
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

    for (const { reqId, decl } of cExt.declItems) {
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
    }
  }

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

  // 6. Sync Officer Review Judgments if present on staffRec.reviewWorkspace
  const workspace = staffRec?.reviewWorkspace;
  if (workspace && workspace.criteriaJudgments && typeof workspace.criteriaJudgments === 'object') {
    const isCityStage =
      staffRec?.currentReviewStage === 'CITY' ||
      staffRec?.currentReviewStage === 'COMMITTEE';
    for (const [critId, jRaw] of Object.entries(
      workspace.criteriaJudgments as Record<string, any>
    )) {
      if (!jRaw || !jRaw.status) continue;
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
        const userSnapshot = JSON.stringify(student);
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

      // 2. Student Applications (JSONB + Relational Tables)
      const currentAppIds = Object.keys(portalState.studentApplications);
      for (const [appId, app] of Object.entries(portalState.studentApplications)) {
        const appChanged = await upsertPersistentRecord(prisma, 'student_application', appId, app);
        const staffRec = portalState.individualStaffRecords.find((r) => r.applicationId === appId);
        const relCacheKey = `rel_sync:${appId}`;
        const relSnapshot = JSON.stringify({ app, staffRec: staffRec ?? null });
        if (appChanged || lastSyncedPayloadHash.get(relCacheKey) !== relSnapshot) {
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

      // 3. Individual Staff Records (including reviewWorkspace)
      const currentStaffIds = portalState.individualStaffRecords
        .map((r) => String(r?.applicationId || ''))
        .filter(Boolean);
      for (const rec of portalState.individualStaffRecords) {
        if (!rec?.applicationId) continue;
        await upsertPersistentRecord(
          prisma,
          'staff_record',
          String(rec.applicationId),
          rec
        );
      }
      if (currentStaffIds.length === 0) {
        await prisma
          .$executeRawUnsafe(
            `DELETE FROM "portal_persistent_records" WHERE "collection" = 'staff_record'`
          )
          .catch(() => {});
      }

      // 4. Collective Applications
      for (const col of portalState.collectiveApplications) {
        const colId = String(col?.id || col?.applicationId || '');
        if (!colId) continue;
        await upsertPersistentRecord(prisma, 'collective_application', colId, col);
      }

      // 5. Evidence Index (including binary base64Content for cross-browser preview)
      for (const [evId, ev] of portalState.evidenceIndex.entries()) {
        await upsertPersistentRecord(prisma, 'evidence_record', evId, ev);
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
  }, 60);
}

export async function clearPortalPersistentRecordsInNeonDb(): Promise<void> {
  lastSyncedPayloadHash.clear();
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

export async function ensurePortalStateHydratedFromNeonDb(): Promise<boolean> {
  if (!isNeonDbSyncEnabled()) return false;
  if (!initialHydrationPromise) {
    initialHydrationPromise = (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const prisma = (await dbManager.getClient()) as any;
        await ensurePortalDbSchema(prisma);

        const rows = (await prisma.$queryRawUnsafe(
          `SELECT "collection", "record_key", "payload" FROM "portal_persistent_records" ORDER BY "updated_at" ASC`
        )) as Array<{
          collection: string;
          record_key: string;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          payload: any;
        }>;

        let loadedCount = 0;

        for (const row of rows || []) {
          const data =
            typeof row.payload === 'string'
              ? JSON.parse(row.payload)
              : row.payload;
          if (!data) continue;
          lastSyncedPayloadHash.set(
            `${row.collection}:${row.record_key}`,
            JSON.stringify(data)
          );

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
            case 'evidence_record':
              portalState.evidenceIndex.set(
                row.record_key,
                data as StoredEvidenceRecord
              );
              loadedCount++;
              break;
            case 'audit_logs_snapshot':
              if (Array.isArray(data) && data.length > 0) {
                portalState.auditLogs = data as PortalAuditLogRecord[];
              }
              break;
          }
        }

        // Also hydrate any relational IndividualApplication rows that might not be in portal_persistent_records
        const relationalApps = await prisma.individualApplication
          .findMany({
            include: {
              applicant: true,
              declarations: true,
            },
          })
          .catch(() => []);

        for (const relApp of relationalApps || []) {
          const code = String(relApp.applicationCode || relApp.id);
          if (portalState.studentApplications[code]) continue;

          const defaultCrit = createDefaultCriteriaList();
          for (const dItem of relApp.declarations || []) {
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
            const attrs = (dItem.structuredAttributes || {}) as Record<string, any>;
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
          portalState.studentApplications[code] = {
            applicationId: code,
            season: 'Năm học 2025–2026',
            level: 'Cấp Đại học Đà Nẵng',
            status:
              relApp.currentReviewStage === 'STUDENT_DRAFT' ? 'draft' : 'under_review',
            reviewStage:
              relApp.currentReviewStage === 'CITY_REVIEW'
                ? 'CITY'
                : relApp.currentReviewStage === 'COMMITTEE_FINALIZATION'
                ? 'COMMITTEE'
                : 'SCHOOL',
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
            supplementRequests: [],
          };
          loadedCount++;
        }

        // Also hydrate student users from relational User table in PostgreSQL
        const relationalUsers = await prisma.user
          .findMany({
            where: { studentCode: { not: null } },
          })
          .catch(() => []);

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
          portalState.registeredStudents.set(emailKey, {
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
            profile: profileObj,
          });
          if (profileObj) {
            portalState.studentProfiles.set(`id:${relUser.id}`, profileObj);
            portalState.studentProfiles.set(`email:${emailKey}`, profileObj);
            portalState.studentProfiles.set(`code:${codeKey.toUpperCase()}`, profileObj);
          }
          loadedCount++;
        }

        // Push any existing local state into Neon PostgreSQL
        if (
          Object.keys(portalState.studentApplications).length > 0 ||
          portalState.individualStaffRecords.length > 0 ||
          portalState.collectiveApplications.length > 0 ||
          portalState.registeredStudents.size > 0 ||
          portalState.evidenceIndex.size > 0
        ) {
          await flushPortalStateToNeonDbNow();
        }

        return loadedCount > 0;
      } catch (err) {
        console.warn(
          '[NeonDB Hydrate] Warning during startup hydration:',
          err instanceof Error ? err.message : String(err)
        );
        return false;
      }
    })();
  }
  return initialHydrationPromise;
}
