/**
 * 5TOT ĐHĐN — Canonical Student Application Domain Data & Criteria Builder
 * Hội Sinh viên Việt Nam Đại học Đà Nẵng
 */

import {
  CRITERIA_DEFINITIONS_LIST,
  resolveMultiplicity,
} from './criteriaDefinitions';
import {
  ApplicationEvidence,
  ApplicationRecommendation,
  ApplicationDeclaration,
  ApplicationRequirement,
  ApplicationRequirementGroup,
  ApplicationCriterion,
  StudentApplicationData,
  StudentApplication,
} from '../../entities/application/studentApplicationTypes';
import { INITIAL_STUDENT_APPLICATION } from './initialStudentApplication';

export type {
  ApplicationEvidence,
  ApplicationRecommendation,
  ApplicationDeclaration,
  ApplicationRequirement,
  ApplicationRequirementGroup,
  ApplicationCriterion,
  StudentApplicationData,
  StudentApplication,
};
export { INITIAL_STUDENT_APPLICATION };
export const STUDENT_APPLICATION_FIXTURE = INITIAL_STUDENT_APPLICATION;

/**
 * Builds application criteria always from central CRITERIA_DEFINITIONS
 */
export function buildCriteriaFromDefinitions(
  existingCriteria: ApplicationCriterion[] = []
): ApplicationCriterion[] {
  return CRITERIA_DEFINITIONS_LIST.map((critDef) => {
    const existingCrit = existingCriteria.find((c) => c.id === critDef.id);
    const existingReqs = existingCrit
      ? [
          ...(existingCrit.groups ? existingCrit.groups.flatMap((g) => g.requirements || []) : []),
          ...(existingCrit.requirements || []),
        ]
      : [];

    const groups: ApplicationRequirementGroup[] = critDef.groups.map((groupDef) => {
      const requirements: ApplicationRequirement[] = groupDef.requirements.map((reqDef) => {
        const found = existingReqs.find((r) => r.id === reqDef.id);
        const resolvedMultiplicity = resolveMultiplicity(reqDef.declarationMultiplicity);
        const addAction =
          reqDef.addActionLabel ||
          (resolvedMultiplicity === 'MULTIPLE' ? '+ Thêm kê khai' : 'Kê khai nội dung này');

        if (found && found.declarations && found.declarations.length > 0) {
          const normalizedDeclarations: ApplicationDeclaration[] =
            found.declarations.map((d) => {
              const rawDecl = d as unknown as Record<string, any>;
              const rawEvList = Array.isArray(d.evidenceFiles)
                ? d.evidenceFiles
                : Array.isArray(d.evidence)
                ? d.evidence
                : [];
              const normalizedEvidence: ApplicationEvidence[] = rawEvList.map(
                (ev) => {
                  const rawEv = ev as unknown as Record<string, any>;
                  return {
                    ...ev,
                    id: ev.id || `ev-${Date.now()}`,
                    name:
                      ev.name ||
                      rawEv.fileName ||
                      rawEv.title ||
                      'Minh_chung.pdf',
                    fileType: ev.fileType || 'pdf',
                    size: ev.size || rawEv.fileSize || '240 KB',
                    uploadedAt: ev.uploadedAt || '10/10/2026',
                    status:
                      ev.status && (ev.status as string) !== 'completed'
                        ? ev.status
                        : 'ready',
                    url: ev.url || rawEv.previewUrl,
                  };
                }
              );
              return {
                ...d,
                value:
                  d.value ||
                  rawDecl.title ||
                  rawDecl.description ||
                  'Đã kê khai minh chứng',
                detail: d.detail || rawDecl.description || rawDecl.authority || '',
                date: d.date || rawDecl.date || '10/10/2026',
                status:
                  d.status && (d.status as string) !== 'completed'
                    ? d.status
                    : 'ready',
                evidenceFiles: normalizedEvidence,
              };
            });
          return {
            ...found,
            declarations: normalizedDeclarations,
            status:
              found.status &&
              found.status !== 'undeclared' &&
              (found.status as string) !== 'completed'
                ? found.status
                : 'ready',
            groupId: groupDef.id,
            title: reqDef.title,
            ruleBadge: reqDef.ruleBadge,
            ruleHelper: reqDef.ruleHelper,
            declarationMultiplicity: resolvedMultiplicity,
            declarationLabel: reqDef.declarationLabel,
            addActionLabel: addAction,
            allowMultipleEvidence: reqDef.allowMultipleEvidence ?? true,
            declarationMode: reqDef.declarationMode,
            allowMultipleDeclarations: resolvedMultiplicity === 'MULTIPLE',
            isOptionalEmpty: false,
          };
        }
        return {
          id: reqDef.id,
          code: reqDef.code,
          criterionId: reqDef.criterionId,
          groupId: groupDef.id,
          title: reqDef.title,
          ruleBadge: reqDef.ruleBadge,
          ruleHelper: reqDef.ruleHelper,
          declarationMultiplicity: resolvedMultiplicity,
          declarationLabel: reqDef.declarationLabel,
          addActionLabel: addAction,
          allowMultipleEvidence: reqDef.allowMultipleEvidence ?? true,
          declarationMode: reqDef.declarationMode,
          allowMultipleDeclarations: resolvedMultiplicity === 'MULTIPLE',
          status: 'undeclared',
          declarations: [],
          isOptionalEmpty: true,
        };
      });

      return {
        id: groupDef.id,
        criterionId: groupDef.criterionId,
        title: groupDef.title,
        groupType: groupDef.groupType,
        ruleBadge: groupDef.ruleBadge,
        ruleHelper: groupDef.ruleHelper,
        minSelections: groupDef.minSelections ?? groupDef.minApplicable ?? 1,
        minApplicable: groupDef.minApplicable,
        requirements,
      };
    });

    const flatRequirements = groups.flatMap((g) => g.requirements);
    const declaredReqs = flatRequirements.filter(
      (r) => r.declarations && r.declarations.length > 0
    );
    const totalEvidence = flatRequirements.reduce(
      (sum, r) =>
        sum +
        r.declarations.reduce(
          (dSum, d) => dSum + (d.evidenceFiles?.length || 0),
          0
        ),
      0
    );

    let resolvedShortSummary = existingCrit?.shortSummary || critDef.shortSummary;
    if (
      declaredReqs.length > 0 &&
      (!existingCrit?.shortSummary || existingCrit.shortSummary.startsWith('0 '))
    ) {
      if (critDef.id === 'volunteer') {
        const allDecls = flatRequirements.flatMap((r) => r.declarations || []);
        const totalActivities = allDecls.length;
        let totalDays = 0;
        let bloodCount = 0;
        for (const d of allDecls) {
          const combined = `${d.value} ${d.detail || ''}`.toLowerCase();
          if (
            d.metadata?.volActivityType === 'blood_donation' ||
            combined.includes('hiến máu') ||
            combined.includes('hien mau')
          ) {
            bloodCount++;
            totalDays += 1;
          } else if (d.metadata?.days) {
            const p = parseInt(d.metadata.days, 10);
            totalDays += isNaN(p) ? 1 : p;
          } else {
            const dayMatch = combined.match(/(\d+)\s*ngày/i);
            totalDays += dayMatch ? parseInt(dayMatch[1], 10) : 1;
          }
        }
        resolvedShortSummary = `${totalActivities} hoạt động đã khai · ${totalEvidence} minh chứng · ${totalDays}/3 ngày tình nguyện${
          bloodCount > 0 ? ` (${bloodCount} lần hiến máu)` : ''
        }`;
      } else if (critDef.id === 'physical') {
        resolvedShortSummary = `${declaredReqs.length} nội dung đã kê khai · ${totalEvidence} minh chứng`;
      } else {
        resolvedShortSummary = `${declaredReqs.length} nội dung đã kê khai · ${totalEvidence} minh chứng`;
      }
    }

    const resolvedStatusLabel =
      existingCrit?.statusLabel &&
      existingCrit.statusLabel !== 'Chưa kê khai' &&
      existingCrit.statusLabel !== 'Đã kê khai'
        ? existingCrit.statusLabel
        : declaredReqs.length > 0
        ? 'Đã kê khai'
        : existingCrit?.statusLabel || 'Đã kê khai';

    return {
      id: critDef.id,
      number: critDef.number,
      name: critDef.name,
      shortSummary: resolvedShortSummary,
      statusLabel: resolvedStatusLabel,
      groups,
      requirements: flatRequirements,
    };
  });
}

// Ensure INITIAL_STUDENT_APPLICATION criteria are always merged from central definitions
INITIAL_STUDENT_APPLICATION.criteria = buildCriteriaFromDefinitions(
  INITIAL_STUDENT_APPLICATION.criteria
);

export function resolveInstitutionFromUniversity(
  university?: string,
  fallbackInstId?: string
): { institutionId: string; schoolReviewUnitId: string; schoolReviewUnitName: string } {
  const norm = (university || '').toLowerCase();
  if (fallbackInstId) {
    const map: Record<string, { unitId: string; unitName: string }> = {
      'inst-dut': { unitId: 'unit-dut', unitName: 'Trường Đại học Bách khoa – ĐHĐN' },
      'inst-due': { unitId: 'unit-due', unitName: 'Trường Đại học Kinh tế – ĐHĐN' },
      'inst-ued': { unitId: 'unit-ued', unitName: 'Trường Đại học Sư phạm – ĐHĐN' },
      'inst-ufl': { unitId: 'unit-ufl', unitName: 'Trường Đại học Ngoại ngữ – ĐHĐN' },
      'inst-ufls': { unitId: 'unit-ufl', unitName: 'Trường Đại học Ngoại ngữ – ĐHĐN' },
      'inst-ute': { unitId: 'unit-ute', unitName: 'Trường Đại học Sư phạm Kỹ thuật – ĐHĐN' },
      'inst-vku': {
        unitId: 'unit-vku',
        unitName: 'Trường Đại học Công nghệ Thông tin và Truyền thông Việt – Hàn – ĐHĐN',
      },
      'inst-smp': { unitId: 'unit-smp', unitName: 'Trường Y Dược – ĐHĐN' },
      'inst-vnuk': {
        unitId: 'unit-vnuk',
        unitName: 'Viện Nghiên cứu và Đào tạo Việt – Anh – ĐHĐN',
      },
      'inst-kontum': {
        unitId: 'unit-kontum',
        unitName: 'Phân hiệu Đại học Đà Nẵng tại Kon Tum',
      },
    };
    const matched = map[fallbackInstId];
    if (matched) {
      return {
        institutionId: fallbackInstId === 'inst-ufls' ? 'inst-ufl' : fallbackInstId,
        schoolReviewUnitId: matched.unitId,
        schoolReviewUnitName: matched.unitName,
      };
    }
  }
  if (norm.includes('kinh tế')) {
    return {
      institutionId: 'inst-due',
      schoolReviewUnitId: 'unit-due',
      schoolReviewUnitName: 'Trường Đại học Kinh tế – ĐHĐN',
    };
  }
  if (norm.includes('sư phạm kỹ thuật')) {
    return {
      institutionId: 'inst-ute',
      schoolReviewUnitId: 'unit-ute',
      schoolReviewUnitName: 'Trường Đại học Sư phạm Kỹ thuật – ĐHĐN',
    };
  }
  if (norm.includes('sư phạm')) {
    return {
      institutionId: 'inst-ued',
      schoolReviewUnitId: 'unit-ued',
      schoolReviewUnitName: 'Trường Đại học Sư phạm – ĐHĐN',
    };
  }
  if (norm.includes('ngoại ngữ')) {
    return {
      institutionId: 'inst-ufl',
      schoolReviewUnitId: 'unit-ufl',
      schoolReviewUnitName: 'Trường Đại học Ngoại ngữ – ĐHĐN',
    };
  }
  if (norm.includes('việt – hàn') || norm.includes('việt - hàn') || norm.includes('cntt')) {
    return {
      institutionId: 'inst-vku',
      schoolReviewUnitId: 'unit-vku',
      schoolReviewUnitName:
        'Trường Đại học Công nghệ Thông tin và Truyền thông Việt – Hàn – ĐHĐN',
    };
  }
  if (norm.includes('y dược')) {
    return {
      institutionId: 'inst-smp',
      schoolReviewUnitId: 'unit-smp',
      schoolReviewUnitName: 'Trường Y Dược – ĐHĐN',
    };
  }
  if (norm.includes('việt – anh') || norm.includes('việt - anh') || norm.includes('vnuk')) {
    return {
      institutionId: 'inst-vnuk',
      schoolReviewUnitId: 'unit-vnuk',
      schoolReviewUnitName: 'Viện Nghiên cứu và Đào tạo Việt – Anh – ĐHĐN',
    };
  }
  if (norm.includes('kon tum')) {
    return {
      institutionId: 'inst-kontum',
      schoolReviewUnitId: 'unit-kontum',
      schoolReviewUnitName: 'Phân hiệu Đại học Đà Nẵng tại Kon Tum',
    };
  }
  return {
    institutionId: 'inst-dut',
    schoolReviewUnitId: 'unit-dut',
    schoolReviewUnitName: university || 'Trường Đại học Bách khoa – ĐHĐN',
  };
}

/**
 * Checks whether an application object is the hardcoded demo fixture (`INITIAL_STUDENT_APPLICATION`)
 * or belongs to a different student, without wiping out legitimate backend declarations of `minh.nv@dut.udn.vn` (`102220123`).
 */
export function isDemoFixtureApplication(
  app: StudentApplicationData | null | undefined,
  currentStudentId?: string
): boolean {
  if (!app) return false;
  if (
    currentStudentId &&
    app.student?.studentId &&
    app.student.studentId !== currentStudentId
  ) {
    return true;
  }
  if (app.student?.email === 'minhanh.nguyen@dut.udn.vn') {
    return true;
  }
  const hasHardcodedDemoDecl = (app.criteria || []).some((c) => {
    const reqs = [
      ...(c.requirements || []),
      ...(c.groups ? c.groups.flatMap((g) => g.requirements || []) : []),
    ];
    return reqs.some((r) =>
      (r.declarations || []).some(
        (d) => d.id === 'decl-drl' || d.id === 'decl-law' || d.id === 'decl-gpa'
      )
    );
  });
  return hasHardcodedDemoDecl;
}

export function buildCleanStudentApplication(params: {
  fullName: string;
  studentId: string;
  university: string;
  email?: string;
  institutionId?: string;
  existingProfileSnapshot?: import('../../entities/application/studentApplicationTypes').StudentProfileDto | null;
}): StudentApplicationData {
  const emptyCriteria = buildCriteriaFromDefinitions([]).map((crit) => ({
    ...crit,
    shortSummary: '0 nội dung đã kê khai · 0 minh chứng',
    statusLabel: 'Chưa kê khai',
  }));

  const resolvedInst = resolveInstitutionFromUniversity(
    params.university,
    params.institutionId || params.existingProfileSnapshot?.institutionId
  );
  const resolvedInstId = resolvedInst.institutionId;
  const profileSnapshot: import('../../entities/application/studentApplicationTypes').StudentProfileDto =
    params.existingProfileSnapshot &&
    params.existingProfileSnapshot.fullName === params.fullName
      ? {
          ...params.existingProfileSnapshot,
          fullName: params.fullName,
          email: params.email || params.existingProfileSnapshot.email,
          institutionId: resolvedInstId,
          institutionName: params.university || resolvedInst.schoolReviewUnitName,
        }
      : {
          fullName: params.fullName,
          gender: '',
          ethnicity: '',
          dateOfBirth: '',
          email: params.email || '',
          phoneNumber: '',
          homeProvince: '',
          institutionId: resolvedInstId,
          institutionName: params.university || resolvedInst.schoolReviewUnitName,
          academicYearNumber: 0,
          educationLevel: 'Đại học',
          className: '',
          unionPosition: 'Chưa giữ chức vụ',
          politicalStatus: 'Đoàn viên',
        };

  return {
    ...INITIAL_STUDENT_APPLICATION,
    applicationId: `APP-2026-DN-${params.studentId || 'NEW'}`,
    status: 'Đang hoàn thiện',
    eligibilityStatus: 'Đã xác nhận điều kiện nộp hồ sơ',
    applicantProfileSnapshot: profileSnapshot,
    student: {
      fullName: params.fullName,
      studentId: params.studentId,
      university: params.university,
      faculty: '',
      class: profileSnapshot.className || '',
      email: profileSnapshot.email || params.email || '',
      academicYear: INITIAL_STUDENT_APPLICATION.student.academicYear,
    },
    trainingInstitutionName: params.university,
    schoolReviewUnitId: resolvedInst.schoolReviewUnitId,
    schoolReviewUnitName: params.university || resolvedInst.schoolReviewUnitName,
    supplementRequests: [],
    criteria: emptyCriteria,
  };
}

export {
  type PersonalLibraryItem,
  MOCK_PERSONAL_LIBRARY_EVIDENCE,
  loadPersonalLibraryItems,
  savePersonalLibraryItems,
  uploadFilesToPersonalLibrary,
  syncEvidenceFilesToPersonalLibrary,
  removePersonalLibraryItem,
  getActiveStudentCombinedLibrary,
  usePersonalEvidenceLibrary,
} from './mockEvidenceLibrary';
