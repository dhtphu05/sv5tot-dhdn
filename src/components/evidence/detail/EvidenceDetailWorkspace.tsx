import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  X,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { ApplicationEvidence } from '../../../demo/fixtures/studentApplication';
import { CRITERIA, CriterionDefinition, RequirementStatus } from '../../../tokens';
import { FileTypeIcon } from '../FileTypeIcon';
import { RightInspector } from '../../inspector/RightInspector';
import { RegulationInspectorContent } from '../../inspector/RegulationInspectorContent';
import { DocumentViewer } from './DocumentViewer';
import { InformationPanel } from './InformationPanel';
import { RecognizedFieldItem } from './RecognizedField';

export interface EvidenceDetailWorkspaceProps {
  evidence: ApplicationEvidence;
  allEvidenceList?: ApplicationEvidence[];
  criterionName: string;
  criterionId: string;
  requirementTitle: string;
  requirementId: string;
  declarationTitle?: string;
  onClose: () => void;
  onReturnToNotifications?: () => void;
  onConfirmEvidence: (fileId: string) => void;
  onUpdateField?: (fileId: string, fieldId: string, newValue: string) => void;
  onOpenRegulation?: (criterionId: string, requirementId?: string) => void;
  onSwitchEvidence?: (file: ApplicationEvidence) => void;
  readOnly?: boolean;
}

/**
 * Generate rich recognized field items based on evidence file
 */
function getInitialRecognizedFields(
  file: ApplicationEvidence,
  context?: {
    criterionName?: string;
    requirementTitle?: string;
    declarationTitle?: string;
  }
): RecognizedFieldItem[] {
  const name = file.name.toLowerCase();

  if (name.includes('ielts')) {
    return [
      {
        id: 'f-ielts-1',
        label: 'Tên chứng chỉ',
        effectiveValue: 'IELTS Academic Test Report Form (7.0)',
        recognizedValue: 'IELTS Academic Test Report Form (7.0)',
        editable: true,
        highlightRegionId: 'award-name',
      },
      {
        id: 'f-ielts-2',
        label: 'Điểm tổng quát (Overall Band)',
        effectiveValue: '7.0',
        recognizedValue: '7.0',
        editable: true,
        highlightRegionId: 'score',
      },
      {
        id: 'f-ielts-3',
        label: 'Họ và tên thí sinh',
        effectiveValue:
          file.id === 'ev-ielts-1' ? 'NGUYEN MINH ANH' : 'Trích xuất từ chứng chỉ ngoại ngữ',
        recognizedValue:
          file.id === 'ev-ielts-1' ? 'NGUYEN MINH ANH' : 'Trích xuất từ chứng chỉ ngoại ngữ',
        editable: true,
        highlightRegionId: 'student-name',
      },
      {
        id: 'f-ielts-4',
        label: 'Ngày thi & Cấp chứng chỉ (Test Date)',
        effectiveValue: '15/06/2026',
        recognizedValue: '15/06/2026',
        needsAttention: file.status === 'needs_verification',
        attentionReason:
          'Một thông tin được nhận diện từ tài liệu (Ngày cấp & Mã TRF) cần bạn xác nhận.',
        editable: true,
        highlightRegionId: 'date',
      },
      {
        id: 'f-ielts-5',
        label: 'Đơn vị khảo thí',
        effectiveValue: 'IDP Education / British Council',
        recognizedValue: 'IDP Education / British Council',
        editable: true,
        highlightRegionId: 'authority',
      },
    ];
  }

  if (name.includes('scan_mo') || file.status === 'read_failed') {
    return [
      {
        id: 'f-failed-1',
        label: 'Tên thành tích',
        effectiveValue: 'Chưa xác định rõ do văn bản mờ',
        recognizedValue: 'Chưa xác định rõ',
        needsAttention: true,
        attentionReason: 'Chất lượng bản quét chưa đủ rõ để nhận diện tự động.',
        editable: true,
      },
      {
        id: 'f-failed-2',
        label: 'Đơn vị cấp',
        effectiveValue: 'Đang chờ thẩm tra',
        recognizedValue: 'Đang chờ thẩm tra',
        editable: true,
      },
    ];
  }

  if (name.includes('mua_he_xanh') || name.includes('mhx')) {
    return [
      {
        id: 'f-vol-1',
        label: 'Tên hoạt động tình nguyện',
        effectiveValue: 'Chiến dịch Mùa hè xanh 2026',
        recognizedValue: 'Chiến dịch Mùa hè xanh 2026',
        editable: true,
      },
      {
        id: 'f-vol-2',
        label: 'Đơn vị tổ chức',
        effectiveValue: 'Đoàn trường ĐH Bách khoa - ĐH Đà Nẵng',
        recognizedValue: 'Đoàn trường ĐH Bách khoa - ĐH Đà Nẵng',
        editable: true,
      },
      {
        id: 'f-vol-3',
        label: 'Thời gian tham gia',
        effectiveValue: '12/07/2026 → 14/07/2026 (3 ngày)',
        recognizedValue: '12/07/2026 → 14/07/2026',
        editable: true,
      },
      {
        id: 'f-vol-4',
        label: 'Địa bàn triển khai',
        effectiveValue: 'Huyện Hòa Vang, Thành phố Đà Nẵng',
        recognizedValue: 'Huyện Hòa Vang, Thành phố Đà Nẵng',
        editable: true,
      },
    ];
  }

  if (name.includes('tinh_nguyen.docx')) {
    return [
      {
        id: 'f-doc-1',
        label: 'Tên báo cáo',
        effectiveValue: 'Báo cáo thành tích tình nguyện Chủ nhật xanh',
        recognizedValue: 'Báo cáo thành tích tình nguyện Chủ nhật xanh',
        editable: true,
      },
      {
        id: 'f-doc-2',
        label: 'Đơn vị xác nhận',
        effectiveValue: 'Đoàn phường Hòa Khánh Bắc',
        recognizedValue: 'Đoàn phường Hòa Khánh Bắc',
        editable: true,
      },
      {
        id: 'f-doc-3',
        label: 'Thời lượng tình nguyện',
        effectiveValue: '1 ngày (8 giờ hoạt động)',
        recognizedValue: '1 ngày',
        editable: true,
      },
      {
        id: 'f-doc-4',
        label: 'Ngày hoàn thành',
        effectiveValue: '18/08/2026',
        recognizedValue: '18/08/2026',
        editable: true,
      },
    ];
  }

  // Primary Hero Scenario: Giay_chung_nhan_NCKH.pdf / Quyet_dinh_cong_nhan_...pdf (Section 21, 24, 68)
  if (name.includes('nckh') || name.includes('quyet_dinh_cong_nhan')) {
    return [
      {
        id: 'f-nckh-1',
        label: 'Tên thành tích / Danh hiệu',
        effectiveValue: 'Giải Nhì Hội nghị Sinh viên Nghiên cứu khoa học 2026',
        recognizedValue: 'Giải Nhì Hội nghị Sinh viên Nghiên cứu khoa học 2026',
        editable: true,
        highlightRegionId: 'award-name',
      },
      {
        id: 'f-nckh-2',
        label: 'Đơn vị công nhận & cấp bằng',
        effectiveValue: 'Trường Đại học Bách khoa - Đại học Đà Nẵng',
        recognizedValue: 'Trường Đại học Bách khoa - Đại học Đà Nẵng',
        editable: true,
        highlightRegionId: 'authority',
      },
      {
        id: 'f-nckh-3',
        label: 'Ngày công nhận (Quyết định khen thưởng)',
        effectiveValue: '20/05/2028',
        recognizedValue: '20/05/2028',
        needsAttention: true,
        attentionReason:
          'Ngày được hệ thống nhận diện (2028) có thể chưa chính xác so với văn bản gốc (2026).',
        editable: true,
        highlightRegionId: 'date',
      },
      {
        id: 'f-nckh-4',
        label: 'Cấp thành tích',
        effectiveValue: 'Cấp trường',
        recognizedValue: 'Cấp trường',
        editable: true,
      },
      {
        id: 'f-nckh-5',
        label: 'Họ và tên người được khen thưởng',
        effectiveValue: 'Nguyễn Minh Anh',
        recognizedValue: 'Nguyễn Minh Anh',
        editable: true,
        highlightRegionId: 'student-name',
      },
      {
        id: 'f-nckh-6',
        label: 'Mã số sinh viên (MSSV)',
        effectiveValue: '102220123',
        recognizedValue: '102220123',
        editable: true,
      },
    ];
  }

  // Real files and user-uploaded evidence
  return [
    {
      id: 'f-real-1',
      label: 'Tên nội dung kê khai / Minh chứng',
      effectiveValue: context?.declarationTitle || file.name,
      recognizedValue: context?.declarationTitle || file.name,
      editable: true,
      highlightRegionId: 'award-name',
    },
    {
      id: 'f-real-2',
      label: 'Tiêu chí & Yêu cầu áp dụng',
      effectiveValue:
        context?.requirementTitle ||
        context?.criterionName ||
        'Minh chứng hồ sơ Sinh viên 5 tốt',
      recognizedValue:
        context?.requirementTitle ||
        context?.criterionName ||
        'Minh chứng hồ sơ Sinh viên 5 tốt',
      editable: true,
      highlightRegionId: 'authority',
    },
    {
      id: 'f-real-3',
      label: 'Tệp đính kèm',
      effectiveValue: `${file.name}${file.size ? ` (${file.size})` : ''}`,
      recognizedValue: file.name,
      editable: false,
    },
    {
      id: 'f-real-4',
      label: 'Thời điểm tải lên',
      effectiveValue: file.uploadedAt || 'Vừa tải lên',
      recognizedValue: file.uploadedAt || 'Vừa tải lên',
      editable: true,
      highlightRegionId: 'date',
    },
  ];
}

/**
 * EvidenceDetailWorkspace (Main Split-View)
 * Full-viewport shell-aware split view workspace:
 * - Left Pane: Document viewer (58-62% at 1440px)
 * - Right Pane: Information & review panel (38-42% at 1440px, capped at 500px on ultra-wide)
 * - Section 7: Back returns to exact previous context
 * - Section 34: Locks background page scroll while active
 * - Section 59: Escape key closes
 */
export const EvidenceDetailWorkspace: React.FC<EvidenceDetailWorkspaceProps> = ({
  evidence,
  allEvidenceList = [],
  criterionName,
  criterionId,
  requirementTitle,
  requirementId,
  declarationTitle,
  onClose,
  onReturnToNotifications,
  onConfirmEvidence,
  onUpdateField,
  onOpenRegulation,
  onSwitchEvidence,
  readOnly = false,
}) => {
  const [currentFile, setCurrentFile] = useState<ApplicationEvidence>(evidence);
  const [fields, setFields] = useState<RecognizedFieldItem[]>(() =>
    getInitialRecognizedFields(evidence, {
      criterionName,
      requirementTitle,
      declarationTitle,
    })
  );
  const initialAttentionField = fields.find((f) => f.needsAttention);
  const [focusedFieldId, setFocusedFieldId] = useState<string | null>(
    initialAttentionField?.id || null
  );
  const [highlightRegion, setHighlightRegion] = useState<string | null>(
    initialAttentionField?.highlightRegionId || null
  );
  const [isRegulationOpen, setIsRegulationOpen] = useState(false);
  const [activeRegCriterion, setActiveRegCriterion] = useState<CriterionDefinition>(
    () => CRITERIA[criterionId as keyof typeof CRITERIA] || CRITERIA.ethics
  );
  const [activeRegSectionId, setActiveRegSectionId] = useState<string | null>(
    requirementId || null
  );

  // Sync state if selected evidence prop changes
  useEffect(() => {
    setCurrentFile(evidence);
    const nextFields = getInitialRecognizedFields(evidence, {
      criterionName,
      requirementTitle,
      declarationTitle,
    });
    setFields(nextFields);
    const att = nextFields.find((f) => f.needsAttention);
    setFocusedFieldId(att?.id || null);
    setHighlightRegion(att?.highlightRegionId || null);
  }, [evidence, criterionName, requirementTitle, declarationTitle]);

  // Lock background application page scroll (Section 34)
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Keyboard shortcut listener: Escape to close (Section 59)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isRegulationOpen) {
          setIsRegulationOpen(false);
          return;
        }
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isRegulationOpen]);

  // Attachment switcher logic (Section 47 & 48)
  const fileIndex = allEvidenceList.findIndex((f) => f.id === currentFile.id);
  const hasMultiple = allEvidenceList.length > 1;

  const handlePrevEvidence = () => {
    if (fileIndex > 0 && onSwitchEvidence) {
      onSwitchEvidence(allEvidenceList[fileIndex - 1]);
    }
  };

  const handleNextEvidence = () => {
    if (fileIndex < allEvidenceList.length - 1 && onSwitchEvidence) {
      onSwitchEvidence(allEvidenceList[fileIndex + 1]);
    }
  };

  // Region highlight handler (Section 75)
  const handleFocusField = (fieldId: string) => {
    setFocusedFieldId(fieldId);
    const f = fields.find((item) => item.id === fieldId);
    setHighlightRegion(f?.highlightRegionId || null);
  };

  const handleUpdateFieldValue = (fieldId: string, newValue: string) => {
    setFields((prev) =>
      prev.map((f) => (f.id === fieldId ? { ...f, effectiveValue: newValue } : f))
    );
    if (onUpdateField) {
      onUpdateField(currentFile.id, fieldId, newValue);
    }
  };

  const handleOpenInlineRegulation = (critId: string, reqId?: string) => {
    const critDef =
      CRITERIA[critId as keyof typeof CRITERIA] ||
      CRITERIA[criterionId as keyof typeof CRITERIA] ||
      CRITERIA.ethics;
    setActiveRegCriterion(critDef);
    setActiveRegSectionId(reqId || requirementId || null);
    setIsRegulationOpen(true);
  };

  const usageContextTitle = declarationTitle
    ? `${requirementTitle} · ${declarationTitle}`
    : requirementTitle;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Chi tiết minh chứng: ${currentFile.name}`}
      className="fixed inset-0 z-50 flex flex-col bg-white overflow-hidden animate-in fade-in duration-150"
    >
      {/* Top Bar (Section 6 & Prompt 12 Section 27) */}
      <div className="h-13 bg-white border-b border-[#DCE7EE] px-5 flex items-center justify-between shrink-0 select-none z-30">
        {/* Left: Back button + Context navigation path */}
        <div className="flex items-center gap-2.5 min-w-0">
          {onReturnToNotifications && (
            <button
              type="button"
              onClick={onReturnToNotifications}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[7px] text-[#0D78AE] bg-[#F0F8FD] hover:bg-[#E1F2FC] border border-[#CFE6F5] text-[12.5px] font-bold transition-colors cursor-pointer shrink-0"
              title="Quay lại danh sách Thông báo"
            >
              <ArrowLeft size={14} strokeWidth={2.4} />
              <span>Quay lại Thông báo</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[7px] text-[#172A3A] hover:bg-[#F1F6F9] border border-[#DCE7EE] text-[12.5px] font-semibold transition-colors cursor-pointer shrink-0"
            title="Quay lại hồ sơ (Esc)"
          >
            {!onReturnToNotifications && <ArrowLeft size={14} strokeWidth={2.4} />}
            <span>Quay lại hồ sơ</span>
          </button>

          <div className="h-4 w-[1px] bg-[#DCE7EE] shrink-0" />

          {/* Context path */}
          <div className="flex items-center gap-1.5 text-[12.5px] min-w-0 truncate">
            <span className="text-[#607483] font-medium truncate">{criterionName}</span>
            <span className="text-[#B9CCD9]">/</span>
            <span className="text-[#607483] font-medium truncate">{usageContextTitle}</span>
            <span className="text-[#B9CCD9]">/</span>
            <span
              id="evidence-detail-heading"
              tabIndex={-1}
              className="text-[#172A3A] font-bold truncate max-w-[260px] outline-none"
            >
              {currentFile.name}
            </span>
          </div>
        </div>

        {/* Right: File switcher + Friendly status badge + Close button */}
        <div className="flex items-center gap-3 shrink-0">
          {/* File Switcher (Section 47 & 48) */}
          {hasMultiple && (
            <div className="flex items-center gap-1 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[7px] px-2 py-1 text-[11.5px] text-[#607483]">
              <button
                type="button"
                onClick={handlePrevEvidence}
                disabled={fileIndex <= 0}
                className="p-0.5 rounded text-[#607483] hover:text-[#172A3A] disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                title="Minh chứng trước"
              >
                <ChevronLeft size={14} strokeWidth={2.4} />
              </button>
              <span className="font-semibold px-1 text-[#172A3A] tabular-nums">
                {fileIndex + 1} / {allEvidenceList.length} minh chứng
              </span>
              <button
                type="button"
                onClick={handleNextEvidence}
                disabled={fileIndex >= allEvidenceList.length - 1}
                className="p-0.5 rounded text-[#607483] hover:text-[#172A3A] disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                title="Minh chứng tiếp theo"
              >
                <ChevronRight size={14} strokeWidth={2.4} />
              </button>
            </div>
          )}

          {/* Friendly Status Badge */}
          {currentFile.status === 'needs_verification' ? (
            <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#B75B00] bg-[#FEF6EB] border border-[#FADDB6] px-2.5 py-1 rounded-[6px]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E99A18] shrink-0" />
              <span>Cần bạn kiểm tra</span>
            </span>
          ) : currentFile.status === 'reading_document' ? (
            <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#0D78AE] bg-[#EAF6FC] border border-[#D0E8F5] px-2.5 py-1 rounded-[6px]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#18A6E0] animate-pulse shrink-0" />
              <span>Đang đọc tài liệu</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#1B7C49] bg-[#EDF9F1] border border-[#C6EED5] px-2.5 py-1 rounded-[6px]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1A934E] shrink-0" />
              <span>Đã sẵn sàng</span>
            </span>
          )}

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#607483] hover:text-[#172A3A] hover:bg-[#F1F6F9] rounded-[7px] transition-colors cursor-pointer"
            title="Đóng chi tiết minh chứng (Esc)"
          >
            <X size={17} strokeWidth={2.2} />
          </button>
        </div>
      </div>

      {/* Main Split-View Body (Section 4 & 54-58) */}
      <div className="flex-1 flex min-h-0 min-w-0 overflow-hidden">
        {/* LEFT: Document Viewer (58–62% width) */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          <DocumentViewer
            fileId={currentFile.id}
            fileName={currentFile.name}
            fileType={currentFile.fileType}
            fileUrl={currentFile.url}
            totalPage={currentFile.name.toLowerCase().endsWith('.pdf') ? 2 : 1}
            highlightRegion={highlightRegion}
            onSelectRegion={(reg) => {
              setHighlightRegion(reg);
              const matchingField = fields.find((f) => f.highlightRegionId === reg);
              if (matchingField) {
                setFocusedFieldId(matchingField.id);
              }
            }}
          />
        </div>

        {/* RIGHT: Information Panel (38–42% width, capped at 500px on ultra-wide, Section 58) */}
        <div className="w-[420px] 2xl:w-[480px] shrink-0 h-full min-w-[380px] max-w-[520px] overflow-hidden flex flex-col bg-white">
          <InformationPanel
            evidenceId={currentFile.id}
            fileName={currentFile.name}
            fileType={currentFile.fileType}
            fileSize={currentFile.size}
            uploadedAt={currentFile.uploadedAt}
            status={currentFile.status}
            criterionName={criterionName}
            criterionId={criterionId}
            requirementTitle={usageContextTitle}
            requirementId={requirementId}
            fields={fields}
            focusedFieldId={focusedFieldId}
            onUpdateField={handleUpdateFieldValue}
            onConfirmEvidence={() => onConfirmEvidence(currentFile.id)}
            onOpenRegulation={handleOpenInlineRegulation}
            onFocusField={handleFocusField}
            readOnly={readOnly}
          />
        </div>
      </div>

      {/* Inline Regulation Slide-Over Drawer (stays inside EvidenceDetailWorkspace without exiting) */}
      <RightInspector
        isOpen={isRegulationOpen}
        onClose={() => setIsRegulationOpen(false)}
        title="Quy định áp dụng"
        subtitle={`${activeRegCriterion.name} · Năm học 2025–2026`}
        width={420}
        zIndexClassName="z-[60]"
      >
        <RegulationInspectorContent
          criterion={activeRegCriterion}
          season="Năm học 2025–2026"
          focusedSectionId={activeRegSectionId}
          onSelectCriterion={(critId) => {
            const critDef = CRITERIA[critId as keyof typeof CRITERIA];
            if (critDef) {
              setActiveRegCriterion(critDef);
              setActiveRegSectionId(null);
            }
          }}
        />
      </RightInspector>
    </div>
  );
};
