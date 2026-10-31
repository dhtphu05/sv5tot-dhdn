/**
 * 5TOT ĐHĐN — Operations & System Configuration View (Vận hành & Cấu hình)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements ADMIN-REVAMP Sections 12, 13, 14 & 15:
 * - Notification Templates & Safe Preview (never dispatches real mass emails)
 * - Supported Workflow Settings (supplementation window, resubmission cap, immutable LEAN locks)
 * - System Integration Health ("Trạng thái hệ thống" with zero secret exposure)
 * - Reference Data Export (JSON catalog export for backup/season migration)
 */

import React, { useState } from 'react';
import {
  Settings2,
  Bell,
  Activity,
  Sliders,
  Download,
  Eye,
  Save,
  CheckCircle2,
  Lock,
  X,
} from 'lucide-react';
import { formatAcademicYearLabel } from '@5tot/contracts';
import {
  CriteriaVersion,
  Institution,
  NotificationTemplateConfig,
  SchoolReviewUnitConfig,
  Season,
  SystemIntegrationHealthItem,
  WorkflowOperationalPolicy,
} from '../../adminTypes';
import { StaffApplicationRecord, StaffApplicationStatus } from '../../types';
import {
  INITIAL_NOTIFICATION_TEMPLATES,
  INITIAL_SYSTEM_HEALTH,
  INITIAL_WORKFLOW_POLICY,
} from '../../fixtures/adminDataset';
import { Button } from '../../../components/buttons/Button';
import { AdminApplicationHotfixPanel } from './AdminApplicationHotfixPanel';

export interface OperationsConfigViewProps {
  currentSeason?: Season;
  applications?: StaffApplicationRecord[];
  notificationTemplates?: NotificationTemplateConfig[];
  workflowPolicy?: WorkflowOperationalPolicy;
  systemHealth?: SystemIntegrationHealthItem[];
  institutions: Institution[];
  schoolReviewUnits?: SchoolReviewUnitConfig[];
  criteriaVersions: CriteriaVersion[];
  onUpdateNotificationTemplate?: (
    id: string,
    updates: Partial<NotificationTemplateConfig>,
    reason?: string
  ) => void;
  onUpdateWorkflowPolicy?: (
    updates: Partial<WorkflowOperationalPolicy>,
    reason?: string
  ) => void;
  onCreateOperationalApplication?: (payload: {
    fullName: string;
    studentCode: string;
    email: string;
    institutionId: string;
    schoolYear: string;
    reason: string;
  }) => void;
  onHotfixOperationalApplication?: (
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
  ) => void;
  onDeleteOperationalApplication?: (
    applicationId: string,
    reason: string
  ) => void;
}

export const OperationsConfigView: React.FC<OperationsConfigViewProps> = ({
  currentSeason,
  applications = [],
  notificationTemplates,
  workflowPolicy,
  systemHealth,
  institutions,
  schoolReviewUnits = [],
  criteriaVersions,
  onUpdateNotificationTemplate,
  onUpdateWorkflowPolicy,
  onCreateOperationalApplication,
  onHotfixOperationalApplication,
  onDeleteOperationalApplication,
}) => {
  const templates =
    notificationTemplates && notificationTemplates.length > 0
      ? notificationTemplates
      : INITIAL_NOTIFICATION_TEMPLATES;
  const policy = workflowPolicy || INITIAL_WORKFLOW_POLICY;
  const healthItems =
    systemHealth && systemHealth.length > 0
      ? systemHealth
      : INITIAL_SYSTEM_HEALTH;

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    templates[0]?.id || ''
  );
  const selectedTemplate =
    templates.find((t) => t.id === selectedTemplateId) || templates[0];

  const [subjectDraft, setSubjectDraft] = useState(
    selectedTemplate?.subjectTemplate || ''
  );
  const [bodyDraft, setBodyDraft] = useState(
    selectedTemplate?.bodyTemplate || ''
  );
  const [previewOpen, setPreviewOpen] = useState(false);

  const [policyDraft, setPolicyDraft] = useState({
    defaultSupplementWindowHours: policy.defaultSupplementWindowHours,
    maxResubmissionCountPerSupplement: policy.maxResubmissionCountPerSupplement,
    allowStudentEditBeforeDeadline: policy.allowStudentEditBeforeDeadline,
  });

  const seasonFullLabel = formatAcademicYearLabel(
    currentSeason?.schoolYear || '2025–2026'
  );

  const handleSelectTemplate = (tpl: NotificationTemplateConfig) => {
    setSelectedTemplateId(tpl.id);
    setSubjectDraft(tpl.subjectTemplate);
    setBodyDraft(tpl.bodyTemplate || tpl.bodyTemplateVi || '');
  };

  const renderPreviewText = (raw: string) =>
    raw
      .replace(/\{\{studentName\}\}/g, 'Nguyễn Văn An')
      .replace(/\{\{applicationCode\}\}/g, 'HS-2026-DUT-0018')
      .replace(/\{\{academicYear\}\}/g, seasonFullLabel)
      .replace(/\{\{deadline\}\}/g, '02/11/2026 17:00 (GMT+7)')
      .replace(
        /\{\{schoolReviewUnitName\}\}/g,
        'Hội đồng Sơ tuyển Đại học Đà Nẵng'
      )
      .replace(/\{\{invitationCode\}\}/g, 'INV-5TOT-DEMO99');

  const handleExportReferenceCatalog = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      seasonAcademicYear: currentSeason?.schoolYear || '2025–2026',
      institutions,
      schoolReviewUnits,
      criteriaVersions,
      workflowPolicy: policy,
      notificationTemplates: templates,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', '5TOT_DaNang_Danh_Muc_Cau_Hinh_Chuan.json');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 max-w-[1360px] w-full mx-auto space-y-6">
      {/* 1. Header */}
      <div className="border-b border-[#DCE7EE] pb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-[12px] font-semibold text-[#526B7C]">
            {seasonFullLabel} · Cấu hình vận hành &amp; Chẩn đoán hệ thống
          </div>
          <h1 className="text-[20px] font-extrabold text-[#0F2335] mt-0.5 flex items-center gap-2">
            <Settings2 size={20} className="text-[#0D78AE]" />
            <span>Vận hành &amp; Cấu hình hệ thống</span>
          </h1>
          <p className="text-[12.5px] text-[#526B7C] mt-1">
            Quản lý mẫu thông báo nghiệp vụ, chính sách bổ sung minh chứng, kiểm
            tra trạng thái kết nối dịch vụ và xuất danh mục cấu hình chuẩn.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleExportReferenceCatalog}
          className="flex items-center gap-1.5"
        >
          <Download size={14} />
          <span>Xuất danh mục cấu hình (JSON)</span>
        </Button>
      </div>

      {/* 2. Operational Application CRUD & Hotfix Console */}
      <AdminApplicationHotfixPanel
        applications={applications}
        institutions={institutions}
        currentSeason={currentSeason}
        onCreateApplication={onCreateOperationalApplication}
        onHotfixApplication={onHotfixOperationalApplication}
        onDeleteApplication={onDeleteOperationalApplication}
      />

      {/* 3. System Health & Integration Diagnostics ("Trạng thái hệ thống") */}
      <div
        data-testid="system-integration-health-panel"
        className="bg-white rounded-[12px] border border-[#D4E2EC] p-5 shadow-2xs space-y-3.5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[13.5px] font-extrabold text-[#0F2335]">
            <Activity size={16} className="text-[#0D78AE]" />
            <span>Trạng thái hệ thống &amp; Kết nối tích hợp</span>
          </div>
          <span className="text-[11.5px] text-[#136F3A] font-bold bg-[#ECFDF5] px-2.5 py-0.5 rounded border border-[#A7F3D0]">
            Đã ẩn toàn bộ khóa bí mật / chuỗi kết nối (Zero Secret Exposure)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 text-[12px]">
          {healthItems.map((item) => (
            <div
              key={item.key}
              className="p-3.5 rounded-[10px] bg-[#F8FBFD] border border-[#DCE7EE] space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-[#0F2335]">
                  {item.labelVi}
                </span>
                <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
              </div>
              <div className="text-[11.5px] font-bold text-[#0D78AE]">
                {item.modeLabelVi}
              </div>
              <p className="text-[11px] text-[#526B7C] leading-relaxed">
                {item.detailVi}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Workflow Policy & Supplementation Settings */}
      <div
        data-testid="workflow-operational-policy-panel"
        className="bg-white rounded-[12px] border border-[#D4E2EC] p-5 shadow-2xs space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EEF4F8] pb-3">
          <div>
            <div className="flex items-center gap-2 text-[13.5px] font-extrabold text-[#0F2335]">
              <Sliders size={16} className="text-[#0D78AE]" />
              <span>Chính sách vận hành &amp; Bổ sung hồ sơ</span>
            </div>
            <p className="text-[12px] text-[#526B7C] mt-0.5">
              Điều chỉnh thời hạn phản hồi yêu cầu bổ sung minh chứng trong khi
              bảo toàn tuyệt đối quy trình nghiệp vụ 2 cấp (Trường → Đại học Đà Nẵng).
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() =>
              onUpdateWorkflowPolicy?.(
                policyDraft,
                'Cập nhật chính sách thời hạn bổ sung minh chứng'
              )
            }
            className="flex items-center gap-1.5"
          >
            <Save size={14} />
            <span>Lưu chính sách vận hành</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[12.5px]">
          <div className="p-3.5 rounded-[10px] bg-[#F8FBFD] border border-[#DCE7EE] space-y-1.5">
            <label className="font-bold text-[#0F2335] block">
              Thời hạn bổ sung mặc định (Giờ)
            </label>
            <input
              type="number"
              min={12}
              max={336}
              value={policyDraft.defaultSupplementWindowHours}
              onChange={(e) =>
                setPolicyDraft({
                  ...policyDraft,
                  defaultSupplementWindowHours: Number(e.target.value),
                })
              }
              className="w-full h-[38px] px-3 bg-white border border-[#DCE7EE] rounded-[8px] font-bold"
            />
            <span className="text-[11px] text-[#526B7C] block">
              Áp dụng khi Cán bộ sơ tuyển Trường hoặc Cán bộ cấp Đại học Đà Nẵng gửi yêu
              cầu bổ sung inline.
            </span>
          </div>

          <div className="p-3.5 rounded-[10px] bg-[#F8FBFD] border border-[#DCE7EE] space-y-1.5">
            <label className="font-bold text-[#0F2335] block">
              Số lần nộp bổ sung tối đa / yêu cầu
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={policyDraft.maxResubmissionCountPerSupplement}
              onChange={(e) =>
                setPolicyDraft({
                  ...policyDraft,
                  maxResubmissionCountPerSupplement: Number(e.target.value),
                })
              }
              className="w-full h-[38px] px-3 bg-white border border-[#DCE7EE] rounded-[8px] font-bold"
            />
            <span className="text-[11px] text-[#526B7C] block">
              Giới hạn số lượt phản hồi bổ sung cho mỗi đợt yêu cầu.
            </span>
          </div>

          <div className="p-3.5 rounded-[10px] bg-[#F8FBFD] border border-[#DCE7EE] space-y-2">
            <div className="font-bold text-[#0F2335] flex items-center gap-1.5">
              <Lock size={13} className="text-[#0D78AE]" />
              <span>Quy tắc nghiệp vụ cốt lõi (Đã khóa bảo vệ)</span>
            </div>
            <ul className="text-[11.5px] text-[#526B7C] space-y-1">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 size={12} className="text-[#16A34A]" />
                <span>
                  Bắt buộc 01 PDF công văn/tờ trình chung khi Trường gửi ĐHĐN
                </span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 size={12} className="text-[#16A34A]" />
                <span>
                  Tối đa 01 đợt gửi danh sách / Đơn vị xét sơ tuyển / mùa
                </span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 size={12} className="text-[#16A34A]" />
                <span>
                  Tập thể (TT01–TT04) nộp trực tiếp lên ĐHĐN; AI chỉ tư vấn
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 4. Notification Templates Configuration & Safe Preview */}
      <div
        data-testid="notification-templates-panel"
        className="bg-white rounded-[12px] border border-[#D4E2EC] p-5 shadow-2xs space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EEF4F8] pb-3">
          <div>
            <div className="flex items-center gap-2 text-[13.5px] font-extrabold text-[#0F2335]">
              <Bell size={16} className="text-[#0D78AE]" />
              <span>Mẫu thông báo nghiệp vụ ({templates.length} mẫu)</span>
            </div>
            <p className="text-[12px] text-[#526B7C] mt-0.5">
              Biên tập tiêu đề và nội dung thông báo tự động theo sự kiện. Chế
              độ Xem trước an toàn tuyệt đối không phát tán email hàng loạt.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPreviewOpen(true)}
              className="flex items-center gap-1.5"
            >
              <Eye size={14} />
              <span>Xem trước thông báo</span>
            </Button>
            {selectedTemplate && (
              <Button
                variant="primary"
                size="sm"
                onClick={() =>
                  onUpdateNotificationTemplate?.(
                    selectedTemplate.id,
                    {
                      subjectTemplate: subjectDraft,
                      bodyTemplate: bodyDraft,
                    },
                    `Cập nhật mẫu thông báo ${selectedTemplate.titleVi}`
                  )
                }
                className="flex items-center gap-1.5"
              >
                <Save size={14} />
                <span>Lưu mẫu thông báo</span>
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-4 space-y-1.5">
            {templates.map((tpl) => {
              const isSelected = tpl.id === selectedTemplate?.id;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleSelectTemplate(tpl)}
                  className={`w-full text-left p-3 rounded-[9px] border text-[12.5px] transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#EBF6FC] border-[#0D78AE] text-[#0F2335] font-bold'
                      : 'bg-[#F8FBFD] border-[#DCE7EE] text-[#172A3A] hover:bg-white'
                  }`}
                >
                  <div>{tpl.titleVi}</div>
                  <div className="text-[11px] text-[#526B7C] mt-0.5">
                    Người nhận: {tpl.recipientScopeVi}
                  </div>
                </button>
              );
            })}
          </div>

          {selectedTemplate && (
            <div className="lg:col-span-8 space-y-3 text-[12.5px]">
              <div>
                <label className="font-bold text-[#172A3A] block mb-1">
                  Tiêu đề thông báo / Email
                </label>
                <input
                  type="text"
                  value={subjectDraft}
                  onChange={(e) => setSubjectDraft(e.target.value)}
                  className="w-full h-[38px] px-3 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px] font-semibold"
                />
              </div>
              <div>
                <label className="font-bold text-[#172A3A] block mb-1">
                  Nội dung mẫu (Hỗ trợ biến:{' '}
                  {(
                    selectedTemplate.supportedVariables ||
                    selectedTemplate.allowedVariables ||
                    []
                  )
                    .map((v) => `{{${v}}}`)
                    .join(', ')}
                  )
                </label>
                <textarea
                  rows={4}
                  value={bodyDraft}
                  onChange={(e) => setBodyDraft(e.target.value)}
                  className="w-full p-3 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px]"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Safe Notification Preview Modal */}
      {previewOpen && selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-[14px] border border-[#D4E2EC] max-w-[540px] w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#EEF4F8] pb-3">
              <div>
                <h2 className="text-[16px] font-extrabold text-[#0F2335]">
                  Xem trước mẫu thông báo (Chế độ an toàn)
                </h2>
                <span className="text-[11.5px] text-[#136F3A] font-bold">
                  Cam kết an toàn: Không gửi email hàng loạt ra bên ngoài
                  (massEmailDispatched = false)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="p-1 text-[#607483] hover:text-[#0F2335]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-3.5 rounded-[10px] bg-[#F8FBFD] border border-[#DCE7EE] space-y-2 text-[12.5px]">
              <div>
                <span className="text-[#526B7C] text-[11px] font-bold block">
                  TIÊU ĐỀ HIỂN THỊ:
                </span>
                <div className="font-extrabold text-[#0F2335]">
                  {renderPreviewText(subjectDraft)}
                </div>
              </div>
              <div className="pt-2 border-t border-[#E2EDF5]">
                <span className="text-[#526B7C] text-[11px] font-bold block">
                  NỘI DUNG HIỂN THỊ:
                </span>
                <p className="text-[#172A3A] mt-1 leading-relaxed">
                  {renderPreviewText(bodyDraft)}
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setPreviewOpen(false)}
              >
                Đóng xem trước
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
