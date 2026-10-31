/**
 * 5TOT Đại học Đà Nẵng — Student-Facing Individual Application Routes
 *
 * Handles student application initialization, profile/declaration updates,
 * submission to School Preliminary Review, and supplement responses.
 */

import { type Router, type Request, type Response } from 'express';
import type { IIdentityRepository } from '../identity/identity.repository';
import {
  SCHOOL_UNIT_MAP,
  createDefaultCriteriaList,
  createDefaultCriteriaReviewList,
  portalState,
  savePortalStateToDisk,
  appendPortalAuditLog,
  resolveSessionActor,
  mergeStudentProfileObjects,
  resolveSavedStudentProfileFromPortalState,
  syncStudentProfileInPortalState,
} from './domainPortal.state';
import {
  collectCriterionDeclarations,
  resolveSchoolMappingForApp,
  isDraftStudentAppStatus,
  syncStaffRecordFromStudentApplication,
  collectAddedEvidenceForScope,
} from './domainPortal.individual.sync';
import { dbManager } from '../../shared/database/prismaClient';

import type { IEmailService } from '../../shared/email/email.types';
import { getEmailService } from '../../shared/email';
import { logger } from '../../shared/logging/logger';

export interface IndividualStudentRouteDeps {
  identityRepo: IIdentityRepository;
  emailService?: IEmailService;
}

export function registerIndividualStudentPortalRoutes(
  router: Router,
  deps: IndividualStudentRouteDeps
): void {
  router.get('/individual/applications/:id/student-view', async (req: Request, res: Response): Promise<void> => {
    const app = portalState.studentApplications[req.params.id];
    if (!app) {
      res.status(404).json({
        success: false,
        errorCode: 'APPLICATION_NOT_FOUND',
        error: `Không tìm thấy hồ sơ ${req.params.id}`,
      });
      return;
    }

    const studentCode = String(
      app.student?.studentId || app.student?.studentCode || req.params.id.replace(/^APP-\d{4}-DN-/, '')
    ).trim();
    const email = String(app.student?.email || app.applicantProfileSnapshot?.email || '').trim();
    const portalSaved = resolveSavedStudentProfileFromPortalState({ studentCode, email });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let dbProfile: Record<string, any> | null = null;
    if (!portalSaved && !app.applicantProfileSnapshot?.fullName) {
      try {
        const dbUser =
          (studentCode ? await deps.identityRepo.findByStudentCode(studentCode).catch(() => null) : null) ||
          (email ? await deps.identityRepo.findByEmail(email).catch(() => null) : null);
        if (dbUser) {
          dbProfile = await deps.identityRepo.getProfile(dbUser.id).catch(() => null);
        }
      } catch {
        // Offline or test mode
      }
    }

    if (portalSaved || dbProfile) {
      const mergedProfile = mergeStudentProfileObjects(
        mergeStudentProfileObjects(app.applicantProfileSnapshot, portalSaved),
        dbProfile
      );
      app.applicantProfileSnapshot = mergedProfile;
      if (app.student) {
        if (mergedProfile.fullName) app.student.fullName = mergedProfile.fullName;
        if (mergedProfile.className) app.student.class = mergedProfile.className;
        if (mergedProfile.institutionName) app.student.university = mergedProfile.institutionName;
        if (mergedProfile.email) app.student.email = mergedProfile.email;
      }
      if (mergedProfile.institutionName) {
        app.trainingInstitutionName = mergedProfile.institutionName;
      }
    }

    // Authoritative hydration of supplementRequests from Neon DB
    try {
      const prisma = await dbManager.getClient();
      if (prisma) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dbSups = await (prisma as any).supplementRequest.findMany({
          where: {
            OR: [
              { individualApplicationId: req.params.id },
              { individualApplication: { id: req.params.id } },
              { individualApplication: { applicationCode: req.params.id } },
            ],
          },
          include: { responses: true },
          orderBy: { requestedAt: 'desc' },
        });

        if (Array.isArray(dbSups) && dbSups.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const activeSups = dbSups.filter((s: any) => s.status === 'OPEN');
          if (activeSups.length > 0) {
            app.status = 'supplement_required';
            app.schoolPreliminaryStatus = 'SCHOOL_SUPPLEMENT_REQUESTED';
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          app.supplementRequests = dbSups.map((s: any) => {
            const normCode = (s.criterionOrReqCode || '').toLowerCase();
            let cId = 'ethics';
            let cNum = 1;
            let cName = 'Đạo đức tốt';
            if (normCode.includes('academic') || normCode.startsWith('tc2') || normCode.includes('tc02')) {
              cId = 'academic'; cNum = 2; cName = 'Học tập tốt';
            } else if (normCode.includes('physical') || normCode.startsWith('tc3') || normCode.includes('tc03')) {
              cId = 'physical'; cNum = 3; cName = 'Thể lực tốt';
            } else if (normCode.includes('volunteer') || normCode.startsWith('tc4') || normCode.includes('tc04')) {
              cId = 'volunteer'; cNum = 4; cName = 'Tình nguyện tốt';
            } else if (normCode.includes('integration') || normCode.startsWith('tc5') || normCode.includes('tc05')) {
              cId = 'integration'; cNum = 5; cName = 'Hội nhập tốt';
            }
            let cleanDeclId = s.targetDeclarationId || undefined;
            if (cleanDeclId && cleanDeclId.includes('__')) {
              cleanDeclId = cleanDeclId.split('__').slice(1).join('__');
            }

            let reqId = s.criterionOrReqCode;
            let reqTitle = cName;
            if (cleanDeclId && Array.isArray(app.criteria)) {
              for (const c of app.criteria) {
                const reqs = Array.isArray(c.groups) && c.groups.length > 0 ? c.groups.flatMap((g: any) => g.requirements || []) : c.requirements || [];
                for (const r of reqs) {
                  if (r.declarations?.some((d: any) => d.id === cleanDeclId || d.id === s.targetDeclarationId)) {
                    reqId = r.id;
                    reqTitle = r.title || cName;
                    break;
                  }
                }
              }
            }

            const rawReqAction = s.requiredAction || '';
            const rawActions = [rawReqAction, ...(Array.isArray((s as any).allowedActions) ? (s as any).allowedActions : [])].filter(Boolean);
            const normAllowedActions = Array.from(new Set(rawActions.flatMap((a: string) => {
              const lower = a.toLowerCase();
              const acts: string[] = [a];
              if (lower.includes('minh chứng') || lower === 'addevidence') acts.push('addEvidence', 'replaceEvidence', 'confirmEvidence');
              if (lower.includes('kê khai') || lower.includes('chỉnh sửa') || lower === 'editdeclaration') acts.push('editDeclaration');
              if (lower.includes('thêm') || lower === 'adddeclaration') acts.push('addDeclaration');
              return acts;
            })));
            if (normAllowedActions.length === 0) {
              normAllowedActions.push('addEvidence', 'editDeclaration');
            }

            const isReqActive = s.status === 'OPEN';
            const isResubmitted = s.status === 'RESUBMITTED';
            const reqStatus = isReqActive ? 'active' : 'completed';
            const staffStatus = isReqActive ? 'waiting_student' : isResubmitted ? 'student_returned' : 'closed';

            return {
              id: s.id,
              criterionId: cId,
              criterionName: cName,
              criterionNumber: cNum,
              requirementId: reqId,
              requirementTitle: reqTitle,
              declarationId: cleanDeclId,
              declarationTitle: s.declarationTitle || undefined,
              scopeLevel: cleanDeclId ? 'declaration' : 'criterion',
              message: s.requestReason,
              requestedAt: s.requestedAt ? new Date(s.requestedAt).toLocaleDateString('vi-VN') : '',
              deadline: s.deadlineAt ? new Date(s.deadlineAt).toLocaleDateString('vi-VN') : '',
              allowedActions: normAllowedActions,
              status: reqStatus,
              staffStatus,
              responses: s.responses || [],
            };
          });
        }
      }
    } catch {
      // Ignore if offline
    }

    res.status(200).json({ success: true, data: app });
  });

  router.put('/individual/applications/:id/student-view', async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const incoming = (req.body?.application || req.body || {}) as Record<string, any>;
    const isUserMutation = Boolean(req.body?.isUserMutation);
    if (!incoming || typeof incoming !== 'object') {
      res.status(400).json({
        success: false,
        errorCode: 'INVALID_APPLICATION_PAYLOAD',
        error: 'Dữ liệu hồ sơ sinh viên không hợp lệ.',
      });
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const countCriteriaDecls = (criteriaList?: Record<string, any>[], otherList?: Record<string, any>[]) =>
      (Array.isArray(criteriaList) ? criteriaList : []).reduce((sum, c) => {
        const reqs =
          Array.isArray(c.groups) && c.groups.length > 0
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ? c.groups.flatMap((g: Record<string, any>) => g.requirements || [])
            : Array.isArray(c.requirements)
            ? c.requirements
            : [];
        return (
          sum +
          reqs.reduce(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (rSum: number, r: Record<string, any>) =>
              rSum + (Array.isArray(r.declarations) ? r.declarations.length : 0),
            0
          )
        );
      }, 0) + (Array.isArray(otherList) ? otherList.length : 0);

    const existing = portalState.studentApplications[id] || {};
    const existingDecls = countCriteriaDecls(existing.criteria, existing.otherAchievements);
    const incomingDecls = countCriteriaDecls(incoming.criteria, incoming.otherAchievements);

    const shouldPreserveExistingCriteria =
      !isUserMutation && existingDecls > 0 && incomingDecls === 0;
    const existingIsSubmitted =
      Boolean(existing.status) &&
      !isDraftStudentAppStatus(existing.status, existing.schoolPreliminaryStatus);
    const incomingIsDraft = isDraftStudentAppStatus(
      incoming.status,
      incoming.schoolPreliminaryStatus
    );
    const shouldPreserveSubmittedStatus = existingIsSubmitted && incomingIsDraft;

    const studentCode = String(
      incoming.student?.studentId ||
        existing.student?.studentId ||
        id.replace(/^APP-\d{4}-DN-/, '')
    ).trim();
    const studentEmail = String(
      incoming.student?.email ||
        incoming.applicantProfileSnapshot?.email ||
        existing.student?.email ||
        existing.applicantProfileSnapshot?.email ||
        ''
    ).trim();

    const portalSaved = resolveSavedStudentProfileFromPortalState({
      studentCode,
      email: studentEmail,
    });
    const mergedSnapshot = mergeStudentProfileObjects(
      mergeStudentProfileObjects(portalSaved, existing.applicantProfileSnapshot),
      incoming.applicantProfileSnapshot
    );

    const resolvedStatus = shouldPreserveSubmittedStatus
      ? existing.status
      : incomingIsDraft && !existingIsSubmitted
      ? 'draft'
      : incoming.status || existing.status || 'draft';

    const resolvedSchoolPrelim = shouldPreserveSubmittedStatus
      ? existing.schoolPreliminaryStatus
      : isDraftStudentAppStatus(resolvedStatus, incoming.schoolPreliminaryStatus)
      ? 'school_not_submitted'
      : incoming.schoolPreliminaryStatus || existing.schoolPreliminaryStatus || 'school_not_submitted';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const merged: Record<string, any> = {
      ...existing,
      ...incoming,
      applicationId: id,
      applicantProfileSnapshot: mergedSnapshot,
      student: {
        ...(existing.student || {}),
        ...(incoming.student || {}),
        fullName:
          mergedSnapshot.fullName ||
          incoming.student?.fullName ||
          existing.student?.fullName,
        class:
          mergedSnapshot.className ||
          incoming.student?.class ||
          existing.student?.class ||
          '',
        university:
          mergedSnapshot.institutionName ||
          incoming.student?.university ||
          existing.student?.university,
        email:
          mergedSnapshot.email ||
          incoming.student?.email ||
          existing.student?.email,
      },
      criteria: shouldPreserveExistingCriteria
        ? existing.criteria
        : incoming.criteria ?? existing.criteria,
      otherAchievements: shouldPreserveExistingCriteria
        ? existing.otherAchievements
        : incoming.otherAchievements ?? existing.otherAchievements ?? [],
      status: resolvedStatus,
      reviewStage: shouldPreserveSubmittedStatus
        ? existing.reviewStage
        : incoming.reviewStage || existing.reviewStage || 'SCHOOL',
      schoolPreliminaryStatus: resolvedSchoolPrelim,
      schoolRecommendation: shouldPreserveSubmittedStatus
        ? existing.schoolRecommendation
        : incoming.schoolRecommendation || existing.schoolRecommendation,
      supplementRequests:
        Array.isArray(incoming.supplementRequests) && incoming.supplementRequests.length > 0
          ? incoming.supplementRequests
          : existing.supplementRequests || [],
      councilFeedback: incoming.councilFeedback ?? existing.councilFeedback,
      decisionCode: incoming.decisionCode ?? existing.decisionCode,
      awardedAt: incoming.awardedAt ?? existing.awardedAt,
    };
    const mapped = resolveSchoolMappingForApp(merged);
    if (!merged.schoolReviewUnitId) merged.schoolReviewUnitId = mapped.unitId;
    if (!merged.schoolReviewUnitName) merged.schoolReviewUnitName = mapped.unitName;
    if (!merged.trainingInstitutionName) merged.trainingInstitutionName = mapped.instName;

    portalState.studentApplications[id] = merged;
    syncStudentProfileInPortalState(
      mergedSnapshot,
      {
        studentCode,
        email: studentEmail,
      },
      { skipSaveIfUnchanged: true }
    );
    syncStaffRecordFromStudentApplication(merged, {
      createIfMissing: !isDraftStudentAppStatus(merged.status, merged.schoolPreliminaryStatus),
    });
    savePortalStateToDisk();

    res.status(200).json({ success: true, data: merged });
  });

  router.post('/individual/applications', async (req: Request, res: Response): Promise<void> => {
    const {
      studentFullName,
      studentCode,
      email,
      institutionId,
      institutionName,
      faculty,
      className,
      gender,
      dateOfBirth,
      ethnicity,
      academicYearNumber,
      educationLevel,
      homeProvince,
      unionPosition,
      politicalStatus,
      phoneNumber,
      applicantProfileSnapshot,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } = (req.body || {}) as Record<string, any>;

    if (!studentFullName || !studentCode || !institutionId) {
      res.status(400).json({
        success: false,
        errorCode: 'MISSING_REQUIRED_FIELDS',
        error: 'Thiếu thông tin bắt buộc của sinh viên hoặc đơn vị đào tạo.',
      });
      return;
    }

    const mapped = SCHOOL_UNIT_MAP[institutionId] || {
      unitId: 'unit-dut',
      unitName: 'Trường Đại học Bách khoa – ĐHĐN',
      instName: institutionName || 'Trường Đại học Bách khoa – ĐHĐN',
    };

    const appId = `APP-2026-DN-${studentCode}`;
    const existingApp = portalState.studentApplications[appId];
    const portalSaved = resolveSavedStudentProfileFromPortalState({
      studentCode: String(studentCode),
      email: email ? String(email) : undefined,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let dbProfile: Record<string, any> | null = null;
    try {
      const dbUser =
        (await deps.identityRepo.findByStudentCode(String(studentCode)).catch(() => null)) ||
        (email ? await deps.identityRepo.findByEmail(String(email)).catch(() => null) : null);
      if (dbUser) {
        dbProfile = await deps.identityRepo.getProfile(dbUser.id).catch(() => null);
      }
    } catch {
      // Offline or test mode
    }

    const explicitFieldsSnapshot = {
      fullName: studentFullName,
      gender: gender || '',
      dateOfBirth: dateOfBirth || '',
      ethnicity: ethnicity || '',
      academicYearNumber: Number(academicYearNumber) || 0,
      educationLevel: educationLevel || '',
      className: className || '',
      homeProvince: homeProvince || '',
      institutionId,
      institutionName: institutionName || mapped.instName,
      unionPosition: unionPosition || '',
      politicalStatus: politicalStatus || '',
      phoneNumber: phoneNumber || '',
      email: email || `${studentCode}@sv.udn.vn`,
    };

    const resolvedSnapshot = mergeStudentProfileObjects(
      mergeStudentProfileObjects(
        mergeStudentProfileObjects(existingApp?.applicantProfileSnapshot, portalSaved),
        dbProfile
      ),
      mergeStudentProfileObjects(explicitFieldsSnapshot, applicantProfileSnapshot)
    );

    const isExistingDraft = isDraftStudentAppStatus(
      existingApp?.status,
      existingApp?.schoolPreliminaryStatus
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const created: Record<string, any> = {
      applicationId: appId,
      season: 'Năm học 2025–2026',
      level: 'Cấp Đại học Đà Nẵng',
      status: isExistingDraft ? 'draft' : existingApp?.status || 'draft',
      reviewStage: existingApp?.reviewStage || 'SCHOOL',
      trainingInstitutionName: resolvedSnapshot.institutionName || institutionName || mapped.instName,
      schoolReviewUnitId: mapped.unitId,
      schoolReviewUnitName: mapped.unitName,
      schoolPreliminaryStatus: isExistingDraft
        ? 'school_not_submitted'
        : existingApp?.schoolPreliminaryStatus || 'school_not_submitted',
      applicantProfileSnapshot: resolvedSnapshot,
      student: {
        fullName: resolvedSnapshot.fullName || studentFullName,
        studentId: studentCode,
        university: resolvedSnapshot.institutionName || institutionName || mapped.instName,
        faculty: faculty || existingApp?.student?.faculty || 'Khoa Đào tạo',
        class: resolvedSnapshot.className || className || existingApp?.student?.class || '',
        email: resolvedSnapshot.email || email || `${studentCode}@sv.udn.vn`,
        academicYear: 'Năm học 2025–2026',
      },
      criteria:
        Array.isArray(existingApp?.criteria) && existingApp.criteria.length > 0
          ? existingApp.criteria
          : createDefaultCriteriaList(),
      otherAchievements: Array.isArray(existingApp?.otherAchievements)
        ? existingApp.otherAchievements
        : [],
      supplementRequests: existingApp?.supplementRequests || [],
    };

    portalState.studentApplications[appId] = created;
    syncStudentProfileInPortalState(resolvedSnapshot, {
      studentCode: String(studentCode),
      email: created.student.email,
    });
    syncStaffRecordFromStudentApplication(created, {
      createIfMissing: !isDraftStudentAppStatus(created.status, created.schoolPreliminaryStatus),
    });
    savePortalStateToDisk();

    appendPortalAuditLog({
      track: 'INDIVIDUAL',
      applicationId: appId,
      action: 'CREATE_INDIVIDUAL_APPLICATION',
      actorId: studentCode,
      actorName: studentFullName,
      actorRole: 'STUDENT',
      details: `Khởi tạo hồ sơ cá nhân và định tuyến về ${mapped.unitName}`,
    });

    res.status(201).json({ success: true, data: created });
  });

  router.put('/individual/applications/:id/declarations', (req: Request, res: Response): void => {
    const { id } = req.params;
    const { criterionId, requirementId, declaration } = (req.body || {}) as {
      criterionId?: string;
      requirementId?: string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      declaration?: Record<string, any>;
    };

    if (!criterionId || !requirementId || !declaration) {
      res.status(400).json({
        success: false,
        errorCode: 'INVALID_DECLARATION_PAYLOAD',
        error: 'Thiếu criterionId, requirementId hoặc nội dung kê khai.',
      });
      return;
    }

    const actor = resolveSessionActor(req);
    const inferredStudentCode = id.replace(/^APP-\d{4}-DN-/, '');
    const savedProfile = resolveSavedStudentProfileFromPortalState({
      userId: actor.authenticated ? actor.id : undefined,
      studentCode: inferredStudentCode,
      email: actor.email || undefined,
    });
    const app =
      portalState.studentApplications[id] || {
        applicationId: id,
        season: 'Năm học 2025–2026',
        level: 'Cấp Đại học Đà Nẵng',
        status: 'draft',
        reviewStage: 'SCHOOL',
        applicantProfileSnapshot: savedProfile || undefined,
        student: {
          fullName: savedProfile?.fullName || actor.name || 'Sinh viên ĐHĐN',
          studentId: inferredStudentCode,
          university:
            savedProfile?.institutionName || 'Trường Đại học Bách khoa – ĐHĐN',
          class: savedProfile?.className || '',
          email: savedProfile?.email || actor.email || `${inferredStudentCode}@sv.udn.vn`,
          academicYear: 'Năm học 2025–2026',
        },
        criteria: createDefaultCriteriaList(),
        otherAchievements: [],
        supplementRequests: [],
      };
    app.applicationId = id;
    if (!Array.isArray(app.criteria) || app.criteria.length === 0) {
      app.criteria = createDefaultCriteriaList();
    }

    const rawEvFiles = Array.isArray(declaration.evidenceFiles)
      ? declaration.evidenceFiles
      : [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const normalizedEvFiles = rawEvFiles.map((ev: Record<string, any>) => ({
      ...ev,
      id: ev.id || `ev-${requirementId}-${Date.now()}`,
      name: ev.name || ev.fileName || 'Minh_chung.pdf',
      fileName: ev.fileName || ev.name || 'Minh_chung.pdf',
      fileType: ev.fileType || 'pdf',
      size: ev.size || ev.fileSize || '240 KB',
      fileSize: ev.fileSize || ev.size || '240 KB',
      uploadedAt: ev.uploadedAt || '10/10/2026',
      status: ev.status || 'completed',
    }));
    const normalizedDecl = {
      ...declaration,
      id: declaration.id || `decl-${requirementId}-${Date.now()}`,
      title: declaration.title || declaration.value || 'Nội dung kê khai',
      value: declaration.value || declaration.title || 'Nội dung kê khai',
      description: declaration.description || declaration.detail || '',
      detail: declaration.detail || declaration.description || '',
      date: declaration.date || '10/10/2026',
      authority: declaration.authority || '',
      status: 'completed',
      evidenceFiles: normalizedEvFiles,
      metadata: declaration.metadata ? { ...declaration.metadata } : undefined,
    };

    if (criterionId === 'other_achievements' || requirementId === 'other-achievements-general') {
      if (!Array.isArray(app.otherAchievements)) {
        app.otherAchievements = [];
      }
      const existingOtherIdx = app.otherAchievements.findIndex(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (d: Record<string, any>) => d.id === normalizedDecl.id
      );
      if (existingOtherIdx >= 0) {
        app.otherAchievements[existingOtherIdx] = normalizedDecl;
      } else {
        app.otherAchievements.push(normalizedDecl);
      }
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const crit = app.criteria.find((c: Record<string, any>) => c.id === criterionId);
      if (crit) {
        if (!Array.isArray(crit.requirements)) {
          crit.requirements = [];
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const upsertIntoReqList = (reqList: Record<string, any>[], addIfMissing: boolean) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let reqObj = reqList.find((r: Record<string, any>) => r.id === requirementId);
          if (!reqObj && addIfMissing) {
            reqObj = {
              id: requirementId,
              criterionId,
              status: 'completed',
              declarations: [],
            };
            reqList.push(reqObj);
          }
          if (reqObj) {
            if (!Array.isArray(reqObj.declarations)) {
              reqObj.declarations = [];
            }
            const existingDeclIdx = reqObj.declarations.findIndex(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (d: Record<string, any>) => d.id === normalizedDecl.id
            );
            if (existingDeclIdx >= 0) {
              reqObj.declarations[existingDeclIdx] = normalizedDecl;
            } else {
              reqObj.declarations.push(normalizedDecl);
            }
            reqObj.status = 'completed';
            reqObj.isOptionalEmpty = false;
          }
        };

        upsertIntoReqList(crit.requirements, true);
        if (Array.isArray(crit.groups)) {
          for (const group of crit.groups) {
            if (Array.isArray(group?.requirements)) {
              upsertIntoReqList(group.requirements, false);
            }
          }
        }

        const allDecls = collectCriterionDeclarations(crit);
        const totalCritEvidence = allDecls.reduce(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (sum: number, d: Record<string, any>) => sum + (d.evidenceFiles?.length || 0),
          0
        );
        crit.statusLabel = 'Đã kê khai';
        crit.shortSummary =
          criterionId === 'physical'
            ? `${allDecls.length}/2 hình thức đã kê khai · ${totalCritEvidence} minh chứng`
            : `${allDecls.length} nội dung đã kê khai · ${totalCritEvidence} minh chứng`;
      }
    }

    portalState.studentApplications[id] = app;
    syncStaffRecordFromStudentApplication(app, { createIfMissing: false });
    savePortalStateToDisk();

    appendPortalAuditLog({
      track: 'INDIVIDUAL',
      applicationId: id,
      action: 'SAVE_INDIVIDUAL_DECLARATION',
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      details: `Lưu kê khai tiêu chí ${criterionId} (${requirementId}): ${declaration.title || ''}`,
    });

    res.status(200).json({ success: true, data: app });
  });

  router.delete('/individual/applications/:id/declarations/:declarationId', (req: Request, res: Response): void => {
    const { id, declarationId } = req.params;
    const { requirementId } = (req.body || {}) as { requirementId?: string };

    const app = portalState.studentApplications[id];
    if (!app) {
      res.status(404).json({
        success: false,
        errorCode: 'APPLICATION_NOT_FOUND',
        error: `Không tìm thấy hồ sơ ${id}`,
      });
      return;
    }

    if (Array.isArray(app.otherAchievements)) {
      app.otherAchievements = app.otherAchievements.filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (d: Record<string, any>) => d.id !== declarationId
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const removeFromReqList = (reqList: Record<string, any>[]) => {
      for (const reqObj of reqList) {
        if (!requirementId || reqObj.id === requirementId) {
          if (Array.isArray(reqObj.declarations)) {
            reqObj.declarations = reqObj.declarations.filter(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (d: Record<string, any>) => d.id !== declarationId
            );
            if (reqObj.declarations.length === 0) {
              reqObj.status = 'undeclared';
              reqObj.isOptionalEmpty = true;
            }
          }
        }
      }
    };

    if (Array.isArray(app.criteria)) {
      for (const crit of app.criteria) {
        if (Array.isArray(crit.requirements)) {
          removeFromReqList(crit.requirements);
        }
        if (Array.isArray(crit.groups)) {
          for (const group of crit.groups) {
            if (Array.isArray(group?.requirements)) {
              removeFromReqList(group.requirements);
            }
          }
        }
        const allDecls = collectCriterionDeclarations(crit);
        const totalCritEvidence = allDecls.reduce(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (sum: number, d: Record<string, any>) => sum + (d.evidenceFiles?.length || 0),
          0
        );
        crit.statusLabel = allDecls.length > 0 ? 'Đã kê khai' : 'Chưa kê khai';
        crit.shortSummary =
          crit.id === 'physical'
            ? `${allDecls.length}/2 hình thức đã kê khai · ${totalCritEvidence} minh chứng`
            : `${allDecls.length} nội dung đã kê khai · ${totalCritEvidence} minh chứng`;
      }
    }

    syncStaffRecordFromStudentApplication(app, { createIfMissing: false });
    savePortalStateToDisk();

    const actor = resolveSessionActor(req);
    appendPortalAuditLog({
      track: 'INDIVIDUAL',
      applicationId: id,
      action: 'DELETE_INDIVIDUAL_DECLARATION',
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      details: `Xóa kê khai ${declarationId} (${requirementId || 'all'})`,
    });

    res.status(200).json({ success: true, data: app });
  });

  router.post('/individual/applications/:id/submit', async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const incomingApp = (req.body?.application || undefined) as Record<string, any> | undefined;
    const baseApp =
      portalState.studentApplications[id] ||
      incomingApp || {
        applicationId: id,
        status: 'under_review',
        reviewStage: 'SCHOOL',
        criteria: createDefaultCriteriaList(),
        otherAchievements: [],
        supplementRequests: [],
      };
    const preservedOtherAchievements =
      Array.isArray(incomingApp?.otherAchievements) && incomingApp.otherAchievements.length > 0
        ? incomingApp.otherAchievements
        : Array.isArray(baseApp.otherAchievements)
        ? baseApp.otherAchievements
        : [];
    const baseTotalCritDecls = Array.isArray(baseApp.criteria)
      ? baseApp.criteria.reduce(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (sum: number, c: Record<string, any>) => sum + collectCriterionDeclarations(c).length,
          0
        )
      : 0;
    const incomingTotalCritDecls = Array.isArray(incomingApp?.criteria)
      ? incomingApp.criteria.reduce(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (sum: number, c: Record<string, any>) => sum + collectCriterionDeclarations(c).length,
          0
        )
      : 0;
    const preservedCriteria =
      incomingTotalCritDecls === 0 && baseTotalCritDecls > 0
        ? baseApp.criteria
        : incomingApp?.criteria || baseApp.criteria;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const app: Record<string, any> = incomingApp
      ? {
          ...baseApp,
          ...incomingApp,
          criteria: preservedCriteria,
          otherAchievements: preservedOtherAchievements,
          applicationId: id,
        }
      : {
          ...baseApp,
          otherAchievements: preservedOtherAchievements,
          applicationId: id,
        };

    const actor = resolveSessionActor(req);
    const studentCode = String(
      app.student?.studentId || app.student?.studentCode || id.replace(/^APP-\d{4}-DN-/, '')
    ).trim();
    const studentEmail = String(
      app.student?.email || app.applicantProfileSnapshot?.email || actor.email || ''
    ).trim();

    const portalSaved = resolveSavedStudentProfileFromPortalState({
      userId: actor.authenticated ? actor.id : undefined,
      studentCode,
      email: studentEmail,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let dbProfile: Record<string, any> | null = null;
    try {
      const dbUser =
        (actor.authenticated ? await deps.identityRepo.findById(actor.id).catch(() => null) : null) ||
        (studentCode ? await deps.identityRepo.findByStudentCode(studentCode).catch(() => null) : null) ||
        (studentEmail ? await deps.identityRepo.findByEmail(studentEmail).catch(() => null) : null);
      if (dbUser) {
        dbProfile = await deps.identityRepo.getProfile(dbUser.id).catch(() => null);
      }
    } catch {
      // Offline or test mode
    }

    if (portalSaved || dbProfile || app.applicantProfileSnapshot) {
      app.applicantProfileSnapshot = mergeStudentProfileObjects(
        mergeStudentProfileObjects(portalSaved, dbProfile),
        app.applicantProfileSnapshot
      );
      if (app.student) {
        if (app.applicantProfileSnapshot.fullName) {
          app.student.fullName = app.applicantProfileSnapshot.fullName;
        }
        if (app.applicantProfileSnapshot.className) {
          app.student.class = app.applicantProfileSnapshot.className;
        }
        if (app.applicantProfileSnapshot.institutionName) {
          app.student.university = app.applicantProfileSnapshot.institutionName;
        }
        if (app.applicantProfileSnapshot.email) {
          app.student.email = app.applicantProfileSnapshot.email;
        }
      }
    }

    const mapped = resolveSchoolMappingForApp(app);
    app.applicationId = id;
    app.status = 'under_review';
    app.reviewStage = 'SCHOOL';
    app.schoolPreliminaryStatus = 'pending_intake';
    app.schoolReviewUnitId = app.schoolReviewUnitId || mapped.unitId;
    app.schoolReviewUnitName = app.schoolReviewUnitName || mapped.unitName;
    app.trainingInstitutionName = app.trainingInstitutionName || mapped.instName;
    app.submittedAt = app.submittedAt || new Date().toLocaleDateString('vi-VN');
    portalState.studentApplications[id] = app;

    syncStaffRecordFromStudentApplication(app, {
      createIfMissing: true,
      markSubmitted: true,
    });
    savePortalStateToDisk();

    appendPortalAuditLog({
      track: 'INDIVIDUAL',
      applicationId: id,
      action: 'SUBMIT_TO_SCHOOL_REVIEW',
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      details: `Sinh viên nộp hồ sơ về Đơn vị xét sơ tuyển (${app.schoolReviewUnitName || 'Trường Đại học Bách khoa – ĐHĐN'})`,
    });
    const emailSvc = deps.emailService || getEmailService();
    const finalStudentEmail = String(
      app.student?.email || app.applicantProfileSnapshot?.email || actor.email || ''
    ).trim();
    const studentFullName = String(
      app.student?.fullName || app.applicantProfileSnapshot?.fullName || actor.name || 'Sinh viên'
    ).trim();

    if (emailSvc && typeof emailSvc.sendSubmissionConfirmationEmail === 'function' && finalStudentEmail && finalStudentEmail.includes('@')) {
      emailSvc
        .sendSubmissionConfirmationEmail({
          to: finalStudentEmail,
          studentName: studentFullName,
          applicationCode: app.applicationCode || id,
          awardTitle: app.awardTitle || app.title || 'danh hiệu Sinh viên 5 tốt Đại học Đà Nẵng',
          seasonName: app.seasonName || app.season || 'Năm học 2025 - 2026',
          institutionName: app.trainingInstitutionName || app.student?.university || mapped.instName || 'Đại học Đà Nẵng',
          schoolReviewUnitName: app.schoolReviewUnitName || mapped.unitName || 'Đơn vị xét sơ tuyển cấp Trường',
          submittedAt: new Date(),
          statusName: 'Chờ xét sơ tuyển',
        })
        .catch((err: unknown) => {
          logger.error(
            `[DomainPortal:SUBMIT] Failed to dispatch submission confirmation email: ${
              err instanceof Error ? err.message : String(err)
            }`
          );
        });
    }


    res.status(200).json({
      success: true,
      message: 'Đã nộp hồ sơ về Đơn vị xét sơ tuyển thành công.',
      schoolReviewUnitId: app.schoolReviewUnitId || 'unit-dut',
      schoolReviewUnitName: app.schoolReviewUnitName || 'Trường Đại học Bách khoa – ĐHĐN',
      data: app,
    });
  });

  router.post('/individual/applications/:id/supplement', (req: Request, res: Response): void => {
    const { id } = req.params;
    const {
      requestId,
      explanation: rawExplanation,
      note,
      updatedApplication: rawUpdatedApp,
      application,
      isFullyCompleted: rawIsFullyCompleted,
    } = (req.body || {}) as {
      isFullyCompleted?: boolean;
      requestId?: string;
      explanation?: string;
      note?: string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      updatedApplication?: Record<string, any>;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      application?: Record<string, any>;
    };
    const explanation = (rawExplanation || note || '').trim();
    const updatedApplication = rawUpdatedApp || application;
    const nowStr = new Date().toLocaleDateString('vi-VN');

    if (updatedApplication && typeof updatedApplication === 'object') {
      const existingStuApp = portalState.studentApplications[id] || {};
      const nextOtherAchievements =
        Array.isArray(updatedApplication.otherAchievements) &&
        updatedApplication.otherAchievements.length > 0
          ? updatedApplication.otherAchievements
          : Array.isArray(existingStuApp.otherAchievements)
          ? existingStuApp.otherAchievements
          : [];
      const incomingSupps = Array.isArray(updatedApplication.supplementRequests)
        ? updatedApplication.supplementRequests
        : Array.isArray(existingStuApp.supplementRequests)
        ? existingStuApp.supplementRequests
        : [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const normalizedStuSupps = incomingSupps.map((s: Record<string, any>) => {
        const matchesTarget = requestId ? s.id === requestId : rawIsFullyCompleted === true;
        if (matchesTarget && (s.status === 'active' || s.status === 'open')) {
          return {
            ...s,
            status: 'completed',
            respondedAt: nowStr,
            studentExplanation: explanation || s.studentExplanation,
          };
        }
        return s;
      });
      const remainingActiveStuSupps = normalizedStuSupps.filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (s: Record<string, any>) => s.status === 'active'
      );
      portalState.studentApplications[id] = {
        ...existingStuApp,
        ...updatedApplication,
        otherAchievements: nextOtherAchievements,
        supplementRequests: normalizedStuSupps,
        applicationId: id,
        status: remainingActiveStuSupps.length > 0 ? 'supplement_required' : 'supplement_sent',
      };
      syncStaffRecordFromStudentApplication(portalState.studentApplications[id], {
        createIfMissing: true,
      });
    } else if (portalState.studentApplications[id]) {
      if (Array.isArray(portalState.studentApplications[id].supplementRequests)) {
        portalState.studentApplications[id].supplementRequests =
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          portalState.studentApplications[id].supplementRequests.map((s: Record<string, any>) => {
            const matchesTarget = requestId ? s.id === requestId : rawIsFullyCompleted === true;
            if (matchesTarget && (s.status === 'active' || s.status === 'open')) {
              return {
                ...s,
                status: 'completed',
                respondedAt: nowStr,
                studentExplanation: explanation || s.studentExplanation,
              };
            }
            return s;
          });
      }
      const remainingActiveStuSupps = Array.isArray(
        portalState.studentApplications[id].supplementRequests
      )
        ? portalState.studentApplications[id].supplementRequests.filter(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (s: Record<string, any>) => s.status === 'active'
          )
        : [];
      portalState.studentApplications[id].status =
        remainingActiveStuSupps.length > 0 ? 'supplement_required' : 'supplement_sent';
    }

    const idx = portalState.individualStaffRecords.findIndex((r) => r.applicationId === id);
    if (idx === -1) {
      res.status(404).json({
        success: false,
        error: `Không tìm thấy hồ sơ cá nhân ${id}`,
      });
      return;
    }

    const current = portalState.individualStaffRecords[idx];
    const isSchoolStage = current.currentReviewStage === 'SCHOOL';
    const stuApp = portalState.studentApplications[id];

    const existingWs = current.workspaceState || {
      applicationId: id,
      reviewStage: isSchoolStage ? 'SCHOOL' : 'CITY',
      hasStartedReview: true,
      scopeRecords: {},
      evidenceRecords: {},
      criterionCompletedMap: {},
      criterionConclusions: {},
      supplementRequests: [],
      historyEvents: [],
    };

    const nextWsSupplementRequests = Array.isArray(existingWs.supplementRequests)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? existingWs.supplementRequests.map((sr: Record<string, any>) => {
          const matchesTarget = requestId ? sr.id === requestId : rawIsFullyCompleted === true;
          if (matchesTarget && (sr.status === 'active' || sr.staffStatus === 'waiting_student')) {
            return {
              ...sr,
              staffStatus: 'student_returned',
              studentReturnedAt: nowStr,
              studentRespondedAt: nowStr,
              studentExplanation: explanation || sr.studentExplanation,
            };
          }
          return sr;
        })
      : [];

    const returnedCriterionIds = new Set<string>(
      nextWsSupplementRequests
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((sr: Record<string, any>) => sr.staffStatus === 'student_returned')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((sr: Record<string, any>) => String(sr.criterionId || ''))
        .filter(Boolean)
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nextScopeRecords: Record<string, any> = {
      ...(existingWs.scopeRecords || {}),
    };
    for (const [scopeKey, rec] of Object.entries(nextScopeRecords)) {
      const matchingReturnedReq = nextWsSupplementRequests.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (sr: Record<string, any>) =>
          sr.staffStatus === 'student_returned' &&
          (sr.declarationId
            ? sr.declarationId === rec.declarationId
            : sr.requirementId === rec.requirementId)
      );
      if (rec.status === 'needs_supplement' || Boolean(matchingReturnedReq)) {
        const addedEv = collectAddedEvidenceForScope(
          stuApp,
          rec.criterionId,
          rec.requirementId,
          rec.declarationId
        );
        const effNote =
          explanation ||
          rec.supplementDiff?.explanationNote ||
          'Sinh viên đã bổ sung minh chứng hoàn tất.';
        nextScopeRecords[scopeKey] = {
          ...rec,
          status: 'supplement_returned',
          supplementDiff: {
            requestId:
              matchingReturnedReq?.id ||
              requestId ||
              rec.supplementDiff?.requestId ||
              'sup-req-1',
            returnedAt: nowStr,
            explanationNote: effNote,
            studentResponseNote: effNote,
            addedEvidenceNames:
              addedEv.names.length > 0
                ? addedEv.names
                : rec.supplementDiff?.addedEvidenceNames || [],
            addedEvidenceIds:
              addedEv.ids.length > 0
                ? addedEv.ids
                : rec.supplementDiff?.addedEvidenceIds || [],
            fieldChanges: rec.supplementDiff?.fieldChanges || [],
          },
        };
        if (rec.criterionId) {
          returnedCriterionIds.add(String(rec.criterionId));
        }
      }
    }

    for (const sr of nextWsSupplementRequests) {
      if (sr.staffStatus !== 'student_returned' || !sr.requirementId) continue;
      const canonicalKey = sr.declarationId
        ? `decl:${sr.declarationId}`
        : `req:${sr.requirementId}`;
      const hasExistingMatch = Object.values(nextScopeRecords).some(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (rec: Record<string, any>) =>
          sr.declarationId
            ? rec.declarationId === sr.declarationId
            : rec.requirementId === sr.requirementId
      );
      if (!hasExistingMatch && !nextScopeRecords[canonicalKey]) {
        const addedEv = collectAddedEvidenceForScope(
          stuApp,
          sr.criterionId,
          sr.requirementId,
          sr.declarationId
        );
        const effNote =
          explanation ||
          sr.studentExplanation ||
          'Sinh viên đã bổ sung minh chứng hoàn tất.';
        nextScopeRecords[canonicalKey] = {
          scopeKey: canonicalKey,
          applicationId: id,
          criterionId: sr.criterionId,
          requirementId: sr.requirementId,
          declarationId: sr.declarationId,
          reviewerId: sr.requestingOfficerId || 'staff',
          reviewerName: sr.requestingOfficerName || 'Cán bộ xét duyệt',
          status: 'supplement_returned',
          internalNote: '',
          reviewedAt: nowStr,
          supplementDiff: {
            requestId: sr.id || requestId || 'sup-req-1',
            returnedAt: nowStr,
            explanationNote: effNote,
            studentResponseNote: effNote,
            addedEvidenceNames: addedEv.names,
            addedEvidenceIds: addedEv.ids,
            fieldChanges: [],
          },
        };
      }
    }

    const nextHistoryEvents = [
      {
        id: `hist-supp-return-${Date.now()}`,
        timestamp: nowStr,
        actorName: current.fullName || stuApp?.student?.fullName || 'Sinh viên',
        actorRoleLabel: 'Sinh viên',
        description: explanation
          ? `Sinh viên đã gửi bổ sung minh chứng kèm giải trình: "${explanation}".`
          : 'Sinh viên đã gửi bổ sung minh chứng hoàn tất.',
        scopeBadge: 'Đã gửi bổ sung',
        tone: 'brand',
      },
      ...(Array.isArray(existingWs.historyEvents) ? existingWs.historyEvents : []),
    ];

    const nextWorkspaceState = {
      ...existingWs,
      scopeRecords: nextScopeRecords,
      supplementRequests: nextWsSupplementRequests,
      historyEvents: nextHistoryEvents,
    };

    const nextCriteriaReview = (
      current.criteriaReview || createDefaultCriteriaReviewList()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ).map((cr: Record<string, any>) => {
      const cid = cr.criterionId;
      const matchingCrit = (stuApp?.criteria || []).find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (c: Record<string, any>) => c.id === cid
      );
      const allDecls = matchingCrit ? collectCriterionDeclarations(matchingCrit) : null;
      const declaredCount =
        allDecls !== null ? allDecls.length : cr.declaredCount ?? 0;
      const evidenceCount =
        allDecls !== null
          ? allDecls.reduce(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (sum: number, d: Record<string, any>) => sum + (d.evidenceFiles?.length || 0),
              0
            )
          : cr.evidenceCount ?? 0;

      if (cr.status === 'needs_supplement' || returnedCriterionIds.has(cid)) {
        return {
          ...cr,
          declaredCount,
          evidenceCount,
          status: 'supplement_returned',
          noteSummary: explanation
            ? `Sinh viên đã bổ sung: ${explanation}`
            : 'Sinh viên đã gửi bổ sung · Chờ cán bộ xét lại',
        };
      }
      return {
        ...cr,
        declaredCount,
        evidenceCount,
      };
    });

    const otherAchievementsList = Array.isArray(stuApp?.otherAchievements)
      ? stuApp.otherAchievements
      : [];
    const otherAchievementsEvidenceCount = otherAchievementsList.reduce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (sum: number, d: Record<string, any>) => sum + (d.evidenceFiles?.length || 0),
      0
    );
    const recalculatedTotalDeclarations =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      nextCriteriaReview.reduce((sum: number, cr: Record<string, any>) => sum + (cr.declaredCount || 0), 0) +
      otherAchievementsList.length;
    const recalculatedTotalEvidence =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      nextCriteriaReview.reduce((sum: number, cr: Record<string, any>) => sum + (cr.evidenceCount || 0), 0) +
      otherAchievementsEvidenceCount;

    const latestReturnedReq =
      nextWsSupplementRequests.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (sr: Record<string, any>) => sr.staffStatus === 'student_returned'
      ) || current.supplementSummary?.latestRequest;

    const hasRemainingActive = (nextWsSupplementRequests || []).some(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (sr: Record<string, any>) => sr.status === 'active' || sr.staffStatus === 'waiting_student'
    );
    const isCompletedFinal =
      rawIsFullyCompleted !== undefined ? Boolean(rawIsFullyCompleted) : !hasRemainingActive;

    if (stuApp && isSchoolStage) {
      stuApp.schoolPreliminaryStatus = isCompletedFinal
        ? 'supplement_returned'
        : stuApp.schoolPreliminaryStatus || 'supplement_requested';
    }

    const updated = {
      ...current,
      workspaceState: nextWorkspaceState,
      workflowStatus: isCompletedFinal
        ? 'supplement_returned'
        : current.workflowStatus || 'supplement_requested',
      schoolPreliminaryStatus: isSchoolStage
        ? 'supplement_returned'
        : current.schoolPreliminaryStatus,
      schoolReviewSummary:
        isSchoolStage && current.schoolReviewSummary
          ? {
              ...current.schoolReviewSummary,
              status: 'supplement_returned',
            }
          : current.schoolReviewSummary,
      criteriaReview: nextCriteriaReview,
      totalDeclarations: recalculatedTotalDeclarations || current.totalDeclarations,
      totalEvidence: recalculatedTotalEvidence || current.totalEvidence,
      updatedAt: new Date().toISOString(),
      updatedSortKey: Date.now(),
      latestOperationalNote: explanation
        ? `Sinh viên giải trình: ${explanation}`
        : 'Sinh viên đã gửi bổ sung minh chứng.',
      supplementSummary: {
        ...(current.supplementSummary || {}),
        requestCount:
          nextWsSupplementRequests.length ||
          current.supplementSummary?.requestCount ||
          1,
        activeStatus: 'student_returned',
        returnedDaysAgo: 0,
        latestRequest: latestReturnedReq
          ? {
              ...latestReturnedReq,
              staffStatus: 'student_returned',
              returnedAt: nowStr,
              studentExplanation: explanation || latestReturnedReq.studentExplanation,
            }
          : undefined,
      },
      studentApplication: stuApp || current.studentApplication,
    };
    portalState.individualStaffRecords[idx] = updated;
    savePortalStateToDisk();

    const actor = resolveSessionActor(req);
    appendPortalAuditLog({
      track: 'INDIVIDUAL',
      applicationId: id,
      action: 'SUBMIT_INDIVIDUAL_SUPPLEMENT',
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      details: `Gửi phản hồi bổ sung hồ sơ cá nhân: ${explanation || 'Bổ sung minh chứng'}`,
    });

    // Persist SupplementResponse in Neon DB if available
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dbManager.getClient().then(async (prisma: any) => {
      if (!prisma) return;
      try {
        const targetDbReq = await prisma.supplementRequest.findFirst({
          where: {
            OR: [
              ...(requestId ? [{ id: requestId }] : []),
              {
                individualApplication: {
                  OR: [{ id }, { applicationCode: id }],
                },
                status: 'OPEN',
              },
            ],
          },
        });
        if (targetDbReq) {
          await prisma.supplementResponse.create({
            data: {
              supplementRequestId: targetDbReq.id,
              responderUserId: actor.id || 'student',
              responderNameSnapshot: actor.name || 'Sinh viên',
              explanationNote: explanation || 'Sinh viên đã bổ sung minh chứng',
              attachedEvidenceIds: [],
            },
          });
          await prisma.supplementRequest.update({
            where: { id: targetDbReq.id },
            data: { status: 'RESUBMITTED' },
          });
        }
        if (isCompletedFinal) {
          await prisma.supplementRequest.updateMany({
            where: {
              individualApplication: {
                OR: [{ id }, { applicationCode: id }],
              },
              status: 'OPEN',
            },
            data: { status: 'RESUBMITTED' },
          });
        }
      } catch (err) {
        console.warn('[DomainPortal] Warning persisting supplement response to DB:', err);
      }
    }).catch(() => {});

    res.status(200).json({ success: true, data: updated });
  });
}
