/**
 * 5TOT Đại học Đà Nẵng — Individual Application Domain Synchronization Service
 *
 * Single Source of Truth (SSOT) domain synchronization helpers between
 * student-facing Individual Applications (`portalState.studentApplications`)
 * and staff/officer/committee review records (`portalState.individualStaffRecords`).
 */

import {
  SCHOOL_UNIT_MAP,
  createDefaultCriteriaReviewList,
  portalState,
  savePortalStateToDisk,
  isTestRuntime,
  isLegacyMockOrTestAppId,
  isNonUdnInstitutionRecord,
  inferInstitutionIdFromName,
} from './domainPortal.state';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function collectCriterionDeclarations(crit: Record<string, any> | undefined): Record<string, any>[] {
  if (!crit) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const byId = new Map<string, Record<string, any>>();
  const pushDecls = (reqs: unknown) => {
    if (!Array.isArray(reqs)) return;
    for (const r of reqs) {
      if (r && Array.isArray(r.declarations)) {
        for (const d of r.declarations) {
          if (d && typeof d === 'object') {
            const key = d.id || `${r.id}-${byId.size}`;
            byId.set(key, d);
          }
        }
      }
    }
  };
  if (Array.isArray(crit.groups)) {
    for (const g of crit.groups) {
      pushDecls(g?.requirements);
    }
  }
  pushDecls(crit.requirements);
  return Array.from(byId.values());
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function resolveSchoolMappingForApp(app: Record<string, any>): {
  instId: string;
  unitId: string;
  unitName: string;
  instName: string;
} {
  const unitMatchInstId = Object.entries(SCHOOL_UNIT_MAP).find(
    ([, v]) => v.unitId === app.schoolReviewUnitId
  )?.[0];
  if (unitMatchInstId && unitMatchInstId !== 'inst-dut') {
    return { instId: unitMatchInstId, ...SCHOOL_UNIT_MAP[unitMatchInstId] };
  }

  const inferredFromAppNames =
    inferInstitutionIdFromName(app.student?.university) ||
    inferInstitutionIdFromName(app.trainingInstitutionName) ||
    inferInstitutionIdFromName(app.applicantProfileSnapshot?.institutionName) ||
    inferInstitutionIdFromName(app.schoolReviewUnitName);
  if (inferredFromAppNames && inferredFromAppNames !== 'inst-dut' && SCHOOL_UNIT_MAP[inferredFromAppNames]) {
    return { instId: inferredFromAppNames, ...SCHOOL_UNIT_MAP[inferredFromAppNames] };
  }

  const studentCode = String(
    app.student?.studentId ||
      app.student?.studentCode ||
      String(app.applicationId || '').replace(/^APP-\d{4}-DN-/, '')
  ).trim();
  const studentEmail = String(
    app.student?.email || app.applicantProfileSnapshot?.email || ''
  )
    .trim()
    .toLowerCase();
  const regStudent =
    (studentEmail ? portalState.registeredStudents.get(studentEmail) : undefined) ||
    Array.from(portalState.registeredStudents.values()).find(
      (st) =>
        (studentEmail && st.email.toLowerCase() === studentEmail) ||
        (studentCode && st.studentCode.toUpperCase() === studentCode.toUpperCase())
    );
  const regInstId =
    inferInstitutionIdFromName(regStudent?.institutionName || regStudent?.profile?.institutionName) ||
    regStudent?.institutionId ||
    regStudent?.profile?.institutionId;
  if (regInstId && regInstId !== 'inst-dut' && SCHOOL_UNIT_MAP[regInstId]) {
    return { instId: regInstId, ...SCHOOL_UNIT_MAP[regInstId] };
  }

  const rawInstId =
    app.applicantProfileSnapshot?.institutionId ||
    app.trainingInstitutionId ||
    app.institution?.id ||
    unitMatchInstId ||
    inferredFromAppNames ||
    regInstId ||
    '';
  if (rawInstId && SCHOOL_UNIT_MAP[rawInstId]) {
    return { instId: rawInstId, ...SCHOOL_UNIT_MAP[rawInstId] };
  }
  return { instId: 'inst-dut', ...SCHOOL_UNIT_MAP['inst-dut'] };
}

export function isDraftStudentAppStatus(
  status?: string | null,
  schoolPreliminaryStatus?: string | null
): boolean {
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

export function syncStaffRecordFromStudentApplication(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  app: Record<string, any>,
  options?: { createIfMissing?: boolean; markSubmitted?: boolean }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Record<string, any> | null {
  const appId = app.applicationId;
  if (!appId) return null;
  if (!isTestRuntime() && isLegacyMockOrTestAppId(appId)) return null;

  const existingIdx = portalState.individualStaffRecords.findIndex(
    (r) => r.applicationId === appId
  );
  if (existingIdx === -1 && !options?.createIfMissing) {
    return null;
  }

  const existing = existingIdx >= 0 ? portalState.individualStaffRecords[existingIdx] : null;
  const mapped = resolveSchoolMappingForApp(app);
  const studentCode =
    app.student?.studentId ||
    app.student?.studentCode ||
    existing?.student?.studentCode ||
    appId.replace(/^APP-\d{4}-DN-/, '');
  const studentFullName =
    app.student?.fullName ||
    app.applicantProfileSnapshot?.fullName ||
    existing?.student?.fullName ||
    'Sinh viên ĐHĐN';
  const studentEmail =
    app.student?.email ||
    app.applicantProfileSnapshot?.email ||
    existing?.student?.email ||
    `${studentCode}@sv.udn.vn`;

  let totalDecl = 0;
  let totalEv = 0;
  const baseCriteriaReview = existing?.criteriaReview || createDefaultCriteriaReviewList();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updatedCriteriaReview = baseCriteriaReview.map((cr: Record<string, any>) => {
    const matchingCrit = (app.criteria || []).find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (c: Record<string, any>) => c.id === cr.criterionId
    );
    const allDecls = collectCriterionDeclarations(matchingCrit);
    const evCount = allDecls.reduce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (sum: number, d: Record<string, any>) => sum + (d.evidenceFiles?.length || 0),
      0
    );
    totalDecl += allDecls.length;
    totalEv += evCount;
    return {
      ...cr,
      declaredCount: allDecls.length,
      evidenceCount: evCount,
    };
  });

  if (Array.isArray(app.otherAchievements)) {
    totalDecl += app.otherAchievements.length;
    for (const d of app.otherAchievements) {
      totalEv += Array.isArray(d?.evidenceFiles) ? d.evidenceFiles.length : 0;
    }
  }

  const baseSnapshot = app.applicantProfileSnapshot || existing?.applicantProfileSnapshot || {
    fullName: studentFullName,
    gender: 'Nam',
    dateOfBirth: '15/05/2004',
    ethnicity: 'Kinh',
    academicYearNumber: 3,
    educationLevel: 'Đại học',
    className: app.student?.class || '22CLC1',
    homeProvince: 'Thành phố Đà Nẵng',
    institutionId: mapped.instId,
    institutionName: mapped.instName,
    unionPosition: 'Đoàn viên',
    politicalStatus: 'Đoàn viên',
    phoneNumber: '',
    email: studentEmail,
  };
  const resolvedSnapshot = {
    ...baseSnapshot,
    institutionId: mapped.instId,
    institutionName: baseSnapshot.institutionName || mapped.instName,
  };
  app.applicantProfileSnapshot = resolvedSnapshot;
  const resolvedUnitId =
    mapped.unitId !== 'unit-dut'
      ? mapped.unitId
      : app.schoolReviewUnitId || existing?.schoolReviewUnitId || mapped.unitId;
  const resolvedUnitName =
    mapped.unitId !== 'unit-dut'
      ? mapped.unitName
      : app.schoolReviewUnitName || existing?.schoolReviewUnitName || mapped.unitName;
  app.schoolReviewUnitId = resolvedUnitId;
  app.schoolReviewUnitName = resolvedUnitName;
  app.trainingInstitutionName = app.trainingInstitutionName || mapped.instName;

  const nowFormatted = new Date().toLocaleDateString('vi-VN');
  const isDraftApp =
    !options?.markSubmitted &&
    isDraftStudentAppStatus(app.status, app.schoolPreliminaryStatus);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const staffRec: Record<string, any> = {
    ...(existing || {
      applicationId: appId,
      schoolYear: app.season || 'Năm học 2025–2026',
      levelLabel: app.level || 'Cấp Đại học Đà Nẵng',
      submittedAt: isDraftApp ? '' : app.submittedAt || nowFormatted,
      submittedDateSortKey: new Date().toISOString(),
      internalDeadline: '10/11/2026',
      eligibilityStatus: 'verified',
      eligibilityLabel: 'Đủ điều kiện nộp hồ sơ',
      currentReviewStage: app.reviewStage || 'SCHOOL',
      schoolPreliminaryStatus: isDraftApp
        ? 'school_not_submitted'
        : app.schoolPreliminaryStatus || 'pending_intake',
      schoolRecommendation: app.schoolRecommendation || 'pending',
      workflowStatus: 'unassigned',
      assignment: null,
      reviewedCriteriaCount: 0,
      totalCriteriaCount: 5,
      supplementSummary: {
        requestCount: Array.isArray(app.supplementRequests) ? app.supplementRequests.length : 0,
        activeStatus: null,
      },
      committeeSummary: null,
      finalResultSummary: null,
      latestOperationalNote: isDraftApp
        ? 'Sinh viên đang hoàn thiện bản nháp hồ sơ'
        : `Sinh viên đã nộp hồ sơ về ${resolvedUnitName}`,
    }),
    applicationId: appId,
    student: {
      fullName: studentFullName,
      studentCode,
      email: studentEmail,
    },
    applicantProfileSnapshot: resolvedSnapshot,
    institution: {
      id: mapped.instId,
      officialName: app.trainingInstitutionName || mapped.instName,
    },
    schoolReviewUnitId: resolvedUnitId,
    schoolReviewUnitName: resolvedUnitName,
    criteriaReview: updatedCriteriaReview,
    totalDeclarations: totalDecl,
    totalEvidence: totalEv,
    updatedAt: 'Vừa cập nhật',
    updatedSortKey: Date.now(),
  };

  if (options?.markSubmitted) {
    staffRec.currentReviewStage = 'SCHOOL';
    staffRec.schoolPreliminaryStatus = 'pending_intake';
    staffRec.submittedAt = app.submittedAt || nowFormatted;
    staffRec.submittedDateSortKey = new Date().toISOString();
    staffRec.latestOperationalNote = `Sinh viên đã nộp hồ sơ chính thức về ${staffRec.schoolReviewUnitName}`;
  }

  if (existingIdx >= 0) {
    portalState.individualStaffRecords[existingIdx] = staffRec;
  } else {
    portalState.individualStaffRecords.unshift(staffRec);
  }

  return staffRec;
}

export function ensureAllSubmittedApplicationsHaveStaffRecords(): void {
  let didRepair = false;
  if (!isTestRuntime()) {
    for (const [appId, app] of Object.entries(portalState.studentApplications)) {
      if (isLegacyMockOrTestAppId(appId) || isNonUdnInstitutionRecord(app)) {
        delete portalState.studentApplications[appId];
        didRepair = true;
      }
    }
    const prevStaffLen = portalState.individualStaffRecords.length;
    portalState.individualStaffRecords = portalState.individualStaffRecords.filter((r) => {
      if (isLegacyMockOrTestAppId(r?.applicationId) || isNonUdnInstitutionRecord(r)) {
        return false;
      }
      if (r?.schoolPreliminaryStatus === 'school_not_submitted') {
        return false;
      }
      const stuApp = portalState.studentApplications[r?.applicationId];
      if (stuApp && isDraftStudentAppStatus(stuApp.status, stuApp.schoolPreliminaryStatus)) {
        return false;
      }
      return true;
    });
    if (portalState.individualStaffRecords.length !== prevStaffLen) {
      didRepair = true;
    }
    const prevColLen = portalState.collectiveApplications.length;
    portalState.collectiveApplications = portalState.collectiveApplications.filter(
      (c) => !isLegacyMockOrTestAppId(c?.id || c?.applicationId) && !isNonUdnInstitutionRecord(c)
    );
    if (portalState.collectiveApplications.length !== prevColLen) {
      didRepair = true;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const staffByAppId = new Map<string, Record<string, any>>();
  for (const r of portalState.individualStaffRecords) {
    if (r?.applicationId) {
      staffByAppId.set(String(r.applicationId), r);
    }
  }

  for (const app of Object.values(portalState.studentApplications)) {
    if (!app || !app.applicationId) continue;
    if (isDraftStudentAppStatus(app.status, app.schoolPreliminaryStatus)) continue;
    const existingRec = staffByAppId.get(String(app.applicationId));
    const mapped = resolveSchoolMappingForApp(app);
    const needsUnitFix =
      existingRec &&
      mapped.unitId !== 'unit-dut' &&
      existingRec.schoolReviewUnitId === 'unit-dut';
    if (!existingRec || needsUnitFix) {
      const synced = syncStaffRecordFromStudentApplication(app, { createIfMissing: true });
      if (synced) {
        staffByAppId.set(String(app.applicationId), synced);
      }
      didRepair = true;
    }
  }

  if (didRepair) {
    savePortalStateToDisk();
  }
}

export function collectAddedEvidenceForScope(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stuApp: Record<string, any> | undefined,
  criterionId?: string,
  requirementId?: string,
  declarationId?: string
): { names: string[]; ids: string[] } {
  if (!stuApp || !Array.isArray(stuApp.criteria)) {
    return { names: [], ids: [] };
  }
  const names: string[] = [];
  const ids: string[] = [];
  const inspectReqList = (reqs: unknown) => {
    if (!Array.isArray(reqs)) return;
    for (const r of reqs) {
      if (!r || typeof r !== 'object') continue;
      if (requirementId && r.id && r.id !== requirementId) continue;
      for (const d of r.declarations || []) {
        if (!d || typeof d !== 'object') continue;
        if (declarationId && d.id && d.id !== declarationId) continue;
        for (const ef of d.evidenceFiles || []) {
          if (ef?.isNewlyAddedSupplement) {
            if (ef.name && !names.includes(ef.name)) {
              names.push(ef.name);
            }
            if (ef.id && !ids.includes(ef.id)) {
              ids.push(ef.id);
            }
          }
        }
      }
    }
  };
  for (const crit of stuApp.criteria) {
    if (criterionId && crit.id !== criterionId) continue;
    inspectReqList(crit.requirements);
    if (Array.isArray(crit.groups)) {
      for (const g of crit.groups) {
        inspectReqList(g?.requirements);
      }
    }
  }
  return { names, ids };
}
