import { CollectiveApplication } from "../collectiveTypes";
import { StaffUser } from "../types";
import { canInspectUnpublishedResults } from "./workflowClassification";
import { getAllCollectiveApplications } from "../collectiveStore";
import { isBackendMode } from "../../shared/config/executionMode";

export interface CollectiveInstitutionRow {
  institutionId: string;
  institutionName: string;
  total: number;
  underReview: number;
  recognized: number;
}

export interface CollectiveSeasonAnalytics {
  totalSubmitted: number;
  recognizedCount: number;
  recognizedRatePercent: number | null;
  publishedCount: number;
  byRequirement: {
    tt01Pass: number;
    tt02Pass: number;
    tt03Pass: number;
    tt04Pass: number;
  };
  byInstitution: CollectiveInstitutionRow[];
  byType: {
    faculty_association: { count: number; percentage: number };
    student_branch: { count: number; percentage: number };
    club_team_group: { count: number; percentage: number };
  };
  byStatus: {
    unassigned: number;
    underReview: number;
    supplementRequested: number;
    supplementReturned: number;
    reviewCompleted: number;
    committeePending: number;
    finalized: number;
    published: number;
  };
  results: {
    canSeeUnpublished: boolean;
    totalDecided: number;
    recognizedCount: number;
    notRecognizedCount: number;
    needsConsiderationCount: number;
    publishedCount: number;
    unpublishedCount: number;
    recognizedRatePercent: number | null;
  };
  criteriaRates: {
    tt01PassedRate: number;
    tt02PassedRate: number;
    tt03PassedRate: number;
    tt04PassedRate: number;
  };
  totalMembersCount: number;
  totalParticipatingMembers: number;
  totalRecognizedMembers: number;
}

export function getCollectiveSeasonAnalytics(
  collectiveApps: CollectiveApplication[],
  user: StaffUser
): CollectiveSeasonAnalytics {
  const canSeeUnpublished = canInspectUnpublishedResults(user);
  const submittedApps = isBackendMode()
    ? collectiveApps.filter((app) => app.status !== 'draft')
    : collectiveApps;
  const totalSubmitted = submittedApps.length;

  let facultyCount = 0;
  let branchCount = 0;
  let clubCount = 0;

  const byStatus = {
    unassigned: 0,
    underReview: 0,
    supplementRequested: 0,
    supplementReturned: 0,
    reviewCompleted: 0,
    committeePending: 0,
    finalized: 0,
    published: 0,
  };

  let totalDecided = 0;
  let recognizedCount = 0;
  let notRecognizedCount = 0;
  let needsConsiderationCount = 0;
  let publishedCount = 0;
  let unpublishedCount = 0;

  let tt01Pass = 0;
  let tt02Pass = 0;
  let tt03Pass = 0;
  let tt04Pass = 0;

  let totalMembersCount = 0;
  let totalParticipatingMembers = 0;
  let totalRecognizedMembers = 0;

  for (const app of submittedApps) {
    const rawType = String(app.collectiveType || '').toLowerCase();
    if (rawType === 'faculty_association' || rawType === 'lien_chi_hoi') {
      facultyCount++;
    } else if (rawType === 'club_team_group' || rawType === 'clb_doi_nhom') {
      clubCount++;
    } else {
      branchCount++;
    }

    totalMembersCount += app.tt02?.totalMembers || 0;
    totalParticipatingMembers += app.tt02?.participatingCount || 0;
    totalRecognizedMembers += app.tt03?.recognizedCount || 0;

    // TT Rates
    if (app.tt01?.isRecognizedSchoolLevel) tt01Pass++;
    const pRate = app.tt02?.totalMembers > 0
      ? (app.tt02.participatingCount / app.tt02.totalMembers) * 100
      : 0;
    if (pRate >= 100) tt02Pass++;
    const rRate = app.tt02?.totalMembers > 0
      ? (app.tt03.recognizedCount / app.tt02.totalMembers) * 100
      : 0;
    if (rRate >= 20) tt03Pass++;
    if (app.tt04?.noViolationsConfirmed) tt04Pass++;

    // Status mapping
    switch (app.status) {
      case 'city_unassigned':
        byStatus.unassigned++;
        break;
      case 'city_under_review':
        byStatus.underReview++;
        break;
      case 'city_supplement_requested':
        byStatus.supplementRequested++;
        break;
      case 'city_supplement_returned':
        byStatus.supplementReturned++;
        break;
      case 'city_review_completed':
        byStatus.reviewCompleted++;
        break;
      case 'committee_pending':
        byStatus.committeePending++;
        break;
      case 'finalized':
        byStatus.finalized++;
        break;
      case 'published':
        byStatus.published++;
        break;
      default:
        break;
    }

    // Results mapping
    const hasOutcome = Boolean(app.committeeOutcome || app.finalResult?.outcome);
    const outcome = app.finalResult?.outcome || app.committeeOutcome;
    const isPub = app.status === 'published';

    if (hasOutcome && (isPub || canSeeUnpublished)) {
      totalDecided++;
      if (outcome === 'recognized') recognizedCount++;
      else if (outcome === 'not_recognized') notRecognizedCount++;
      else if (outcome === 'needs_consideration') needsConsiderationCount++;

      if (isPub) publishedCount++;
      else unpublishedCount++;
    }
  }

  const safeTotal = totalSubmitted > 0 ? totalSubmitted : 1;
  const recognizedRatePercent =
    totalDecided > 0 ? Math.round((recognizedCount / totalDecided) * 100) : null;

  return {
    totalSubmitted,
    recognizedCount,
    recognizedRatePercent,
    publishedCount,
    byRequirement: {
      tt01Pass,
      tt02Pass,
      tt03Pass,
      tt04Pass,
    },
    byType: {
      faculty_association: {
        count: facultyCount,
        percentage: Math.round((facultyCount / safeTotal) * 100),
      },
      student_branch: {
        count: branchCount,
        percentage: Math.round((branchCount / safeTotal) * 100),
      },
      club_team_group: {
        count: clubCount,
        percentage: Math.round((clubCount / safeTotal) * 100),
      },
    },
    byStatus,
    results: {
      canSeeUnpublished,
      totalDecided,
      recognizedCount,
      notRecognizedCount,
      needsConsiderationCount,
      publishedCount,
      unpublishedCount,
      recognizedRatePercent,
    },
    criteriaRates: {
      tt01PassedRate: Math.round((tt01Pass / safeTotal) * 100),
      tt02PassedRate: Math.round((tt02Pass / safeTotal) * 100),
      tt03PassedRate: Math.round((tt03Pass / safeTotal) * 100),
      tt04PassedRate: Math.round((tt04Pass / safeTotal) * 100),
    },
    totalMembersCount,
    totalParticipatingMembers,
    totalRecognizedMembers,
    byInstitution: (() => {
      const institutionMap = new Map<string, CollectiveInstitutionRow>();
      for (const app of submittedApps) {
        const instId = app.institutionId || 'other';
        const instName = app.institutionName || 'Khác';
        if (!institutionMap.has(instId)) {
          institutionMap.set(instId, {
            institutionId: instId,
            institutionName: instName,
            total: 0,
            underReview: 0,
            recognized: 0,
          });
        }
        const entry = institutionMap.get(instId)!;
        entry.total++;
        if (
          app.status === 'city_under_review' ||
          app.status === 'city_in_review' ||
          app.status === 'city_supplement_requested' ||
          app.status === 'city_supplement_returned'
        ) {
          entry.underReview++;
        }
        const outcome = app.finalResult?.outcome || app.committeeOutcome;
        if (outcome === 'recognized' && (app.status === 'published' || canSeeUnpublished)) {
          entry.recognized++;
        }
      }
      return Array.from(institutionMap.values()).sort((a, b) => b.total - a.total);
    })(),
  };
}
