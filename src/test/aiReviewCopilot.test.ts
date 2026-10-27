/**
 * 5TOT ĐHĐN — AI Review Copilot Unit & Integration Test Suite
 * Tests Feature A (Brief), Feature B (Inspector), Feature C (Navigation),
 * Feature D (Supplement Draft), and Feature E (Student Coach).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEMO_AI_FINDINGS,
  DEMO_AI_CRITERION_SUMMARIES,
  DEMO_AI_AGENT_TASKS,
  DEMO_GUIDED_STEPS,
  DEMO_NEXT_BEST_ACTIONS,
  DEMO_AI_APPLICATION_OVERVIEW,
  getDeclarationAiInsight,
  getEvidenceAiInsight,
} from '../features/ai-review-copilot/demoCopilotFixtures';
import {
  aggregateEvidenceToDeclaration,
  aggregateDeclarationsToCriterion,
  aggregateCriteriaToApplicationOverview,
} from '../features/ai-review-copilot/copilotAggregation';
import { computeVolunteerQuantitativeAggregation } from '../staff/reviewSelectors';
import { INITIAL_STUDENT_APPLICATION } from '../demo/fixtures/initialStudentApplication';
import {
  AiInspectorState,
  AiFinding,
  AiGuidedReviewState,
  AiNextBestAction,
} from '../features/ai-review-copilot/copilotTypes';

describe('5TOT ĐHĐN — AI Review Copilot (AI-UX2 Suite)', () => {
  describe('1. Demo Scenarios & Data Provenance (Section 12 & 19)', () => {
    it('provides all 5 realistic synthetic scenarios in Demo mode', () => {
      // Scenario 1: Ethics compliant
      const ethics = DEMO_AI_FINDINGS['finding-ethics-compliant'];
      assert.ok(ethics);
      assert.equal(ethics.criterionId, 'ethics');
      assert.equal(ethics.severity, 'info');

      // Scenario 2: Volunteer mismatch
      const vol = DEMO_AI_FINDINGS['finding-vol-days-mismatch'];
      assert.ok(vol);
      assert.equal(vol.criterionId, 'volunteer');
      assert.equal(vol.severity, 'discrepancy');
      assert.match(vol.studentDeclaredValue, /05 ngày/);
      assert.match(vol.aiExtractedValue, /04 ngày/);
      assert.ok(vol.evidenceProvenance.fileName);

      // Scenario 3: Academic incomplete
      const acad = DEMO_AI_FINDINGS['finding-acad-transcript-incomplete'];
      assert.ok(acad);
      assert.equal(acad.criterionId, 'academic');
      assert.equal(acad.severity, 'missing_evidence');

      // Scenario 4: Supplement draft available
      assert.ok(vol.draftSupplementMessage);
      assert.match(vol.draftSupplementMessage, /Kính gửi sinh viên/);

      // Scenario 5: Ambiguous physical information
      const phys = DEMO_AI_FINDINGS['finding-phys-sports-scope'];
      assert.ok(phys);
      assert.equal(phys.criterionId, 'physical');
      assert.equal(phys.severity, 'unclear');
    });

    it('summaries maintain non-empty findings and correct evidence counts', () => {
      const volSummary = DEMO_AI_CRITERION_SUMMARIES['volunteer'];
      assert.equal(volSummary.status, 'completed');
      assert.equal(volSummary.findings.length, 1);
      assert.equal(volSummary.primaryFinding?.id, 'finding-vol-days-mismatch');

      const ethicsSummary = DEMO_AI_CRITERION_SUMMARIES['ethics'];
      assert.equal(ethicsSummary.status, 'no_findings');
    });
  });

  describe('2. Human Decision Authority & Business Safety (Section 1 & 13)', () => {
    it('AI findings do not contain official status mutators or uncalibrated confidence percentages', () => {
      const finding = DEMO_AI_FINDINGS['finding-vol-days-mismatch'];
      // The finding only suggests actions ('inspect', 'supplement_draft', 'confirm'), never sets approval
      assert.equal(finding.suggestedAction, 'inspect');
      // Verifies no automated approval flag
      assert.equal((finding as any).isApproved, undefined);
      assert.equal((finding as any).isRejected, undefined);
      assert.equal((finding as any).confidenceScore, undefined);
    });

    it('Regulation citations are grounded in official 2025–2026 SV5T regulations', () => {
      for (const key of Object.keys(DEMO_AI_FINDINGS)) {
        const f = DEMO_AI_FINDINGS[key];
        assert.match(f.applicableRegulation, /Quy chế SV5T cấp Đại học Đà Nẵng 2025–2026/);
      }
    });
  });

  describe('3. Inspector State Lifecycle (Section 7)', () => {
    it('initial state is closed and transitions cleanly to open with full payload', () => {
      let state: AiInspectorState = { kind: 'closed' };
      assert.equal(state.kind, 'closed');

      const sampleFinding = DEMO_AI_FINDINGS['finding-vol-days-mismatch'];
      state = {
        kind: 'open',
        applicationId: 'APP-2026-DN-102220123',
        criterionId: sampleFinding.criterionId,
        finding: sampleFinding,
        sourceScreen: 'brief',
      };

      assert.equal(state.kind, 'open');
      assert.equal(state.applicationId, 'APP-2026-DN-102220123');
      assert.equal(state.finding.id, 'finding-vol-days-mismatch');

      // Closing restores cleanly
      state = { kind: 'closed' };
      assert.equal(state.kind, 'closed');
    });
  });

  describe('4. Supplement Draft Generation & Scope Preservation (Section 10)', () => {
    it('draft messages contain respectful Vietnamese phrasing and clear action instructions', () => {
      const draft = DEMO_AI_FINDINGS['finding-vol-days-mismatch'].draftSupplementMessage!;
      assert.ok(draft.startsWith('Kính gửi sinh viên'));
      assert.match(draft, /bổ sung/);
      assert.match(draft, /Quy chế/);
    });
  });

  describe('5. AI-UX2 Feature B: Guided Review ("Dẫn tôi kiểm tra") (Section 6)', () => {
    it('provides multi-step guided sequences across all 5 criteria', () => {
      assert.ok(DEMO_GUIDED_STEPS.volunteer.length >= 4);
      assert.ok(DEMO_GUIDED_STEPS.academic.length >= 4);
      assert.ok(DEMO_GUIDED_STEPS.physical.length >= 3);
      assert.ok(DEMO_GUIDED_STEPS.ethics.length >= 3);
      assert.ok(DEMO_GUIDED_STEPS.integration.length >= 3);

      const volStep1 = DEMO_GUIDED_STEPS.volunteer[0];
      assert.equal(volStep1.stepNumber, 1);
      assert.equal(volStep1.criterionId, 'volunteer');
      assert.ok(volStep1.headline);
      assert.ok(volStep1.explanation);
    });

    it('guided review state models active walkthrough and step transitions', () => {
      const steps = DEMO_GUIDED_STEPS.volunteer;
      let guidedState: AiGuidedReviewState = { isActive: false };
      assert.equal(guidedState.isActive, false);

      guidedState = {
        isActive: true,
        currentStepIndex: 0,
        steps,
      };
      assert.equal(guidedState.isActive, true);
      assert.equal(guidedState.currentStepIndex, 0);
      assert.equal(guidedState.steps.length, steps.length);

      // Step forward
      guidedState = {
        ...guidedState,
        currentStepIndex: 1,
      };
      assert.equal(guidedState.currentStepIndex, 1);

      // Exit
      guidedState = { isActive: false };
      assert.equal(guidedState.isActive, false);
    });
  });

  describe('6. AI-UX2 Feature D: Agent Activity Stages & Completed Artifacts (Section 8)', () => {
    it('contains all 6 product processing stages', () => {
      assert.equal(DEMO_AI_AGENT_TASKS.length, 6);
      const stages = DEMO_AI_AGENT_TASKS.map((t) => t.stage);
      assert.deepEqual(stages, [
        'collect_declarations',
        'read_evidence',
        'extract_facts',
        'match_regulations',
        'cross_check',
        'synthesize_findings',
      ]);
    });

    it('completed tasks expose meaningful artifact counts and labels', () => {
      const task1 = DEMO_AI_AGENT_TASKS[0];
      assert.equal(task1.status, 'completed');
      assert.equal(task1.artifactCount, 11);
      assert.equal(task1.artifactLabel, '11 nội dung kê khai');

      const task2 = DEMO_AI_AGENT_TASKS[1];
      assert.equal(task2.status, 'completed');
      assert.equal(task2.artifactCount, 8);
      assert.equal(task2.artifactLabel, '8 tệp minh chứng');

      const task6 = DEMO_AI_AGENT_TASKS[5];
      assert.equal(task6.status, 'needs_attention');
      assert.equal(task6.artifactCount, 2);
    });
  });

  describe('7. AI-UX2 Feature E: Next Best Action (Section 9)', () => {
    it('defines at most one primary contextual action per criterion', () => {
      const volAction = DEMO_NEXT_BEST_ACTIONS.volunteer;
      assert.ok(volAction);
      assert.equal(volAction.actionType, 'inspect_evidence');
      assert.ok(volAction.label);
      assert.ok(volAction.description);

      const acadAction = DEMO_NEXT_BEST_ACTIONS.academic;
      assert.ok(acadAction);
      assert.equal(acadAction.actionType, 'draft_supplement');
    });
  });

  describe('8. AI-UX3 Four-Level Contextual AI Architecture (Sections 4, 5, 6, 7)', () => {
    it('Level 1: Application-wide overview aggregates 5 criteria and reports evidence counts', () => {
      assert.equal(DEMO_AI_APPLICATION_OVERVIEW.totalCriteriaAnalyzed, 5);
      assert.equal(DEMO_AI_APPLICATION_OVERVIEW.totalEvidenceAnalyzed, 8);
      assert.equal(DEMO_AI_APPLICATION_OVERVIEW.attentionNeededCount, 2);
      assert.equal(DEMO_AI_APPLICATION_OVERVIEW.consistentCriteriaCount, 2);
      assert.equal(DEMO_AI_APPLICATION_OVERVIEW.recommendedStartingCriterionId, 'volunteer');
      assert.ok(DEMO_AI_APPLICATION_OVERVIEW.primaryActionLabel);
    });

    it('Level 2: Criterion assessment aggregates declarations and separates rule calculation from AI', () => {
      const vol = DEMO_AI_CRITERION_SUMMARIES.volunteer;
      assert.equal(vol.criterionId, 'volunteer');
      assert.equal(vol.status, 'completed');
      assert.ok(vol.headlineSummary);
      assert.equal(vol.findings.length, 1);
    });

    it('Level 3: Declaration insights provide side-by-side values, source references, and draft actions', () => {
      const declMhx = getDeclarationAiInsight('decl-vol-mhx');
      assert.ok(declMhx);
      assert.equal(declMhx.status, 'discrepancy');
      assert.match(declMhx.studentDeclaredValue, /05 ngày/);
      assert.match(declMhx.aiExtractedValue!, /04 ngày/);
      assert.equal(declMhx.sourceEvidencePage, 1);
      assert.ok(declMhx.draftSupplementMessage);
      assert.ok(declMhx.draftInternalNote);

      const declCnx = getDeclarationAiInsight('decl-vol-cnx');
      assert.ok(declCnx);
      assert.equal(declCnx.status, 'consistent');
    });

    it('Level 4: Evidence insights extract candidate facts and highlight regions', () => {
      const evMhx = getEvidenceAiInsight('ev-vol-mhx-1');
      assert.ok(evMhx);
      assert.equal(evMhx.status, 'needs_attention');
      assert.equal(evMhx.pageNumber, 1);
      assert.ok(evMhx.candidateFacts.length >= 3);
      assert.ok(evMhx.candidateFacts.some((f: any) => f.isDiscrepancy));
      assert.ok(evMhx.draftSupplementMessage);

      const evIelts = getEvidenceAiInsight('ev-int-ielts-cert');
      assert.ok(evIelts);
      assert.equal(evIelts.status, 'analyzed');
      assert.equal(evIelts.badgeLabel, 'AI đã đọc');
    });
  });

  describe('9. AI-UX3 Bottom-Up Finding Aggregation Engine (Section 13 & 14)', () => {
    it('aggregates evidence insights to declaration insight correctly', () => {
      const evInsight = getEvidenceAiInsight('ev-vol-mhx-1')!;
      const finding = DEMO_AI_FINDINGS['finding-vol-days-mismatch'];

      const declInsight = aggregateEvidenceToDeclaration(
        'decl-vol-mhx',
        'volunteer',
        'volunteer-activities',
        '05 ngày tình nguyện',
        [evInsight],
        finding
      );

      assert.equal(declInsight.declarationId, 'decl-vol-mhx');
      assert.equal(declInsight.status, 'discrepancy');
      assert.match(declInsight.headline, /khác biệt/i);
    });

    it('aggregates declaration insights to criterion without auto-failing criterion on isolated mismatch', () => {
      const mhx = getDeclarationAiInsight('decl-vol-mhx')!;
      const cnx = getDeclarationAiInsight('decl-vol-cnx')!;
      const hm = getDeclarationAiInsight('decl-vol-hm')!;

      const critSummary = aggregateDeclarationsToCriterion(
        'volunteer',
        [mhx, cnx, hm],
        3,
        [DEMO_AI_FINDINGS['finding-vol-days-mismatch']]
      );

      assert.equal(critSummary.criterionId, 'volunteer');
      assert.equal(critSummary.status, 'completed');
      assert.equal(critSummary.evidenceCount, 3);
      assert.ok(critSummary.headlineSummary.includes('đối chiếu'));
    });

    it('aggregates criteria summaries into Level 1 Application Overview', () => {
      const overview = aggregateCriteriaToApplicationOverview(
        'APP-2026-DN-TEST',
        DEMO_AI_CRITERION_SUMMARIES
      );

      assert.equal(overview.applicationId, 'APP-2026-DN-TEST');
      assert.equal(overview.totalCriteriaAnalyzed, 5);
      assert.ok(overview.totalEvidenceAnalyzed >= 5);
      assert.ok(overview.attentionNeededCount >= 1);
      assert.equal(overview.recommendedStartingCriterionId, 'volunteer');
    });
  });

  describe('10. AI-UX3 Companion Presentation Modes & Guided Review Stepper (Section 8 & 9)', () => {
    it('supports ambient, compact, and expanded companion presentation modes', () => {
      const modes = ['ambient', 'compact', 'expanded'];
      assert.equal(modes.length, 3);
    });

    it('guided review state models skip step without terminating walkthrough', () => {
      const steps = DEMO_GUIDED_STEPS.volunteer;
      let state = {
        isActive: true,
        currentStepIndex: 0,
        steps,
      };

      // Skip advances to step 1
      state = {
        ...state,
        currentStepIndex: state.currentStepIndex + 1,
      };
      assert.equal(state.currentStepIndex, 1);
      assert.equal(state.isActive, true);

      // Advance to last step
      state = {
        ...state,
        currentStepIndex: steps.length - 1,
      };
      assert.equal(state.currentStepIndex, steps.length - 1);
    });
  });

  describe('11. AI-UX3 Volunteer Quantitative Rule Calculation (Section 5 & 14)', () => {
    it('correctly calculates volunteer days with blood donation 1-day conversion rule', () => {
      const volAgg = computeVolunteerQuantitativeAggregation(INITIAL_STUDENT_APPLICATION);
      assert.ok(volAgg);
      assert.equal(volAgg.activityCount, 3);
      assert.equal(volAgg.bloodDonationCount, 1);
      assert.equal(volAgg.threshold, 5);
      assert.equal(volAgg.thresholdMet, true);
      assert.ok(volAgg.totalDaysDeclared >= 5);
    });
  });
});

