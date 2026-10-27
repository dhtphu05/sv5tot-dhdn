/**
 * 5TOT Đà Nẵng — Individual Criteria Domain Service Unit Tests (Backend V2)
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { FakeCriteriaRepository } from '../fakes/fakeCriteriaRepository';
import { CriteriaService } from '../../src/modules/criteria/criteria.service';
import { DeclarationItemInput } from '../../src/modules/criteria/criteria.types';

describe('Backend V2: Individual Criteria Domain Service Unit Tests', () => {
  let fakeRepo: FakeCriteriaRepository;
  let service: CriteriaService;

  beforeEach(() => {
    fakeRepo = new FakeCriteriaRepository();
    service = new CriteriaService(fakeRepo);
  });

  it('retrieves exactly the 5 canonical criteria groups for the season', async () => {
    const groups = await service.getSeasonCriteria('season-2025-2026', 'INDIVIDUAL');
    assert.ok(groups.length >= 5);

    const codes = new Set(groups.map((g) => g.code));
    assert.ok(codes.has('ETHICS'));
    assert.ok(codes.has('ACADEMIC'));
    assert.ok(codes.has('PHYSICAL'));
    assert.ok(codes.has('VOLUNTEER'));
    assert.ok(codes.has('INTEGRATION'));

    // Strictly NO 6th criterion
    assert.equal(codes.size, 5);
  });

  it('evaluates completely met individual application (all 5 criteria satisfied)', () => {
    const fullyQualifiedDeclarations: DeclarationItemInput[] = [
      // 1. ETHICS: TC1.1 (Score) + TC1.2 (Law) + TC1.3 (Party)
      { criterionCode: 'ETHICS', requirementCode: 'TC1.1', value: '88/100', evidenceCount: 1 },
      { criterionCode: 'ETHICS', requirementCode: 'TC1.2', value: 'Không vi phạm', evidenceCount: 0 },
      { criterionCode: 'ETHICS', requirementCode: 'TC1.3', value: 'Đảng viên ĐCSVN', evidenceCount: 1 },

      // 2. ACADEMIC: TC2.1 (GPA) + TC2.2 (NCKH)
      { criterionCode: 'ACADEMIC', requirementCode: 'TC2.1', value: '3.6/4.0', evidenceCount: 1 },
      { criterionCode: 'ACADEMIC', requirementCode: 'TC2.2', value: 'Giải Nhất NCKH cấp Trường', evidenceCount: 1 },

      // 3. PHYSICAL: TC3.1 (Thanh niên khỏe)
      { criterionCode: 'PHYSICAL', requirementCode: 'TC3.1', value: 'Chứng nhận Thanh niên khỏe', evidenceCount: 1 },

      // 4. VOLUNTEER: TC4.1 (Activities >= 5 days)
      { criterionCode: 'VOLUNTEER', requirementCode: 'TC4.1', value: '5 ngày tình nguyện', evidenceCount: 2 },

      // 5. INTEGRATION: TC5.1 (Group A - Soft Skills) + TC5.4 (Group B - IELTS 6.5)
      { criterionCode: 'INTEGRATION', requirementCode: 'TC5.1', value: 'Kỹ năng làm việc nhóm', evidenceCount: 1 },
      { criterionCode: 'INTEGRATION', requirementCode: 'TC5.4', value: 'IELTS 6.5', evidenceCount: 1 },
    ];

    const evaluation = service.evaluateIndividualAdvisory(fullyQualifiedDeclarations);

    assert.equal(evaluation.isOverallEligible, true);
    assert.equal(evaluation.readinessPercentage, 100);
    assert.equal(evaluation.isSubmissionBlocked, false);
    assert.equal(evaluation.missingRequirements.length, 0);
    assert.equal(evaluation.criteriaResults.ETHICS.isMet, true);
    assert.equal(evaluation.criteriaResults.ACADEMIC.isMet, true);
    assert.equal(evaluation.criteriaResults.PHYSICAL.isMet, true);
    assert.equal(evaluation.criteriaResults.VOLUNTEER.isMet, true);
    assert.equal(evaluation.criteriaResults.INTEGRATION.isMet, true);
  });

  it('ALTERNATIVE FULFILLMENT: 1 eligible alternative satisfies AT_LEAST_N requirement group', () => {
    // Student selects ONLY TC2.3 (Journal paper) without NCKH (TC2.2) or Innovation (TC2.7)
    const declarations: DeclarationItemInput[] = [
      { criterionCode: 'ACADEMIC', requirementCode: 'TC2.1', value: '3.4/4.0', evidenceCount: 1 },
      { criterionCode: 'ACADEMIC', requirementCode: 'TC2.3', value: 'Bài báo IEEE', evidenceCount: 1 },
    ];

    const evaluation = service.evaluateIndividualAdvisory(declarations);
    // Academic criterion is MET because 1 alternative out of 6 was selected!
    assert.equal(evaluation.criteriaResults.ACADEMIC.isMet, true);
  });

  it('VOLUNTARY EXTRA EVIDENCE: Student can voluntarily declare multiple alternatives and multiple evidence items', () => {
    // Student declares BOTH TC2.2 (NCKH) AND TC2.3 (Journal paper) AND attaches 3 evidence items
    const declarations: DeclarationItemInput[] = [
      { criterionCode: 'ACADEMIC', requirementCode: 'TC2.1', value: '3.5/4.0', evidenceCount: 1 },
      { criterionCode: 'ACADEMIC', requirementCode: 'TC2.2', value: 'Giải Ba NCKH', evidenceCount: 2 },
      { criterionCode: 'ACADEMIC', requirementCode: 'TC2.3', value: 'Bài báo tạp chí', evidenceCount: 3 },
    ];

    const evaluation = service.evaluateIndividualAdvisory(declarations);
    assert.equal(evaluation.criteriaResults.ACADEMIC.isMet, true);
    assert.equal(evaluation.criteriaResults.ACADEMIC.declaredCount, 3);
    assert.equal(evaluation.criteriaResults.ACADEMIC.evidenceCount, 6);
    // Crucial: extra voluntary evidence does NOT become an additional requirement or block!
    assert.equal(evaluation.isSubmissionBlocked, false);
  });

  it('PHYSICAL ALTERNATIVES: TC3.2 (Sports) satisfies when TC3.1 is not declared', () => {
    const declarations: DeclarationItemInput[] = [
      { criterionCode: 'PHYSICAL', requirementCode: 'TC3.2', value: 'Huy chương Vàng Bơi lội', evidenceCount: 1 },
    ];

    const evaluation = service.evaluateIndividualAdvisory(declarations);
    assert.equal(evaluation.criteriaResults.PHYSICAL.isMet, true);
  });

  it('ADVISORY WARNINGS: Incomplete criteria generate advisory warnings but DO NOT block submission', () => {
    // Only declared Ethics TC1.1 (missing TC1.2 and TC1.3)
    const incompleteDeclarations: DeclarationItemInput[] = [
      { criterionCode: 'ETHICS', requirementCode: 'TC1.1', value: '85/100', evidenceCount: 1 },
    ];

    const evaluation = service.evaluateIndividualAdvisory(incompleteDeclarations);
    assert.equal(evaluation.isOverallEligible, false);
    assert.equal(evaluation.criteriaResults.ETHICS.isMet, false);
    assert.ok(evaluation.missingRequirements.length >= 1);
    assert.ok(evaluation.advisoryWarnings.length >= 1);

    // CRITICAL UX CONTRACT: isSubmissionBlocked must remain FALSE!
    assert.equal(evaluation.isSubmissionBlocked, false);
  });

  it('INTEGRATION: Both Group A (Skills/Union) AND Group B (Lang/Intl) are required', () => {
    // Only Group A declared
    const onlyGroupA: DeclarationItemInput[] = [
      { criterionCode: 'INTEGRATION', requirementCode: 'TC5.1', value: 'Khóa kỹ năng', evidenceCount: 1 },
    ];

    const evalA = service.evaluateIndividualAdvisory(onlyGroupA);
    assert.equal(evalA.criteriaResults.INTEGRATION.isMet, false);

    // Both Group A and Group B declared
    const bothGroups: DeclarationItemInput[] = [
      { criterionCode: 'INTEGRATION', requirementCode: 'TC5.1', value: 'Khóa kỹ năng', evidenceCount: 1 },
      { criterionCode: 'INTEGRATION', requirementCode: 'TC5.4', value: 'TOEIC 550', evidenceCount: 1 },
    ];

    const evalBoth = service.evaluateIndividualAdvisory(bothGroups);
    assert.equal(evalBoth.criteriaResults.INTEGRATION.isMet, true);
  });
});
