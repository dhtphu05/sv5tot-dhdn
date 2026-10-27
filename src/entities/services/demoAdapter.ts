/**
 * 5TOT Đà Nẵng — Interactive Demo Mode Service Adapter
 * Implements DomainServicesBundle backed by isolated Demo Stores and Fixtures.
 * Works 100% offline/client-side without requiring a production backend connection.
 */

import type {
  DomainServicesBundle,
  AuthSessionPayload,
  CreateCollectivePayload,
  CreateSupplementRequestPayload,
  EvidenceUploadPayload,
  AuditLogRecord,
} from './contracts';
import {
  validateClientEvidenceFile,
  resolveCanonicalMimeType,
} from '../../shared/api/r2EvidenceClient';
import type {
  StaffRole,
  StaffApplicationRecord,
} from '../../staff/types';
import type {
  CollectiveApplication,
  CollectiveRequirementId,
} from '../../staff/collectiveTypes';
import { AUTHORIZED_COLLECTIVE_REGISTRY } from '../../staff/collectiveTypes';
import {
  STAFF_DEMO_USERS,
  CITY_REVIEW_OFFICERS,
  INITIAL_STAFF_APPLICATIONS,
} from '../../staff/fixtures/staffDataset';
import { INITIAL_STAFF_ACCOUNTS } from '../../staff/fixtures/admin/staffAccounts';
import {
  getAllCollectiveApplications,
  getCollectiveApplicationById,
  createCollectiveApplication,
  updateCollectiveBasicInfo,
  updateCollectiveRequirement,
  submitCollectiveDirectlyToCity,
  assignCityOfficer,
  addCollectiveEvidence,
  removeCollectiveEvidence,
  submitCollectiveSupplement,
  startCityReview,
  saveCityRequirementJudgment,
  saveCityEvidenceJudgment,
  completeCityReview,
  reopenCityReview,
  requestCollectiveSupplement,
  recordCollectiveCommitteeDecision,
  publishCollectiveResultRecord,
  reopenCollectiveCommitteeDecision,
} from '../../staff/collectiveStore';
import { getApplicationSchoolReviewUnitId } from '../../staff/schoolSelectors';
import {
  AUTHORITATIVE_SCHOOL_REVIEW_UNITS,
  resolveSchoolReviewUnit,
  SchoolForwardingBatchSummaryDto,
  SchoolForwardingBatchDto,
} from '../../staff/schoolReviewTypes';
import { STUDENT_APPLICATION_FIXTURE } from '../../demo/fixtures/studentApplication';
import type {
  StudentApplicationData,
  ApplicationEvidence,
  StudentProfileDto,
  UpdateStudentProfileInput,
  ProfileCompletenessResult,
} from '../application/studentApplicationTypes';
import {
  DEFAULT_CANONICAL_STUDENT_PROFILE,
  evaluateProfileCompleteness,
} from '../../demo/fixtures/studentProfileFixtures';

const DEMO_SEEDED_STUDENTS: Array<{
  id: string;
  email: string;
  fullName: string;
  studentCode: string;
  institutionId: string;
  institutionName: string;
  unitId: string;
  unitLabel: string;
}> = [
  {
    id: 'stu-dut-01',
    email: 'minh.nv@dut.udn.vn',
    fullName: 'Nguyễn Minh Anh',
    studentCode: '102220123',
    institutionId: 'inst-dut',
    institutionName: 'Trường Đại học Bách khoa – ĐHĐN',
    unitId: 'unit-dut',
    unitLabel: 'Trường Đại học Bách khoa – ĐHĐN',
  },
  {
    id: 'stu-dut-02',
    email: 'sv.dut@dut.udn.vn',
    fullName: 'Nguyễn Minh Anh',
    studentCode: '102220123',
    institutionId: 'inst-dut',
    institutionName: 'Trường Đại học Bách khoa – ĐHĐN',
    unitId: 'unit-dut',
    unitLabel: 'Trường Đại học Bách khoa – ĐHĐN',
  },
  {
    id: 'stu-due-01',
    email: 'sv.due@due.udn.vn',
    fullName: 'Lê Thị Bảo Ngọc',
    studentCode: '211121045120',
    institutionId: 'inst-due',
    institutionName: 'Trường Đại học Kinh tế – ĐHĐN',
    unitId: 'unit-due',
    unitLabel: 'Trường Đại học Kinh tế – ĐHĐN',
  },
  {
    id: 'stu-ued-01',
    email: 'sv.ued@ued.udn.vn',
    fullName: 'Trần Quốc Bảo',
    studentCode: '3140122089',
    institutionId: 'inst-ued',
    institutionName: 'Trường Đại học Sư phạm – ĐHĐN',
    unitId: 'unit-ued',
    unitLabel: 'Trường Đại học Sư phạm – ĐHĐN',
  },
  {
    id: 'stu-ufl-01',
    email: 'sv.ufl@ufl.udn.vn',
    fullName: 'Phạm Ngọc Hà My',
    studentCode: '411220156',
    institutionId: 'inst-ufl',
    institutionName: 'Trường Đại học Ngoại ngữ – ĐHĐN',
    unitId: 'unit-ufl',
    unitLabel: 'Trường Đại học Ngoại ngữ – ĐHĐN',
  },
  {
    id: 'stu-ute-01',
    email: 'sv.ute@ute.udn.vn',
    fullName: 'Võ Văn Kiệt',
    studentCode: '221150531201',
    institutionId: 'inst-ute',
    institutionName: 'Trường Đại học Sư phạm Kỹ thuật – ĐHĐN',
    unitId: 'unit-ute',
    unitLabel: 'Trường Đại học Sư phạm Kỹ thuật – ĐHĐN',
  },
  {
    id: 'stu-vku-01',
    email: 'sv.vku@vku.udn.vn',
    fullName: 'Hoàng Gia Bảo',
    studentCode: '22IT088',
    institutionId: 'inst-vku',
    institutionName: 'Trường Đại học CNTT & TT Việt – Hàn – ĐHĐN',
    unitId: 'unit-vku',
    unitLabel: 'Trường Đại học CNTT & TT Việt – Hàn – ĐHĐN',
  },
  {
    id: 'stu-smp-01',
    email: 'sv.smp@smp.udn.vn',
    fullName: 'Đặng Thùy Dương',
    studentCode: '21YK042',
    institutionId: 'inst-smp',
    institutionName: 'Trường Y Dược – ĐHĐN',
    unitId: 'unit-smp',
    unitLabel: 'Trường Y Dược – ĐHĐN',
  },
  {
    id: 'stu-vnuk-01',
    email: 'sv.vnuk@vnuk.udn.vn',
    fullName: 'Phan Minh Khôi',
    studentCode: '22VNUK019',
    institutionId: 'inst-vnuk',
    institutionName: 'Viện Nghiên cứu và Đào tạo Việt – Anh – ĐHĐN',
    unitId: 'unit-vnuk',
    unitLabel: 'Viện Nghiên cứu và Đào tạo Việt – Anh – ĐHĐN',
  },
  {
    id: 'stu-kontum-01',
    email: 'sv.kontum@kontum.udn.vn',
    fullName: 'Nguyễn Hoàng Phúc',
    studentCode: '22KT045',
    institutionId: 'inst-kontum',
    institutionName: 'Phân hiệu Đại học Đà Nẵng tại Kon Tum',
    unitId: 'unit-kontum',
    unitLabel: 'Phân hiệu Đại học Đà Nẵng tại Kon Tum',
  },
];

let demoSchoolForwardingBatches = new Map<string, SchoolForwardingBatchDto>();

const DEMO_PROFILE_STORAGE_KEY = '5tot_demo_student_profile_v1';

function loadPersistedDemoProfile(): StudentProfileDto | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(DEMO_PROFILE_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as StudentProfileDto;
  } catch {
    // ignore storage errors
  }
  return null;
}

function savePersistedDemoProfile(profile: StudentProfileDto): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(DEMO_PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // ignore storage errors
  }
}

let activeDemoSession: AuthSessionPayload | null = null;
let demoStudentProfile: StudentProfileDto =
  loadPersistedDemoProfile() || structuredClone(DEFAULT_CANONICAL_STUDENT_PROFILE);
let demoRegisteredProfiles = new Map<string, StudentProfileDto>();
let demoIndividualRecords: StaffApplicationRecord[] = [...INITIAL_STAFF_APPLICATIONS];
let demoStudentApps = new Map<string, StudentApplicationData>([
  [STUDENT_APPLICATION_FIXTURE.applicationId, structuredClone(STUDENT_APPLICATION_FIXTURE)],
]);
let demoEvidenceMap = new Map<string, ApplicationEvidence & { base64Content?: string }>();
let demoAuditLogs: AuditLogRecord[] = [];

function recordDemoAudit(entry: Omit<AuditLogRecord, 'id' | 'timestamp'>): void {
  demoAuditLogs.unshift({
    id: `demo-aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    ...entry,
  });
}

const REQ_KEY_MAP: Record<CollectiveRequirementId, 'tt01' | 'tt02' | 'tt03' | 'tt04'> = {
  TT01: 'tt01',
  TT02: 'tt02',
  TT03: 'tt03',
  TT04: 'tt04',
};

export const demoServicesAdapter: DomainServicesBundle = {
  mode: 'DEMO',

  auth: {
    async loginWithCredentials({ email, password, preferredTrack }) {
      const normalized = email.trim().toLowerCase();

      if (normalized === 'sai@example.com' || password === 'wrongpassword') {
        const err = new Error('Email hoặc mật khẩu chưa chính xác.') as Error & {
          status?: number;
          code?: string;
        };
        err.status = 401;
        err.code = 'INVALID_CREDENTIALS';
        throw err;
      }

      // Check full Staff accounts list first (includes all School Officers across 9 member units)
      const matchedStaffAccount = INITIAL_STAFF_ACCOUNTS.find(
        (acc) => acc.email.toLowerCase() === normalized && acc.status === 'active'
      );

      // Check canonical Staff demo users (including legacy aliases)
      const staffRoleEntry = (Object.entries(STAFF_DEMO_USERS) as [StaffRole, typeof STAFF_DEMO_USERS[StaffRole]][]).find(
        ([, user]) =>
          user.email.toLowerCase() === normalized ||
          (user.primaryRole === 'SCHOOL_OFFICER' &&
            (normalized === 'canbo.udn@udn.vn' ||
              normalized === 'an.nv@udn.vn')) ||
          (user.primaryRole === 'CITY_OFFICER' &&
            (normalized === 'nam.th@hsvdanang.vn' ||
              normalized === 'canbo.thanhpho@hsvdanang.vn' ||
              normalized === 'canbo.dhdn@udn.vn')) ||
          (user.primaryRole === 'CITY_MANAGER' &&
            (normalized === 'ha.nt@hsvdanang.vn' ||
              normalized === 'quanly.thanhpho@hsvdanang.vn' ||
              normalized === 'quanly.dhdn@udn.vn')) ||
          (user.primaryRole === 'CITY_COMMITTEE' &&
            (normalized === 'quan.lm@hsvdanang.vn' ||
              normalized === 'hoidong.thanhpho@hsvdanang.vn' ||
              normalized === 'hoidong.dhdn@udn.vn')) ||
          (user.primaryRole === 'ADMIN' &&
            (normalized === 'lan.pn@hsvdanang.vn' ||
              normalized === 'khoa.nd@hsvdanang.vn' ||
              normalized === 'admin@hsvdanang.vn' ||
              normalized === 'admin@udn.vn'))
      );

      if (matchedStaffAccount || staffRoleEntry || preferredTrack === 'STAFF') {
        if (matchedStaffAccount) {
          activeDemoSession = {
            authenticated: true,
            mode: 'DEMO',
            token: `demo-token-${matchedStaffAccount.id}`,
            accountType: 'STAFF',
            user: {
              id: matchedStaffAccount.id,
              fullName: matchedStaffAccount.fullName,
              email: matchedStaffAccount.email,
              role: matchedStaffAccount.primaryRole,
              roleLabel: matchedStaffAccount.roleLabel,
              unitId: matchedStaffAccount.schoolReviewUnitId,
              unitLabel: matchedStaffAccount.unitLabel,
            },
          };
          return activeDemoSession;
        }
        const [role, user] = staffRoleEntry || ['CITY_OFFICER', STAFF_DEMO_USERS.CITY_OFFICER];
        activeDemoSession = {
          authenticated: true,
          mode: 'DEMO',
          token: `demo-token-${user.id}`,
          accountType: 'STAFF',
          user: {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            role,
            roleLabel: user.roleLabel,
            unitId: user.schoolReviewUnitId,
            unitLabel: user.unitLabel,
          },
        };
        return activeDemoSession;
      }

      // Check Authorized Collective Preparer
      const collectiveEntity = AUTHORIZED_COLLECTIVE_REGISTRY.find(
        (c) => c.authorizedPreparerEmail.toLowerCase() === normalized
      );
      if (collectiveEntity || preferredTrack === 'COLLECTIVE') {
        if (
          preferredTrack === 'COLLECTIVE' &&
          !collectiveEntity &&
          (normalized.includes('minhanh.nguyen') ||
            normalized.includes('student') ||
            normalized.startsWith('sv.'))
        ) {
          const err = new Error(
            'Tài khoản này là tài khoản sinh viên cá nhân, không có quyền truy cập Cổng Tập thể. Vui lòng chuyển sang Cổng Sinh viên cá nhân.'
          ) as Error & { status?: number; code?: string };
          err.status = 403;
          err.code = 'UNAUTHORIZED_COLLECTIVE_PREPARER';
          throw err;
        }
        const target = collectiveEntity || AUTHORIZED_COLLECTIVE_REGISTRY[0];
        activeDemoSession = {
          authenticated: true,
          mode: 'DEMO',
          token: `demo-token-col-${target.id}`,
          accountType: 'COLLECTIVE_PREPARER',
          user: {
            id: `prep-${target.id}`,
            fullName: target.authorizedPreparerName,
            email: normalized || target.authorizedPreparerEmail,
            role: 'COLLECTIVE_PREPARER',
            roleLabel: 'Người lập hồ sơ Tập thể được phân quyền',
            unitId: target.schoolReviewUnitId,
            unitLabel: target.schoolReviewUnitName,
            institutionId: target.institutionId,
            institutionName: target.institutionName,
          },
        };
        return activeDemoSession;
      }

      // Check Seeded Multi-School Student or fallback to default Student
      const matchedStudent = DEMO_SEEDED_STUDENTS.find(
        (s) => s.email.toLowerCase() === normalized
      );
      const registeredProf = demoRegisteredProfiles.get(normalized);
      if (registeredProf) {
        demoStudentProfile = structuredClone(registeredProf);
        savePersistedDemoProfile(demoStudentProfile);
      } else if (
        normalized === 'minhanh.nguyen@dut.udn.vn' ||
        normalized === 'minh.nv@dut.udn.vn'
      ) {
        demoStudentProfile = {
          ...structuredClone(DEFAULT_CANONICAL_STUDENT_PROFILE),
          email: normalized,
        };
        savePersistedDemoProfile(demoStudentProfile);
      } else if (matchedStudent) {
        demoStudentProfile = {
          fullName: matchedStudent.fullName,
          gender: '',
          dateOfBirth: '',
          ethnicity: '',
          academicYearNumber: 0,
          educationLevel: '',
          className: '',
          homeProvince: '',
          institutionId: matchedStudent.institutionId,
          institutionName: matchedStudent.institutionName,
          unionPosition: '',
          politicalStatus: '' as any,
          phoneNumber: '',
          email: matchedStudent.email,
        };
        savePersistedDemoProfile(demoStudentProfile);
      }

      activeDemoSession = {
        authenticated: true,
        mode: 'DEMO',
        token: `demo-token-student-${matchedStudent?.studentCode || '102220123'}`,
        accountType: 'STUDENT',
        user: {
          id: matchedStudent?.id || 'student-102220123',
          fullName:
            registeredProf?.fullName ||
            matchedStudent?.fullName ||
            STUDENT_APPLICATION_FIXTURE.student.fullName,
          email: normalized || 'minhanh.nguyen@dut.udn.vn',
          role: 'STUDENT',
          roleLabel: 'Sinh viên đăng ký xét chọn',
          studentCode: matchedStudent?.studentCode || STUDENT_APPLICATION_FIXTURE.student.studentId,
          institutionId:
            registeredProf?.institutionId || matchedStudent?.institutionId || 'inst-dut',
          institutionName:
            registeredProf?.institutionName ||
            matchedStudent?.institutionName ||
            STUDENT_APPLICATION_FIXTURE.student.university,
          unitId: matchedStudent?.unitId || 'unit-dut',
          unitLabel: matchedStudent?.unitLabel || 'Trường Đại học Bách khoa – ĐHĐN',
        },
      };
      return activeDemoSession;
    },

    async registerStudent({ fullName, email, studentCode, institutionId, institutionName }) {
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedCode = studentCode.trim().toUpperCase();

      if (normalizedEmail === 'da-ton-tai@dut.udn.vn') {
        const err = new Error('Email này đã được sử dụng.') as Error & {
          status?: number;
          code?: string;
        };
        err.status = 409;
        err.code = 'EMAIL_CONFLICT';
        throw err;
      }

      if (normalizedCode === 'TRUNG_MSSV') {
        const err = new Error('Mã số sinh viên này đã được sử dụng cho một tài khoản khác.') as Error & {
          status?: number;
          code?: string;
        };
        err.status = 409;
        err.code = 'STUDENT_CODE_CONFLICT';
        throw err;
      }

      const resolvedInstName = institutionName || 'Trường Đại học Bách khoa – ĐHĐN';
      const freshProfile: StudentProfileDto = {
        fullName: fullName.trim(),
        gender: '',
        dateOfBirth: '',
        ethnicity: '',
        academicYearNumber: 0,
        educationLevel: '',
        className: '',
        homeProvince: '',
        institutionId,
        institutionName: resolvedInstName,
        unionPosition: '',
        politicalStatus: '' as any,
        phoneNumber: '',
        email: normalizedEmail,
      };
      demoStudentProfile = structuredClone(freshProfile);
      demoRegisteredProfiles.set(normalizedEmail, structuredClone(freshProfile));
      savePersistedDemoProfile(demoStudentProfile);

      activeDemoSession = {
        authenticated: true,
        mode: 'DEMO',
        token: `demo-token-student-${studentCode.trim()}`,
        accountType: 'STUDENT',
        user: {
          id: `student-${studentCode.trim()}`,
          fullName: fullName.trim(),
          email: normalizedEmail,
          role: 'STUDENT',
          roleLabel: 'Sinh viên đăng ký xét chọn',
          studentCode: studentCode.trim(),
          institutionId,
          institutionName: resolvedInstName,
        },
      };
      return activeDemoSession;
    },

    async getCurrentSession() {
      return activeDemoSession;
    },

    async logout() {
      activeDemoSession = null;
    },
  },

  profile: {
    async getProfile() {
      const persisted = loadPersistedDemoProfile();
      if (persisted) {
        demoStudentProfile = persisted;
      }
      return {
        profile: structuredClone(demoStudentProfile),
        completeness: evaluateProfileCompleteness(demoStudentProfile),
      };
    },

    async updateProfile(input: UpdateStudentProfileInput, actor) {
      demoStudentProfile = {
        ...demoStudentProfile,
        ...input,
        email: demoStudentProfile.email, // email is immutable
      };
      if (demoStudentProfile.email) {
        demoRegisteredProfiles.set(
          demoStudentProfile.email.toLowerCase(),
          structuredClone(demoStudentProfile)
        );
      }
      savePersistedDemoProfile(demoStudentProfile);
      const completeness = evaluateProfileCompleteness(demoStudentProfile);
      recordDemoAudit({
        track: 'INDIVIDUAL',
        action: 'UPDATE_STUDENT_PROFILE',
        actorId: actor?.id || (demoStudentProfile as any).studentCode || 'student-102220123',
        actorName: actor?.name || demoStudentProfile.fullName,
        actorRole: actor?.role || 'STUDENT',
        details: `Cập nhật thông tin cá nhân sinh viên (${completeness.completedFields}/${completeness.totalFields} trường đầy đủ)`,
      });
      return {
        profile: structuredClone(demoStudentProfile),
        completeness,
      };
    },
  },

  individual: {
    async listApplications() {
      return [...demoIndividualRecords];
    },

    async getStudentApplication(applicationId: string) {
      return demoStudentApps.get(applicationId) || structuredClone(STUDENT_APPLICATION_FIXTURE);
    },

    async getStaffApplicationRecord(applicationId: string) {
      return demoIndividualRecords.find((r) => r.applicationId === applicationId) || null;
    },

    async createStudentApplication(params) {
      const appId = `APP-2026-DN-${params.studentCode}`;
      const routing = resolveSchoolReviewUnit(params.institutionId);
      const created: StudentApplicationData = {
        ...structuredClone(STUDENT_APPLICATION_FIXTURE),
        applicationId: appId,
        status: 'draft',
        reviewStage: 'SCHOOL',
        trainingInstitutionName: params.institutionName,
        schoolReviewUnitId: routing.unit?.id || 'unit-dut',
        schoolReviewUnitName: routing.unit?.officialName || 'Trường Đại học Bách khoa – ĐHĐN',
        schoolPreliminaryStatus: 'school_not_submitted',
        student: {
          fullName: params.studentFullName,
          studentId: params.studentCode,
          university: params.institutionName,
          faculty: params.faculty,
          class: params.className,
          email: params.email,
          academicYear: '2025–2026',
        },
      };
      demoStudentApps.set(appId, created);
      recordDemoAudit({
        track: 'INDIVIDUAL',
        applicationId: appId,
        action: 'CREATE_INDIVIDUAL_APPLICATION',
        actorId: params.studentCode,
        actorName: params.studentFullName,
        actorRole: 'STUDENT',
        details: `Khởi tạo hồ sơ cá nhân cho sinh viên ${params.studentFullName} (${params.studentCode})`,
      });
      return created;
    },

    async saveDeclaration({ applicationId, criterionId, requirementId, declaration, actor }) {
      const app =
        demoStudentApps.get(applicationId) || structuredClone(STUDENT_APPLICATION_FIXTURE);
      const nextCriteria = app.criteria.map((c: any) => {
        if (c.id !== criterionId) return c;
        const updateReqs = (reqs: any[]) =>
          reqs.map((r: any) => {
            if (r.id !== requirementId) return r;
            const existingIdx = r.declarations.findIndex((d: any) => d.id === declaration.id);
            const nextDecls =
              existingIdx >= 0
                ? r.declarations.map((d: any, idx: number) => (idx === existingIdx ? declaration : d))
                : [...r.declarations, declaration];
            return { ...r, declarations: nextDecls };
          });
        return {
          ...c,
          requirements: updateReqs(c.requirements),
          groups: c.groups.map((g: any) => ({ ...g, requirements: updateReqs(g.requirements) })),
        };
      });
      const updated: StudentApplicationData = { ...app, criteria: nextCriteria };
      demoStudentApps.set(applicationId, updated);
      recordDemoAudit({
        track: 'INDIVIDUAL',
        applicationId,
        action: 'SAVE_INDIVIDUAL_DECLARATION',
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        details: `Lưu kê khai tiêu chí ${criterionId} - yêu cầu ${requirementId}`,
      });
      return updated;
    },

    async submitToSchoolReview({ applicationId, actor }) {
      const app =
        demoStudentApps.get(applicationId) || structuredClone(STUDENT_APPLICATION_FIXTURE);
      const snapshot = structuredClone(demoStudentProfile);
      const updated: StudentApplicationData = {
        ...app,
        status: 'under_review',
        reviewStage: 'SCHOOL',
        schoolPreliminaryStatus: 'school_submitted',
        applicantProfileSnapshot: snapshot,
      };
      demoStudentApps.set(applicationId, updated);
      const recIdx = demoIndividualRecords.findIndex((r) => r.applicationId === applicationId);
      if (recIdx >= 0) {
        demoIndividualRecords[recIdx] = {
          ...demoIndividualRecords[recIdx],
          applicantProfileSnapshot: snapshot,
          workflowStatus: 'under_review',
        };
      }
      recordDemoAudit({
        track: 'INDIVIDUAL',
        applicationId,
        action: 'SUBMIT_TO_SCHOOL_REVIEW',
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        details: `Nộp hồ sơ về đơn vị xét sơ tuyển: ${updated.schoolReviewUnitName || 'Trường Đại học Bách khoa – ĐHĐN'}`,
      });
      return {
        success: true,
        message: 'Đã nộp hồ sơ về Đơn vị xét sơ tuyển thành công.',
        schoolReviewUnitId: updated.schoolReviewUnitId,
        schoolReviewUnitName: updated.schoolReviewUnitName,
        application: updated,
      };
    },

    async submitSupplementResponse({ applicationId, explanation, actor }) {
      const idx = demoIndividualRecords.findIndex((r) => r.applicationId === applicationId);
      if (idx === -1) {
        throw new Error(`Không tìm thấy hồ sơ cá nhân ${applicationId}`);
      }
      const current = demoIndividualRecords[idx];
      const updated: StaffApplicationRecord = {
        ...current,
        workflowStatus: 'supplement_returned',
        updatedAt: 'Vừa xong',
        latestOperationalNote: explanation,
        supplementSummary: {
          ...current.supplementSummary,
          activeStatus: 'student_returned',
          returnedDaysAgo: 0,
        },
      };
      demoIndividualRecords[idx] = updated;
      recordDemoAudit({
        track: 'INDIVIDUAL',
        applicationId,
        action: 'SUBMIT_INDIVIDUAL_SUPPLEMENT',
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        details: `Sinh viên gửi phản hồi bổ sung: ${explanation}`,
      });
      return updated;
    },
  },

  schoolReview: {
    async listSchoolQueue(unitId) {
      if (!unitId) return [...demoIndividualRecords];
      const effectiveUnitId = unitId === 'unit-udn' ? 'unit-dut' : unitId;
      return demoIndividualRecords.filter(
        (r) => getApplicationSchoolReviewUnitId(r) === effectiveUnitId
      );
    },

    async recordSchoolCriterionJudgment({ applicationId, criterionId, status, note, actor }) {
      const idx = demoIndividualRecords.findIndex((r) => r.applicationId === applicationId);
      if (idx === -1) {
        throw new Error(`Không tìm thấy hồ sơ xét sơ tuyển ${applicationId}`);
      }
      const target = demoIndividualRecords[idx];
      const nextCriteria = target.criteriaReview.map((c) =>
        c.criterionId === criterionId ? { ...c, status, noteSummary: note || c.noteSummary } : c
      );
      const updated: StaffApplicationRecord = {
        ...target,
        criteriaReview: nextCriteria,
        reviewedCriteriaCount: nextCriteria.filter((c) => c.status === 'reviewed').length,
      };
      demoIndividualRecords[idx] = updated;
      recordDemoAudit({
        track: 'INDIVIDUAL',
        applicationId,
        action: 'SCHOOL_CRITERION_REVIEW',
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        details: `Xét sơ tuyển tiêu chí ${criterionId}: ${status}`,
      });
      return updated;
    },

    async completeSchoolPreliminaryReview({ applicationId, recommendation, summaryNote, actor }) {
      const idx = demoIndividualRecords.findIndex((r) => r.applicationId === applicationId);
      if (idx === -1) {
        throw new Error(`Không tìm thấy hồ sơ xét sơ tuyển ${applicationId}`);
      }
      const target = demoIndividualRecords[idx];
      const updated: StaffApplicationRecord = {
        ...target,
        schoolPreliminaryStatus:
          recommendation === 'recommended' ? 'recommended_forwarding' : 'not_recommended',
        schoolReviewSummary: {
          status:
            recommendation === 'recommended' ? 'recommended_forwarding' : 'not_recommended',
          schoolReviewUnitId: target.schoolReviewUnitId,
          schoolReviewUnitName: target.schoolReviewUnitName,
          recommendation,
          recommendationDate: new Date().toISOString(),
          recommendingOfficerId: actor.id,
          recommendingOfficerName: actor.name,
          isForwardedToCity: false,
          officerNotes: summaryNote,
          reviewedCriteriaCount: 5,
        },
        latestOperationalNote: summaryNote,
      };
      demoIndividualRecords[idx] = updated;
      recordDemoAudit({
        track: 'INDIVIDUAL',
        applicationId,
        action: 'COMPLETE_SCHOOL_REVIEW',
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        details: `Hoàn tất xét sơ tuyển: ${recommendation} — ${summaryNote}`,
      });
      return updated;
    },

    async forwardSchoolApplicationToCity({ applicationId, actor }) {
      const idx = demoIndividualRecords.findIndex((r) => r.applicationId === applicationId);
      if (idx === -1) {
        throw new Error(`Không tìm thấy hồ sơ xét sơ tuyển ${applicationId}`);
      }
      const target = demoIndividualRecords[idx];
      const now = new Date().toISOString();
      const updatedRecord: StaffApplicationRecord = {
        ...target,
        currentReviewStage: 'CITY',
        workflowStatus: 'unassigned',
        schoolPreliminaryStatus: 'forwarded_to_city',
        schoolReviewSummary: {
          ...(target.schoolReviewSummary || {
            recommendation: 'recommended',
            reviewedCriteriaCount: 5,
          }),
          status: 'forwarded_to_city',
          isForwardedToCity: true,
          forwardedAt: now,
          forwardedBy: actor.id,
          forwardedByName: actor.name,
        },
      };
      demoIndividualRecords[idx] = updatedRecord;
      return {
        success: true,
        message: 'Đã xác nhận và chuyển hồ sơ lên Hội Sinh viên Đại học Đà Nẵng.',
        record: updatedRecord,
      };
    },

    async getSchoolForwardingBatchSummary(params) {
      const rawUnitId = params?.actor?.unitId || 'unit-dut';
      const unitId = rawUnitId === 'unit-udn' ? 'unit-dut' : rawUnitId;
      const unitName =
        AUTHORITATIVE_SCHOOL_REVIEW_UNITS.find((u) => u.id === unitId)?.officialName ||
        'Trường Đại học Bách khoa – ĐHĐN';
      const seasonId = params?.seasonId || 'season-2026-2027';
      const batchKey = `${unitId}:${seasonId}`;
      const existingBatch = demoSchoolForwardingBatches.get(batchKey);

      const apps = demoIndividualRecords.filter((r) => {
        const rUnit = resolveSchoolReviewUnit(r.institution.id);
        const effectiveUnitId = rUnit.resolved && rUnit.unit ? rUnit.unit.id : r.institution.id;
        return effectiveUnitId === unitId;
      });

      let reviewed = 0;
      let selected = 0;
      let notSelected = 0;
      let pending = 0;
      let withActiveSupplements = 0;

      const instMap = new Map<string, { id: string; name: string; total: number; selected: number; pending: number }>();

      for (const app of apps) {
        const instId = app.institution.id;
        const instName = app.institution.officialName;
        if (!instMap.has(instId)) {
          instMap.set(instId, { id: instId, name: instName, total: 0, selected: 0, pending: 0 });
        }
        const item = instMap.get(instId)!;
        item.total++;

        if (app.supplementSummary && app.supplementSummary.activeStatus) {
          withActiveSupplements++;
        }

        if (app.schoolPreliminaryStatus === 'forwarded_to_city') {
          reviewed++;
          selected++;
          item.selected++;
        } else if (app.schoolPreliminaryStatus === 'recommended_forwarding') {
          reviewed++;
          selected++;
          item.selected++;
        } else if (app.schoolPreliminaryStatus === 'not_recommended') {
          reviewed++;
          notSelected++;
        } else {
          pending++;
          item.pending++;
        }
      }

      const effectiveSelectedCount = existingBatch?.selectedApplicationIds
        ? existingBatch.selectedApplicationIds.length
        : selected;

      const blockingReasons: string[] = [];
      if (effectiveSelectedCount === 0) {
        blockingReasons.push('Chưa có hồ sơ nào được đơn vị đề xuất chuyển cấp Đại học Đà Nẵng.');
      }
      if (!existingBatch?.decisionFileId) {
        blockingReasons.push('Chưa đính kèm tệp văn bản PDF đề nghị của đơn vị.');
      }
      if (withActiveSupplements > 0) {
        blockingReasons.push(`Còn ${withActiveSupplements} hồ sơ có yêu cầu bổ sung minh chứng chưa hoàn tất.`);
      }

      const isAlreadyForwarded = existingBatch?.status === 'FORWARDED';

      return {
        schoolReviewUnitId: unitId,
        schoolReviewUnitName: unitName,
        seasonId,
        seasonCode: seasonId.includes('2025') ? '2025–2026' : '2026–2027',
        totalApplicationsInScope: apps.length,
        reviewedApplicationsCount: reviewed,
        selectedApplicationsCount: effectiveSelectedCount,
        notSelectedApplicationsCount: notSelected,
        pendingReviewCount: pending,
        hasActiveSupplementsCount: withActiveSupplements,
        institutionBreakdown: Array.from(instMap.values()).map((v) => ({
          institutionId: v.id,
          institutionName: v.name,
          totalApplications: v.total,
          selectedCount: v.selected,
          pendingCount: v.pending,
        })),
        canForward: !isAlreadyForwarded && blockingReasons.length === 0,
        blockingReasons,
        isAlreadyForwarded,
        forwardedAt: existingBatch?.submittedAt,
        batchId: existingBatch?.id,
        attachedDecisionDocument: existingBatch?.decisionFileId
          ? {
              decisionNumber: existingBatch.decisionNumber || undefined,
              decisionTitle: existingBatch.decisionTitle || undefined,
              decisionDate: existingBatch.decisionDate || undefined,
              signedByName: existingBatch.signedByName || undefined,
              signedByTitle: existingBatch.signedByTitle || undefined,
              fileId: existingBatch.decisionFileId || '',
              fileName: existingBatch.decisionFileName || '',
              fileSize: existingBatch.decisionFileSize || 0,
              fileUrl: existingBatch.decisionFileUrl,
            }
          : undefined,
      };
    },

    async getSchoolForwardingBatch(params) {
      const rawUnitId = params?.actor?.unitId || 'unit-dut';
      const unitId = rawUnitId === 'unit-udn' ? 'unit-dut' : rawUnitId;
      const seasonId = params?.seasonId || 'season-2026-2027';
      const batchKey = `${unitId}:${seasonId}`;
      return demoSchoolForwardingBatches.get(batchKey) || null;
    },

    async saveSchoolForwardingBatchDraft({ seasonId = 'season-2026-2027', selectedApplicationIds, forwardingNote, decisionMetadata, actor }) {
      const rawUnitId = actor.unitId || 'unit-dut';
      const unitId = rawUnitId === 'unit-udn' ? 'unit-dut' : rawUnitId;
      const unitName =
        AUTHORITATIVE_SCHOOL_REVIEW_UNITS.find((u) => u.id === unitId)?.officialName ||
        'Trường Đại học Bách khoa – ĐHĐN';
      const batchKey = `${unitId}:${seasonId}`;
      let batch = demoSchoolForwardingBatches.get(batchKey);

      if (batch && batch.status === 'FORWARDED') {
        throw new Error('BATCH_ALREADY_FORWARDED: Đơn vị đã chốt và chuyển danh sách lên cấp Đại học Đà Nẵng. Không thể chỉnh sửa sau khi đã gửi.');
      }

      for (const appId of selectedApplicationIds) {
        const app = demoIndividualRecords.find((r) => r.applicationId === appId);
        if (app) {
          const rUnit = resolveSchoolReviewUnit(app.institution.id);
          const effectiveUnitId = rUnit.resolved && rUnit.unit ? rUnit.unit.id : app.institution.id;
          if (effectiveUnitId !== unitId) {
            throw new Error(`APPLICATION_NOT_IN_SCOPE: Hồ sơ ${appId} không thuộc thẩm quyền của đơn vị.`);
          }
        }
      }

      const now = new Date().toISOString();
      if (!batch) {
        batch = {
          id: `batch-${unitId}-${Date.now().toString(36)}`,
          seasonId,
          schoolReviewUnitId: unitId,
          schoolReviewUnitName: unitName,
          status: 'DRAFT',
          selectedApplicationIds,
          applicationCount: selectedApplicationIds.length,
          forwardingNote,
          decisionNumber: decisionMetadata?.decisionNumber,
          decisionTitle: decisionMetadata?.decisionTitle,
          decisionDate: decisionMetadata?.decisionDate,
          signedByName: decisionMetadata?.signedByName,
          signedByTitle: decisionMetadata?.signedByTitle,
          version: 1,
          createdAt: now,
          updatedAt: now,
        };
      } else {
        batch.selectedApplicationIds = selectedApplicationIds;
        batch.applicationCount = selectedApplicationIds.length;
        batch.forwardingNote = forwardingNote ?? batch.forwardingNote;
        if (decisionMetadata) {
          batch.decisionNumber = decisionMetadata.decisionNumber ?? batch.decisionNumber;
          batch.decisionTitle = decisionMetadata.decisionTitle ?? batch.decisionTitle;
          batch.decisionDate = decisionMetadata.decisionDate ?? batch.decisionDate;
          batch.signedByName = decisionMetadata.signedByName ?? batch.signedByName;
          batch.signedByTitle = decisionMetadata.signedByTitle ?? batch.signedByTitle;
        }
        batch.version += 1;
        batch.updatedAt = now;
      }

      demoSchoolForwardingBatches.set(batchKey, batch);
      recordDemoAudit({
        track: 'INDIVIDUAL',
        action: 'SAVE_SCHOOL_FORWARDING_BATCH_DRAFT',
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        details: `Lưu dự thảo đợt chuyển danh sách cấp Trường (${selectedApplicationIds.length} hồ sơ).`,
      });

      return batch;
    },

    async attachSchoolDecisionDocument({ seasonId = 'season-2026-2027', decisionNumber, decisionTitle, decisionDate, signedByName, signedByTitle, fileId, fileName, fileSize, fileUrl, actor }) {
      const rawUnitId = actor.unitId || 'unit-dut';
      const unitId = rawUnitId === 'unit-udn' ? 'unit-dut' : rawUnitId;
      const unitName =
        AUTHORITATIVE_SCHOOL_REVIEW_UNITS.find((u) => u.id === unitId)?.officialName ||
        'Trường Đại học Bách khoa – ĐHĐN';
      const batchKey = `${unitId}:${seasonId}`;
      let batch = demoSchoolForwardingBatches.get(batchKey);

      if (batch && batch.status === 'FORWARDED') {
        throw new Error('BATCH_ALREADY_FORWARDED: Đơn vị đã chốt và chuyển danh sách lên cấp Đại học Đà Nẵng. Quyết định đã được đóng băng.');
      }

      if (!fileId) {
        throw new Error('INVALID_DECISION_DOC_INPUT: Tệp đính kèm văn bản quyết định là bắt buộc.');
      }

      if (fileName && !fileName.toLowerCase().endsWith('.pdf')) {
        throw new Error('Văn bản đính kèm bắt buộc phải là định dạng PDF (.pdf)');
      }

      const now = new Date().toISOString();
      if (!batch) {
        batch = {
          id: `batch-${unitId}-${Date.now().toString(36)}`,
          seasonId,
          schoolReviewUnitId: unitId,
          schoolReviewUnitName: unitName,
          status: 'DRAFT',
          selectedApplicationIds: [],
          applicationCount: 0,
          decisionNumber,
          decisionTitle,
          decisionDate,
          signedByName,
          signedByTitle,
          decisionFileId: fileId,
          decisionFileName: fileName,
          decisionFileSize: fileSize,
          decisionFileUrl: fileUrl,
          version: 1,
          createdAt: now,
          updatedAt: now,
        };
      } else {
        batch.decisionNumber = decisionNumber ?? batch.decisionNumber;
        batch.decisionTitle = decisionTitle ?? batch.decisionTitle;
        batch.decisionDate = decisionDate ?? batch.decisionDate;
        batch.signedByName = signedByName ?? batch.signedByName;
        batch.signedByTitle = signedByTitle ?? batch.signedByTitle;
        batch.decisionFileId = fileId;
        batch.decisionFileName = fileName;
        batch.decisionFileSize = fileSize;
        batch.decisionFileUrl = fileUrl;
        batch.version += 1;
        batch.updatedAt = now;
      }

      demoSchoolForwardingBatches.set(batchKey, batch);
      recordDemoAudit({
        track: 'INDIVIDUAL',
        action: 'ATTACH_SCHOOL_DECISION_DOCUMENT',
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        details: `Đính kèm văn bản quyết định đề xuất (${fileName}).`,
      });

      return batch;
    },

    async confirmSchoolForwardingBatch({ seasonId = 'season-2026-2027', idempotencyKey, forwardingNote, actor }) {
      const rawUnitId = actor.unitId || 'unit-dut';
      const unitId = rawUnitId === 'unit-udn' ? 'unit-dut' : rawUnitId;
      const batchKey = `${unitId}:${seasonId}`;
      const batch = demoSchoolForwardingBatches.get(batchKey);

      if (!batch) {
        throw new Error('BATCH_NOT_FOUND: Chưa khởi tạo danh sách đề xuất chuyển cấp Đại học Đà Nẵng.');
      }

      if (batch.status === 'FORWARDED') {
        if (idempotencyKey && batch.idempotencyKey === idempotencyKey) {
          return {
            success: true,
            message: `Danh sách đợt đề xuất đã được chuyển thành công trước đó (idempotent).`,
            data: batch,
          };
        }
        throw new Error('BATCH_ALREADY_FORWARDED: Danh sách đề xuất của đơn vị đã được chuyển lên cấp Đại học Đà Nẵng trước đó. Mỗi đơn vị chỉ được chuyển 01 lần duy nhất trong mùa xét.');
      }

      if (!batch.selectedApplicationIds || batch.selectedApplicationIds.length === 0) {
        throw new Error('EMPTY_SELECTION_LIST: Danh sách đề xuất chuyển cấp Đại học Đà Nẵng không được để trống.');
      }

      if (!batch.decisionFileId) {
        throw new Error('MISSING_DECISION_DOCUMENT: Bắt buộc phải đính kèm tệp văn bản PDF đề nghị của đơn vị trước khi chuyển danh sách lên cấp Đại học Đà Nẵng.');
      }

      const now = new Date().toISOString();
      batch.status = 'FORWARDED';
      batch.submittedAt = now;
      batch.submittedByUserId = actor.id;
      batch.submittedByName = actor.name;
      if (forwardingNote) batch.forwardingNote = forwardingNote;
      if (idempotencyKey) batch.idempotencyKey = idempotencyKey;
      batch.version += 1;
      batch.updatedAt = now;

      let transitionedCount = 0;
      for (const appId of batch.selectedApplicationIds) {
        const idx = demoIndividualRecords.findIndex((r) => r.applicationId === appId);
        if (idx !== -1) {
          const current = demoIndividualRecords[idx];
          demoIndividualRecords[idx] = {
            ...current,
            currentReviewStage: 'CITY',
            schoolPreliminaryStatus: 'forwarded_to_city',
            workflowStatus: 'unassigned',
            assignment: null,
            reviewedCriteriaCount: 0,
            criteriaReview: current.criteriaReview.map((c) => ({
              ...c,
              status: 'not_reviewed',
              noteSummary: undefined,
            })),
            latestOperationalNote: `Đã chuyển theo Quyết định ${batch.decisionNumber} từ ${
              current.schoolReviewUnitName || batch.schoolReviewUnitName || 'Trường Đại học Bách khoa – ĐHĐN'
            } lên Hội Sinh viên Đại học Đà Nẵng (${now}).`,
          };
          transitionedCount++;
        }
      }

      recordDemoAudit({
        track: 'INDIVIDUAL',
        action: 'CONFIRM_ONE_TIME_SCHOOL_FORWARDING_BATCH',
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        details: `Chốt và chuyển chính thức đợt ${batch.id} gồm ${transitionedCount} hồ sơ lên Hội Sinh viên Đại học Đà Nẵng theo QĐ số ${batch.decisionNumber}.`,
      });

      return {
        success: true,
        message: `Đã chốt và chuyển thành công ${transitionedCount} hồ sơ lên Hội Sinh viên Đại học Đà Nẵng.`,
        data: batch,
      };
    },

    async listIncomingForwardedBatchesForCity(params) {
      const seasonId = params?.seasonId;
      const batches = Array.from(demoSchoolForwardingBatches.values()).filter(
        (b) => b.status === 'FORWARDED' && (!seasonId || b.seasonId === seasonId)
      );
      return batches;
    },
  },

  collective: {
    async listApplications() {
      return getAllCollectiveApplications();
    },

    async getApplicationById(id: string) {
      return getCollectiveApplicationById(id) || null;
    },

    async createApplication(payload: CreateCollectivePayload) {
      return createCollectiveApplication(payload);
    },

    async updateBasicInfo(id: string, payload: any) {
      updateCollectiveBasicInfo(id, payload, payload.actor);
      return getCollectiveApplicationById(id)!;
    },

    async updateDeclaration(
      id: string,
      requirementId: CollectiveRequirementId,
      data: Record<string, unknown>,
      actor?: any
    ) {
      const keyMap: Record<CollectiveRequirementId, 'tt01' | 'tt02' | 'tt03' | 'tt04'> = {
        TT01: 'tt01',
        TT02: 'tt02',
        TT03: 'tt03',
        TT04: 'tt04',
      };
      updateCollectiveRequirement(id, keyMap[requirementId], data as any, actor);
      return getCollectiveApplicationById(id)!;
    },

    async saveMembersRoster(
      id: string,
      requirementId: 'TT02' | 'TT03',
      members: any[],
      actor?: any
    ) {
      const keyMap: Record<'TT02' | 'TT03', 'tt02' | 'tt03'> = {
        TT02: 'tt02',
        TT03: 'tt03',
      };
      updateCollectiveRequirement(id, keyMap[requirementId], { structuredMembers: members } as any, actor);
      return getCollectiveApplicationById(id)!;
    },

    async submitDirectlyToCity(id: string, actor: any) {
      const res = submitCollectiveDirectlyToCity(
        id,
        actor || { name: 'Người lập hồ sơ', role: 'COLLECTIVE_PREPARER' }
      );
      return {
        success: res.success,
        message: res.message,
        destination: 'Hội Sinh viên Việt Nam Đại học Đà Nẵng',
        data: res.application || getCollectiveApplicationById(id) || null,
      };
    },

    async submitSupplementResponse(params: {
      applicationId: string;
      requirementId: CollectiveRequirementId;
      files: ApplicationEvidence[];
      notes: string;
      actor: any;
    }) {
      submitCollectiveSupplement(
        params.applicationId,
        params.requirementId,
        params.files,
        params.notes,
        params.actor || { name: 'Người nộp bổ sung' }
      );
      return getCollectiveApplicationById(params.applicationId)!;
    },
  },

  cityAssignment: {
    async assignIndividualOfficer({ applicationId, officerId, reason, actor }) {
      const app = INITIAL_STAFF_APPLICATIONS.find((a) => a.applicationId === applicationId);
      if (!app) throw new Error(`Không tìm thấy hồ sơ ${applicationId}`);
      const officer = CITY_REVIEW_OFFICERS.find((o) => o.id === officerId) || {
        id: officerId,
        fullName: 'Cán bộ thẩm định',
        email: 'officer@danang.gov.vn',
      };
      app.assignment = {
        applicationId,
        officerId: officer.id,
        officerName: officer.fullName,
        assignedAt: new Date().toISOString(),
        assignedBy: actor.name,
        status: 'not_started',
      };
      return app;
    },

    async assignCollectiveOfficer({
      applicationId,
      officerId,
      assignmentNote,
      reassignmentReason,
      actor,
    }) {
      const officer = CITY_REVIEW_OFFICERS.find((o) => o.id === officerId) || {
        id: officerId,
        fullName: 'Cán bộ thẩm định',
        email: 'officer@danang.gov.vn',
      };
      const res = assignCityOfficer(
        applicationId,
        officer.id,
        officer.fullName,
        { name: actor.name, role: actor.role },
        assignmentNote,
        reassignmentReason
      );
      return {
        success: res.success,
        message: res.message,
        isReassignment: res.isReassignment,
        data: res.application || getCollectiveApplicationById(applicationId) || null,
      };
    },
  },

  cityOfficerReview: {
    async startCollectiveReview(applicationId, actor) {
      startCityReview(applicationId, { name: actor.name, role: actor.role });
      const updated = getCollectiveApplicationById(applicationId);
      if (!updated) throw new Error(`Không tìm thấy hồ sơ tập thể ${applicationId}`);
      return updated;
    },

    async saveCollectiveRequirementJudgment({
      applicationId,
      requirementId,
      judgment,
      notes,
      actor,
    }) {
      const ok = saveCityRequirementJudgment(applicationId, requirementId, judgment, notes, {
        name: actor.name,
        role: actor.role,
      });
      if (!ok) throw new Error(`Không tìm thấy hồ sơ tập thể ${applicationId}`);
      return getCollectiveApplicationById(applicationId)!;
    },

    async saveCollectiveEvidenceJudgment({
      applicationId,
      requirementId,
      evidenceId,
      status,
      notes,
      actor,
    }) {
      const ok = saveCityEvidenceJudgment(
        applicationId,
        requirementId,
        evidenceId,
        status,
        notes,
        { name: actor.name, role: actor.role }
      );
      if (!ok) throw new Error(`Không tìm thấy hồ sơ tập thể ${applicationId}`);
      return getCollectiveApplicationById(applicationId)!;
    },

    async requestCollectiveSupplement(applicationId, payload: CreateSupplementRequestPayload) {
      requestCollectiveSupplement(
        applicationId,
        payload.requirementId,
        payload.reason,
        { id: payload.actor.id, name: payload.actor.name, role: payload.actor.role },
        {
          deadline: payload.deadline,
          scopeType: payload.scopeType,
          targetDeclarationField: payload.targetDeclarationField,
          targetEvidenceId: payload.targetEvidenceId,
          targetEvidenceName: payload.targetEvidenceName,
          allowedActions: payload.allowedActions,
        }
      );
      const updated = getCollectiveApplicationById(applicationId);
      if (!updated) throw new Error(`Không tìm thấy hồ sơ tập thể ${applicationId}`);
      return updated;
    },

    async completeCollectiveReview({ applicationId, summaryNote, actor }) {
      const res = completeCityReview(applicationId, summaryNote, {
        name: actor.name,
        role: actor.role,
      });
      return {
        success: res.success,
        message: res.message,
        data: getCollectiveApplicationById(applicationId) || null,
      };
    },

    async reopenCollectiveReview({ applicationId, reason, actor }) {
      const res = reopenCityReview(applicationId, reason, {
        name: actor.name,
        role: actor.role,
      });
      return {
        success: res.success,
        message: res.message,
        data: getCollectiveApplicationById(applicationId) || null,
      };
    },
  },

  committeeDecision: {
    async recordIndividualDecision({ applicationId, outcome, internalNote, actor }) {
      const idx = demoIndividualRecords.findIndex((r) => r.applicationId === applicationId);
      if (idx === -1) throw new Error(`Không tìm thấy hồ sơ cá nhân ${applicationId}`);
      const current = demoIndividualRecords[idx];
      const updated: StaffApplicationRecord = {
        ...current,
        workflowStatus: 'ready_for_finalization',
        finalResultSummary: {
          isPublished: false,
          outcome,
        },
        latestOperationalNote: internalNote || current.latestOperationalNote,
      };
      demoIndividualRecords[idx] = updated;
      recordDemoAudit({
        track: 'INDIVIDUAL',
        applicationId,
        action: 'COMMITTEE_INDIVIDUAL_DECISION',
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        details: `Hội đồng ghi nhận kết luận: ${outcome}`,
      });
      return updated;
    },

    async publishIndividualResults({ decisionNumber, actor }) {
      let publishedCount = 0;
      const now = new Date().toISOString();
      demoIndividualRecords = demoIndividualRecords.map((r) => {
        if (r.finalResultSummary?.outcome) {
          publishedCount++;
          return {
            ...r,
            workflowStatus:
              r.finalResultSummary.outcome === 'recognized'
                ? 'finalized_recognized'
                : 'finalized_not_recognized',
            finalResultSummary: {
              ...r.finalResultSummary,
              isPublished: true,
              decisionNumber,
              publishedAt: now,
            },
          };
        }
        return r;
      });
      recordDemoAudit({
        track: 'INDIVIDUAL',
        action: 'PUBLISH_INDIVIDUAL_RESULTS',
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        details: `Công bố ${publishedCount} kết quả cá nhân theo QĐ ${decisionNumber}`,
      });
      return { publishedCount, decisionNumber };
    },

    async recordCollectiveDecision({ applicationId, outcome, notes, actor }) {
      const res = recordCollectiveCommitteeDecision(applicationId, outcome, notes || '', {
        name: actor.name,
        role: actor.role,
      });
      return {
        success: res.success,
        message: res.message,
        data: getCollectiveApplicationById(applicationId) || null,
      };
    },

    async publishCollectiveResult({ applicationId, decisionNumber, decisionDate, actor }) {
      const res = publishCollectiveResultRecord(
        applicationId,
        decisionNumber,
        decisionDate || new Date().toLocaleDateString('vi-VN'),
        { name: actor.name, role: actor.role }
      );
      return {
        success: res.success,
        message: res.message,
        data: getCollectiveApplicationById(applicationId) || null,
      };
    },

    async reopenCollectiveDecision({ applicationId, reason, actor }) {
      const res = reopenCollectiveCommitteeDecision(applicationId, reason, {
        name: actor.name,
        role: actor.role,
      });
      return {
        success: res.success,
        message: res.message,
        data: getCollectiveApplicationById(applicationId) || null,
      };
    },
  },

  evidenceStorage: {
    async uploadEvidence(payload: EvidenceUploadPayload) {
      payload.onStateChange?.('VALIDATING');
      const mime = resolveCanonicalMimeType(payload.fileName, payload.mimeType || payload.fileType);
      validateClientEvidenceFile(payload.fileName, mime, payload.fileSizeBytes);

      const ext = payload.fileName.split('.').pop()?.toLowerCase() || 'pdf';
      const sizeKb = Math.max(1, Math.round(payload.fileSizeBytes / 1024));
      const sizeLabel =
        sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;
      const evidence: ApplicationEvidence = {
        id: `ev-demo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: payload.fileName,
        fileType: ext,
        size: sizeLabel,
        uploadedAt: new Date().toLocaleDateString('vi-VN'),
        status: 'achieved' as ApplicationEvidence['status'],
        url: payload.base64Content || `#demo-evidence-${payload.fileName}`,
      };
      demoEvidenceMap.set(evidence.id, { ...evidence, base64Content: payload.base64Content });

      if (payload.ownerTrack === 'COLLECTIVE') {
        addCollectiveEvidence(
          payload.applicationId,
          payload.requirementOrCriterionId as CollectiveRequirementId,
          evidence
        );
      }
      payload.onStateChange?.('CLEAN');
      return evidence;
    },

    async uploadEvidenceViaR2(payload: EvidenceUploadPayload) {
      return this.uploadEvidence(payload);
    },

    async getEvidenceById(evidenceId: string) {
      return demoEvidenceMap.get(evidenceId) || null;
    },

    async getViewUrl(evidenceId: string) {
      const found = demoEvidenceMap.get(evidenceId);
      return {
        evidenceObjectId: evidenceId,
        viewUrl: found?.url || `#demo-view-${evidenceId}`,
        expiresInSeconds: 120,
        fileName: found?.name || 'minh-chung.pdf',
        mimeType: resolveCanonicalMimeType(found?.name || 'minh-chung.pdf', found?.fileType),
        cacheControl: 'private, max-age=3600, immutable',
      };
    },

    async getBatchViewUrls(evidenceIds: string[]) {
      return Promise.all(evidenceIds.map((id) => this.getViewUrl(id)));
    },

    async retryUploadIntent(evidenceId: string) {
      return {
        evidenceObjectId: evidenceId,
        uploadUrl: `#demo-retry-put-${evidenceId}`,
        objectKey: `evidence/demo/${evidenceId}`,
        expiresInSeconds: 300,
      };
    },

    async deleteEvidence({ ownerTrack, applicationId, requirementId, evidenceId }) {
      demoEvidenceMap.delete(evidenceId);
      if (ownerTrack === 'COLLECTIVE') {
        removeCollectiveEvidence(
          applicationId,
          requirementId as CollectiveRequirementId,
          evidenceId
        );
      }
    },
  },

  auditAndSystem: {
    async getHealth() {
      return {
        status: 'ok',
        mode: 'DEMO',
        timestamp: new Date().toISOString(),
      };
    },

    async listAuditLogs(filter) {
      return demoAuditLogs.filter((log) => {
        if (filter?.applicationId && log.applicationId !== filter.applicationId) return false;
        if (filter?.track && log.track !== filter.track) return false;
        return true;
      });
    },
  },
};

export function resetDemoBatchState(): void {
  demoSchoolForwardingBatches.clear();
  demoIndividualRecords = structuredClone(INITIAL_STAFF_APPLICATIONS);
}
