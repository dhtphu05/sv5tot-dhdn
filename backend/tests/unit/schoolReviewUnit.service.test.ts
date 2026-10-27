/**
 * 5TOT Đà Nẵng — School Review Unit Domain Service Unit Tests (Backend V2)
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { FakeSchoolReviewUnitRepository } from '../fakes/fakeSchoolReviewUnitRepository';
import { FakeInstitutionRepository } from '../fakes/fakeInstitutionRepository';
import { SchoolReviewUnitService } from '../../src/modules/schoolReviewUnits/schoolReviewUnit.service';

describe('Backend V2: School Review Unit Domain Service Unit Tests', () => {
  let fakeUnitRepo: FakeSchoolReviewUnitRepository;
  let fakeInstRepo: FakeInstitutionRepository;
  let service: SchoolReviewUnitService;

  beforeEach(() => {
    fakeUnitRepo = new FakeSchoolReviewUnitRepository();
    fakeInstRepo = new FakeInstitutionRepository();
    service = new SchoolReviewUnitService(fakeUnitRepo, fakeInstRepo);
  });

  it('routes all 8 UDN member universities to unit-udn (Đại học Đà Nẵng)', async () => {
    const udnMembers = [
      'inst-dut',
      'inst-due',
      'inst-ued',
      'inst-ufl',
      'inst-ute',
      'inst-vku',
      'inst-smp',
      'inst-vnuk',
    ];

    for (const instId of udnMembers) {
      const resolution = await service.resolveUnitForInstitution(instId, 'INDIVIDUAL');
      assert.equal(resolution.resolved, true, `Failed for ${instId}`);
      assert.ok(resolution.unit);
      assert.equal(resolution.unit.id, 'unit-udn');
      assert.equal(resolution.unit.code, 'UDN');
      assert.equal(resolution.unit.officialName, 'Đại học Đà Nẵng');
    }
  });

  it('routes independent universities to their respective review units', async () => {
    // Duy Tân
    const dtu = await service.resolveUnitForInstitution('inst-dtu', 'INDIVIDUAL');
    assert.equal(dtu.resolved, true);
    assert.equal(dtu.unit?.id, 'unit-dtu');

    // Đông Á
    const donga = await service.resolveUnitForInstitution('inst-donga', 'INDIVIDUAL');
    assert.equal(donga.resolved, true);
    assert.equal(donga.unit?.id, 'unit-donga');

    // Kiến trúc
    const dau = await service.resolveUnitForInstitution('inst-dau', 'INDIVIDUAL');
    assert.equal(dau.resolved, true);
    assert.equal(dau.unit?.id, 'unit-dau');

    // TDTT
    const upes3 = await service.resolveUnitForInstitution('inst-upes3', 'INDIVIDUAL');
    assert.equal(upes3.resolved, true);
    assert.equal(upes3.unit?.id, 'unit-upes3');

    // KTYD
    const tyd = await service.resolveUnitForInstitution('inst-tyd', 'INDIVIDUAL');
    assert.equal(tyd.resolved, true);
    assert.equal(tyd.unit?.id, 'unit-tyd');

    // FPT
    const fpt = await service.resolveUnitForInstitution('inst-fpt', 'INDIVIDUAL');
    assert.equal(fpt.resolved, true);
    assert.equal(fpt.unit?.id, 'unit-fpt');
  });

  it('returns NOT_CONFIGURED when institution has no mapped review unit', async () => {
    const res = await service.resolveUnitForInstitution('inst-unmapped-college', 'INDIVIDUAL');
    assert.equal(res.resolved, false);
    assert.ok(res.errorCode === 'NOT_CONFIGURED' || res.errorCode === 'INVALID_INSTITUTION');
  });

  it('returns UNIT_SUSPENDED when mapped review unit is suspended', async () => {
    const res = await service.resolveUnitForInstitution('inst-cd-lacviet', 'INDIVIDUAL');
    assert.equal(res.resolved, false);
    assert.equal(res.errorCode, 'UNIT_SUSPENDED');
  });

  it('enforces that Collective track does NOT undergo School preliminary review', async () => {
    const res = await service.resolveUnitForInstitution('inst-dut', 'COLLECTIVE');
    assert.equal(res.resolved, false);
    assert.equal(res.errorCode, 'COLLECTIVE_NOT_APPLICABLE');
    assert.ok(res.errorMessage?.includes('nộp trực tiếp Cấp Đại học Đà Nẵng'));
  });

  it('enforces officer review scope and denies cross-unit access', () => {
    // Same unit: allowed (does not throw)
    assert.doesNotThrow(() => {
      service.enforceSchoolOfficerScope('unit-udn', 'unit-udn');
    });

    // Cross unit: denied with 403 Forbidden
    assert.throws(
      () => {
        service.enforceSchoolOfficerScope('unit-dtu', 'unit-udn');
      },
      (err: any) => {
        assert.equal(err.status, 403);
        assert.ok(err.detail.includes('khác'));
        return true;
      }
    );

    // Missing officer unit: denied with 403 Forbidden
    assert.throws(
      () => {
        service.enforceSchoolOfficerScope(null, 'unit-udn');
      },
      (err: any) => {
        assert.equal(err.status, 403);
        return true;
      }
    );
  });

  it('verifies Đại học Đà Nẵng is ONE school-level review unit, NOT an extra tier', async () => {
    const unitUdn = await service.getUnitById('unit-udn');
    assert.equal(unitUdn.code, 'UDN');
    // It's a standard SchoolReviewUnitDto, not a separate intermediate stage hierarchy
    assert.ok(unitUdn.memberInstitutionIds.length >= 8);
  });

  // --------------------------------------------------------------------------
  // BE3-A1 AUTHORITATIVE UDN SHARED REVIEWER SCOPE TESTS
  // --------------------------------------------------------------------------
  it('AUTHORITATIVE: Single shared UDN reviewer CAN access DUT, UED, and all other configured UDN member applications', () => {
    const udnReviewerUnitId = 'unit-udn';

    const udnApplications = [
      { id: 'app-dut-01', institutionId: 'inst-dut', schoolReviewUnitId: 'unit-udn' },
      { id: 'app-due-01', institutionId: 'inst-due', schoolReviewUnitId: 'unit-udn' },
      { id: 'app-ued-01', institutionId: 'inst-ued', schoolReviewUnitId: 'unit-udn' },
      { id: 'app-ufl-01', institutionId: 'inst-ufl', schoolReviewUnitId: 'unit-udn' },
      { id: 'app-ute-01', institutionId: 'inst-ute', schoolReviewUnitId: 'unit-udn' },
      { id: 'app-vku-01', institutionId: 'inst-vku', schoolReviewUnitId: 'unit-udn' },
      { id: 'app-smp-01', institutionId: 'inst-smp', schoolReviewUnitId: 'unit-udn' },
      { id: 'app-vnuk-01', institutionId: 'inst-vnuk', schoolReviewUnitId: 'unit-udn' },
    ];

    for (const app of udnApplications) {
      assert.equal(
        service.canReviewApplication(udnReviewerUnitId, app),
        true,
        `UDN reviewer should be able to review application from ${app.institutionId}`
      );
      assert.doesNotThrow(() => {
        service.enforceApplicationReviewAccess(udnReviewerUnitId, app);
      });
    }
  });

  it('AUTHORITATIVE: Single shared UDN reviewer CANNOT access non-UDN institutions (DTU, DAUT, FPT, etc.)', () => {
    const udnReviewerUnitId = 'unit-udn';

    const nonUdnApplications = [
      { id: 'app-dtu-01', institutionId: 'inst-dtu', schoolReviewUnitId: 'unit-dtu' },
      { id: 'app-dau-01', institutionId: 'inst-dau', schoolReviewUnitId: 'unit-dau' },
      { id: 'app-fpt-01', institutionId: 'inst-fpt', schoolReviewUnitId: 'unit-fpt' },
    ];

    for (const app of nonUdnApplications) {
      assert.equal(
        service.canReviewApplication(udnReviewerUnitId, app),
        false,
        `UDN reviewer must NOT access non-UDN application from ${app.institutionId}`
      );
      assert.throws(
        () => {
          service.enforceApplicationReviewAccess(udnReviewerUnitId, app);
        },
        (err: any) => {
          assert.equal(err.status, 403);
          return true;
        }
      );
    }
  });

  it('AUTHORITATIVE: Independent institution reviewer CANNOT access UDN applications', () => {
    const dtuReviewerUnitId = 'unit-dtu';

    const dutApp = { id: 'app-dut-01', institutionId: 'inst-dut', schoolReviewUnitId: 'unit-udn' };
    const uedApp = { id: 'app-ued-01', institutionId: 'inst-ued', schoolReviewUnitId: 'unit-udn' };

    assert.equal(service.canReviewApplication(dtuReviewerUnitId, dutApp), false);
    assert.equal(service.canReviewApplication(dtuReviewerUnitId, uedApp), false);

    assert.throws(() => service.enforceApplicationReviewAccess(dtuReviewerUnitId, dutApp));
    assert.throws(() => service.enforceApplicationReviewAccess(dtuReviewerUnitId, uedApp));
  });

  it('AUTHORITATIVE: School application queues are strictly filtered by authoritative School Review Unit scope', () => {
    const allApplications = [
      { id: 'app-1', institutionId: 'inst-dut', schoolReviewUnitId: 'unit-udn' },
      { id: 'app-2', institutionId: 'inst-due', schoolReviewUnitId: 'unit-udn' },
      { id: 'app-3', institutionId: 'inst-dtu', schoolReviewUnitId: 'unit-dtu' },
      { id: 'app-4', institutionId: 'inst-ued', schoolReviewUnitId: 'unit-udn' },
      { id: 'app-5', institutionId: 'inst-fpt', schoolReviewUnitId: 'unit-fpt' },
    ];

    const udnQueue = service.filterApplicationsForOfficer('unit-udn', allApplications);
    assert.equal(udnQueue.length, 3);
    assert.deepEqual(
      udnQueue.map((a) => a.id),
      ['app-1', 'app-2', 'app-4']
    );

    const dtuQueue = service.filterApplicationsForOfficer('unit-dtu', allApplications);
    assert.equal(dtuQueue.length, 1);
    assert.equal(dtuQueue[0].id, 'app-3');
  });

  it('AUTHORITATIVE: UDN reviewer can filter queue by member institution without changing authorization scope', () => {
    const allApplications = [
      { id: 'app-dut-1', institutionId: 'inst-dut', schoolReviewUnitId: 'unit-udn' },
      { id: 'app-dut-2', institutionId: 'inst-dut', schoolReviewUnitId: 'unit-udn' },
      { id: 'app-due-1', institutionId: 'inst-due', schoolReviewUnitId: 'unit-udn' },
      { id: 'app-ued-1', institutionId: 'inst-ued', schoolReviewUnitId: 'unit-udn' },
      { id: 'app-dtu-1', institutionId: 'inst-dtu', schoolReviewUnitId: 'unit-dtu' },
    ];

    // Filter UDN queue for DUT applications only
    const dutOnly = service.filterApplicationsForOfficer('unit-udn', allApplications, 'inst-dut');
    assert.equal(dutOnly.length, 2);
    assert.deepEqual(
      dutOnly.map((a) => a.id),
      ['app-dut-1', 'app-dut-2']
    );

    // Filter UDN queue for DUE applications only
    const dueOnly = service.filterApplicationsForOfficer('unit-udn', allApplications, 'inst-due');
    assert.equal(dueOnly.length, 1);
    assert.equal(dueOnly[0].id, 'app-due-1');
  });

  it('AUTHORITATIVE: Client-provided parameters cannot enlarge permissions or leak cross-unit applications', () => {
    const allApplications = [
      { id: 'app-dut-1', institutionId: 'inst-dut', schoolReviewUnitId: 'unit-udn' },
      { id: 'app-dtu-1', institutionId: 'inst-dtu', schoolReviewUnitId: 'unit-dtu' },
    ];

    // UDN officer attempts to filter by DTU institution ID (client spoofing / enlargement attempt)
    const spoofedFilter = service.filterApplicationsForOfficer('unit-udn', allApplications, 'inst-dtu');
    // Result MUST be empty — DTU application is NEVER returned to UDN officer
    assert.equal(spoofedFilter.length, 0);
  });

  it('AUTHORITATIVE: Revoked reviewer authority denies future review operations', () => {
    // Active assignment: passes
    assert.doesNotThrow(() => {
      service.enforceReviewerActiveStatus({
        isActive: true,
        schoolReviewUnitId: 'unit-udn',
      });
    });

    // Inactive assignment: throws 403
    assert.throws(
      () => {
        service.enforceReviewerActiveStatus({
          isActive: false,
          schoolReviewUnitId: 'unit-udn',
        });
      },
      (err: any) => {
        assert.equal(err.status, 403);
        assert.ok(err.detail.includes('thu hồi'));
        return true;
      }
    );

    // Revoked timestamp present: throws 403
    assert.throws(
      () => {
        service.enforceReviewerActiveStatus({
          isActive: true,
          schoolReviewUnitId: 'unit-udn',
          revokedAt: new Date(),
        });
      },
      (err: any) => {
        assert.equal(err.status, 403);
        return true;
      }
    );
  });

  it('AUTHORITATIVE: Preserves student original institution identity in application and review context', async () => {
    // When a DUT student's application is processed, institutionId remains inst-dut
    const dutRes = await service.resolveUnitForInstitution('inst-dut', 'INDIVIDUAL');
    assert.equal(dutRes.resolved, true);
    assert.equal(dutRes.trainingInstitutionId, 'inst-dut');
    assert.equal(dutRes.unit?.id, 'unit-udn');

    // When an UED student's application is processed, institutionId remains inst-ued
    const uedRes = await service.resolveUnitForInstitution('inst-ued', 'INDIVIDUAL');
    assert.equal(uedRes.resolved, true);
    assert.equal(uedRes.trainingInstitutionId, 'inst-ued');
    assert.equal(uedRes.unit?.id, 'unit-udn');

    // Both resolve to unit-udn, but their trainingInstitutionIds are distinct!
    assert.notEqual(dutRes.trainingInstitutionId, uedRes.trainingInstitutionId);
  });

  it('AUTHORITATIVE: Structured audit context records student institution, review unit, and shared credential notice', () => {
    const officer = {
      userId: 'user-officer-udn-shared',
      roleCode: 'SCHOOL_OFFICER',
      schoolReviewUnitId: 'unit-udn',
    };
    const app = {
      id: 'app-dut-2026-001',
      institutionId: 'inst-dut',
      schoolReviewUnitId: 'unit-udn',
    };

    const auditContext = service.buildAuditReviewContext(officer, app);
    assert.equal(auditContext.reviewerUserId, 'user-officer-udn-shared');
    assert.equal(auditContext.schoolReviewUnitId, 'unit-udn');
    assert.equal(auditContext.studentInstitutionId, 'inst-dut');
    assert.equal(auditContext.applicationId, 'app-dut-2026-001');
    assert.ok(auditContext.sharedAccountAttributionNotice.includes('dùng chung'));
  });

  it('AUTHORITATIVE: Collective applications never enter School-level review workflow', () => {
    const collectiveApp = {
      id: 'col-app-dut-001',
      institutionId: 'inst-dut',
      schoolReviewUnitId: 'unit-udn',
      track: 'COLLECTIVE' as const,
    };

    // UDN reviewer cannot review collective application
    assert.equal(service.canReviewApplication('unit-udn', collectiveApp), false);

    // Enforcement throws 403 Forbidden
    assert.throws(
      () => {
        service.enforceApplicationReviewAccess('unit-udn', collectiveApp);
      },
      (err: any) => {
        assert.equal(err.status, 403);
        assert.ok(err.detail.includes('Hồ sơ Tập thể nộp trực tiếp Cấp Đại học Đà Nẵng'));
        return true;
      }
    );

    // Filter queue excludes collective applications
    const filtered = service.filterApplicationsForOfficer('unit-udn', [collectiveApp]);
    assert.equal(filtered.length, 0);
  });
});
