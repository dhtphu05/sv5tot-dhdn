/**
 * 5TOT ĐHĐN — Admin Operational Config Repository Interface (Backend V2)
 */

import type {
  NotificationTemplateConfigDto,
  WorkflowOperationalPolicyDto,
  StaffInvitationRecord,
} from './admin.types';
import type { AuditLogEventDto } from '../auditAndAnalytics/auditAndAnalytics.types';

export interface IAdminRepository {
  getBootstrapCompletedAt(): Promise<string | null>;
  setBootstrapCompletedAt(isoTimestamp: string): Promise<void>;
  getFailedBootstrapAttempts(): Promise<number>;
  incrementFailedBootstrapAttempts(): Promise<number>;
  resetFailedBootstrapAttempts(): Promise<void>;

  getInvitationByUserId(userId: string): Promise<StaffInvitationRecord | null>;
  getInvitationByEmailAndCode(email: string, inviteCode: string): Promise<StaffInvitationRecord | null>;
  saveInvitation(record: StaffInvitationRecord): Promise<StaffInvitationRecord>;

  listNotificationTemplates(): Promise<NotificationTemplateConfigDto[]>;
  getNotificationTemplateById(id: string): Promise<NotificationTemplateConfigDto | null>;
  saveNotificationTemplate(template: NotificationTemplateConfigDto): Promise<NotificationTemplateConfigDto>;

  getWorkflowPolicy(): Promise<WorkflowOperationalPolicyDto>;
  saveWorkflowPolicy(policy: WorkflowOperationalPolicyDto): Promise<WorkflowOperationalPolicyDto>;

  recordAdminAuditEvent(event: {
    actorUserId: string;
    actorEmail: string;
    actorRole: string;
    actionCode: string;
    targetEntity: string;
    summaryVi: string;
    metadata?: Record<string, unknown>;
  }): Promise<AuditLogEventDto>;
  listAdminAuditEvents(): Promise<AuditLogEventDto[]>;
}
