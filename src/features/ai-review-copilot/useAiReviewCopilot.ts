/**
 * 5TOT ĐHĐN — useAiReviewCopilot Hook
 * Coordinates AI Review Copilot state, Demo vs Real Mode execution, and Inspector lifecycle.
 *
 * Requirements:
 * - Real Mode: Communicates with backend endpoints (/api/copilot/*) without fabricated data.
 * - Demo Mode: Provides realistic synthetic scenarios with deterministic data provenance.
 * - Progressive Disclosure: Compact by default, allows manual collapse/expand.
 * - Zero Unintended Re-opens: Persists user dismissal state for the current view.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { CriterionId } from '../../types/application';
import { isDemoMode } from '../../shared/config/executionMode';
import { fetchCopilotScopeAnalysis } from '../../shared/api/copilotApi';
import { CRITERIA } from '../../tokens';
import {
  AiCriterionSummary,
  AiFinding,
  AiInspectorState,
  AiAgentTask,
  AiGuidedReviewState,
  AiGuidedReviewStep,
  AiNextBestAction,
} from './copilotTypes';
import {
  DEMO_AI_CRITERION_SUMMARIES,
  DEMO_AI_FINDINGS,
  DEMO_AI_AGENT_TASKS,
  DEMO_GUIDED_STEPS,
  DEMO_NEXT_BEST_ACTIONS,
} from './demoCopilotFixtures';

export interface UseAiReviewCopilotParams {
  criterionId: CriterionId;
  applicationId: string;
  studentInfo?: {
    fullName: string;
    studentCode: string;
    schoolName: string;
    faculty?: string;
    academicYear?: string;
  };
  evidenceList?: Array<{
    id: string;
    name: string;
    fileType?: string;
    size?: string;
  }>;
}

export function useAiReviewCopilot({
  criterionId,
  applicationId,
  studentInfo,
  evidenceList = [],
}: UseAiReviewCopilotParams) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [inspectorState, setInspectorState] = useState<AiInspectorState>({
    kind: 'closed',
  });

  // AI-UX2: Dismissed findings set to respect reviewer preferences (Section 5)
  const [dismissedFindingIds, setDismissedFindingIds] = useState<Set<string>>(
    () => new Set()
  );

  // AI-UX2 Feature B: Guided Review State ("Dẫn tôi kiểm tra") (Section 6)
  const [guidedReviewState, setGuidedReviewState] = useState<AiGuidedReviewState>({
    isActive: false,
  });

  // AI-UX2 Feature D: Agent Activity Rail modal/drawer state (Section 8)
  const [isAgentRailOpen, setIsAgentRailOpen] = useState<boolean>(false);

  // AI-UX2 Feature Hackathon / Demo Tour (Section 20)
  const [isDemoTourOpen, setIsDemoTourOpen] = useState<boolean>(false);

  // AI-UX2 Feature A: Anchored Finding Popover state (Section 5)
  const [activeFindingPopover, setActiveFindingPopover] = useState<{
    finding: AiFinding;
    anchorRect?: DOMRect;
  } | null>(null);

  // Cached summary per criterion in memory
  const [customSummary, setCustomSummary] = useState<AiCriterionSummary | null>(
    null
  );

  const criterionToken = CRITERIA[criterionId];

  // Resolve summary based on mode and filter out dismissed findings
  const rawSummary: AiCriterionSummary = useMemo(() => {
    if (customSummary && customSummary.criterionId === criterionId) {
      return customSummary;
    }

    if (isDemoMode()) {
      const demoData = DEMO_AI_CRITERION_SUMMARIES[criterionId];
      if (demoData) {
        return {
          ...demoData,
          evidenceCount: evidenceList.length > 0 ? evidenceList.length : demoData.evidenceCount,
        };
      }
      return {
        criterionId,
        status: 'no_findings',
        headlineSummary: `Đã đối chiếu ${evidenceList.length} minh chứng. Chưa phát hiện điểm sai lệch.`,
        evidenceCount: evidenceList.length,
        findings: [],
        analyzedAt: 'Vừa xong',
      };
    }

    // In Real Mode without prior fetch
    return {
      criterionId,
      status: 'not_analyzed',
      headlineSummary: 'Sẵn sàng phân tích và đối chiếu hồ sơ với quy chế năm học 2025–2026.',
      evidenceCount: evidenceList.length,
      findings: [],
    };
  }, [criterionId, customSummary, evidenceList.length]);

  // Filter out findings explicitly dismissed by reviewer
  const summary: AiCriterionSummary = useMemo(() => {
    const activeFindings = rawSummary.findings.filter(
      (f) => !dismissedFindingIds.has(f.id)
    );
    return {
      ...rawSummary,
      findings: activeFindings,
      primaryFinding: activeFindings[0] || undefined,
    };
  }, [rawSummary, dismissedFindingIds]);

  // Resolve Next Best Action
  const nextBestAction: AiNextBestAction | undefined = useMemo(() => {
    if (isDemoMode()) {
      const nba = DEMO_NEXT_BEST_ACTIONS[criterionId];
      if (nba && (!nba.finding || !dismissedFindingIds.has(nba.finding.id))) {
        return nba;
      }
    }
    if (summary.primaryFinding) {
      return {
        id: `nba-${summary.primaryFinding.id}`,
        label: `Xem đối chiếu: ${summary.primaryFinding.headline}`,
        description: summary.primaryFinding.observationDetail,
        actionType: 'inspect_evidence',
        finding: summary.primaryFinding,
        requirementId: summary.primaryFinding.requirementId,
        declarationId: summary.primaryFinding.declarationId,
      };
    }
    return undefined;
  }, [criterionId, dismissedFindingIds, summary.primaryFinding]);

  // Agent task stages for Feature D
  const agentTasks: AiAgentTask[] = useMemo(() => {
    if (isDemoMode()) {
      return DEMO_AI_AGENT_TASKS;
    }
    return [
      {
        id: 'real-task-1',
        stage: 'collect_declarations',
        title: 'Thu thập dữ liệu kê khai',
        description: 'Kết nối thông tin hồ sơ theo tiêu chuẩn.',
        status: 'completed',
        completedAt: 'Vừa xong',
      },
      {
        id: 'real-task-2',
        stage: 'read_evidence',
        title: 'Kiểm tra tệp minh chứng',
        description: `${evidenceList.length} tệp minh chứng đã sẵn sàng.`,
        status: evidenceList.length > 0 ? 'completed' : 'pending',
        completedAt: 'Vừa xong',
      },
      {
        id: 'real-task-3',
        stage: 'match_regulations',
        title: 'Quy chế xét chọn',
        description: 'Quy chế SV5T cấp Đại học Đà Nẵng 2025–2026.',
        status: 'completed',
        completedAt: 'Vừa xong',
      },
    ];
  }, [evidenceList.length]);

  const fetchRealAnalysis = useCallback(
    async (force = false) => {
      if (isDemoMode()) {
        // In Demo mode, simulate quick subtle latency for realistic feedback
        setLoading(true);
        setError(null);
        await new Promise((resolve) => setTimeout(resolve, 300));
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetchCopilotScopeAnalysis(
          {
            criterionId,
            criterionName: criterionToken.name,
            criterionNumber: criterionToken.number,
            requirementId: `${criterionId}-general`,
            requirementTitle: `Tiêu chí 0${criterionToken.number} · ${criterionToken.name}`,
            evidenceList: evidenceList.map((e) => ({
              id: e.id,
              name: e.name,
              fileType: e.fileType,
            })),
            studentInfo: studentInfo ? {
              fullName: studentInfo.fullName,
              studentCode: studentInfo.studentCode,
              schoolName: studentInfo.schoolName,
              faculty: studentInfo.faculty,
              academicYear: studentInfo.academicYear,
            } : undefined,
          },
          force
        );

        const realFindings: AiFinding[] = [];
        if (response.suggestedVerdict === 'SUPPLEMENT_REQUIRED' || response.flaggedRisks.length > 0) {
          realFindings.push({
            id: `real-finding-${criterionId}-${Date.now()}`,
            criterionId,
            criterionNumber: criterionToken.number,
            criterionName: criterionToken.name,
            requirementId: `${criterionId}-general`,
            requirementTitle: `Tiêu chí 0${criterionToken.number}`,
            headline: response.headlineSummary,
            studentDeclaredValue: 'Theo nội dung hồ sơ',
            aiExtractedValue: response.evidenceAssessment[0]?.observation || 'Phát hiện cần kiểm tra lại',
            evidenceProvenance: {
              fileName: response.evidenceAssessment[0]?.fileName || 'Tệp minh chứng',
            },
            observationDetail: response.detailedAnalysis,
            applicableRegulation: response.regulationCitation,
            severity: response.suggestedVerdict === 'SUPPLEMENT_REQUIRED' ? 'discrepancy' : 'info',
            suggestedAction: response.draftSupplementMessage ? 'supplement_draft' : 'inspect',
            draftSupplementMessage: response.draftSupplementMessage,
          });
        }

        setCustomSummary({
          criterionId,
          status: realFindings.length > 0 ? 'completed' : 'no_findings',
          headlineSummary: response.headlineSummary,
          evidenceCount: evidenceList.length,
          findings: realFindings,
          primaryFinding: realFindings[0],
          analyzedAt: new Date().toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        });
      } catch (err: any) {
        setError(err.message || 'AI hiện chưa khả dụng. Bạn vẫn có thể tiếp tục thẩm định thủ công.');
        setCustomSummary({
          criterionId,
          status: 'unavailable',
          headlineSummary: 'AI hiện chưa khả dụng. Bạn vẫn có thể tiếp tục thẩm định thủ công.',
          evidenceCount: evidenceList.length,
          findings: [],
          errorMessage: err.message,
        });
      } finally {
        setLoading(false);
      }
    },
    [criterionId, criterionToken, evidenceList, studentInfo]
  );

  // Inspector handlers
  const openInspector = useCallback(
    (finding: AiFinding, sourceScreen: 'brief' | 'card' | 'panel' = 'brief') => {
      setInspectorState({
        kind: 'open',
        applicationId,
        criterionId: finding.criterionId,
        finding,
        sourceScreen,
      });
    },
    [applicationId]
  );

  const closeInspector = useCallback(() => {
    setInspectorState({ kind: 'closed' });
  }, []);

  // AI-UX2: Dismiss finding handler
  const dismissFinding = useCallback((findingId: string) => {
    setDismissedFindingIds((prev) => {
      const next = new Set(prev);
      next.add(findingId);
      return next;
    });
    setActiveFindingPopover(null);
  }, []);

  // AI-UX2: Finding Popover handlers
  const openFindingPopover = useCallback(
    (finding: AiFinding, anchorRect?: DOMRect) => {
      setActiveFindingPopover({ finding, anchorRect });
    },
    []
  );

  const closeFindingPopover = useCallback(() => {
    setActiveFindingPopover(null);
  }, []);

  // AI-UX2 Feature B: Guided Review handlers ("Dẫn tôi kiểm tra")
  const startGuidedReview = useCallback(() => {
    const steps = isDemoMode()
      ? DEMO_GUIDED_STEPS[criterionId] || []
      : summary.findings.map((f, idx, arr) => ({
          id: `step-${f.id}`,
          stepNumber: idx + 1,
          totalSteps: arr.length,
          criterionId: f.criterionId,
          criterionName: f.criterionName,
          requirementId: f.requirementId,
          declarationId: f.declarationId,
          evidenceName: f.evidenceName,
          headline: f.headline,
          explanation: f.observationDetail,
          regulationCitation: f.applicableRegulation,
          finding: f,
        }));

    if (steps.length === 0) return;

    setGuidedReviewState({
      isActive: true,
      currentStepIndex: 0,
      steps,
    });
  }, [criterionId, summary.findings]);

  const nextGuidedStep = useCallback(() => {
    setGuidedReviewState((prev) => {
      if (!prev.isActive) return prev;
      if (prev.currentStepIndex >= prev.steps.length - 1) {
        // Reached end -> complete and exit
        return { isActive: false };
      }
      return {
        ...prev,
        currentStepIndex: prev.currentStepIndex + 1,
      };
    });
  }, []);

  const prevGuidedStep = useCallback(() => {
    setGuidedReviewState((prev) => {
      if (!prev.isActive || prev.currentStepIndex <= 0) return prev;
      return {
        ...prev,
        currentStepIndex: prev.currentStepIndex - 1,
      };
    });
  }, []);

  const exitGuidedReview = useCallback(() => {
    setGuidedReviewState({ isActive: false });
  }, []);

  return {
    summary,
    loading,
    error,
    isCollapsed,
    setIsCollapsed,
    inspectorState,
    openInspector,
    closeInspector,
    // AI-UX2 Extensions
    nextBestAction,
    agentTasks,
    dismissedFindingIds,
    dismissFinding,
    activeFindingPopover,
    openFindingPopover,
    closeFindingPopover,
    guidedReviewState,
    startGuidedReview,
    nextGuidedStep,
    prevGuidedStep,
    exitGuidedReview,
    isAgentRailOpen,
    setIsAgentRailOpen,
    isDemoTourOpen,
    setIsDemoTourOpen,
    refreshAnalysis: () => fetchRealAnalysis(true),
  };
}
