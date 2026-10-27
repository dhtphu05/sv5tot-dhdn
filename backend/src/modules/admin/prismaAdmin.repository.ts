/**
 * 5TOT ĐHĐN — Prisma / Runtime Admin Operational Repository (Backend V2)
 * Stores operational templates, workflow policy, staff invitations, and admin audit events.
 */

import type { IAdminRepository } from './admin.repository';
import type {
  NotificationTemplateConfigDto,
  WorkflowOperationalPolicyDto,
  StaffInvitationRecord,
} from './admin.types';
import type { AuditLogEventDto } from '../auditAndAnalytics/auditAndAnalytics.types';

const DEFAULT_NOTIFICATION_TEMPLATES: NotificationTemplateConfigDto[] = [
  {
    id: 'tpl-submission-confirmation',
    code: 'SUBMISSION_CONFIRMATION',
    nameVi: 'Xác nhận nộp hồ sơ thành công',
    channel: 'IN_APP_AND_EMAIL',
    subjectTemplateVi: '[5TOT ĐHĐN - {{seasonName}}] Xác nhận tiếp nhận hồ sơ {{applicationCode}}',
    bodyTemplateVi:
      'Chào {{studentName}}, Hệ thống xét chọn Sinh viên 5 tốt Đại học Đà Nẵng ({{seasonName}}) đã ghi nhận hồ sơ {{applicationCode}} thuộc đơn vị {{institutionName}}. Hồ sơ đã được chuyển về Hội Sinh viên cấp Trường / ĐHĐN để thẩm định sơ khảo trước thời hạn {{deadline}}.',
    enabled: true,
    supportedVariables: ['studentName', 'applicationCode', 'seasonName', 'institutionName', 'deadline'],
    updatedAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'tpl-supplement-request',
    code: 'SUPPLEMENT_REQUEST',
    nameVi: 'Yêu cầu bổ sung / giải trình minh chứng',
    channel: 'IN_APP_AND_EMAIL',
    subjectTemplateVi: '[5TOT ĐHĐN - {{seasonName}}] Yêu cầu bổ sung minh chứng hồ sơ {{applicationCode}}',
    bodyTemplateVi:
      'Chào {{studentName}}, Hội đồng thẩm định đã gửi yêu cầu bổ sung minh chứng cho hồ sơ {{applicationCode}} ({{seasonName}}). Vui lòng đăng nhập hệ thống và hoàn tất phản hồi trước {{deadline}}.',
    enabled: true,
    supportedVariables: ['studentName', 'applicationCode', 'seasonName', 'deadline'],
    updatedAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'tpl-school-forwarded',
    code: 'SCHOOL_FORWARDED',
    nameVi: 'Thông báo Cấp Trường đã đề xuất hồ sơ lên Cấp Đại học Đà Nẵng',
    channel: 'IN_APP_AND_EMAIL',
    subjectTemplateVi: '[5TOT ĐHĐN - {{seasonName}}] Hồ sơ {{applicationCode}} đã được đề xuất lên Cấp Đại học Đà Nẵng',
    bodyTemplateVi:
      'Chào {{studentName}}, Hồ sơ {{applicationCode}} của bạn đã vượt qua vòng sơ khảo cấp Trường ({{institutionName}}) và nằm trong danh sách đề xuất chính thức gửi Hội Sinh viên Đại học Đà Nẵng xét chọn cấp Đại học Đà Nẵng ({{seasonName}}).',
    enabled: true,
    supportedVariables: ['studentName', 'applicationCode', 'seasonName', 'institutionName'],
    updatedAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'tpl-result-published',
    code: 'RESULT_PUBLISHED',
    nameVi: 'Thông báo công bố Quyết định công nhận chính thức',
    channel: 'IN_APP_AND_EMAIL',
    subjectTemplateVi: '[5TOT ĐHĐN - {{seasonName}}] Công bố kết quả xét chọn chính thức hồ sơ {{applicationCode}}',
    bodyTemplateVi:
      'Chào {{studentName}}, Ban Thư ký Hội Sinh viên Việt Nam Đại học Đà Nẵng trân trọng thông báo kết quả xét chọn danh hiệu "{{seasonName}}" đối với hồ sơ {{applicationCode}}. Vui lòng tra cứu Quyết định công nhận trên cổng thông tin.',
    enabled: true,
    supportedVariables: ['studentName', 'applicationCode', 'seasonName'],
    updatedAt: '2026-09-01T00:00:00.000Z',
  },
];

const DEFAULT_WORKFLOW_POLICY: WorkflowOperationalPolicyDto = {
  defaultSupplementWindowHours: 72,
  allowLateSupplementSubmission: false,
  maxEvidenceFileSizeMb: 15,
  allowedEvidenceMimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
  requirePdfForSchoolForwarding: true,
  udnSharedReviewUnitId: 'unit-udn',
  aiAdvisoryOnly: true,
  updatedAt: '2026-09-01T00:00:00.000Z',
};

export class PrismaAdminRepository implements IAdminRepository {
  private bootstrapCompletedAt: string | null = null;
  private failedBootstrapAttempts = 0;
  private readonly invitations = new Map<string, StaffInvitationRecord>();
  private readonly templates = new Map<string, NotificationTemplateConfigDto>(
    DEFAULT_NOTIFICATION_TEMPLATES.map((t) => [t.id, { ...t }])
  );
  private workflowPolicy: WorkflowOperationalPolicyDto = {
    ...DEFAULT_WORKFLOW_POLICY,
    allowedEvidenceMimeTypes: [...DEFAULT_WORKFLOW_POLICY.allowedEvidenceMimeTypes],
  };
  private readonly auditEvents: AuditLogEventDto[] = [];

  public async getBootstrapCompletedAt(): Promise<string | null> {
    return this.bootstrapCompletedAt;
  }

  public async setBootstrapCompletedAt(isoTimestamp: string): Promise<void> {
    this.bootstrapCompletedAt = isoTimestamp;
  }

  public async getFailedBootstrapAttempts(): Promise<number> {
    return this.failedBootstrapAttempts;
  }

  public async incrementFailedBootstrapAttempts(): Promise<number> {
    this.failedBootstrapAttempts += 1;
    return this.failedBootstrapAttempts;
  }

  public async resetFailedBootstrapAttempts(): Promise<void> {
    this.failedBootstrapAttempts = 0;
  }

  public async getInvitationByUserId(userId: string): Promise<StaffInvitationRecord | null> {
    return this.invitations.get(userId) ?? null;
  }

  public async getInvitationByEmailAndCode(
    email: string,
    inviteCode: string
  ): Promise<StaffInvitationRecord | null> {
    const normEmail = email.toLowerCase().trim();
    const normCode = inviteCode.trim().toUpperCase();
    for (const inv of this.invitations.values()) {
      if (inv.email.toLowerCase() === normEmail && inv.inviteCode.toUpperCase() === normCode) {
        return inv;
      }
    }
    return null;
  }

  public async saveInvitation(record: StaffInvitationRecord): Promise<StaffInvitationRecord> {
    this.invitations.set(record.userId, { ...record });
    return record;
  }

  public async listNotificationTemplates(): Promise<NotificationTemplateConfigDto[]> {
    return Array.from(this.templates.values());
  }

  public async getNotificationTemplateById(id: string): Promise<NotificationTemplateConfigDto | null> {
    return this.templates.get(id) ?? null;
  }

  public async saveNotificationTemplate(
    template: NotificationTemplateConfigDto
  ): Promise<NotificationTemplateConfigDto> {
    this.templates.set(template.id, { ...template });
    return template;
  }

  public async getWorkflowPolicy(): Promise<WorkflowOperationalPolicyDto> {
    return {
      ...this.workflowPolicy,
      allowedEvidenceMimeTypes: [...this.workflowPolicy.allowedEvidenceMimeTypes],
    };
  }

  public async saveWorkflowPolicy(
    policy: WorkflowOperationalPolicyDto
  ): Promise<WorkflowOperationalPolicyDto> {
    this.workflowPolicy = {
      ...policy,
      udnSharedReviewUnitId: 'unit-udn',
      aiAdvisoryOnly: true,
      allowedEvidenceMimeTypes: [...policy.allowedEvidenceMimeTypes],
    };
    return this.getWorkflowPolicy();
  }

  public async recordAdminAuditEvent(event: {
    actorUserId: string;
    actorEmail: string;
    actorRole: string;
    actionCode: string;
    targetEntity: string;
    summaryVi: string;
    metadata?: Record<string, unknown>;
  }): Promise<AuditLogEventDto> {
    const sanitizedMetadata: Record<string, unknown> = {
      targetEntity: event.targetEntity,
      summaryVi: event.summaryVi,
      ...(event.metadata || {}),
    };
    for (const secretKey of ['password', 'passwordHash', 'setupToken', 'token', 'temporaryPassword']) {
      if (secretKey in sanitizedMetadata) {
        sanitizedMetadata[secretKey] = '[REDACTED]';
      }
    }

    const dto: AuditLogEventDto = {
      id: `audit-admin-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      occurredAt: new Date(),
      requestId: `req-admin-${Date.now()}`,
      actionCode: event.actionCode,
      actorUserId: event.actorUserId,
      actorEmail: event.actorEmail,
      actorRole: event.actorRole,
      applicationId: null,
      entityType: 'ADMIN_CONTROL_PLANE',
      entityId: event.targetEntity,
      metadata: sanitizedMetadata,
    };
    this.auditEvents.unshift(dto);
    return dto;
  }

  public async listAdminAuditEvents(): Promise<AuditLogEventDto[]> {
    return [...this.auditEvents];
  }
}
