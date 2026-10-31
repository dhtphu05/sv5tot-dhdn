/**
 * 5TOT ĐHĐN — Officer Evidence Review Viewer (EvidenceReviewViewer)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Prompt 22.2 Sections 10, 11, 13–18, 35, 74, 76:
 * - True individual Evidence review: every evidence file has independent review state.
 * - Left: Large original Student document preview (PDF, Realistic certificate preview, images).
 * - Right: Granular Evidence Review Inspector:
 *   - Title: "Xét duyệt minh chứng"
 *   - Context: Criterion -> Requirement -> Declaration -> File.
 *   - Current status badge: Chưa kiểm tra, Đang kiểm tra, Phù hợp, Cần bổ sung, Không phù hợp, Cần xem xét thêm.
 *   - File navigation: "Minh chứng trước" / "Minh chứng tiếp theo" while preserving context & notes.
 *   - System-recognized advisory information (advisory only, never "AI kết luận đạt").
 *   - Review note field ("Ghi chú xét duyệt minh chứng", autosaved).
 *   - Actions:
 *     - [Xác nhận phù hợp]
 *     - [Yêu cầu bổ sung] (transitions cleanly to supplement modal targeting this exact evidence & declaration)
 *     - [Không phù hợp] (requires internal reason)
 *     - [Cần xem xét thêm] (requires internal reason)
 *     - [Đang kiểm tra]
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Eye,
  CheckCircle2,
  MessageSquareWarning,
  Flag,
  Lock,
  Info,
  AlertTriangle,
  FileText,
  XCircle,
  Sparkles,
  MessageSquare,
  Copy,
  RotateCcw,
} from 'lucide-react';
import { CRITERIA } from '../../../tokens';
import {
  ApplicationDeclaration,
  ApplicationEvidence,
} from '../../../demo/fixtures/studentApplication';
import { DocumentViewer } from '../../../components/evidence/detail/DocumentViewer';
import { FileTypeIcon } from '../../../components/evidence/FileTypeIcon';
import {
  EVIDENCE_REVIEW_STATUS_META,
  SelectedReviewScope,
  StaffEvidenceReviewRecord,
  StaffEvidenceReviewStatus,
} from '../../reviewTypes';
import { ReviewStage } from '../../schoolReviewTypes';
import { getEvidenceAiInsight } from '../../../features/ai-review-copilot/demoCopilotFixtures';
import { isBackendMode } from '../../../shared/config/executionMode';

export interface EvidenceReviewViewerProps {
  isOpen: boolean;
  evidence: ApplicationEvidence | null;
  evidenceList: ApplicationEvidence[];
  scope: SelectedReviewScope;
  requirementTitle: string;
  declaration?: ApplicationDeclaration;
  currentEvidenceStatus: StaffEvidenceReviewStatus;
  evidenceRecord?: StaffEvidenceReviewRecord;
  evidenceRecordsMap?: Record<string, StaffEvidenceReviewRecord>;
  canMutate: boolean;
  onClose: () => void;
  onSelectEvidence: (file: ApplicationEvidence) => void;
  onSaveEvidenceNote: (evidenceId: string, note: string) => void;
  onUpdateEvidenceStatus: (
    evidenceId: string,
    status: StaffEvidenceReviewStatus,
    note?: string,
    unsuitableReason?: string,
    considerationReason?: string
  ) => void;
  onTransitionToSupplementRequest: (
    scope: SelectedReviewScope,
    initialDraft?: string
  ) => void;
  reviewStage?: ReviewStage;
}

interface SystemRecognizedInfoRow {
  label: string;
  value: string;
  advisoryNote?: string;
  highlightRegionId?: string;
}

/**
 * Generates realistic, advisory-only system-recognized fields (Prompt 22.2 Section 67)
 * Advisory only, never "AI kết luận đạt" or fake OCR percentages.
 */
function getOfficerRecognizedFields(
  file: ApplicationEvidence,
  declaration?: ApplicationDeclaration
): SystemRecognizedInfoRow[] {
  const lower = `${file.name} ${file.url || ''}`.toLowerCase();

  if (!isBackendMode() || lower.includes('minhchung_test')) {
  if (lower.includes('518') || lower.includes('smartcampus')) {
    if (lower.includes('307') || lower.includes('ke_hoach')) {
      return [
        {
          label: 'Tên văn bản nhận diện',
          value: 'Kế hoạch số 307/KH-ĐHBK tổ chức Cuộc thi BK-SmartCampus 2026',
          highlightRegionId: 'award-name',
        },
        {
          label: 'Đơn vị ban hành',
          value: 'Trường Đại học Bách khoa – Đại học Đà Nẵng',
          highlightRegionId: 'authority',
        },
        {
          label: 'Nội dung đối chiếu',
          value: 'Thể lệ và quy mô Cuộc thi Chuyển đổi số và Quản lý thông minh',
        },
      ];
    }
    return [
      {
        label: 'Tên quyết định khen thưởng',
        value: 'Quyết định số 518-QĐ/ĐHBK-ĐTN tặng Giấy khen Cuộc thi BK SmartCampus',
        highlightRegionId: 'award-name',
      },
      {
        label: 'Thành tích ghi nhận',
        value: 'Giải Nhất Cuộc thi Chuyển đổi số và Quản lý thông minh – BK SmartCampus',
        highlightRegionId: 'award-name',
      },
      {
        label: 'Ngày ký ban hành',
        value: '14/09/2026',
        highlightRegionId: 'date',
      },
      {
        label: 'Cơ quan cấp & Mộc dấu',
        value: 'BCH Đoàn Trường Đại học Bách khoa – ĐH Đà Nẵng (Dấu đỏ hợp lệ)',
        highlightRegionId: 'authority',
      },
    ];
  }

  if (lower.includes('mistalent')) {
    return [
      {
        label: 'Tên chứng nhận nhận diện',
        value: 'Giấy chứng nhận Top 15 Cuộc thi Học thuật MIS Talent 2026',
        highlightRegionId: 'award-name',
      },
      {
        label: 'Đơn vị cấp chứng nhận',
        value: 'Khoa Hệ thống Thông tin Quản lý – Trường Đại học Kinh tế Quốc dân',
        highlightRegionId: 'authority',
      },
      {
        label: 'Năm học ghi nhận',
        value: 'Năm học 2025–2026',
        highlightRegionId: 'date',
      },
    ];
  }

  if (lower.includes('vannghe_phu')) {
    return [
      {
        label: 'Tên giấy chứng nhận',
        value: 'Giấy chứng nhận đóng góp tích cực Chương trình Chào đón Tân Sinh viên Khóa 2025 & Trao học bổng khuyến học',
        highlightRegionId: 'award-name',
      },
      {
        label: 'Đơn vị xác nhận',
        value: 'BCH Liên Chi đoàn Khoa Công nghệ Thông tin – Trường ĐH Bách khoa ĐHĐN',
        highlightRegionId: 'authority',
      },
      {
        label: 'Ngày cấp trên văn bản',
        value: '17/10/2025',
        highlightRegionId: 'date',
      },
      {
        label: 'Thông tin cần đối chiếu (Thời lượng tình nguyện)',
        value: 'Văn bản ghi nhận đóng góp chương trình ngày 17/10/2025 (cần đối chiếu số ngày chuẩn bị thực tế)',
        advisoryNote:
          'Hệ thống gợi ý kiểm tra: Đối chiếu số ngày tham gia công tác tổ chức thực tế so với kê khai của sinh viên.',
        highlightRegionId: 'date',
      },
    ];
  }

  if (lower.includes('doan_hoang_thien_phu') || lower.includes('convo_ai')) {
    return [
      {
        label: 'Tên chứng nhận quốc tế',
        value: 'Certificate of Participation – Convo AI Hackathon Danang University 2026',
        highlightRegionId: 'award-name',
      },
      {
        label: 'Đơn vị đồng tổ chức',
        value: 'Agora Vietnam, Solana Foundation & Trường Đại học Bách khoa – ĐHĐN',
        highlightRegionId: 'authority',
      },
      {
        label: 'Ngày cấp',
        value: '28/06/2026',
        highlightRegionId: 'date',
      },
    ];
  }

  if (lower.includes('img_1720') || lower.includes('bk_shark') || lower.includes('472')) {
    return [
      {
        label: 'Tên giấy khen',
        value: 'Giấy khen Giải Nhất Cuộc thi Khởi nghiệp trong Sinh viên – BK Shark 2026',
        highlightRegionId: 'award-name',
      },
      {
        label: 'Số quyết định & Ngày cấp',
        value: 'Quyết định số 472-QĐ/ĐHBK-ĐTN ngày 01/07/2026',
        highlightRegionId: 'date',
      },
      {
        label: 'Đơn vị cấp',
        value: 'BCH Đoàn TNCS Hồ Chí Minh Trường Đại học Bách khoa – ĐHĐN',
        highlightRegionId: 'authority',
      },
    ];
  }

  if (lower.includes('img_1721') || lower.includes('startup_runway') || lower.includes('155')) {
    return [
      {
        label: 'Tên bằng khen',
        value: 'Bằng khen Giải Nhất Cuộc thi Khởi nghiệp Startup Runway 2026',
        highlightRegionId: 'award-name',
      },
      {
        label: 'Số quyết định & Ngày cấp',
        value: 'Quyết định số 155-QĐ/ĐHĐN-HSV ngày 07/09/2026',
        highlightRegionId: 'date',
      },
      {
        label: 'Cơ quan ban hành',
        value: 'Ban Thư ký Hội Sinh viên Đại học Đà Nẵng (Dấu đỏ HSV ĐHĐN)',
        highlightRegionId: 'authority',
      },
    ];
  }

  if (lower.includes('img_1711') || lower.includes('147')) {
    return [
      {
        label: 'Tên bằng khen cấp Trung ương',
        value: 'Bằng khen Giải Khuyến khích Bảng B Cuộc thi Vietnamese Student HackAIthon 2026',
        highlightRegionId: 'award-name',
      },
      {
        label: 'Số quyết định & Ngày cấp',
        value: 'Quyết định số 147-QĐKT/TWHSV ngày 23/07/2026',
        highlightRegionId: 'date',
      },
      {
        label: 'Cơ quan ban hành',
        value: 'Ban Chấp hành Trung ương Hội Sinh viên Việt Nam',
        highlightRegionId: 'authority',
      },
    ];
  }

  if (lower.includes('img_9540') || lower.includes('156')) {
    return [
      {
        label: 'Tên bằng khen cấp Đại học Đà Nẵng',
        value: 'Bằng khen Giải Khuyến khích Bảng B Cuộc thi Vietnamese Student HackAIthon 2026',
        highlightRegionId: 'award-name',
      },
      {
        label: 'Số quyết định & Ngày cấp',
        value: 'Quyết định số 156-QĐ/ĐHĐN-HSV ngày 08/09/2026',
        highlightRegionId: 'date',
      },
      {
        label: 'Cơ quan ban hành',
        value: 'Ban Thư ký Hội Sinh viên Đại học Đà Nẵng',
        highlightRegionId: 'authority',
      },
    ];
  }

  if (lower.includes('img_9544') || lower.includes('it_league_2025')) {
    return [
      {
        label: 'Tên giấy chứng nhận thể thao',
        value: 'Giấy chứng nhận Giải Bóng đá truyền thống Khoa CNTT – IT League 2025',
        highlightRegionId: 'award-name',
      },
      {
        label: 'Thời gian giải đấu & Ngày cấp',
        value: '18/04/2025 – 11/05/2025 (Cấp ngày 12/05/2025)',
        highlightRegionId: 'date',
      },
      {
        label: 'Đơn vị tổ chức',
        value: 'BCH Liên Chi đoàn Khoa Công nghệ Thông tin – Trường ĐH Bách khoa ĐHĐN',
        highlightRegionId: 'authority',
      },
    ];
  }

  if (lower.includes('img_9547') || lower.includes('50_nam')) {
    return [
      {
        label: 'Tên giấy chứng nhận tình nguyện',
        value: 'Giấy chứng nhận tham gia phục vụ Lễ Kỷ niệm 50 năm thành lập Trường ĐH Bách khoa – ĐHĐN (1975–2025)',
        highlightRegionId: 'award-name',
      },
      {
        label: 'Ngày cấp',
        value: '10/07/2025',
        highlightRegionId: 'date',
      },
      {
        label: 'Đơn vị xác nhận',
        value: 'BCH Liên Chi đoàn Khoa Công nghệ Thông tin – Trường ĐH Bách khoa ĐHĐN',
        highlightRegionId: 'authority',
      },
    ];
  }

  if (lower.includes('img_9542') || lower.includes('khac_mong')) {
    return [
      {
        label: 'Tên chứng nhận hoạt động cộng đồng',
        value: 'Certificate of Recognition – Chương trình K24 Khắc Mộng Thiên Thu',
        highlightRegionId: 'award-name',
      },
      {
        label: 'Ngày cấp',
        value: '16/11/2024',
        highlightRegionId: 'date',
      },
      {
        label: 'Đơn vị cấp',
        value: 'BCH Liên Chi đoàn Khoa Công nghệ Thông tin – Trường ĐH Bách khoa ĐHĐN',
        highlightRegionId: 'authority',
      },
    ];
  }

  if (lower.includes('img_9553') || lower.includes('310')) {
    return [
      {
        label: 'Tên giấy khen',
        value: 'Giấy khen Thành tích xuất sắc trong công tác Đoàn và phong trào thanh niên',
        highlightRegionId: 'award-name',
      },
      {
        label: 'Số quyết định & Ngày cấp',
        value: 'Quyết định số 310-QĐ/ĐHBK-ĐTN ngày 11/11/2025',
        highlightRegionId: 'date',
      },
      {
        label: 'Đơn vị cấp',
        value: 'BCH Đoàn TNCS Hồ Chí Minh Trường Đại học Bách khoa – ĐHĐN',
        highlightRegionId: 'authority',
      },
    ];
  }

  if (lower.includes('thoi_gian_mhx')) {
    return [
      {
        label: 'Tên văn bản nhận diện',
        value: 'Giấy xác nhận thời gian tham gia Chiến dịch Mùa hè xanh 2026',
        highlightRegionId: 'award-name',
      },
      {
        label: 'Thời gian tham gia trên tài liệu',
        value: '12/07/2026 – 16/07/2026 (05 ngày thực tế tại xã Hòa Bắc)',
        highlightRegionId: 'date',
      },
      {
        label: 'Đơn vị cấp xác nhận',
        value: 'Ban Chỉ huy Chiến dịch Mùa hè xanh Trường ĐH Bách khoa',
        highlightRegionId: 'authority',
      },
    ];
  }
  }

  return [
    {
      label: 'Tên chứng nhận nhận diện',
      value:
        file.aiSuggestedInfo?.achievementName ||
        declaration?.value ||
        file.name,
      highlightRegionId: 'award-name',
    },
    {
      label: 'Ngày ghi nhận / Ngày cấp',
      value:
        file.aiSuggestedInfo?.date ||
        declaration?.date ||
        file.uploadedAt ||
        (isBackendMode() ? 'Theo thông tin trên văn bản' : '15/06/2026'),
      highlightRegionId: 'date',
    },
    {
      label: 'Đơn vị cấp',
      value:
        file.aiSuggestedInfo?.issuingAuthority ||
        declaration?.detail ||
        (isBackendMode()
          ? 'Theo thông tin trên văn bản đính kèm'
          : 'Trường Đại học Bách khoa - Đại học Đà Nẵng'),
      highlightRegionId: 'authority',
    },
  ];
}

export const EvidenceReviewViewer: React.FC<EvidenceReviewViewerProps> = ({
  isOpen,
  evidence,
  evidenceList,
  scope,
  requirementTitle,
  declaration,
  currentEvidenceStatus,
  evidenceRecord,
  evidenceRecordsMap = {},
  canMutate,
  onClose,
  onSelectEvidence,
  onSaveEvidenceNote,
  onUpdateEvidenceStatus,
  onTransitionToSupplementRequest,
  reviewStage = 'CITY',
}) => {
  const isSchoolStage = reviewStage === 'SCHOOL';
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [localNote, setLocalNote] = useState<string>('');
  const [noteSavedFeedback, setNoteSavedFeedback] = useState<boolean>(false);
  const [activeHighlightRegion, setActiveHighlightRegion] = useState<string | null>(null);

  // Negative finding modal / inline form state (Section 23)
  const [showUnsuitableForm, setShowUnsuitableForm] = useState<boolean>(false);
  const [unsuitableReasonInput, setUnsuitableReasonInput] = useState<string>('');
  const [unsuitableReasonError, setUnsuitableReasonError] = useState<string | null>(null);

  // Consideration modal / inline form state (Section 48, 49)
  const [showConsiderationForm, setShowConsiderationForm] = useState<boolean>(false);
  const [considerationReasonInput, setConsiderationReasonInput] = useState<string>('');
  const [considerationReasonError, setConsiderationReasonError] = useState<string | null>(null);

  // Sync local note with evidence change
  useEffect(() => {
    if (evidence) {
      const rec = evidenceRecord || evidenceRecordsMap[evidence.id];
      setLocalNote(rec?.internalNote || '');
      setUnsuitableReasonInput(rec?.unsuitableReason || '');
      setConsiderationReasonInput(rec?.considerationReason || '');
      setShowUnsuitableForm(false);
      setShowConsiderationForm(false);
      setUnsuitableReasonError(null);
      setConsiderationReasonError(null);
    }
  }, [evidence?.id, evidenceRecord]);

  // Esc key closes viewer
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !evidence) return null;

  const criterionToken = CRITERIA[scope.criterionId];
  const statusMeta = EVIDENCE_REVIEW_STATUS_META[currentEvidenceStatus] || EVIDENCE_REVIEW_STATUS_META.not_reviewed;
  const currentIndex = evidenceList.findIndex((f) => f.id === evidence.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < evidenceList.length - 1;

  const recognizedFields = getOfficerRecognizedFields(evidence, declaration);
  const rawAiInsight = getEvidenceAiInsight(evidence.id);
  const isRealMinhChungFile = Boolean(evidence.url?.includes('/minhchung_test/'));
  const aiInsight =
    rawAiInsight && rawAiInsight.criterionId === scope.criterionId && !isRealMinhChungFile
      ? rawAiInsight
      : undefined;
  const isNewSupplementFile = evidence.id.includes('supp-new');

  const handleNoteChange = (text: string) => {
    setLocalNote(text);
    if (evidence) {
      onSaveEvidenceNote(evidence.id, text);
      setNoteSavedFeedback(true);
      window.setTimeout(() => setNoteSavedFeedback(false), 1800);
    }
  };

  const handleConfirmSuitable = () => {
    if (!canMutate || !evidence) return;
    onUpdateEvidenceStatus(evidence.id, 'suitable', localNote);
  };

  const handleConfirmViewed = () => {
    if (!canMutate || !evidence) return;
    onUpdateEvidenceStatus(evidence.id, 'viewed', localNote);
  };

  const handleConfirmUnsuitable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canMutate || !evidence) return;
    if (!unsuitableReasonInput.trim()) {
      setUnsuitableReasonError('Vui lòng nhập lý do minh chứng không phù hợp để lưu vào hồ sơ nội bộ.');
      return;
    }
    onUpdateEvidenceStatus(
      evidence.id,
      'unsuitable',
      localNote,
      unsuitableReasonInput.trim()
    );
    setShowUnsuitableForm(false);
  };

  const handleConfirmConsideration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canMutate || !evidence) return;
    if (!considerationReasonInput.trim()) {
      setConsiderationReasonError('Vui lòng nhập lý do cần xem xét thêm để chuyển Quản lý / Hội đồng.');
      return;
    }
    onUpdateEvidenceStatus(
      evidence.id,
      'needs_consideration',
      localNote,
      undefined,
      considerationReasonInput.trim()
    );
    setShowConsiderationForm(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Trình xem minh chứng: ${evidence.name}`}
      className="fixed inset-0 z-50 bg-[#0F2335]/55 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4"
    >
      <div
        className={`bg-white rounded-[20px] shadow-[0_24px_70px_rgba(15,35,53,0.25)] flex flex-col overflow-hidden transition-all ${
          isFullScreen
            ? 'w-full h-full rounded-none'
            : 'w-full max-w-[1380px] h-[92vh]'
        }`}
      >
        {/* ================================================================= */}
        {/* TOP CONTEXT HEADER (Sections 14, 18)                              */}
        {/* ================================================================= */}
        <header className="px-5 py-3.5 bg-[#0B1E2D] text-white flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Breadcrumb Context: Criterion -> Requirement -> Declaration */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="px-2.5 py-0.5 rounded-[6px] bg-white/12 text-[#7CC4EE] text-[11.5px] font-bold shrink-0">
              0{criterionToken.number} · {criterionToken.name}
            </span>
            <span className="text-white/30">→</span>
            <span className="text-[12.5px] text-[#D6E6F2] font-medium truncate max-w-[240px]">
              {requirementTitle}
            </span>
            {declaration && (
              <>
                <span className="text-white/30">→</span>
                <span className="text-[12.5px] font-bold text-white truncate max-w-[340px]">
                  {declaration.value}
                </span>
              </>
            )}
          </div>

          {/* Right Controls: File Navigation (Section 18) + Full Screen + Close */}
          <div className="flex items-center gap-2 shrink-0">
            {evidenceList.length > 1 && (
              <div className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-[10px] text-[12px]">
                <button
                  type="button"
                  disabled={!hasPrev}
                  onClick={() =>
                    hasPrev && onSelectEvidence(evidenceList[currentIndex - 1])
                  }
                  aria-label="Tệp minh chứng trước"
                  className="p-1 hover:text-[#7CC4EE] disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="tabular-nums font-semibold px-2 text-[12px]">
                  Minh chứng {currentIndex + 1} / {evidenceList.length}
                </span>
                <button
                  type="button"
                  disabled={!hasNext}
                  onClick={() =>
                    hasNext && onSelectEvidence(evidenceList[currentIndex + 1])
                  }
                  aria-label="Tệp minh chứng tiếp theo"
                  className="p-1 hover:text-[#7CC4EE] disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsFullScreen((prev) => !prev)}
              className="h-[32px] px-3 rounded-[10px] bg-white/10 hover:bg-white/18 text-[12px] font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer border-0"
            >
              {isFullScreen ? (
                <>
                  <Minimize2 size={13.5} />
                  <span>Thu gọn</span>
                </>
              ) : (
                <>
                  <Maximize2 size={13.5} />
                  <span>Toàn màn hình</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng trình xem minh chứng"
              className="h-[32px] px-3 rounded-[10px] bg-white/10 hover:bg-white/20 text-white text-[12px] font-bold inline-flex items-center gap-1 cursor-pointer border-0"
            >
              <X size={14} />
              <span>Đóng</span>
            </button>
          </div>
        </header>

        {/* File Strip with individual evidence status badges (Sections 14, 17) */}
        {evidenceList.length > 1 && (
          <div className="px-5 py-2 bg-[#F5F8FB] border-b border-[#F0F4F8] flex items-center gap-2 overflow-x-auto shrink-0">
            <span className="text-[11px] font-bold text-[#526B7C] shrink-0">
              Minh chứng của kê khai ({evidenceList.length}):
            </span>
            {evidenceList.map((item, idx) => {
              const isSelected = item.id === evidence.id;
              const isNew = item.id.includes('supp-new');
              const itemRec = evidenceRecordsMap[item.id];
              const itemStatus = itemRec?.status || 'not_reviewed';
              const itemMeta = EVIDENCE_REVIEW_STATUS_META[itemStatus];

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectEvidence(item)}
                  className={`px-3 py-1.5 rounded-[10px] text-[11.5px] font-semibold inline-flex items-center gap-2 transition-all shrink-0 cursor-pointer border ${
                    isSelected
                      ? 'bg-[#E1F0FD] border-[#93C5FD] text-[#0B64A0] shadow-xs'
                      : 'bg-white border-[#E3EDF3] text-[#334E68] hover:bg-[#EEF3F8]'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-black/5 text-[10px] font-bold inline-flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <FileTypeIcon
                    fileName={item.name}
                    fileType={item.fileType}
                    size="sm"
                  />
                  <span className="max-w-[180px] truncate">{item.name}</span>
                  {isNew && (
                    <span className="px-1.5 py-0.2 rounded-full bg-[#EAFBF1] text-[#136F3A] text-[9.5px] font-bold">
                      Mới
                    </span>
                  )}
                  {/* Status chip */}
                  <span
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold"
                    style={{
                      backgroundColor: itemMeta.bgColor,
                      color: itemMeta.textColor,
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: itemMeta.dotColor }}
                    />
                    <span>{itemMeta.shortLabel}</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* ================================================================= */}
        {/* MAIN TWO-COLUMN BODY (Section 14: Left Preview, Right Inspector)   */}
        {/* ================================================================= */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
          {/* LEFT: ORIGINAL DOCUMENT PREVIEW */}
          <div className="flex-1 min-w-0 min-h-0 flex flex-col bg-[#EEF2F6]">
            <div className="px-5 py-2.5 bg-white border-b border-[#F0F4F8] flex items-center justify-between text-[12px]">
              <div className="flex items-center gap-2 min-w-0">
                <FileText size={15} className="text-[#1680DE] shrink-0" />
                <span className="font-bold text-[#172A3A] truncate">
                  Tài liệu gốc do sinh viên tải lên: {evidence.name}
                </span>
                {isNewSupplementFile && (
                  <span className="px-2 py-0.5 rounded-full bg-[#EAFBF1] text-[#136F3A] text-[10.5px] font-bold">
                    Mới bổ sung
                  </span>
                )}
              </div>
              <span className="text-[11.5px] text-[#607483] uppercase font-mono shrink-0">
                {evidence.fileType} · {evidence.size || '750 KB'} · Tải lên:{' '}
                {evidence.uploadedAt || '11/10/2026'}
              </span>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden">
              <DocumentViewer
                fileId={evidence.id}
                fileName={evidence.name}
                fileType={evidence.fileType}
                fileUrl={evidence.url}
                highlightRegion={activeHighlightRegion}
              />
            </div>
          </div>

          {/* RIGHT: EVIDENCE REVIEW INSPECTOR (Sections 14, 15, 16) */}
          <div className="w-full lg:w-[420px] xl:w-[450px] shrink-0 bg-white flex flex-col justify-between overflow-y-auto border-l border-[#F0F4F8]">
            <div className="p-5 space-y-4">
              {/* Header Title: Xét duyệt minh chứng */}
              <div className="flex items-center justify-between pb-2 border-b border-[#EEF4F8]">
                <div>
                  <h3 className="text-[14.5px] font-extrabold text-[#0F2335]">
                    {isSchoolStage ? 'Xét sơ minh chứng' : 'Xét duyệt minh chứng'}
                  </h3>
                  <p className="text-[11.5px] text-[#526B7C] truncate max-w-[280px]">
                    {evidence.name}
                  </p>
                </div>
                {/* Current Evidence Review Status */}
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-bold border"
                  style={{
                    backgroundColor: statusMeta.bgColor,
                    color: statusMeta.textColor,
                    borderColor: statusMeta.borderColor,
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: statusMeta.dotColor }}
                  />
                  <span>{statusMeta.label}</span>
                </span>
              </div>

              {/* 1. Context Kê khai sinh viên */}
              <section className="p-3.5 rounded-[14px] bg-[#F5F8FB] space-y-1">
                <div className="text-[11px] font-bold text-[#607483]">
                  Nội dung kê khai được minh chứng hỗ trợ
                </div>
                <div className="text-[13px] font-bold text-[#172A3A]">
                  {declaration?.value || requirementTitle}
                </div>
                {declaration?.detail && (
                  <div className="text-[12px] text-[#4A6275] line-clamp-2">
                    {declaration.detail}
                  </div>
                )}
                {declaration?.date && (
                  <div className="text-[11.5px] text-[#607483] tabular-nums pt-0.5">
                    Thời gian: <strong className="text-[#172A3A]">{declaration.date}</strong>
                  </div>
                )}
              </section>

              {/* Status Meaning Explanatory Note */}
              <div className="p-2.5 rounded-[10px] text-[11.5px] leading-relaxed border bg-[#F8FBFD] border-[#E3EDF3] text-[#334E68]">
                {currentEvidenceStatus === 'suitable' && (
                  <span className="text-[#136F3A] font-semibold flex items-center gap-1.5">
                    <CheckCircle2 size={13} />
                    Cán bộ đã đánh giá tệp minh chứng này phù hợp làm căn cứ xét duyệt.
                  </span>
                )}
                {currentEvidenceStatus === 'unsuitable' && (
                  <div className="text-[#B91C1C] space-y-1">
                    <div className="font-bold flex items-center gap-1">
                      <XCircle size={13} />
                      Minh chứng không phù hợp
                    </div>
                    {evidenceRecord?.unsuitableReason && (
                      <p className="text-[11px] italic">“{evidenceRecord.unsuitableReason}”</p>
                    )}
                  </div>
                )}
                {currentEvidenceStatus === 'needs_supplement' && (
                  <span className="text-[#B45309] font-semibold flex items-center gap-1.5">
                    <AlertTriangle size={13} />
                    Minh chứng cần bổ sung hoặc làm rõ thêm thông tin.
                  </span>
                )}
                {currentEvidenceStatus === 'needs_consideration' && (
                  <div className="text-[#5B21B6] space-y-1">
                    <div className="font-bold flex items-center gap-1">
                      <Flag size={13} />
                      Minh chứng cần xem xét thêm
                    </div>
                    {evidenceRecord?.considerationReason && (
                      <p className="text-[11px] italic">“{evidenceRecord.considerationReason}”</p>
                    )}
                  </div>
                )}
                {currentEvidenceStatus === 'viewed' && (
                  <span className="text-[#0B64A0] font-medium flex items-center gap-1.5">
                    <Eye size={13} />
                    Cán bộ đang kiểm tra tệp minh chứng này.
                  </span>
                )}
                {currentEvidenceStatus === 'not_reviewed' && (
                  <span className="text-[#607483]">
                    Minh chứng chưa được kiểm tra. Chọn hành động thẩm định bên dưới.
                  </span>
                )}
              </div>

              {/* 2. Level 4: Contextual AI Evidence Insights (Section 7) */}
              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={14} className="text-[#0D78AE]" />
                    <h4 className="text-[12.5px] font-bold text-[#172A3A]">
                      Gợi ý từ AI: Đối chiếu minh chứng
                    </h4>
                  </div>
                  {aiInsight && (
                    <span
                      className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full border ${
                        aiInsight.status === 'analyzed'
                          ? 'bg-[#EAFBF1] text-[#136F3A] border-[#C3EDD2]'
                          : aiInsight.status === 'needs_attention'
                          ? 'bg-[#FEF6EB] text-[#B45309] border-[#FDE68A]'
                          : 'bg-[#F0F8FD] text-[#0D78AE] border-[#CFE3F0]'
                      }`}
                    >
                      {aiInsight.badgeLabel}
                    </span>
                  )}
                </div>

                {aiInsight && (
                  <p className="text-[12px] text-[#526B7C] leading-relaxed">
                    {aiInsight.summaryText}
                  </p>
                )}

                <div className="p-2.5 rounded-[10px] bg-[#F4FAFF] text-[11px] text-[#0B64A0] flex items-start gap-2 border border-[#DBEAFE]">
                  <Info size={13} className="shrink-0 mt-0.5 text-[#1680DE]" />
                  <span className="leading-relaxed">
                    Dữ liệu trích xuất hỗ trợ cán bộ đối chiếu nhanh với văn bản gốc. Kết quả thẩm định chính thức hoàn toàn do cán bộ quyết định.
                  </span>
                </div>

                {/* Candidate Facts List */}
                <div className="rounded-[12px] bg-[#F5F8FB] border border-[#E2E8F0] overflow-hidden divide-y divide-[#EEF3F8]">
                  {aiInsight && aiInsight.candidateFacts.length > 0
                    ? aiInsight.candidateFacts.map((item, idx) => (
                        <div
                          key={idx}
                          onMouseEnter={() =>
                            setActiveHighlightRegion(
                              item.label.toLowerCase().includes('thời gian') ||
                              item.label.toLowerCase().includes('ngày')
                                ? 'date-range'
                                : 'award-name'
                            )
                          }
                          onMouseLeave={() => setActiveHighlightRegion(null)}
                          className={`p-2.5 transition-colors space-y-0.5 ${
                            item.isDiscrepancy
                              ? 'bg-[#FEF6EB] border-l-3 border-[#F59E0B]'
                              : 'hover:bg-[#EEF4F9]'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-[#607483]">
                              {item.label}
                            </span>
                            {item.isDiscrepancy && (
                              <span className="text-[10px] font-bold text-[#B45309] bg-white px-1.5 py-0.2 rounded border border-[#FDE68A]">
                                Cần kiểm tra
                              </span>
                            )}
                          </div>
                          <div className="text-[12.5px] font-bold text-[#172A3A]">
                            {item.value}
                          </div>
                        </div>
                      ))
                    : recognizedFields.map((item, idx) => (
                        <div
                          key={idx}
                          onMouseEnter={() =>
                            setActiveHighlightRegion(item.highlightRegionId || null)
                          }
                          onMouseLeave={() => setActiveHighlightRegion(null)}
                          className="p-2.5 hover:bg-[#EEF4F9] transition-colors space-y-0.5"
                        >
                          <div className="text-[11px] font-semibold text-[#607483]">
                            {item.label}
                          </div>
                          <div className="text-[12.5px] font-bold text-[#172A3A]">
                            {item.value}
                          </div>
                          {item.advisoryNote && (
                            <div className="mt-1 p-2 rounded-[6px] bg-[#FEF6EB] text-[11px] text-[#B45309] flex items-start gap-1.5 border border-[#FDE68A]">
                              <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                              <span>{item.advisoryNote}</span>
                            </div>
                          )}
                        </div>
                      ))}
                </div>

                {/* AI Action Shortcuts */}
                {aiInsight && (
                  <div className="pt-1 flex items-center gap-2 flex-wrap">
                    {aiInsight.draftSupplementMessage && canMutate && (
                      <button
                        type="button"
                        onClick={() =>
                          onTransitionToSupplementRequest(
                            scope,
                            aiInsight.draftSupplementMessage
                          )
                        }
                        className="h-[30px] px-2.5 rounded-[7px] bg-[#FFFBEB] hover:bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <MessageSquare size={12} />
                        <span>Soạn nháp bổ sung</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        handleNoteChange(
                          localNote
                            ? `${localNote}\n${aiInsight.summaryText}`
                            : aiInsight.summaryText
                        )
                      }
                      className="h-[30px] px-2.5 rounded-[7px] bg-white hover:bg-[#F4F7FA] text-[#0D78AE] border border-[#CFE3F0] text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Copy size={12} />
                      <span>Thêm vào ghi chú</span>
                    </button>
                  </div>
                )}
              </section>

              {/* 3. Ghi chú xét duyệt minh chứng (Internal Staff Note) */}
              <section className="space-y-1.5 pt-2 border-t border-[#F0F4F8]">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="viewer-internal-note"
                    className="text-[12px] font-bold text-[#172A3A] flex items-center gap-1.5"
                  >
                    <Lock size={12} className="text-[#607483]" />
                    <span>Ghi chú xét duyệt minh chứng (Nội bộ)</span>
                  </label>
                  {noteSavedFeedback && (
                    <span className="text-[11px] font-semibold text-[#10B981]">
                      Đã lưu ghi chú
                    </span>
                  )}
                </div>

                <textarea
                  id="viewer-internal-note"
                  rows={2}
                  disabled={!canMutate}
                  value={localNote}
                  onChange={(e) => handleNoteChange(e.target.value)}
                  placeholder="Ghi nhận nhận xét chuyên môn đối với tệp minh chứng này..."
                  className="w-full p-2.5 text-[12px] text-[#172A3A] bg-[#F5F8FB] border border-[#DCE7EE] rounded-[10px] outline-none focus:border-[#1680DE] focus:bg-white transition-colors"
                />
              </section>

              {/* INLINE FORM: LÝ DO KHÔNG PHÙ HỢP (Section 23: Required) */}
              {showUnsuitableForm && (
                <form
                  onSubmit={handleConfirmUnsuitable}
                  className="p-3 rounded-[12px] bg-[#FEF2F2] border border-[#FECACA] space-y-2 animate-in fade-in"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold text-[#B91C1C]">
                      Lý do minh chứng không phù hợp (Bắt buộc)
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    value={unsuitableReasonInput}
                    onChange={(e) => {
                      setUnsuitableReasonInput(e.target.value);
                      if (unsuitableReasonError) setUnsuitableReasonError(null);
                    }}
                    placeholder="Ví dụ: Minh chứng không xác nhận thành tích thuộc năm học đang xét."
                    className="w-full p-2 text-[12px] bg-white border border-[#FCA5A5] rounded-[8px] text-[#172A3A] outline-none"
                  />
                  {unsuitableReasonError && (
                    <p className="text-[11px] font-bold text-[#DC2626]">
                      {unsuitableReasonError}
                    </p>
                  )}
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowUnsuitableForm(false)}
                      className="px-2.5 py-1 rounded-[6px] text-[11.5px] font-semibold text-[#607483] hover:bg-white"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 rounded-[6px] bg-[#DC2626] hover:bg-[#B91C1C] text-white text-[11.5px] font-bold"
                    >
                      Xác nhận không phù hợp
                    </button>
                  </div>
                </form>
              )}

              {/* INLINE FORM: LÝ DO CẦN XEM XÉT THÊM */}
              {showConsiderationForm && (
                <form
                  onSubmit={handleConfirmConsideration}
                  className="p-3 rounded-[12px] bg-[#F5F3FF] border border-[#DDD6FE] space-y-2 animate-in fade-in"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold text-[#5B21B6]">
                      Lý do cần xem xét thêm (Chuyển Quản lý / Hội đồng)
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    value={considerationReasonInput}
                    onChange={(e) => {
                      setConsiderationReasonInput(e.target.value);
                      if (considerationReasonError) setConsiderationReasonError(null);
                    }}
                    placeholder="Ví dụ: Cần đối chiếu cấp ban hành giải thưởng với quy chế tương đương."
                    className="w-full p-2 text-[12px] bg-white border border-[#C4B5FD] rounded-[8px] text-[#172A3A] outline-none"
                  />
                  {considerationReasonError && (
                    <p className="text-[11px] font-bold text-[#DC2626]">
                      {considerationReasonError}
                    </p>
                  )}
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowConsiderationForm(false)}
                      className="px-2.5 py-1 rounded-[6px] text-[11.5px] font-semibold text-[#607483] hover:bg-white"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 rounded-[6px] bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-[11.5px] font-bold"
                    >
                      Lưu & Chuyển xem xét
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Bottom Review Actions inside Viewer (Sections 15, 16, 76) */}
            {canMutate && (
              <div className="p-4 bg-[#F8FBFD] border-t border-[#F0F4F8] space-y-2">
                {/* Primary Action: Xác nhận phù hợp */}
                <button
                  type="button"
                  onClick={handleConfirmSuitable}
                  className={`w-full h-[40px] px-4 rounded-[12px] font-bold text-[13px] inline-flex items-center justify-center gap-2 transition-all cursor-pointer border-0 shadow-sm ${
                    currentEvidenceStatus === 'suitable'
                      ? 'bg-[#EAFBF1] text-[#136F3A] border border-[#B6E6C9]'
                      : 'bg-[#1680DE] hover:bg-[#1371C4] text-white'
                  }`}
                >
                  <CheckCircle2 size={16} />
                  <span>
                    {currentEvidenceStatus === 'suitable'
                      ? 'Minh chứng đã phù hợp'
                      : 'Xác nhận phù hợp'}
                  </span>
                </button>

                {/* Secondary & Additional Action Grid */}
                <div className="grid grid-cols-4 gap-2">
                  {/* Đang kiểm tra */}
                  <button
                    type="button"
                    onClick={handleConfirmViewed}
                    className={`h-[36px] px-2 rounded-[10px] text-[11.5px] font-semibold inline-flex items-center justify-center gap-1 transition-colors border cursor-pointer ${
                      currentEvidenceStatus === 'viewed'
                        ? 'bg-[#EAF6FC] border-[#93C5FD] text-[#0B64A0] font-bold'
                        : 'bg-white border-[#E3EDF3] text-[#334E68] hover:bg-[#F0F4F8]'
                    }`}
                  >
                    <Eye size={13} />
                    <span>Đang xét</span>
                  </button>

                  {/* Yêu cầu bổ sung (Transitions cleanly to modal with this evidence context) */}
                  <button
                    type="button"
                    onClick={() => {
                      onTransitionToSupplementRequest({
                        ...scope,
                        evidenceId: evidence.id,
                      });
                    }}
                    className={`h-[36px] px-2 rounded-[10px] text-[11.5px] font-bold inline-flex items-center justify-center gap-1 transition-colors border cursor-pointer ${
                      currentEvidenceStatus === 'needs_supplement'
                        ? 'bg-[#FEF6EB] border-[#FADDB6] text-[#B45309]'
                        : 'bg-[#FEF6EB] hover:bg-[#FDE9CE] border-[#FADDB6] text-[#B45309]'
                    }`}
                  >
                    <MessageSquareWarning size={13} />
                    <span>Bổ sung</span>
                  </button>

                  {/* Không phù hợp */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowUnsuitableForm(true);
                      setShowConsiderationForm(false);
                    }}
                    className={`h-[36px] px-2 rounded-[10px] text-[11.5px] font-bold inline-flex items-center justify-center gap-1 transition-colors border cursor-pointer ${
                      currentEvidenceStatus === 'unsuitable'
                        ? 'bg-[#FEF2F2] border-[#FECACA] text-[#DC2626]'
                        : 'bg-[#FEF2F2] hover:bg-[#FEE2E2] border-[#FECACA] text-[#DC2626]'
                    }`}
                  >
                    <XCircle size={13} />
                    <span className="truncate">K.phù hợp</span>
                  </button>

                  {/* Cần xem xét thêm */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowConsiderationForm(true);
                      setShowUnsuitableForm(false);
                    }}
                    className={`h-[36px] px-2 rounded-[10px] text-[11.5px] font-bold inline-flex items-center justify-center gap-1 transition-colors border cursor-pointer ${
                      currentEvidenceStatus === 'needs_consideration'
                        ? 'bg-[#F5F3FF] border-[#DDD6FE] text-[#6D28D9]'
                        : 'bg-[#F5F3FF] hover:bg-[#EDE9FE] border-[#DDD6FE] text-[#6D28D9]'
                    }`}
                  >
                    <Flag size={13} />
                    <span className="truncate">Xem xét</span>
                  </button>
                </div>

                {currentEvidenceStatus !== 'not_reviewed' && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowUnsuitableForm(false);
                      setShowConsiderationForm(false);
                      onUpdateEvidenceStatus(evidence.id, 'not_reviewed', localNote);
                    }}
                    className="w-full h-[34px] px-3 rounded-[10px] bg-white hover:bg-[#F1F5F9] text-[#475569] hover:text-[#0F172A] border border-[#CBD5E1] text-[12px] font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw size={13} />
                    <span>Hoàn tác đánh giá minh chứng</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
