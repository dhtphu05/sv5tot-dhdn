/**
 * 5TOT Đà Nẵng — Student Application Pure Domain Mutators & Selectors (FSD Entities Layer)
 * Synchronizes criteria requirement mutations, declaration/evidence CRUD, summary strings, and live stats.
 */

import {
  ApplicationCriterion,
  ApplicationDeclaration,
  ApplicationEvidence,
  ApplicationRequirement,
  StudentApplicationData,
} from '../../demo/fixtures/studentApplication';
import { resolveMultiplicity } from '../../demo/fixtures/criteriaDefinitions';
import { PreSubmitAdvisoryItem } from '../../components/submission/submissionTypes';
import { RequirementStatus } from '../../tokens';

export function syncCriteriaWithUpdate(
  prevCriteria: ApplicationCriterion[],
  reqId: string,
  updateReq: (req: ApplicationRequirement) => ApplicationRequirement
): ApplicationCriterion[] {
  return prevCriteria.map((crit) => {
    const updatedReqs = crit.requirements.map((r) =>
      r.id === reqId ? updateReq(r) : r
    );
    const updatedGroups = crit.groups?.map((grp) => ({
      ...grp,
      requirements: grp.requirements.map((r) =>
        r.id === reqId ? updateReq(r) : r
      ),
    }));

    const declaredReqs = updatedReqs.filter(
      (r) => r.declarations && r.declarations.length > 0
    );
    const totalEvidence = updatedReqs.reduce(
      (sum, r) =>
        sum +
        r.declarations.reduce(
          (dSum, d) => dSum + (d.evidenceFiles?.length || 0),
          0
        ),
      0
    );

    let shortSummary = crit.shortSummary;
    if (crit.id === 'volunteer') {
      const volReq = updatedReqs.find((r) => r.id === 'volunteer-activities');
      const totalActivities = volReq?.declarations?.length || 0;
      let totalDays = 0;
      let bloodCount = 0;
      for (const d of volReq?.declarations || []) {
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
      shortSummary = `${totalActivities} hoạt động đã khai · ${totalEvidence} minh chứng · ${totalDays}/5 ngày tích lũy${
        bloodCount > 0 ? ` (${bloodCount} lần hiến máu)` : ''
      }`;
    } else if (crit.id === 'physical') {
      shortSummary = `${declaredReqs.length}/2 hình thức đã kê khai · ${totalEvidence} minh chứng`;
    } else {
      shortSummary = `${declaredReqs.length} nội dung đã kê khai · ${totalEvidence} minh chứng`;
    }

    const nextStatusLabel =
      crit.statusLabel &&
      crit.statusLabel !== 'Chưa kê khai' &&
      crit.statusLabel !== 'Đã kê khai'
        ? crit.statusLabel
        : declaredReqs.length > 0
        ? 'Đã kê khai'
        : 'Chưa kê khai';

    return {
      ...crit,
      shortSummary,
      statusLabel: nextStatusLabel,
      groups: updatedGroups || crit.groups,
      requirements: updatedReqs,
    };
  });
}

export function applyConfirmEvidenceToApplication(
  prev: StudentApplicationData,
  fileId: string
): StudentApplicationData {
  const newCriteria = prev.criteria.map((crit) => ({
    ...crit,
    requirements: crit.requirements.map((req) => {
      const updatedDeclarations = req.declarations.map((decl) => ({
        ...decl,
        evidenceFiles: decl.evidenceFiles.map((f) =>
          f.id === fileId ? { ...f, status: 'ready' as RequirementStatus } : f
        ),
      }));

      const hasFile = req.declarations.some((d) =>
        d.evidenceFiles.some((f) => f.id === fileId)
      );
      return {
        ...req,
        declarations: updatedDeclarations,
        status: hasFile ? ('ready' as RequirementStatus) : req.status,
        recommendation: hasFile ? undefined : req.recommendation,
      };
    }),
  }));

  return {
    ...prev,
    criteria: newCriteria,
  };
}

export function applySaveDeclarationMutation(
  prev: StudentApplicationData,
  reqId: string,
  declData: {
    value: string;
    detail?: string;
    date?: string;
    metadata?: Record<string, string>;
  },
  evidenceFiles: ApplicationEvidence[],
  existingDeclId: string | undefined,
  isSupplementActive: boolean
): StudentApplicationData {
  if (existingDeclId) {
    return {
      ...prev,
      criteria: syncCriteriaWithUpdate(prev.criteria, reqId, (req) => ({
        ...req,
        status: (isSupplementActive ? 'supplement' : 'ready') as RequirementStatus,
        declarations: req.declarations.map((d) => {
          if (d.id !== existingDeclId) return d;
          return {
            ...d,
            value: declData.value,
            detail: declData.detail,
            date: declData.date || d.date,
            metadata: { ...d.metadata, ...declData.metadata },
            evidenceFiles,
          };
        }),
      })),
    };
  }

  const newDecl: ApplicationDeclaration = {
    id: `decl-${Date.now()}`,
    value: declData.value,
    detail: declData.detail,
    date: declData.date || new Date().toLocaleDateString('vi-VN'),
    metadata: declData.metadata,
    evidenceFiles:
      evidenceFiles.length > 0
        ? evidenceFiles.map((f) => ({
            ...f,
            isNewlyAddedSupplement: isSupplementActive
              ? true
              : f.isNewlyAddedSupplement,
          }))
        : [
            {
              id: `ev-new-${Date.now()}`,
              name: `Minh_chung_${declData.value
                .replace(/\s+/g, '_')
                .substring(0, 20)}.pdf`,
              fileType: 'pdf',
              size: '1.2 MB',
              uploadedAt: new Date().toLocaleDateString('vi-VN'),
              status: 'ready',
              isNewlyAddedSupplement: isSupplementActive,
            },
          ],
  };

  return {
    ...prev,
    criteria: syncCriteriaWithUpdate(prev.criteria, reqId, (req) => {
      const isMulti =
        resolveMultiplicity(req.declarationMultiplicity) === 'MULTIPLE' ||
        req.declarationMode === 'repeatable' ||
        req.allowMultipleDeclarations;
      const updatedDeclarations = isMulti
        ? [...req.declarations, newDecl]
        : [newDecl];

      return {
        ...req,
        status: (isSupplementActive ? 'supplement' : 'ready') as RequirementStatus,
        isOptionalEmpty: false,
        declarations: updatedDeclarations,
      };
    }),
  };
}

export function applyUpdateDeclarationInlineMutation(
  prev: StudentApplicationData,
  reqId: string,
  declarationId: string,
  updated: { value: string; detail?: string }
): StudentApplicationData {
  return {
    ...prev,
    criteria: syncCriteriaWithUpdate(prev.criteria, reqId, (req) => ({
      ...req,
      status: 'declared' as RequirementStatus,
      declarations: req.declarations.map((d) =>
        d.id === declarationId
          ? {
              ...d,
              value: updated.value,
              detail: updated.detail,
            }
          : d
      ),
    })),
  };
}

export function applyAddDeclarationInlineMutation(
  prev: StudentApplicationData,
  reqId: string,
  newDecl: ApplicationDeclaration
): StudentApplicationData {
  return {
    ...prev,
    criteria: syncCriteriaWithUpdate(prev.criteria, reqId, (req) => {
      const isMulti =
        resolveMultiplicity(req.declarationMultiplicity) === 'MULTIPLE' ||
        req.declarationMode === 'repeatable' ||
        req.allowMultipleDeclarations;

      return {
        ...req,
        status: 'ready' as RequirementStatus,
        isOptionalEmpty: false,
        declarations: isMulti ? [...req.declarations, newDecl] : [newDecl],
      };
    }),
  };
}

export function applyDeleteDeclarationMutation(
  prev: StudentApplicationData,
  reqId: string,
  declId: string
): StudentApplicationData {
  return {
    ...prev,
    criteria: syncCriteriaWithUpdate(prev.criteria, reqId, (req) => {
      const nextDeclarations = req.declarations.filter((d) => d.id !== declId);
      return {
        ...req,
        declarations: nextDeclarations,
        status: (nextDeclarations.length > 0 ? req.status : 'undeclared') as RequirementStatus,
        isOptionalEmpty: nextDeclarations.length === 0,
      };
    }),
  };
}

export function applyAppendEvidenceFilesMutation(
  prev: StudentApplicationData,
  reqId: string,
  declId: string,
  newFiles: ApplicationEvidence[],
  updateStatusTo?: RequirementStatus
): StudentApplicationData {
  return {
    ...prev,
    criteria: syncCriteriaWithUpdate(prev.criteria, reqId, (req) => ({
      ...req,
      status: updateStatusTo || req.status,
      declarations: req.declarations.map((d) =>
        d.id === declId
          ? {
              ...d,
              evidenceFiles: [...d.evidenceFiles, ...newFiles],
            }
          : d
      ),
    })),
  };
}

export function findEvidenceContextInApplication(
  application: StudentApplicationData,
  file: ApplicationEvidence
) {
  let foundCritName = 'Hội nhập tốt';
  let foundCritId = 'integration';
  let foundReqTitle = 'Chứng chỉ ngoại ngữ chuẩn quốc tế';
  let foundReqId = 'integration-lang';
  let foundDeclTitle: string | undefined;
  let siblingFiles: ApplicationEvidence[] = [file];

  for (const crit of application.criteria) {
    for (const req of crit.requirements) {
      for (const decl of req.declarations) {
        if (
          decl.evidenceFiles.some(
            (ef) => ef.id === file.id || ef.name === file.name
          )
        ) {
          foundCritName = crit.name;
          foundCritId = crit.id;
          foundReqTitle = req.title;
          foundReqId = req.id;
          foundDeclTitle = decl.value;
          siblingFiles = decl.evidenceFiles;
          break;
        }
      }
    }
  }

  return {
    criterionId: foundCritId,
    criterionName: foundCritName,
    requirementId: foundReqId,
    requirementTitle: foundReqTitle,
    declarationTitle: foundDeclTitle,
    allEvidenceList: siblingFiles,
  };
}

export function findCriterionAndRequirementById(
  application: StudentApplicationData,
  reqId: string
): {
  criterion: ApplicationCriterion | null;
  requirement: ApplicationRequirement | null;
} {
  for (const c of application.criteria) {
    const r = c.requirements.find((req) => req.id === reqId);
    if (r) {
      return { criterion: c, requirement: r };
    }
  }
  return { criterion: null, requirement: null };
}

export function calculateStudentApplicationSummaryStats(
  application: StudentApplicationData
) {
  const totalCriteria = application.criteria.length;
  const totalDeclarations = application.criteria.reduce(
    (sum, c) =>
      sum + c.requirements.reduce((rSum, r) => rSum + r.declarations.length, 0),
    0
  );
  const totalEvidence = application.criteria.reduce(
    (sum, c) =>
      sum +
      c.requirements.reduce(
        (rSum, r) =>
          rSum +
          r.declarations.reduce((dSum, d) => dSum + d.evidenceFiles.length, 0),
        0
      ),
    0
  );
  const totalRecommendations = application.criteria.reduce(
    (sum, c) => sum + c.requirements.filter((r) => !!r.recommendation).length,
    0
  );

  return {
    totalCriteria,
    totalDeclarations,
    totalEvidence,
    totalRecommendations,
  };
}

export function computeCriteriaAdvisoryStatuses(
  criteria: ApplicationCriterion[],
  advisories: PreSubmitAdvisoryItem[]
) {
  return criteria.map((c) => {
    const hasAdvisory = (advisories || []).some((a) => a.criterionId === c.id);
    let statusLabel = 'Đã có thông tin';
    if (hasAdvisory) {
      statusLabel = c.id === 'physical' ? 'Có thể bổ sung' : 'Cần kiểm tra';
    }
    return {
      id: c.id,
      name: c.name,
      number: c.number,
      statusLabel,
      hasAdvisory,
    };
  });
}
