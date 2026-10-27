/**
 * 5TOT ĐHĐN — Admin Control Plane Feature Hook (FSD Features Layer)
 * Encapsulates state, readiness checks, Central-style timeline synchronization,
 * and audit-logged mutations for Institutions, School Review Units, Staff Accounts,
 * Seasons, Criteria (Individual + Collective TT01–TT04), Deadlines, Notifications,
 * Workflow Policy, and First-Admin Bootstrap.
 */

import {
  useState,
  useCallback,
  useEffect,
  Dispatch,
  SetStateAction,
} from 'react';
import {
  StaffRole,
  StaffUser,
  StaffApplicationRecord,
  StaffApplicationStatus,
} from '../../staff/types';
import {
  Institution,
  StaffAccount,
  Season,
  CriteriaVersion,
  DeadlineConfigItem,
  AuditEvent,
  InstitutionStatus,
  StaffAccountStatus,
  SchoolReviewUnitConfig,
  NotificationTemplateConfig,
  WorkflowOperationalPolicy,
  SystemIntegrationHealthItem,
  AdminBootstrapState,
} from '../../staff/adminTypes';
import {
  INITIAL_INSTITUTIONS,
  INITIAL_STAFF_ACCOUNTS,
  INITIAL_SEASONS,
  INITIAL_CRITERIA_VERSIONS,
  INITIAL_DEADLINE_ITEMS,
  INITIAL_AUDIT_LOGS,
  INITIAL_SCHOOL_REVIEW_UNITS,
  INITIAL_NOTIFICATION_TEMPLATES,
  INITIAL_WORKFLOW_POLICY,
  INITIAL_SYSTEM_HEALTH,
} from '../../staff/fixtures/adminDataset';
import {
  canDeactivateStaff,
  validateSchoolReviewUnitMapping,
} from '../../staff/adminSelectors';
import {
  fetchAdminSnapshotFromServer,
  syncAdminActionToServer,
} from './adminApiService';
import { useAdminSeasonAndOperations } from './useAdminSeasonAndOperations';

export interface AdminActionFeedback {
  type: 'success' | 'error' | 'warning';
  message: string;
}

export function useAdminControlPlane(
  staffUser: StaffUser,
  setStaffApplications?: Dispatch<SetStateAction<StaffApplicationRecord[]>>
) {
  const [adminInstitutions, setAdminInstitutions] = useState<Institution[]>(
    () => JSON.parse(JSON.stringify(INITIAL_INSTITUTIONS))
  );
  const [adminSchoolReviewUnits, setAdminSchoolReviewUnits] = useState<
    SchoolReviewUnitConfig[]
  >(() => JSON.parse(JSON.stringify(INITIAL_SCHOOL_REVIEW_UNITS)));
  const [adminStaffAccounts, setAdminStaffAccounts] = useState<StaffAccount[]>(
    () => JSON.parse(JSON.stringify(INITIAL_STAFF_ACCOUNTS))
  );
  const [adminSeasons, setAdminSeasons] = useState<Season[]>(() =>
    JSON.parse(JSON.stringify(INITIAL_SEASONS))
  );
  const [adminCriteriaVersions, setAdminCriteriaVersions] = useState<
    CriteriaVersion[]
  >(() => JSON.parse(JSON.stringify(INITIAL_CRITERIA_VERSIONS)));
  const [adminDeadlines, setAdminDeadlines] = useState<DeadlineConfigItem[]>(
    () => JSON.parse(JSON.stringify(INITIAL_DEADLINE_ITEMS))
  );
  const [adminNotificationTemplates, setAdminNotificationTemplates] = useState<
    NotificationTemplateConfig[]
  >(() => JSON.parse(JSON.stringify(INITIAL_NOTIFICATION_TEMPLATES)));
  const [adminWorkflowPolicy, setAdminWorkflowPolicy] =
    useState<WorkflowOperationalPolicy>(() =>
      JSON.parse(JSON.stringify(INITIAL_WORKFLOW_POLICY))
    );
  const [adminSystemHealth, setAdminSystemHealth] = useState<
    SystemIntegrationHealthItem[]
  >(() => JSON.parse(JSON.stringify(INITIAL_SYSTEM_HEALTH)));
  const [adminBootstrapState, setAdminBootstrapState] =
    useState<AdminBootstrapState>(() => ({
      bootstrapCompleted: true,
      activeAdminCount: INITIAL_STAFF_ACCOUNTS.filter(
        (s) =>
          s.status === 'active' &&
          (s.primaryRole === 'ADMIN' || s.roles.includes('ADMIN'))
      ).length,
      completedAt: '01/10/2025 08:00 (GMT+7)',
      completedByEmail: 'admin.hethong@5tot.danang.vn',
      bootstrapMode: 'NORMAL_OPERATION',
    }));
  const [adminAuditLogs, setAdminAuditLogs] = useState<AuditEvent[]>(() =>
    JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS))
  );
  const [adminActionFeedback, setAdminActionFeedback] =
    useState<AdminActionFeedback | null>(null);

  const clearAdminFeedback = useCallback(() => {
    setAdminActionFeedback(null);
  }, []);

  useEffect(() => {
    if (staffUser.primaryRole !== 'ADMIN') return;
    let mounted = true;
    fetchAdminSnapshotFromServer().then((snap) => {
      if (!mounted || !snap) return;
      if (snap.institutions) setAdminInstitutions(snap.institutions);
      if (snap.schoolReviewUnits)
        setAdminSchoolReviewUnits(snap.schoolReviewUnits);
      if (snap.staffAccounts) setAdminStaffAccounts(snap.staffAccounts);
      if (snap.seasons) setAdminSeasons(snap.seasons);
      if (snap.criteriaVersions)
        setAdminCriteriaVersions(snap.criteriaVersions);
      if (snap.deadlineItems) setAdminDeadlines(snap.deadlineItems);
      if (snap.notificationTemplates)
        setAdminNotificationTemplates(snap.notificationTemplates);
      if (snap.workflowPolicy) setAdminWorkflowPolicy(snap.workflowPolicy);
      if (snap.systemHealth) setAdminSystemHealth(snap.systemHealth);
      if (snap.bootstrapState) setAdminBootstrapState(snap.bootstrapState);
      if (snap.auditEvents) setAdminAuditLogs(snap.auditEvents);
    });
    return () => {
      mounted = false;
    };
  }, [staffUser.primaryRole, staffUser.id]);

  const resetAdminControlPlane = useCallback(() => {
    setAdminInstitutions(JSON.parse(JSON.stringify(INITIAL_INSTITUTIONS)));
    setAdminSchoolReviewUnits(
      JSON.parse(JSON.stringify(INITIAL_SCHOOL_REVIEW_UNITS))
    );
    setAdminStaffAccounts(JSON.parse(JSON.stringify(INITIAL_STAFF_ACCOUNTS)));
    setAdminSeasons(JSON.parse(JSON.stringify(INITIAL_SEASONS)));
    setAdminCriteriaVersions(
      JSON.parse(JSON.stringify(INITIAL_CRITERIA_VERSIONS))
    );
    setAdminDeadlines(JSON.parse(JSON.stringify(INITIAL_DEADLINE_ITEMS)));
    setAdminNotificationTemplates(
      JSON.parse(JSON.stringify(INITIAL_NOTIFICATION_TEMPLATES))
    );
    setAdminWorkflowPolicy(JSON.parse(JSON.stringify(INITIAL_WORKFLOW_POLICY)));
    setAdminSystemHealth(JSON.parse(JSON.stringify(INITIAL_SYSTEM_HEALTH)));
    setAdminAuditLogs(JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS)));
    setAdminActionFeedback(null);
  }, []);

  // ===========================================================================
  // 1. FIRST-ADMIN BOOTSTRAP
  // ===========================================================================
  const handleInitializeFirstAdmin = useCallback(
    (payload: {
      bootstrapToken: string;
      fullName: string;
      email: string;
      password: string;
      phone?: string;
    }): { success: boolean; error?: string } => {
      if (
        adminBootstrapState.bootstrapCompleted &&
        adminBootstrapState.activeAdminCount > 0
      ) {
        const msg =
          'Hệ thống đã hoàn tất khởi tạo Quản trị viên đầu tiên. Tính năng Bootstrap một lần đã được khóa vĩnh viễn.';
        setAdminActionFeedback({ type: 'error', message: msg });
        return { success: false, error: msg };
      }
      if (!payload.bootstrapToken || payload.bootstrapToken.trim().length < 6) {
        const msg =
          'Mã khóa khởi tạo hệ thống (Bootstrap Token) không hợp lệ.';
        setAdminActionFeedback({ type: 'error', message: msg });
        return { success: false, error: msg };
      }
      if (
        !payload.fullName.trim() ||
        !payload.email.includes('@') ||
        payload.password.length < 8
      ) {
        const msg =
          'Vui lòng nhập đầy đủ họ tên, email công vụ và mật khẩu tối thiểu 8 ký tự.';
        setAdminActionFeedback({ type: 'error', message: msg });
        return { success: false, error: msg };
      }

      const nowLabel = 'Vừa xong · Hôm nay';
      const newAdmin: StaffAccount = {
        id: `staff-bootstrap-${Date.now()}`,
        fullName: payload.fullName.trim(),
        email: payload.email.trim().toLowerCase(),
        phone: payload.phone || '0905 000 111',
        primaryRole: 'ADMIN',
        roleLabel: 'Quản trị hệ thống',
        unitLabel: 'Ban Thư ký Hội Sinh viên Việt Nam Đại học Đà Nẵng',
        roles: ['ADMIN'],
        status: 'active',
        assignedApplicationCount: 0,
        lastActiveAt: nowLabel,
        createdAt: nowLabel,
      };

      setAdminStaffAccounts((prev) => [newAdmin, ...prev]);
      setAdminBootstrapState({
        bootstrapCompleted: true,
        activeAdminCount: 1,
        completedAt: nowLabel,
        completedByEmail: newAdmin.email,
        bootstrapMode: 'NORMAL_OPERATION',
      });

      const auditEv: AuditEvent = {
        id: `audit-${Date.now()}`,
        timestamp: nowLabel,
        actorId: newAdmin.id,
        actorName: newAdmin.fullName,
        actorRoleLabel: 'Quản trị hệ thống',
        category: 'security',
        actionType: 'Khởi tạo Quản trị viên đầu tiên (Bootstrap)',
        targetEntity: `${newAdmin.fullName} (${newAdmin.email})`,
        summary: `Khởi tạo thành công Quản trị viên đầu tiên ${newAdmin.email} và khóa vĩnh viễn cơ chế Bootstrap [Token: ĐÃ ẨN].`,
      };
      setAdminAuditLogs((prev) => [auditEv, ...prev]);
      setAdminActionFeedback({
        type: 'success',
        message: `Đã khởi tạo Quản trị viên đầu tiên (${newAdmin.email}) và khóa cơ chế Bootstrap.`,
      });
      void syncAdminActionToServer(
        '/api/v2/admin/bootstrap/initialize',
        'POST',
        payload
      );
      return { success: true };
    },
    [adminBootstrapState]
  );

  // ===========================================================================
  // 2. INSTITUTIONS & SCHOOL REVIEW UNITS (`unit-udn`)
  // ===========================================================================
  const handleCreateInstitution = useCallback(
    (
      newInst: Omit<
        Institution,
        'id' | 'applicationCount' | 'createdAt' | 'updatedAt'
      >
    ) => {
      const nowLabel = 'Vừa xong · Hôm nay';
      const created: Institution = {
        ...newInst,
        id: `inst-custom-${Date.now()}`,
        applicationCount: 0,
        createdAt: nowLabel,
        updatedAt: nowLabel,
      };
      setAdminInstitutions((prev) => [created, ...prev]);
      const auditEv: AuditEvent = {
        id: `audit-${Date.now()}`,
        timestamp: nowLabel,
        actorId: staffUser.id,
        actorName: staffUser.fullName,
        actorRoleLabel: staffUser.roleLabel,
        category: 'institution',
        actionType: 'Thêm đơn vị đào tạo',
        targetEntity: created.officialName,
        summary: `${staffUser.fullName} thêm mới đơn vị đào tạo ${created.officialName} (${created.shortName}).`,
      };
      setAdminAuditLogs((prev) => [auditEv, ...prev]);
      void syncAdminActionToServer('/api/v2/institutions', 'POST', newInst);
    },
    [staffUser]
  );

  const handleUpdateInstitution = useCallback(
    (id: string, updates: Partial<Institution>) => {
      const nowLabel = 'Vừa xong · Hôm nay';
      const target = adminInstitutions.find((i) => i.id === id);
      const nextInstitutions = adminInstitutions.map((inst) =>
        inst.id === id ? { ...inst, ...updates, updatedAt: nowLabel } : inst
      );
      const mappingCheck = validateSchoolReviewUnitMapping(
        nextInstitutions,
        adminSchoolReviewUnits
      );
      if (!mappingCheck.isValid) {
        setAdminActionFeedback({
          type: 'error',
          message:
            mappingCheck.errors[0] ||
            'Phân tuyến đơn vị xét sơ tuyển không hợp lệ.',
        });
        return;
      }

      setAdminInstitutions(nextInstitutions);
      const auditEv: AuditEvent = {
        id: `audit-${Date.now()}`,
        timestamp: nowLabel,
        actorId: staffUser.id,
        actorName: staffUser.fullName,
        actorRoleLabel: staffUser.roleLabel,
        category: 'institution',
        actionType: 'Chỉnh sửa đơn vị đào tạo',
        targetEntity: target?.officialName || 'Đơn vị đào tạo',
        summary: `${staffUser.fullName} cập nhật thông tin đơn vị đào tạo ${
          target?.officialName || ''
        }.`,
      };
      setAdminAuditLogs((prev) => [auditEv, ...prev]);
      void syncAdminActionToServer(
        `/api/v2/institutions/${id}`,
        'PUT',
        updates
      );
    },
    [staffUser, adminInstitutions, adminSchoolReviewUnits]
  );

  const handleToggleInstitutionStatus = useCallback(
    (id: string, nextStatus: InstitutionStatus, reason?: string) => {
      const nowLabel = 'Vừa xong · Hôm nay';
      const target = adminInstitutions.find((i) => i.id === id);
      setAdminInstitutions((prev) =>
        prev.map((inst) =>
          inst.id === id
            ? { ...inst, status: nextStatus, updatedAt: nowLabel }
            : inst
        )
      );
      const auditEv: AuditEvent = {
        id: `audit-${Date.now()}`,
        timestamp: nowLabel,
        actorId: staffUser.id,
        actorName: staffUser.fullName,
        actorRoleLabel: staffUser.roleLabel,
        category: 'institution',
        actionType: 'Cập nhật trạng thái đơn vị',
        targetEntity: target?.officialName || 'Đơn vị đào tạo',
        summary: `${staffUser.fullName} cập nhật trạng thái đơn vị ${
          target?.officialName || ''
        } sang ${nextStatus === 'active' ? 'Hoạt động' : 'Tạm ngưng'}.`,
        reason,
        beforeValue: target?.status === 'active' ? 'Hoạt động' : 'Tạm ngưng',
        afterValue: nextStatus === 'active' ? 'Hoạt động' : 'Tạm ngưng',
      };
      setAdminAuditLogs((prev) => [auditEv, ...prev]);
      void syncAdminActionToServer(
        `/api/v2/institutions/${id}/status`,
        'PATCH',
        { isActive: nextStatus === 'active', reason }
      );
    },
    [staffUser, adminInstitutions]
  );

  const handleUpdateSchoolReviewUnit = useCallback(
    (
      unitId: string,
      updates: Partial<SchoolReviewUnitConfig>,
      reason?: string
    ) => {
      const nowLabel = 'Vừa xong · Hôm nay';
      const target = adminSchoolReviewUnits.find((u) => u.id === unitId);
      if (!target) return;

      const candidateUnits = adminSchoolReviewUnits.map((u) =>
        u.id === unitId ? { ...u, ...updates, updatedAt: nowLabel } : u
      );
      const mappingCheck = validateSchoolReviewUnitMapping(
        adminInstitutions,
        candidateUnits
      );
      if (!mappingCheck.isValid) {
        setAdminActionFeedback({
          type: 'error',
          message:
            mappingCheck.errors[0] ||
            'Vi phạm quy tắc phân tuyến đơn vị xét sơ tuyển.',
        });
        return;
      }

      setAdminSchoolReviewUnits(candidateUnits);
      const auditEv: AuditEvent = {
        id: `audit-${Date.now()}`,
        timestamp: nowLabel,
        actorId: staffUser.id,
        actorName: staffUser.fullName,
        actorRoleLabel: staffUser.roleLabel,
        category: 'institution',
        actionType: 'Cập nhật Đơn vị xét sơ tuyển cấp Trường',
        targetEntity: target.officialName,
        summary: `${staffUser.fullName} cập nhật cấu hình Đơn vị xét sơ tuyển ${target.officialName} (${target.id}).`,
        reason,
      };
      setAdminAuditLogs((prev) => [auditEv, ...prev]);
      void syncAdminActionToServer(
        `/api/v2/school-review-units/${unitId}`,
        'PUT',
        updates
      );
    },
    [staffUser, adminInstitutions, adminSchoolReviewUnits]
  );

  // ===========================================================================
  // 3. STAFF ACCOUNTS & RBAC
  // ===========================================================================
  const handleCreateStaff = useCallback(
    (
      newAccount: Omit<
        StaffAccount,
        'id' | 'assignedApplicationCount' | 'lastActiveAt' | 'createdAt'
      >
    ) => {
      const nowLabel = 'Vừa xong · Hôm nay';
      const invitationCode =
        newAccount.status === 'pending_activation'
          ? `INV-5TOT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
          : undefined;
      const created: StaffAccount = {
        ...newAccount,
        id: `staff-custom-${Date.now()}`,
        assignedApplicationCount: 0,
        lastActiveAt: 'Chưa đăng nhập',
        createdAt: nowLabel,
        invitationCode,
        invitationExpiresAt: invitationCode
          ? '7 ngày kể từ khi cấp'
          : undefined,
      };
      setAdminStaffAccounts((prev) => [created, ...prev]);
      const auditEv: AuditEvent = {
        id: `audit-${Date.now()}`,
        timestamp: nowLabel,
        actorId: staffUser.id,
        actorName: staffUser.fullName,
        actorRoleLabel: staffUser.roleLabel,
        category: 'staff',
        actionType: 'Tạo tài khoản cán bộ',
        targetEntity: `${created.fullName} (${created.email})`,
        summary: `${staffUser.fullName} tạo tài khoản mới cho ${created.fullName} với vai trò ${created.roleLabel}.`,
      };
      setAdminAuditLogs((prev) => [auditEv, ...prev]);
      void syncAdminActionToServer('/api/v2/admin/staff', 'POST', newAccount);
    },
    [staffUser]
  );

  const handleActivateStaff = useCallback(
    (id: string) => {
      const nowLabel = 'Vừa xong · Hôm nay';
      const target = adminStaffAccounts.find((s) => s.id === id);
      setAdminStaffAccounts((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                status: 'active',
                invitationCode: undefined,
                activatedAt: nowLabel,
              }
            : s
        )
      );
      const auditEv: AuditEvent = {
        id: `audit-${Date.now()}`,
        timestamp: nowLabel,
        actorId: staffUser.id,
        actorName: staffUser.fullName,
        actorRoleLabel: staffUser.roleLabel,
        category: 'staff',
        actionType: 'Kích hoạt tài khoản cán bộ',
        targetEntity: target?.fullName || 'Cán bộ',
        summary: `${staffUser.fullName} kích hoạt tài khoản cán bộ ${
          target?.fullName || ''
        } (${target?.email || ''}).`,
        beforeValue: 'Chưa kích hoạt',
        afterValue: 'Đang hoạt động',
      };
      setAdminAuditLogs((prev) => [auditEv, ...prev]);
      setAdminActionFeedback({
        type: 'success',
        message: `Đã kích hoạt tài khoản ${target?.fullName || ''}.`,
      });
    },
    [staffUser, adminStaffAccounts]
  );

  const handleResendStaffInvite = useCallback(
    (id: string) => {
      const nowLabel = 'Vừa xong · Hôm nay';
      const target = adminStaffAccounts.find((s) => s.id === id);
      if (!target) return;
      const freshCode = `INV-5TOT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      setAdminStaffAccounts((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                status: 'pending_activation',
                invitationCode: freshCode,
                invitationExpiresAt: '7 ngày kể từ hôm nay',
              }
            : s
        )
      );
      const auditEv: AuditEvent = {
        id: `audit-${Date.now()}`,
        timestamp: nowLabel,
        actorId: staffUser.id,
        actorName: staffUser.fullName,
        actorRoleLabel: staffUser.roleLabel,
        category: 'staff',
        actionType: 'Cấp lại mã kích hoạt cán bộ',
        targetEntity: `${target.fullName} (${target.email})`,
        summary: `${staffUser.fullName} cấp lại mã kích hoạt lời mời cho ${target.email}.`,
      };
      setAdminAuditLogs((prev) => [auditEv, ...prev]);
      setAdminActionFeedback({
        type: 'success',
        message: `Đã cấp mã kích hoạt mới (${freshCode}) cho ${target.fullName}.`,
      });
      void syncAdminActionToServer(
        `/api/v2/admin/staff/${id}/resend-invite`,
        'POST'
      );
    },
    [staffUser, adminStaffAccounts]
  );

  const handleResetStaffPassword = useCallback(
    (id: string, reason?: string) => {
      const nowLabel = 'Vừa xong · Hôm nay';
      const target = adminStaffAccounts.find((s) => s.id === id);
      if (!target) return;
      const auditEv: AuditEvent = {
        id: `audit-${Date.now()}`,
        timestamp: nowLabel,
        actorId: staffUser.id,
        actorName: staffUser.fullName,
        actorRoleLabel: staffUser.roleLabel,
        category: 'security',
        actionType: 'Đặt lại mật khẩu cán bộ',
        targetEntity: `${target.fullName} (${target.email})`,
        summary: `${staffUser.fullName} đặt lại mật khẩu tạm thời và thu hồi các phiên đăng nhập của ${target.email} [Mật khẩu: ĐÃ ẨN].`,
        reason,
      };
      setAdminAuditLogs((prev) => [auditEv, ...prev]);
      setAdminActionFeedback({
        type: 'success',
        message: `Đã đặt lại mật khẩu tạm thời và thu hồi phiên đăng nhập của ${target.fullName}.`,
      });
      void syncAdminActionToServer(
        `/api/v2/admin/staff/${id}/reset-password`,
        'POST',
        { reason }
      );
    },
    [staffUser, adminStaffAccounts]
  );

  const handleChangeStaffRole = useCallback(
    (
      id: string,
      newRole: StaffRole,
      reason?: string,
      schoolReviewUnitId?: string
    ) => {
      const nowLabel = 'Vừa xong · Hôm nay';
      const target = adminStaffAccounts.find((s) => s.id === id);
      if (!target) return;

      if (
        (target.primaryRole === 'ADMIN' || target.roles.includes('ADMIN')) &&
        newRole !== 'ADMIN' &&
        target.status === 'active'
      ) {
        const activeAdmins = adminStaffAccounts.filter(
          (a) =>
            a.status === 'active' &&
            (a.primaryRole === 'ADMIN' || a.roles.includes('ADMIN'))
        );
        if (activeAdmins.length <= 1) {
          setAdminActionFeedback({
            type: 'error',
            message: `Không thể thu hồi quyền Quản trị hệ thống của ${target.fullName} vì đây là Quản trị viên đang hoạt động duy nhất.`,
          });
          return;
        }
      }

      const roleLabel =
        newRole === 'CITY_OFFICER'
          ? 'Cán bộ xét duyệt'
          : newRole === 'CITY_MANAGER'
            ? 'Quản lý xét duyệt'
            : newRole === 'CITY_COMMITTEE'
              ? 'Hội đồng xét chọn'
              : newRole === 'SCHOOL_OFFICER'
                ? 'Cán bộ sơ tuyển cấp Trường'
                : 'Quản trị hệ thống';

      setAdminStaffAccounts((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                primaryRole: newRole,
                roleLabel,
                roles: [newRole],
                schoolReviewUnitId:
                  newRole === 'SCHOOL_OFFICER'
                    ? schoolReviewUnitId || s.schoolReviewUnitId || 'unit-dut'
                    : undefined,
              }
            : s
        )
      );

      const auditEv: AuditEvent = {
        id: `audit-${Date.now()}`,
        timestamp: nowLabel,
        actorId: staffUser.id,
        actorName: staffUser.fullName,
        actorRoleLabel: staffUser.roleLabel,
        category: 'permission',
        actionType: 'Thay đổi vai trò cán bộ',
        targetEntity: target.fullName,
        summary: `${staffUser.fullName} thay đổi vai trò của ${target.fullName} từ ${target.roleLabel} sang ${roleLabel}.`,
        reason,
        beforeValue: target.roleLabel,
        afterValue: roleLabel,
      };
      setAdminAuditLogs((prev) => [auditEv, ...prev]);
      void syncAdminActionToServer(`/api/v2/admin/staff/${id}/role`, 'PUT', {
        primaryRole: newRole,
        schoolReviewUnitId,
        reason,
      });
    },
    [staffUser, adminStaffAccounts]
  );

  const handleToggleStaffStatus = useCallback(
    (id: string, nextStatus: StaffAccountStatus, reason?: string) => {
      const nowLabel = 'Vừa xong · Hôm nay';
      const target = adminStaffAccounts.find((s) => s.id === id);
      if (!target) return;

      if (
        (nextStatus === 'suspended' || nextStatus === 'retired') &&
        target.status === 'active'
      ) {
        const check = canDeactivateStaff(target, adminStaffAccounts);
        if (check.isLastActiveAdmin) {
          setAdminActionFeedback({
            type: 'error',
            message:
              check.warningMessage ||
              'Không thể khóa tài khoản Quản trị viên hoạt động cuối cùng.',
          });
          return;
        }
      }

      setAdminStaffAccounts((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: nextStatus } : s))
      );
      const statusText =
        nextStatus === 'active'
          ? 'Đang hoạt động'
          : nextStatus === 'suspended'
            ? 'Tạm khóa'
            : nextStatus === 'retired'
              ? 'Ngừng sử dụng'
              : 'Chưa kích hoạt';

      const auditEv: AuditEvent = {
        id: `audit-${Date.now()}`,
        timestamp: nowLabel,
        actorId: staffUser.id,
        actorName: staffUser.fullName,
        actorRoleLabel: staffUser.roleLabel,
        category: 'staff',
        actionType: 'Thay đổi trạng thái tài khoản',
        targetEntity: target.fullName,
        summary: `${staffUser.fullName} cập nhật trạng thái tài khoản của ${target.fullName} sang ${statusText}.`,
        reason,
      };
      setAdminAuditLogs((prev) => [auditEv, ...prev]);
      void syncAdminActionToServer(
        `/api/v2/admin/staff/${id}/status`,
        'PATCH',
        {
          status: nextStatus,
          reason,
        }
      );
    },
    [staffUser, adminStaffAccounts]
  );

  const seasonAndOps = useAdminSeasonAndOperations({
    staffUser,
    adminInstitutions,
    adminSchoolReviewUnits,
    adminStaffAccounts,
    adminSeasons,
    setAdminSeasons,
    adminCriteriaVersions,
    setAdminCriteriaVersions,
    adminDeadlines,
    setAdminDeadlines,
    adminNotificationTemplates,
    setAdminNotificationTemplates,
    adminWorkflowPolicy,
    setAdminWorkflowPolicy,
    setAdminAuditLogs,
    setAdminActionFeedback,
  });

  const handleCreateOperationalApplication = useCallback(
    (payload: {
      fullName: string;
      studentCode: string;
      email: string;
      institutionId: string;
      schoolYear: string;
      reason: string;
    }) => {
      const nowLabel = 'Vừa xong · Hôm nay';
      const inst =
        adminInstitutions.find((i) => i.id === payload.institutionId) ||
        adminInstitutions[0];
      const appId = `APP-2026-DN-${payload.studentCode}`;
      if (setStaffApplications) {
        setStaffApplications((prev) => {
          const template = prev[0];
          if (!template) return prev;
          const created: StaffApplicationRecord = {
            ...JSON.parse(JSON.stringify(template)),
            applicationId: appId,
            student: {
              fullName: payload.fullName,
              studentCode: payload.studentCode,
              email: payload.email,
            },
            institution: {
              id: inst?.id || payload.institutionId,
              officialName: inst?.officialName || 'Trường ĐH Bách khoa, ĐHĐN',
            },
            schoolYear: payload.schoolYear,
            submittedAt: nowLabel,
            updatedAt: nowLabel,
            workflowStatus: 'under_review',
            latestOperationalNote: `[Tạo hồ sơ vận hành]: ${payload.reason}`,
          };
          return [created, ...prev];
        });
      }
      setAdminSeasons((prev) =>
        prev.map((s) =>
          s.isCurrentActive
            ? { ...s, applicationCount: s.applicationCount + 1 }
            : s
        )
      );
      const auditEv: AuditEvent = {
        id: `audit-${Date.now()}`,
        timestamp: nowLabel,
        actorId: staffUser.id,
        actorName: staffUser.fullName,
        actorRoleLabel: staffUser.roleLabel,
        category: 'season',
        actionType: 'Khởi tạo hồ sơ vận hành',
        targetEntity: `${appId} (${payload.fullName})`,
        summary: `${staffUser.fullName} tạo mới hồ sơ vận hành ${appId} cho sinh viên ${payload.fullName} (${payload.studentCode}).`,
        reason: payload.reason,
      };
      setAdminAuditLogs((prev) => [auditEv, ...prev]);
      void syncAdminActionToServer('/api/v2/admin/applications', 'POST', payload);
    },
    [staffUser, adminInstitutions, setStaffApplications]
  );

  const handleHotfixOperationalApplication = useCallback(
    (
      applicationId: string,
      updates: {
        fullName?: string;
        studentCode?: string;
        email?: string;
        institutionId?: string;
        schoolYear?: string;
        workflowStatus?: StaffApplicationStatus;
        internalDeadline?: string;
        latestOperationalNote?: string;
        reason: string;
      }
    ) => {
      const nowLabel = 'Vừa xong · Hôm nay';
      const inst = adminInstitutions.find(
        (i) => i.id === updates.institutionId
      );
      if (setStaffApplications) {
        setStaffApplications((prev) =>
          prev.map((app) =>
            app.applicationId === applicationId
              ? {
                  ...app,
                  student: {
                    fullName: updates.fullName || app.student.fullName,
                    studentCode: updates.studentCode || app.student.studentCode,
                    email: updates.email || app.student.email,
                  },
                  institution: inst
                    ? { id: inst.id, officialName: inst.officialName }
                    : app.institution,
                  schoolYear: updates.schoolYear || app.schoolYear,
                  workflowStatus: updates.workflowStatus || app.workflowStatus,
                  internalDeadline:
                    updates.internalDeadline || app.internalDeadline,
                  latestOperationalNote:
                    updates.latestOperationalNote || app.latestOperationalNote,
                  updatedAt: nowLabel,
                }
              : app
          )
        );
      }
      const auditEv: AuditEvent = {
        id: `audit-${Date.now()}`,
        timestamp: nowLabel,
        actorId: staffUser.id,
        actorName: staffUser.fullName,
        actorRoleLabel: staffUser.roleLabel,
        category: 'season',
        actionType: 'Hotfix hành chính & vận hành hồ sơ',
        targetEntity: `${applicationId} (${updates.fullName || ''})`,
        summary: `${staffUser.fullName} thực hiện Hotfix hành chính/vận hành trên hồ sơ ${applicationId}.`,
        reason: updates.reason,
      };
      setAdminAuditLogs((prev) => [auditEv, ...prev]);
      void syncAdminActionToServer(
        `/api/v2/admin/applications/${applicationId}/hotfix`,
        'PATCH',
        updates
      );
    },
    [staffUser, adminInstitutions, setStaffApplications]
  );

  const handleDeleteOperationalApplication = useCallback(
    (applicationId: string, reason: string) => {
      const nowLabel = 'Vừa xong · Hôm nay';
      if (setStaffApplications) {
        setStaffApplications((prev) =>
          prev.filter((app) => app.applicationId !== applicationId)
        );
      }
      const auditEv: AuditEvent = {
        id: `audit-${Date.now()}`,
        timestamp: nowLabel,
        actorId: staffUser.id,
        actorName: staffUser.fullName,
        actorRoleLabel: staffUser.roleLabel,
        category: 'season',
        actionType: 'Xóa hồ sơ nháp / trùng lặp',
        targetEntity: applicationId,
        summary: `${staffUser.fullName} xóa hồ sơ nháp/trùng lặp ${applicationId}.`,
        reason,
      };
      setAdminAuditLogs((prev) => [auditEv, ...prev]);
      void syncAdminActionToServer(
        `/api/v2/admin/applications/${applicationId}`,
        'DELETE',
        { reason }
      );
    },
    [staffUser, setStaffApplications]
  );

  return {
    adminInstitutions,
    adminSchoolReviewUnits,
    adminStaffAccounts,
    adminSeasons,
    adminCriteriaVersions,
    adminDeadlines,
    adminNotificationTemplates,
    adminWorkflowPolicy,
    adminSystemHealth,
    adminBootstrapState,
    adminAuditLogs,
    adminActionFeedback,
    clearAdminFeedback,
    resetAdminControlPlane,
    resetAdminState: resetAdminControlPlane,
    handleInitializeFirstAdmin,
    handleCreateInstitution,
    handleUpdateInstitution,
    handleToggleInstitutionStatus,
    handleUpdateSchoolReviewUnit,
    handleCreateStaff,
    handleActivateStaff,
    handleResendStaffInvite,
    handleResetStaffPassword,
    handleChangeStaffRole,
    handleToggleStaffStatus,
    handleCreateOperationalApplication,
    handleHotfixOperationalApplication,
    handleDeleteOperationalApplication,
    ...seasonAndOps,
  };
}
