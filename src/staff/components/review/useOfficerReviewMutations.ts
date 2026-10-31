import { isMatchingDeclarationId, isMatchingRequirementId } from '../../../components/supplement/supplementHelpers';
import { parseFlexibleDateTime } from '../../../utils/dateUtils';
import { apiRequest } from '../../../shared/api/httpClient';
/**
 * 5TOT ĐHĐN — Officer Review Mutations Hook
 * Extracted mutation handlers for OfficerReviewWorkspace:
 * - Start review session
 * - Update scope status
 * - Update evidence status & notes
 * - Save internal notes & consideration reasons
 * - Send supplement requests
 * - Continue review after supplement
 * - Complete criterion & complete application
 */

import { useCallback } from 'react';
import { CriterionDefinition } from '../../../tokens';
import { StaffApplicationRecord, StaffUser } from '../../types';
import { ReviewStage } from '../../schoolReviewTypes';
import {
  ApplicationReviewWorkspaceState,
  SelectedReviewScope,
  StaffEvidenceReviewRecord,
  StaffEvidenceReviewStatus,
  StaffItemReviewStatus,
  CriterionConclusionOutcome,
} from '../../reviewTypes';
import {
  StudentApplicationData,
} from '../../../demo/fixtures/studentApplication';
import { SupplementRequestFormPayload } from './SupplementRequestFormModal';
import {
  buildStartReviewMutation,
  buildUpdateScopeStatusMutation,
  buildUpdateEvidenceStatusMutation,
  buildSaveInternalNoteMutation,
  buildSaveConsiderationReasonMutation,
  buildSendSupplementMutation,
  buildContinueAfterSupplementMutation,
  buildCompleteCriterionMutation,
  buildCompleteApplicationMutation,
  buildRecordCriterionConclusionMutation,
  buildRevokeCriterionConclusionMutation,
  buildReopenApplicationReviewMutation,
} from '../../../entities/review/officerReviewMutators';

export interface UseOfficerReviewMutationsProps {
  currentUser: StaffUser;
  applicationRecord: StaffApplicationRecord | null | undefined;
  studentApp: StudentApplicationData;
  activeCriterionId: CriterionDefinition['id'];
  selectedScope: SelectedReviewScope;
  effectiveCanMutate: boolean;
  effectiveStage: ReviewStage;
  isSchoolStage: boolean;
  schoolReviewUnitName?: string;
  isCompletionAllowed: boolean;
  onMutateWorkspaceState: (
    updater: (
      prevWorkspace: ApplicationReviewWorkspaceState,
      prevStudentApp: StudentApplicationData
    ) => any
  ) => void;
  showToast: (msg: string) => void;
}

export function useOfficerReviewMutations({
  currentUser,
  applicationRecord,
  studentApp,
  activeCriterionId,
  selectedScope,
  effectiveCanMutate,
  effectiveStage,
  isSchoolStage,
  schoolReviewUnitName,
  isCompletionAllowed,
  onMutateWorkspaceState,
  showToast,
}: UseOfficerReviewMutationsProps) {
  const handleStartReview = useCallback(() => {
    onMutateWorkspaceState((prevWs, prevStudentApp) =>
      buildStartReviewMutation(
        prevWs,
        prevStudentApp,
        currentUser,
        isSchoolStage
      )
    );
    showToast(
      isSchoolStage
        ? 'Đã bắt đầu phiên xét sơ tuyển. Các thao tác đánh giá chuyên môn cấp Trường đã sẵn sàng.'
        : 'Đã bắt đầu phiên xét hồ sơ. Các thao tác đánh giá chuyên môn đã sẵn sàng.'
    );
  }, [currentUser, isSchoolStage, onMutateWorkspaceState, showToast]);

  const handleUpdateScopeStatus = useCallback(
    (scope: SelectedReviewScope, nextStatus: StaffItemReviewStatus) => {
      if (!effectiveCanMutate) return;

      const targetAppId = applicationRecord?.applicationId || studentApp.applicationId;
      const targetStaffToken =
        (currentUser as any).token ||
        `staff-token-${currentUser.id || (isSchoolStage ? 'staff-sch-dut' : 'staff-off-nam')}`;
      const staffActor = {
        userId: currentUser.id || (isSchoolStage ? 'staff-sch-dut' : 'staff-off-nam'),
        userName: currentUser.fullName,
        userEmail: currentUser.email || (isSchoolStage ? 'canbo.dut@udn.vn' : 'canbo.dhdn@udn.vn'),
        role: currentUser.primaryRole || (isSchoolStage ? 'SCHOOL_OFFICER' : 'CITY_OFFICER'),
        unitId: currentUser.schoolReviewUnitId || (isSchoolStage ? 'unit-dut' : undefined),
        token: targetStaffToken,
      };

      onMutateWorkspaceState((prevWs) => {
        if (targetAppId && (nextStatus === 'suitable' || nextStatus === 'unsuitable')) {
          const matchingSupRequests = (prevWs.supplementRequests || []).filter((r) => {
            const isTarget =
              isMatchingDeclarationId(r.declarationId, scope.declarationId) ||
              (!scope.declarationId &&
                (isMatchingRequirementId(r.requirementId, scope.requirementId) ||
                  r.criterionId === scope.criterionId));
            return (
              isTarget &&
              (r.status === 'active' ||
                r.staffStatus === 'waiting_student' ||
                r.staffStatus === 'student_returned' ||
                (r.status as string) === 'responded')
            );
          });

          for (const sup of matchingSupRequests) {
            apiRequest(
              `/api/v2/school-reviews/${encodeURIComponent(targetAppId)}/supplements/${encodeURIComponent(sup.id)}/resolve`,
              {
                method: 'PUT',
                body: {
                  status:
                    nextStatus === 'suitable'
                      ? 'RESOLVED_SATISFIED'
                      : 'RESOLVED_UNSATISFIED',
                  resolutionNote:
                    nextStatus === 'suitable'
                      ? 'Cán bộ đã thẩm định bổ sung đạt yêu cầu.'
                      : 'Cán bộ thẩm định bổ sung chưa đạt.',
                },
                actor: staffActor,
              }
            ).catch((err) => {
              console.warn('Backend resolve supplement notice:', err);
            });
          }
        }

        return buildUpdateScopeStatusMutation(
          prevWs,
          scope,
          nextStatus,
          currentUser,
          applicationRecord?.workflowStatus
        );
      });
    },
    [
      effectiveCanMutate,
      onMutateWorkspaceState,
      currentUser,
      applicationRecord,
      studentApp.applicationId,
      isSchoolStage,
    ]
  );

  const handleUpdateEvidenceStatus = useCallback(
    (
      evidenceId: string,
      nextStatus: StaffEvidenceReviewStatus,
      noteText?: string,
      unsuitableReason?: string,
      considerationReason?: string
    ) => {
      if (!effectiveCanMutate) return;
      onMutateWorkspaceState((prevWs) =>
        buildUpdateEvidenceStatusMutation(
          prevWs,
          evidenceId,
          nextStatus,
          activeCriterionId,
          selectedScope,
          currentUser,
          applicationRecord?.workflowStatus,
          noteText,
          unsuitableReason,
          considerationReason
        )
      );
      showToast('Đã lưu kết quả kiểm tra cho minh chứng này.');
    },
    [
      effectiveCanMutate,
      onMutateWorkspaceState,
      activeCriterionId,
      selectedScope,
      currentUser,
      applicationRecord?.workflowStatus,
      showToast,
    ]
  );

  const handleSaveEvidenceNote = useCallback(
    (evidenceId: string, noteText: string) => {
      if (!effectiveCanMutate) return;
      onMutateWorkspaceState((prevWs) => {
        const existing = prevWs.evidenceRecords?.[evidenceId];
        const nextEvidenceRecord: StaffEvidenceReviewRecord = {
          evidenceId,
          applicationId: prevWs.applicationId,
          criterionId: activeCriterionId,
          requirementId: selectedScope.requirementId,
          declarationId: selectedScope.declarationId,
          reviewerId: currentUser.id,
          reviewerName: currentUser.fullName,
          status: existing?.status || 'viewed',
          internalNote: noteText,
          unsuitableReason: existing?.unsuitableReason,
          considerationReason: existing?.considerationReason,
          reviewedAt: '17/10/2026 · 15:15',
        };
        return {
          nextWorkspace: {
            ...prevWs,
            evidenceRecords: {
              ...(prevWs.evidenceRecords || {}),
              [evidenceId]: nextEvidenceRecord,
            },
          },
        };
      });
    },
    [
      effectiveCanMutate,
      onMutateWorkspaceState,
      activeCriterionId,
      selectedScope,
      currentUser,
    ]
  );

  const handleSaveInternalNote = useCallback(
    (scope: SelectedReviewScope, noteText: string): boolean => {
      if (!effectiveCanMutate) return false;
      onMutateWorkspaceState((prevWs) =>
        buildSaveInternalNoteMutation(
          prevWs,
          scope,
          noteText,
          currentUser,
          applicationRecord?.workflowStatus
        )
      );
      return true;
    },
    [effectiveCanMutate, onMutateWorkspaceState, currentUser, applicationRecord]
  );

  const handleSaveConsiderationReason = useCallback(
    (scope: SelectedReviewScope, reasonText: string) => {
      if (!effectiveCanMutate) return;
      onMutateWorkspaceState((prevWs) =>
        buildSaveConsiderationReasonMutation(
          prevWs,
          scope,
          reasonText,
          currentUser
        )
      );
      showToast(
        'Đã ghi nhận nội dung Cần xem xét thêm để trình Quản lý / Hội đồng.'
      );
    },
    [effectiveCanMutate, onMutateWorkspaceState, currentUser, showToast]
  );

  const handleConfirmSendSupplement = useCallback(
    async (payload: SupplementRequestFormPayload): Promise<boolean> => {
      if (!effectiveCanMutate) return false;

      // Authoritative Wire to Backend V2 School Reviews API
      const targetAppId = applicationRecord?.applicationId || studentApp.applicationId;
      const targetStaffToken =
        (currentUser as any).token ||
        `staff-token-${currentUser.id || (isSchoolStage ? 'staff-sch-dut' : 'staff-off-nam')}`;
      const staffActor = {
        userId: currentUser.id || (isSchoolStage ? 'staff-sch-dut' : 'staff-off-nam'),
        userName: currentUser.fullName,
        userEmail: currentUser.email || (isSchoolStage ? 'canbo.dut@udn.vn' : 'canbo.dhdn@udn.vn'),
        role: currentUser.primaryRole || (isSchoolStage ? 'SCHOOL_OFFICER' : 'CITY_OFFICER'),
        unitId: currentUser.schoolReviewUnitId || (isSchoolStage ? 'unit-dut' : undefined),
        token: targetStaffToken,
      };

      if (targetAppId) {
        let parsedDeadline: string | undefined = undefined;
        if (payload.requestedDueDate) {
          const d = parseFlexibleDateTime(payload.requestedDueDate);
          if (d) {
            parsedDeadline = d.toISOString();
          }
        }

        const ACTION_LABELS: Record<string, string> = {
          addEvidence: 'Bổ sung minh chứng mới',
          editDeclaration: 'Chỉnh sửa thông tin kê khai',
          replaceEvidence: 'Thay thế minh chứng hiện tại',
          addDeclaration: 'Kê khai thêm thông tin / hoạt động mới',
          explanation: 'Giải trình / xác nhận nội dung',
        };
        const friendlyActions = Array.isArray(payload.allowedActions)
          ? payload.allowedActions.map((a) => ACTION_LABELS[a] || a).join(', ')
          : 'Bổ sung minh chứng mới';

        const supplementPayload = {
          criterionOrReqCode: payload.scope.requirementId || payload.scope.criterionId,
          scopeType: payload.scope.declarationId ? 'DECLARATION_ITEM' : 'CRITERION_OR_REQUIREMENT',
          targetDeclarationId: payload.scope.declarationId || undefined,
          criterionName: payload.criterionName,
          requirementTitle: payload.requirementTitle,
          declarationTitle: payload.declarationTitle,
          requestReason: payload.message,
          requiredAction: friendlyActions,
          allowedActions: payload.allowedActions || ['addEvidence'],
          deadlineAt: parsedDeadline,
        };

        let createdSupplementId: string | undefined = undefined;
        try {
          const res = await apiRequest(
            `/api/v2/school-reviews/${encodeURIComponent(targetAppId)}/supplements`,
            {
              method: 'POST',
              body: supplementPayload,
              actor: staffActor,
            }
          );
          createdSupplementId = (res as any)?.data?.id || (res as any)?.id;
        } catch (err: any) {
          const msg = err?.message || 'Lỗi gửi yêu cầu bổ sung đến máy chủ.';
          console.error('Backend V2 School Review supplement request notice:', err);
          showToast(`Lỗi gửi yêu cầu bổ sung: ${msg}`);
          throw err;
        }
      }

      onMutateWorkspaceState((prevWs) =>
        buildSendSupplementMutation(
          prevWs,
          payload,
          studentApp,
          currentUser,
          effectiveStage,
          isSchoolStage,
          schoolReviewUnitName,
          createdSupplementId
        )
      );

      showToast(
        'Đã gửi yêu cầu bổ sung và gửi email thông báo qua Resend đến sinh viên!'
      );
      return true;
    },
    [
      effectiveCanMutate,
      studentApp,
      onMutateWorkspaceState,
      currentUser,
      effectiveStage,
      isSchoolStage,
      schoolReviewUnitName,
      showToast,
      applicationRecord,
    ]
  );

  const handleContinueReviewAfterSupplement = useCallback(
    (scope: SelectedReviewScope) => {
      if (!effectiveCanMutate) return;
      onMutateWorkspaceState((prevWs) =>
        buildContinueAfterSupplementMutation(prevWs, scope, currentUser)
      );
      showToast(
        'Đã chuyển nội dung sang trạng thái Đang xét. Vui lòng kiểm tra và nhấn "Hoàn tất xét nội dung" khi hoàn tất.'
      );
    },
    [effectiveCanMutate, onMutateWorkspaceState, currentUser, showToast]
  );

  const handleCompleteCriterion = useCallback(
    (critId: CriterionDefinition['id']) => {
      if (!effectiveCanMutate) return;
      onMutateWorkspaceState((prevWs) =>
        buildCompleteCriterionMutation(prevWs, critId, currentUser)
      );
      showToast(`Đã đánh dấu hoàn tất kiểm tra Tiêu chí ${critId}.`);
    },
    [effectiveCanMutate, onMutateWorkspaceState, currentUser, showToast]
  );

  const handleConfirmCompleteApplicationReview = useCallback((): boolean => {
    if (!effectiveCanMutate || !isCompletionAllowed) return false;
    onMutateWorkspaceState((prevWs) =>
      buildCompleteApplicationMutation(prevWs, currentUser, isSchoolStage)
    );
    showToast(
      isSchoolStage
        ? 'Đã hoàn tất xét sơ tuyển cấp Trường. Hồ sơ đã được cập nhật sang danh sách Chờ đề xuất chuyển cấp ĐHĐN.'
        : 'Đã hoàn tất phần xét hồ sơ. Hồ sơ đã được chuyển sang bước xử lý tiếp theo.'
    );
    return true;
  }, [
    effectiveCanMutate,
    isCompletionAllowed,
    isSchoolStage,
    onMutateWorkspaceState,
    currentUser,
    showToast,
  ]);

  const handleRecordCriterionConclusion = useCallback(
    (
      critId: CriterionDefinition['id'],
      conclusion: CriterionConclusionOutcome,
      reason?: string
    ) => {
      if (!effectiveCanMutate) return;
      onMutateWorkspaceState((prevWs) =>
        buildRecordCriterionConclusionMutation(
          prevWs,
          critId,
          conclusion,
          reason,
          currentUser,
          effectiveStage
        )
      );
      showToast(
        conclusion === 'pass'
          ? `Đã ghi nhận kết luận: Đạt tiêu chí ${critId}.`
          : `Đã ghi nhận kết luận: Không đạt tiêu chí ${critId}.`
      );
    },
    [effectiveCanMutate, onMutateWorkspaceState, currentUser, effectiveStage, showToast]
  );

  const handleRevokeCriterionConclusion = useCallback(
    (critId: CriterionDefinition['id']) => {
      if (!effectiveCanMutate) return;
      onMutateWorkspaceState((prevWs) =>
        buildRevokeCriterionConclusionMutation(
          prevWs,
          critId,
          currentUser,
          effectiveStage
        )
      );
      showToast(`Đã hoàn tác kết luận tiêu chí. Bạn có thể xét lại tiêu chí này.`);
    },
    [effectiveCanMutate, onMutateWorkspaceState, currentUser, effectiveStage, showToast]
  );

  const handleReopenApplicationReview = useCallback(() => {
    if (!effectiveCanMutate) return;
    onMutateWorkspaceState((prevWs) =>
      buildReopenApplicationReviewMutation(prevWs, currentUser, isSchoolStage)
    );
    showToast(
      isSchoolStage
        ? 'Đã hoàn tác chốt xét sơ tuyển. Bạn có thể chỉnh sửa lại đánh giá và kết luận tiêu chí.'
        : 'Đã hoàn tác chốt thẩm định. Bạn có thể chỉnh sửa lại đánh giá và kết luận tiêu chí.'
    );
  }, [effectiveCanMutate, onMutateWorkspaceState, currentUser, isSchoolStage, showToast]);

  return {
    handleStartReview,
    handleUpdateScopeStatus,
    handleUpdateEvidenceStatus,
    handleSaveEvidenceNote,
    handleSaveInternalNote,
    handleSaveConsiderationReason,
    handleConfirmSendSupplement,
    handleContinueReviewAfterSupplement,
    handleCompleteCriterion,
    handleConfirmCompleteApplicationReview,
    handleRecordCriterionConclusion,
    handleRevokeCriterionConclusion,
    handleReopenApplicationReview,
  };
}
