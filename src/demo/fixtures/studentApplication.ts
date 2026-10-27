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
        resolvedShortSummary = `${totalActivities} hoạt động đã khai · ${totalEvidence} minh chứng · ${totalDays}/5 ngày tích lũy${
          bloodCount > 0 ? ` (${bloodCount} lần hiến máu)` : ''
        }`;
      } else if (critDef.id === 'physical') {
        resolvedShortSummary = `${declaredReqs.length}/2 hình thức đã kê khai · ${totalEvidence} minh chứng`;
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

  const resolvedInstId =
    params.institutionId ||
    params.existingProfileSnapshot?.institutionId ||
    'inst-dut';
  const profileSnapshot: import('../../entities/application/studentApplicationTypes').StudentProfileDto =
    params.existingProfileSnapshot &&
    params.existingProfileSnapshot.fullName === params.fullName
      ? {
          ...params.existingProfileSnapshot,
          fullName: params.fullName,
          email: params.email || params.existingProfileSnapshot.email,
          institutionId: resolvedInstId,
          institutionName: params.university,
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
          institutionName: params.university,
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
    schoolReviewUnitName: params.university || 'Trường Đại học Bách khoa – ĐHĐN',
    criteria: emptyCriteria,
  };
}

export { type PersonalLibraryItem, MOCK_PERSONAL_LIBRARY_EVIDENCE } from './mockEvidenceLibrary';
