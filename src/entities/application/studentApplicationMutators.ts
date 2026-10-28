/**
 * 5TOT ĐHĐN — Student Application Pure Domain Mutators & Selectors (FSD Entities Layer)
 * Synchronizes criteria requirement mutations, declaration/evidence CRUD, summary strings, and live stats.
 */

import {
  ApplicationCriterion,
  ApplicationDeclaration,
  ApplicationEvidence,
  ApplicationRequirement,
  StudentApplicationData,
  OTHER_ACHIEVEMENTS_REQ_ID,
  buildOtherAchievementsCriterion,
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
      const allDecls = updatedReqs.flatMap((r) => r.declarations || []);
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
        } else if (d.metadata?.days || d.metadata?.volDaysCount) {
          const p = parseInt(d.metadata.days || d.metadata.volDaysCount || '1', 10);
          totalDays += isNaN(p) ? 1 : p;
        } else {
          const dayMatch = combined.match(/(\d+)\s*ngày/i);
          totalDays += dayMatch ? parseInt(dayMatch[1], 10) : 1;
        }
      }
      shortSummary = `${totalActivities} hoạt động đã khai · ${totalEvidence} minh chứng · ${totalDays}/3 ngày tình nguyện${
        bloodCount > 0 ? ` (${bloodCount} lần hiến máu)` : ''
      }`;
    } else if (crit.id === 'physical') {
      shortSummary = `${declaredReqs.length} nội dung đã kê khai · ${totalEvidence} minh chứng`;
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

  const newOtherAchievements = (prev.otherAchievements || []).map((decl) => ({
    ...decl,
    evidenceFiles: (decl.evidenceFiles || []).map((f) =>
      f.id === fileId ? { ...f, status: 'ready' as RequirementStatus } : f
    ),
  }));

  return {
    ...prev,
    criteria: newCriteria,
    otherAchievements: newOtherAchievements,
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
  if (reqId === OTHER_ACHIEVEMENTS_REQ_ID) {
    const existingList = prev.otherAchievements || [];
    if (existingDeclId) {
      return {
        ...prev,
        otherAchievements: existingList.map((d) =>
          d.id === existingDeclId
            ? {
                ...d,
                value: declData.value,
                detail: declData.detail,
                date: declData.date || d.date,
                metadata: declData.metadata,
                evidenceFiles,
              }
            : d
        ),
      };
    }
    const newOtherDecl: ApplicationDeclaration = {
      id: `decl-other-${Date.now()}`,
      value: declData.value,
      detail: declData.detail,
      date: declData.date || new Date().toLocaleDateString('vi-VN'),
      metadata: declData.metadata,
      evidenceFiles: evidenceFiles.map((f) => ({
        ...f,
        isNewlyAddedSupplement: isSupplementActive
          ? true
          : f.isNewlyAddedSupplement,
      })),
    };
    return {
      ...prev,
      otherAchievements: [...existingList, newOtherDecl],
    };
  }

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
            metadata: declData.metadata,
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
    evidenceFiles: evidenceFiles.map((f) => ({
      ...f,
      isNewlyAddedSupplement: isSupplementActive
        ? true
        : f.isNewlyAddedSupplement,
    })),
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
  if (reqId === OTHER_ACHIEVEMENTS_REQ_ID) {
    return {
      ...prev,
      otherAchievements: (prev.otherAchievements || []).map((d) =>
        d.id === declarationId
          ? {
              ...d,
              value: updated.value,
              detail: updated.detail,
            }
          : d
      ),
    };
  }
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
  if (reqId === OTHER_ACHIEVEMENTS_REQ_ID) {
    return {
      ...prev,
      otherAchievements: [...(prev.otherAchievements || []), newDecl],
    };
  }
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
  if (reqId === OTHER_ACHIEVEMENTS_REQ_ID) {
    return {
      ...prev,
      otherAchievements: (prev.otherAchievements || []).filter(
        (d) => d.id !== declId
      ),
    };
  }
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
  if (reqId === OTHER_ACHIEVEMENTS_REQ_ID) {
    return {
      ...prev,
      otherAchievements: (prev.otherAchievements || []).map((d) =>
        d.id === declId
          ? {
              ...d,
              evidenceFiles: [...(d.evidenceFiles || []), ...newFiles],
            }
          : d
      ),
    };
  }
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

  for (const decl of application.otherAchievements || []) {
    if (
      (decl.evidenceFiles || []).some(
        (ef) => ef.id === file.id || ef.name === file.name
      )
    ) {
      foundCritName = 'Thành tích khác';
      foundCritId = 'other_achievements';
      foundReqTitle =
        'Các giải thưởng, bằng khen, giấy khen, sáng kiến hoặc thành tích tiêu biểu khác';
      foundReqId = OTHER_ACHIEVEMENTS_REQ_ID;
      foundDeclTitle = decl.value;
      siblingFiles = decl.evidenceFiles || [file];
      break;
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
  if (reqId === OTHER_ACHIEVEMENTS_REQ_ID) {
    const otherCrit = buildOtherAchievementsCriterion(
      application.otherAchievements
    );
    return {
      criterion: otherCrit,
      requirement: otherCrit.requirements[0] || null,
    };
  }
  for (const c of application.criteria) {
    const r = c.requirements.find((req) => req.id === reqId);
    if (r) {
      return { criterion: c, requirement: r };
    }
    if (c.groups) {
      for (const grp of c.groups) {
        const gr = grp.requirements.find((req) => req.id === reqId);
        if (gr) {
          return { criterion: c, requirement: gr };
        }
      }
    }
  }
  return { criterion: null, requirement: null };
}

export function calculateStudentApplicationSummaryStats(
  application: StudentApplicationData
) {
  const totalCriteria = application.criteria.length;
  const otherDecls = application.otherAchievements || [];
  const otherEvCount = otherDecls.reduce(
    (sum, d) => sum + (d.evidenceFiles?.length || 0),
    0
  );
  const totalDeclarations =
    application.criteria.reduce(
      (sum, c) =>
        sum +
        c.requirements.reduce((rSum, r) => rSum + r.declarations.length, 0),
      0
    ) + otherDecls.length;
  const totalEvidence =
    application.criteria.reduce(
      (sum, c) =>
        sum +
        c.requirements.reduce(
          (rSum, r) =>
            rSum +
            r.declarations.reduce(
              (dSum, d) => dSum + d.evidenceFiles.length,
              0
            ),
          0
        ),
      0
    ) + otherEvCount;
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

export function computeDynamicPreSubmitAdvisories(
  criteria: ApplicationCriterion[],
  manualAdvisories: PreSubmitAdvisoryItem[] = []
): PreSubmitAdvisoryItem[] {
  const result: PreSubmitAdvisoryItem[] = [];

  for (const c of criteria) {
    const allReqs = c.requirements || [];
    const declaredCount = allReqs.reduce(
      (sum, r) => sum + (r.declarations?.length || 0),
      0
    );

    if (declaredCount === 0) {
      result.push({
        id: `adv-undeclared-${c.id}`,
        criterionId: c.id,
        criterionName: c.name,
        criterionNumber: c.number,
        requirementId: allReqs[0]?.id || '',
        message: `Tiêu chí ${c.name} hiện chưa có nội dung kê khai nào.`,
        actionLabel: 'Kê khai',
        targetType: 'row',
      });
      continue;
    }

    for (const r of allReqs) {
      const hasDeclWithoutEvidence = (r.declarations || []).some(
        (d) => !d.evidenceFiles || d.evidenceFiles.length === 0
      );
      if (hasDeclWithoutEvidence) {
        result.push({
          id: `adv-no-ev-${c.id}-${r.id}`,
          criterionId: c.id,
          criterionName: c.name,
          criterionNumber: c.number,
          requirementId: r.id,
          message: `Mục "${r.title}" đã kê khai nhưng chưa đính kèm tệp minh chứng.`,
          actionLabel: 'Bổ sung',
          targetType: 'row',
        });
      }
    }

    for (const adv of manualAdvisories || []) {
      if (adv.criterionId === c.id) {
        result.push(adv);
      }
    }
  }

  return result;
}

export function computeCriteriaAdvisoryStatuses(
  criteria: ApplicationCriterion[],
  advisories: PreSubmitAdvisoryItem[]
) {
  return criteria.map((c) => {
    const allReqs = c.requirements || [];
    const declaredCount = allReqs.reduce(
      (sum, r) => sum + (r.declarations?.length || 0),
      0
    );
    const missingEvidenceCount = allReqs.reduce(
      (sum, r) =>
        sum +
        (r.declarations || []).filter(
          (d) => !d.evidenceFiles || d.evidenceFiles.length === 0
        ).length,
      0
    );
    const hasManualAdvisory = (advisories || []).some(
      (a) => a.criterionId === c.id && !a.id.startsWith('adv-undeclared-')
    );

    let statusLabel = 'Đã có thông tin';
    let statusTone: 'undeclared' | 'advisory' | 'ready' = 'ready';
    let hasAdvisory = false;

    if (declaredCount === 0) {
      statusLabel = 'Chưa kê khai';
      statusTone = 'undeclared';
      hasAdvisory = false;
    } else if (missingEvidenceCount > 0) {
      statusLabel = 'Thiếu minh chứng';
      statusTone = 'advisory';
      hasAdvisory = true;
    } else if (hasManualAdvisory) {
      statusLabel = c.id === 'physical' ? 'Có thể bổ sung' : 'Cần kiểm tra';
      statusTone = 'advisory';
      hasAdvisory = true;
    }

    return {
      id: c.id,
      name: c.name,
      number: c.number,
      statusLabel,
      statusTone,
      hasAdvisory,
      declaredCount,
    };
  });
}
