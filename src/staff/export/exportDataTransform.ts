import { StaffApplicationRecord, StaffUser } from "../types";
import { getStaffApplicationStatusMeta } from "../statusMap";
import { CommitteeCaseDetail } from "../committeeTypes";
import {
  AnalyticsFilterState,
  canInspectUnpublishedResults,
  classifyApplicationWorkflowBucket,
  filterApplicationsForAnalytics,
  resolveAuthoritativeResultForRecord,
} from "../analyticsSelectors";
import { getAllCollectiveApplications } from "../collectiveStore";
import { COLLECTIVE_TYPE_LABELS, COLLECTIVE_STATUS_LABELS } from "../collectiveTypes";
import {
  ExportScopeType,
  FormattedReportRow,
  ReportColumnKey,
  ReportDefinition,
  ReportPresetId,
  REPORT_COLUMNS_CATALOG,
} from "./exportTypes";
import { REPORT_DEFINITIONS } from "./reportDefinitions";
import { deriveApplicationCriteriaReviewProgress } from "../criteriaProgress";
import { isBackendMode } from "../../shared/config/executionMode";

function formatCleanExportDate(raw?: string): string {
  if (!raw) return '—';
  return raw.replace(/\s*·\s*/g, ' ');
}

function normalizeSchoolYearForExport(raw: string): string {
  return raw.replace(/^Năm học\s+/i, '').trim() || '2025–2026';
}

/**
 * Filters applications by the selected ReportPresetId BEFORE applying optional user filters
 */
export function filterApplicationsByReportPreset(
  presetId: ReportPresetId,
  applications: StaffApplicationRecord[],
  committeeCases: Record<string, CommitteeCaseDetail>,
  user: StaffUser
): StaffApplicationRecord[] {
  const canSeeUnpublished = canInspectUnpublishedResults(user);

  return applications.filter((app) => {
    const bucket = classifyApplicationWorkflowBucket(app, committeeCases);
    const res = resolveAuthoritativeResultForRecord(app, committeeCases);
    const c = committeeCases[app.applicationId];

    switch (presetId) {
      case 'ALL_SUBMITTED_APPLICATIONS':
      case 'BY_INSTITUTION':
        return true;
      case 'UNASSIGNED_APPLICATIONS':
        return !app.assignment || app.workflowStatus === 'unassigned';
      case 'UNDER_REVIEW_APPLICATIONS':
        return (
          bucket === 'under_review' ||
          app.workflowStatus === 'assigned_not_started' ||
          app.workflowStatus === 'under_review' ||
          app.workflowStatus === 'needs_recheck'
        );
      case 'SUPPLEMENT_WAITING':
        return app.workflowStatus === 'supplement_requested';
      case 'SUPPLEMENT_RETURNED':
        return app.workflowStatus === 'supplement_returned';
      case 'REVIEW_COMPLETED':
        return (
          app.reviewedCriteriaCount === 5 ||
          bucket === 'review_completed' ||
          bucket === 'waiting_decision' ||
          bucket === 'decided'
        );
      case 'COMMITTEE_ATTENTION':
        if (c) {
          return c.flaggedItems.some(
            (f) => f.status === 'pending_consideration'
          );
        }
        return app.workflowStatus === 'needs_committee_review';
      case 'AWAITING_DECISION':
        if (c) {
          const hasPending = c.flaggedItems.some(
            (f) => f.status === 'pending_consideration'
          );
          return !hasPending && !c.decision;
        }
        return (
          app.workflowStatus === 'waiting_decision' ||
          app.workflowStatus === 'ready_for_finalization'
        );
      case 'DECIDED_RESULTS':
        return res.hasDecision && (res.isPublished || canSeeUnpublished);
      case 'RECOGNIZED_RESULTS':
        return (
          res.hasDecision &&
          res.outcome === 'recognized' &&
          (res.isPublished || canSeeUnpublished)
        );
      case 'NOT_RECOGNIZED_RESULTS':
        return (
          res.hasDecision &&
          res.outcome === 'not_recognized' &&
          (res.isPublished || canSeeUnpublished)
        );
      case 'ASSIGNMENT_LIST':
        return Boolean(app.assignment);
      case 'SUPPLEMENT_LIST':
        return app.supplementSummary.requestCount > 0;
      default:
        return true;
    }
  });
}

/**
 * Builds formatted report rows matching UI filters and sort order (Sections 73–76, 136)
 */
export function getReportRows(params: {
  presetId: ReportPresetId;
  applications: StaffApplicationRecord[];
  committeeCases: Record<string, CommitteeCaseDetail>;
  filters: AnalyticsFilterState;
  user: StaffUser;
  sortKey?: string | null;
  sortDirection?: 'asc' | 'desc';
  ignoreActiveFilters?: boolean;
}): FormattedReportRow[] {
  const {
    presetId,
    applications,
    committeeCases,
    filters,
    user,
    sortKey = null,
    sortDirection = 'asc',
    ignoreActiveFilters = false,
  } = params;

  const canSeeUnpublished = canInspectUnpublishedResults(user);

  // Collective Applications Export Branch (S4.8.6)
  if (presetId.startsWith('COLLECTIVE_')) {
    const allColls = getAllCollectiveApplications();
    const filteredColls = allColls.filter((c) => {
      if (isBackendMode() && c.status === 'draft') return false;
      // Preset conditions
      if (presetId === 'COLLECTIVE_RECOGNIZED_RESULTS') {
        const outcome = c.finalResult?.outcome || c.committeeOutcome;
        if (outcome !== 'recognized') return false;
        if (c.status !== 'published' && !canSeeUnpublished) return false;
      } else if (presetId === 'COLLECTIVE_DECIDED_RESULTS') {
        const hasOutcome = Boolean(c.finalResult?.outcome || c.committeeOutcome);
        if (!hasOutcome) return false;
        if (c.status !== 'published' && !canSeeUnpublished) return false;
      }

      // User filters
      if (!ignoreActiveFilters) {
        if (filters.institutionId !== 'all' && c.institutionId !== filters.institutionId) {
          return false;
        }
        if (filters.searchQuery.trim()) {
          const q = filters.searchQuery.toLowerCase();
          const match =
            c.id.toLowerCase().includes(q) ||
            c.collectiveName.toLowerCase().includes(q) ||
            c.institutionName.toLowerCase().includes(q) ||
            (c.representative?.fullName || c.preparedByUserName || '').toLowerCase().includes(q);
          if (!match) return false;
        }
      }
      return true;
    });

    const rows: FormattedReportRow[] = filteredColls.map((c) => {
      const isPub = c.status === 'published';
      const outcome = c.finalResult?.outcome || c.committeeOutcome;
      let outcomeLabel = 'Chưa có kết luận';
      let decisionNumber = '—';
      let decidedAt = '—';
      const pubLabel = isPub ? 'Đã công bố' : 'Chưa công bố';

      if (outcome) {
        if (isPub || canSeeUnpublished) {
          outcomeLabel =
            outcome === 'recognized'
              ? 'Được công nhận Tập thể Sinh viên 5 tốt'
              : outcome === 'not_recognized'
              ? 'Chưa được công nhận trong đợt xét này'
              : 'Hội đồng cần xem xét lại';
          if (outcome === 'recognized') {
            decisionNumber = c.finalResult?.decisionNumber || '86/QĐ-HSV-ĐHĐN';
          }
          decidedAt = c.finalResult?.decisionDate || '24/10/2026';
        } else {
          outcomeLabel = 'Chờ công bố chính thức';
        }
      }

      const revSummary =
        c.cityReviewCompletedAt
          ? 'Đã hoàn tất thẩm định'
          : c.assignedOfficerName
          ? `Đang thẩm định (${c.assignedOfficerName})`
          : 'Chờ phân công';

      const pCount = c.tt02?.participatingCount ?? 0;
      const tMembers = c.tt02?.totalMembers ?? 0;
      const pPercent = tMembers > 0 ? ((pCount / tMembers) * 100).toFixed(0) : '0';
      const rCount = c.tt03?.recognizedCount ?? 0;
      const rPercent = tMembers > 0 ? ((rCount / tMembers) * 100).toFixed(1) : '0';

      return {
        rowKey: c.id,
        applicationId: c.id,
        studentName: c.collectiveName,
        studentCode: c.representative?.studentCode || '—',
        institutionId: c.institutionId,
        institutionName: c.institutionName,
        schoolYear: normalizeSchoolYearForExport(c.academicYear),
        submittedAt: formatCleanExportDate(c.submittedAt),
        workflowStatusLabel: COLLECTIVE_STATUS_LABELS[c.status] || c.status,
        officerName: c.assignedOfficerName || 'Chưa phân công',
        assignedAt: '—',
        reviewProgressLabel: revSummary,
        supplementStatusLabel:
          c.status === 'city_supplement_requested'
            ? 'Đang chờ tập thể bổ sung'
            : c.status === 'city_supplement_returned'
            ? 'Đã nhận bổ sung'
            : 'Không phát sinh',
        supplementCriterionLabel: '—',
        decisionOutcomeLabel: outcomeLabel,
        decidedAt,
        publicationStatusLabel: pubLabel,
        collectiveName: c.collectiveName,
        collectiveTypeLabel:
          COLLECTIVE_TYPE_LABELS[c.collectiveType] ||
          (String(c.collectiveType).includes('faculty') || String(c.collectiveType).includes('LIEN_CHI')
            ? 'Liên chi hội'
            : String(c.collectiveType).includes('club') || String(c.collectiveType).includes('CLB')
            ? 'CLB, Đội, Nhóm'
            : 'Chi hội sinh viên'),
        facultyName: c.facultyName || '—',
        representativeName: c.representative?.fullName || c.preparedByUserName || 'Đại diện tập thể',
        representativeRole: c.representative?.position || 'Đại diện tập thể',
        totalMembersCount: String(tMembers),
        participatingMembersCount: `${pCount}/${tMembers} (${pPercent}%)`,
        recognizedMembersCount: `${rCount}/${tMembers} (${rPercent}%)`,
        cityReviewSummary: revSummary,
        decisionNumber,
      };
    });

    if (sortKey) {
      const dir = sortDirection === 'desc' ? -1 : 1;
      rows.sort((a, b) => {
        const valA = String((a as unknown as Record<string, unknown>)[sortKey] || '');
        const valB = String((b as unknown as Record<string, unknown>)[sortKey] || '');
        return valA.localeCompare(valB, 'vi') * dir;
      });
    }

    return rows;
  }

  const presetBase = filterApplicationsByReportPreset(
    presetId,
    applications,
    committeeCases,
    user
  );

  const scopedApps = ignoreActiveFilters
    ? presetBase
    : filterApplicationsForAnalytics(
        presetBase,
        committeeCases,
        filters,
        user
      );

  const rows: FormattedReportRow[] = scopedApps.map((app) => {
    const statusMeta = getStaffApplicationStatusMeta(app.workflowStatus);
    const res = resolveAuthoritativeResultForRecord(app, committeeCases);
    const c = committeeCases[app.applicationId];

    let workflowStatusLabel = statusMeta.shortLabel || statusMeta.label;
    if (c) {
      if (c.isPublished) {
        workflowStatusLabel = 'Đã công bố kết quả';
      } else if (c.decision) {
        workflowStatusLabel = canSeeUnpublished
          ? 'Đã hoàn tất quyết định'
          : 'Đang chờ công bố kết quả';
      } else if (
        c.flaggedItems.some((f) => f.status === 'pending_consideration')
      ) {
        workflowStatusLabel = 'Chờ Hội đồng xem xét';
      } else {
        workflowStatusLabel = 'Chờ quyết định';
      }
    }

    let supplementStatusLabel = 'Không phát sinh';
    let supplementCriterionLabel = '—';
    if (
      app.supplementSummary.requestCount > 0 &&
      app.supplementSummary.latestRequest
    ) {
      const req = app.supplementSummary.latestRequest;
      supplementCriterionLabel = req.criterionName;
      if (req.staffStatus === 'waiting_student') {
        supplementStatusLabel = 'Đang chờ sinh viên bổ sung';
      } else if (req.staffStatus === 'student_returned') {
        supplementStatusLabel = 'Đã nhận bổ sung';
      } else {
        supplementStatusLabel = 'Đã tiếp tục xét';
      }
    }

    let decisionOutcomeLabel = 'Chưa có kết luận';
    let decidedAt = '—';
    let publicationStatusLabel = 'Chưa công bố';

    if (res.hasDecision) {
      if (res.isPublished || canSeeUnpublished) {
        decisionOutcomeLabel = res.outcomeLabel;
        decidedAt = formatCleanExportDate(res.decidedAt);
        publicationStatusLabel = res.isPublished
          ? 'Đã công bố'
          : 'Chưa công bố';
      } else {
        decisionOutcomeLabel = 'Chờ công bố chính thức';
        publicationStatusLabel = 'Chưa công bố';
      }
    }

    return {
      rowKey: app.applicationId,
      applicationId: app.applicationId,
      studentName: app.student.fullName,
      studentCode: app.student.studentCode,
      institutionId: app.institution.id,
      institutionName: app.institution.officialName,
      schoolYear: normalizeSchoolYearForExport(app.schoolYear),
      submittedAt: formatCleanExportDate(app.submittedAt),
      workflowStatusLabel,
      officerName: app.assignment?.officerName || 'Chưa phân công',
      assignedAt: formatCleanExportDate(app.assignment?.assignedAt),
      reviewProgressLabel: deriveApplicationCriteriaReviewProgress(app).compactProgressLabel,
      supplementStatusLabel,
      supplementCriterionLabel,
      decisionOutcomeLabel,
      decidedAt,
      publicationStatusLabel,
    };
  });

  if (sortKey) {
    const dir = sortDirection === 'desc' ? -1 : 1;
    rows.sort((a, b) => {
      const valA = String(
        (a as unknown as Record<string, unknown>)[sortKey] || ''
      );
      const valB = String(
        (b as unknown as Record<string, unknown>)[sortKey] || ''
      );
      return valA.localeCompare(valB, 'vi') * dir;
    });
  }

  return rows;
}

/**
 * Resolves exact rows to export based on ExportScopeType (Sections 56, 57, 59, 75, 76)
 */
export function getExportRows(params: {
  scope: ExportScopeType;
  filteredRows: FormattedReportRow[];
  allReportRows: FormattedReportRow[];
  selectedRowKeys: Set<string>;
}): FormattedReportRow[] {
  const { scope, filteredRows, allReportRows, selectedRowKeys } = params;
  if (scope === 'selected') {
    return filteredRows.filter((r) => selectedRowKeys.has(r.rowKey));
  }
  if (scope === 'all_in_report') {
    return allReportRows;
  }
  return filteredRows;
}

/**
 * Institution slug map for clean Vietnamese filenames (Section 72)
 * Example: 5TOT_DaNang_DHBachKhoa_DanhSachHoSo_2026-2027.xlsx
 */
const INSTITUTION_FILE_SLUG_MAP: Record<string, string> = {
  'inst-dut': 'DHBachKhoa',
  'inst-due': 'DHKinhTe',
  'inst-ued': 'DHSuPham',
  'inst-ufl': 'DHNgoaiNgu',
  'inst-ute': 'DHSuPhamKyThuat',
  'inst-vku': 'DHCNTTVaTruyenThongVietHan',
  'inst-vnuk': 'VienNCVaDaoTaoVietAnh',
  'inst-smp': 'KhoaYDuocDHDN',
  'inst-dtu': 'DHDuyTan',
  'inst-donga': 'DHDongA',
  'inst-dau': 'DHKienTruc',
  'inst-fpt': 'DHFPTDaNang',
  'inst-tyd': 'DHKyThuatYDuoc',
  'inst-tdtt': 'DHTheDucTheThao',
};

export function buildExportFilename(params: {
  report: ReportDefinition;
  institutionId: string;
  format: 'xlsx' | 'csv';
  schoolYear?: string;
}): string {
  const { report, institutionId, format, schoolYear } = params;
  const yearSlug = normalizeSchoolYearForExport(schoolYear || '2025–2026').replace(/[–—]/g, '-');
  const instSlug =
    institutionId !== 'all'
      ? INSTITUTION_FILE_SLUG_MAP[institutionId] || 'DonVi'
      : null;

  if (instSlug) {
    return `5TOT_DaNang_${instSlug}_${report.fileSlug}_${yearSlug}.${format}`;
  }
  return `5TOT_DaNang_${report.fileSlug}_${yearSlug}.${format}`;
}

/**
 * Audit Event for Exports (Sections 80 & 129)
 */
