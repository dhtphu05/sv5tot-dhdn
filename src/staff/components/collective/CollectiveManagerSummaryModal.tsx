/**
 * 5TOT ĐHĐN — City Manager Collective Application Summary Modal
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Prompt S4.8.3 Sections 12–16:
 * - Read-only operational summary view for City Manager.
 * - Displays Collective identity, Managing institution, and School Review Unit metadata.
 * - Displays 04 requirement declarations with strictly distinct "Declared vs. Verified" terminology.
 * - Displays evidence metadata and complete assignment & audit history.
 * - Direct trigger to open Assignment / Reassignment Dialog.
 */

import React, { useState } from 'react';
import {
  X,
  Users,
  UserCheck,
  RotateCcw,
  ShieldCheck,
  Eye,
} from 'lucide-react';
import {
  CollectiveApplication,
  COLLECTIVE_TYPE_LABELS,
} from '../../collectiveTypes';
import { Button } from '../../../components/buttons/Button';
import { FileTypeIcon } from '../../../components/evidence/FileTypeIcon';
import { RealisticCertificatePreview } from '../../../components/evidence/detail/documentPreviews/RealisticCertificatePreview';

export interface CollectiveManagerSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: CollectiveApplication;
  onOpenAssignDialog?: () => void;
  isManager?: boolean;
}

export const CollectiveManagerSummaryModal: React.FC<CollectiveManagerSummaryModalProps> = ({
  isOpen,
  onClose,
  application,
  onOpenAssignDialog,
  isManager = true,
}) => {
  const [activeTab, setActiveTab] = useState<'declarations' | 'evidence' | 'history'>('declarations');
  const [previewFile, setPreviewFile] = useState<{
    id: string;
    name: string;
    fileType: string;
    size: string;
    uploadedAt: string;
    reqCode: string;
  } | null>(null);

  if (!isOpen) return null;

  const { tt01, tt02, tt03, tt04, status } = application;

  // Rate calculations
  const participationRate =
    tt02.totalMembers > 0 ? (tt02.participatingCount / tt02.totalMembers) * 100 : 0;
  const isTT02Met =
    tt02.totalMembers > 0 && tt02.participatingCount === tt02.totalMembers;

  const recognitionRate =
    tt02.totalMembers > 0 ? (tt03.recognizedCount / tt02.totalMembers) * 100 : 0;
  const isTT03Met =
    tt02.totalMembers > 0 && tt03.recognizedCount * 100 >= tt02.totalMembers * 20;

  // Consolidated evidence list
  const allEvidence = [
    ...(tt01.evidenceFiles || []).map((f) => ({ ...f, reqCode: 'TT01' as const })),
    ...(tt02.evidenceFiles || []).map((f) => ({ ...f, reqCode: 'TT02' as const })),
    ...(tt03.evidenceFiles || []).map((f) => ({ ...f, reqCode: 'TT03' as const })),
    ...(tt04.evidenceFiles || []).map((f) => ({ ...f, reqCode: 'TT04' as const })),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-4xl bg-white rounded-[16px] shadow-2xl border border-[#DCE7EE] overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-[#F8FBFD] border-b border-[#DCE7EE] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-[10px] bg-[#EAF6FC] text-[#0D78AE] flex items-center justify-center shrink-0">
              <Users size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-[17px] font-black text-[#172A3A] truncate">
                  {application.collectiveName}
                </h2>
                <span className="px-2 py-0.5 rounded-[5px] text-[11px] font-bold bg-[#EAF6FC] text-[#0D78AE]">
                  {COLLECTIVE_TYPE_LABELS[application.collectiveType]}
                </span>
                <span className="px-2 py-0.5 rounded-[5px] text-[11px] font-bold bg-[#F1F5F9] text-[#475569]">
                  Tập thể
                </span>
                {status === 'city_unassigned' ? (
                  <span className="px-2 py-0.5 rounded-[5px] text-[11px] font-bold bg-[#EDF9F1] text-[#16A34A] border border-[#C6EED5]">
                    Chờ phân công
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-[5px] text-[11px] font-bold bg-[#EAF6FC] text-[#0D78AE] border border-[#CFE3F0]">
                    Đã phân công
                  </span>
                )}
              </div>
              <p className="text-[12px] text-[#607483] mt-0.5 truncate">
                Mã hồ sơ: <strong>{application.id}</strong> · Năm học: {application.academicYear} · {application.institutionName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isManager && onOpenAssignDialog && (
              <Button
                variant={status === 'city_unassigned' ? 'primary' : 'secondary'}
                size="sm"
                onClick={onOpenAssignDialog}
                className="gap-1.5 shadow-2xs"
              >
                {status === 'city_unassigned' ? (
                  <>
                    <UserCheck size={14} />
                    <span>Phân công cán bộ</span>
                  </>
                ) : (
                  <>
                    <RotateCcw size={14} />
                    <span>Đổi cán bộ phụ trách</span>
                  </>
                )}
              </Button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-[7px] text-[#728391] hover:text-[#172A3A] hover:bg-[#EEF4F8] transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs inside modal */}
        <div className="px-6 bg-[#F8FBFD] border-b border-[#DCE7EE] flex items-center gap-4 text-[13px] font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('declarations')}
            className={`py-2.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'declarations'
                ? 'border-[#0D78AE] text-[#0D78AE]'
                : 'border-transparent text-[#607483] hover:text-[#172A3A]'
            }`}
          >
            04 Tiêu chuẩn kê khai
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('evidence')}
            className={`py-2.5 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'evidence'
                ? 'border-[#0D78AE] text-[#0D78AE]'
                : 'border-transparent text-[#607483] hover:text-[#172A3A]'
            }`}
          >
            <span>Minh chứng đính kèm</span>
            <span className="px-1.5 py-0.2 rounded-full bg-[#E2EDF5] text-[11px] tabular-nums">
              {allEvidence.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`py-2.5 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-[#0D78AE] text-[#0D78AE]'
                : 'border-transparent text-[#607483] hover:text-[#172A3A]'
            }`}
          >
            <span>Lịch sử phân công & Nhật ký</span>
            <span className="px-1.5 py-0.2 rounded-full bg-[#E2EDF5] text-[11px] tabular-nums">
              {application.auditHistory?.length || 0}
            </span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-5 text-[13px]">
          {/* Metadata Grid */}
          <div className="p-4 bg-[#F8FAFC] border border-[#DCE7EE] rounded-[12px] grid grid-cols-1 md:grid-cols-3 gap-3 text-[12.5px]">
            <div>
              <div className="text-[#607483] text-[11.5px]">Đơn vị đào tạo</div>
              <div className="font-bold text-[#172A3A] mt-0.5">{application.institutionName}</div>
              <div className="text-[#607483] text-[11.5px] mt-0.5">{application.facultyName}</div>
            </div>

            <div>
              <div className="text-[#607483] text-[11.5px]">Người lập hồ sơ</div>
              <div className="font-bold text-[#172A3A] mt-0.5">{application.preparedByUserName}</div>
              <div className="text-[#607483] text-[11.5px] mt-0.5">
                {application.preparedByUserEmail} · {application.contactPhone}
              </div>
            </div>

            <div>
              <div className="text-[#607483] text-[11.5px]">Cán bộ cấp Đại học Đà Nẵng phụ trách</div>
              <div className="font-bold text-[#172A3A] mt-0.5">
                {application.assignedOfficerName || (
                  <span className="text-[#B45309] italic">Chưa phân công</span>
                )}
              </div>
              <div className="text-[#607483] text-[11.5px] mt-0.5">
                Nộp lúc: {application.submittedAt ? new Date(application.submittedAt).toLocaleString('vi-VN') : '—'}
              </div>
            </div>
          </div>

          {/* TAB 1: DECLARATIONS */}
          {activeTab === 'declarations' && (
            <div className="space-y-4">
              <div className="p-3 bg-[#EAF6FC] border border-[#CFE3F0] rounded-[10px] text-[12px] text-[#0B64A0] flex items-center gap-2">
                <ShieldCheck size={16} className="shrink-0 text-[#0D78AE]" />
                <span>
                  <strong>Lưu ý nghiệp vụ Quản lý:</strong> Dữ liệu bên dưới thể hiện số liệu và hồ sơ do tập thể <strong>tự kê khai</strong>. Cán bộ xét duyệt sẽ thẩm định chi tiết và xác minh minh chứng độc lập trong bước tiếp theo.
                </span>
              </div>

              {/* TT01 */}
              <div className="p-4 bg-white border border-[#DCE7EE] rounded-[12px] space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-[#0D78AE] bg-[#EAF6FC] px-2 py-0.5 rounded text-[11.5px]">
                      TT01
                    </span>
                    <span className="font-extrabold text-[14px] text-[#172A3A]">
                      Công nhận danh hiệu cấp Trường
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded text-[11.5px] font-bold bg-[#EAF6FC] text-[#0D78AE]">
                    {tt01.isRecognizedSchoolLevel ? 'Đã kê khai, chờ xác minh' : 'Chưa kê khai'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12px] text-[#475569] pt-2 border-t border-[#F1F5F9]">
                  <div>
                    Đơn vị công nhận: <strong>{tt01.issuingUnitName || 'Chưa nhập'}</strong>
                  </div>
                  <div>
                    Số quyết định: <strong>{tt01.decisionNumber || 'Chưa nhập'}</strong>
                  </div>
                  <div>
                    Ngày ban hành: <strong>{tt01.decisionDate || 'Chưa nhập'}</strong>
                  </div>
                  <div>
                    Năm học công nhận: <strong>{tt01.recognizedAcademicYear}</strong>
                  </div>
                </div>

                {tt01.referenceNotes && (
                  <p className="text-[12px] text-[#607483] italic bg-[#F8FAFC] p-2.5 rounded-[8px]">
                    "{tt01.referenceNotes}"
                  </p>
                )}
              </div>

              {/* TT02 */}
              <div className="p-4 bg-white border border-[#DCE7EE] rounded-[12px] space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-[#0D78AE] bg-[#EAF6FC] px-2 py-0.5 rounded text-[11.5px]">
                      TT02
                    </span>
                    <span className="font-extrabold text-[14px] text-[#172A3A]">
                      100% sinh viên tham gia phong trào Sinh viên 5 tốt
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded text-[11.5px] font-bold ${
                      isTT02Met
                        ? 'bg-[#EDF9F1] text-[#16A34A]'
                        : 'bg-[#FEF2F2] text-[#DC2626]'
                    }`}
                  >
                    {isTT02Met
                      ? 'Số liệu kê khai đạt ngưỡng 100%'
                      : `Chưa đủ 100% (${participationRate.toFixed(1)}%)`}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[12px] text-[#475569] pt-2 border-t border-[#F1F5F9]">
                  <div>
                    Tổng số sinh viên (Mẫu số): <strong>{tt02.totalMembers} SV</strong>
                  </div>
                  <div>
                    Số SV tham gia (Tử số): <strong>{tt02.participatingCount} SV</strong>
                  </div>
                  <div>
                    Tỷ lệ tính toán: <strong>{participationRate.toFixed(1)}%</strong>
                  </div>
                </div>

                {tt02.notes && (
                  <p className="text-[12px] text-[#607483] italic bg-[#F8FAFC] p-2.5 rounded-[8px]">
                    "{tt02.notes}"
                  </p>
                )}
              </div>

              {/* TT03 */}
              <div className="p-4 bg-white border border-[#DCE7EE] rounded-[12px] space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-[#0D78AE] bg-[#EAF6FC] px-2 py-0.5 rounded text-[11.5px]">
                      TT03
                    </span>
                    <span className="font-extrabold text-[14px] text-[#172A3A]">
                      Ít nhất 20% thành viên đạt danh hiệu SV5T cấp Trường
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded text-[11.5px] font-bold ${
                      isTT03Met
                        ? 'bg-[#EDF9F1] text-[#16A34A]'
                        : 'bg-[#FEF2F2] text-[#DC2626]'
                    }`}
                  >
                    {isTT03Met
                      ? `Số liệu kê khai đạt ngưỡng >= 20% (${recognitionRate.toFixed(1)}%)`
                      : `Dưới ngưỡng 20% (${recognitionRate.toFixed(1)}%)`}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[12px] text-[#475569] pt-2 border-t border-[#F1F5F9]">
                  <div>
                    Tổng thành viên: <strong>{tt02.totalMembers} SV</strong>
                  </div>
                  <div>
                    Số đạt SV5T cấp Trường: <strong>{tt03.recognizedCount} SV</strong>
                  </div>
                  <div>
                    Số tối thiểu cần đạt (&ge;20%): <strong>{Math.ceil((tt02.totalMembers * 20) / 100)} SV</strong>
                  </div>
                </div>

                {tt03.notes && (
                  <p className="text-[12px] text-[#607483] italic bg-[#F8FAFC] p-2.5 rounded-[8px]">
                    "{tt03.notes}"
                  </p>
                )}
              </div>

              {/* TT04 */}
              <div className="p-4 bg-white border border-[#DCE7EE] rounded-[12px] space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-[#0D78AE] bg-[#EAF6FC] px-2 py-0.5 rounded text-[11.5px]">
                      TT04
                    </span>
                    <span className="font-extrabold text-[14px] text-[#172A3A]">
                      Không có sinh viên vi phạm pháp luật & nội quy
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded text-[11.5px] font-bold ${
                      tt04.noViolationsConfirmed
                        ? 'bg-[#EDF9F1] text-[#16A34A]'
                        : 'bg-[#FEF2F2] text-[#DC2626]'
                    }`}
                  >
                    {tt04.noViolationsConfirmed
                      ? 'Đã khai báo không vi phạm'
                      : 'Chưa xác nhận'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[12px] text-[#475569] pt-2 border-t border-[#F1F5F9]">
                  <div>
                    Đơn vị xác nhận: <strong>{tt04.confirmingUnitName || 'Khoa/Trường'}</strong>
                  </div>
                  <div>
                    Số văn bản: <strong>{tt04.confirmationDocNumber || 'Chưa nhập'}</strong>
                  </div>
                  <div>
                    Ngày xác nhận: <strong>{tt04.confirmationDate || 'Chưa nhập'}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EVIDENCE */}
          {activeTab === 'evidence' && (
            <div className="space-y-3">
              <div className="text-[12.5px] font-bold text-[#607483]">
                Tổng số {allEvidence.length} tài liệu minh chứng được đính kèm
              </div>

              <div className="divide-y divide-[#EEF4F8] border border-[#DCE7EE] rounded-[12px] overflow-hidden bg-white">
                {allEvidence.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3.5 flex items-center justify-between gap-3 hover:bg-[#F8FBFD] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FileTypeIcon fileName={ev.name} fileType={ev.fileType} size="md" />
                      <div className="min-w-0">
                        <div className="font-bold text-[13px] text-[#172A3A] truncate">
                          {ev.name}
                        </div>
                        <div className="text-[11.5px] text-[#728391] mt-0.5">
                          Tiêu chuẩn: <strong className="text-[#0D78AE]">{ev.reqCode}</strong> · {ev.size} · Tải lên ngày {ev.uploadedAt}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPreviewFile(ev)}
                      className="px-2.5 py-1 text-[11.5px] font-semibold text-[#0D78AE] bg-[#EAF6FC] hover:bg-[#D5EBF8] rounded-[6px] transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <Eye size={13} />
                      <span>Xem tệp</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: ASSIGNMENT HISTORY & AUDIT LOG */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {/* Assignment Summary Banner */}
              <div className="p-4 bg-[#F8FAFC] border border-[#DCE7EE] rounded-[12px] space-y-2">
                <div className="font-bold text-[13px] text-[#172A3A] flex items-center gap-2">
                  <UserCheck size={16} className="text-[#0D78AE]" />
                  <span>Trạng thái phân công hiện tại</span>
                </div>
                <div className="text-[12.5px] text-[#475569]">
                  Cán bộ phụ trách: <strong>{application.assignedOfficerName || 'Chưa phân công'}</strong>
                  {application.assignedByManagerName && (
                    <span> · Người phân công: <strong>{application.assignedByManagerName}</strong></span>
                  )}
                  {application.assignedAt && (
                    <span> · Lúc: {new Date(application.assignedAt).toLocaleString('vi-VN')}</span>
                  )}
                </div>
                {application.assignmentNote && (
                  <div className="text-[12px] text-[#0B64A0] bg-[#EAF6FC] p-2.5 rounded-[6px] italic">
                    Ghi chú phân công: "{application.assignmentNote}"
                  </div>
                )}
              </div>

              {/* Assignment Reassignment History */}
              {application.assignmentHistory && application.assignmentHistory.length > 0 && (
                <div className="space-y-2">
                  <div className="font-bold text-[12.5px] text-[#607483]">
                    Lịch sử các lần phân công ({application.assignmentHistory.length})
                  </div>
                  <div className="border border-[#DCE7EE] rounded-[10px] divide-y divide-[#EEF4F8] bg-white text-[12px]">
                    {application.assignmentHistory.slice().reverse().map((h) => (
                      <div key={h.id} className="p-3 space-y-1">
                        <div className="font-bold text-[#172A3A]">
                          Phân công cho: {h.officerName}
                        </div>
                        <div className="text-[#607483]">
                          Thực hiện bởi: {h.assignedBy} · {new Date(h.assignedAt).toLocaleString('vi-VN')}
                        </div>
                        {h.reassignmentReason && (
                          <div className="text-[#B45309] font-medium">
                            Lý do điều chỉnh: {h.reassignmentReason}
                          </div>
                        )}
                        {h.note && (
                          <div className="text-[#475569] italic">
                            Ghi chú: "{h.note}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Audit Timeline */}
              <div className="space-y-2">
                <div className="font-bold text-[12.5px] text-[#607483]">
                  Nhật ký xử lý hồ sơ (Audit Trail)
                </div>
                <div className="border border-[#DCE7EE] rounded-[10px] divide-y divide-[#EEF4F8] bg-white text-[12px]">
                  {(application.auditHistory || []).slice().reverse().map((aud) => (
                    <div key={aud.id} className="p-3 space-y-1">
                      <div className="font-bold text-[#172A3A] flex items-center justify-between">
                        <span>{aud.action}</span>
                        <span className="text-[11px] text-[#728391] font-normal tabular-nums">
                          {new Date(aud.timestamp).toLocaleString('vi-VN')}
                        </span>
                      </div>
                      <div className="text-[#607483] text-[11.5px]">
                        Thực hiện bởi: {aud.actorName} ({aud.actorRole})
                      </div>
                      {aud.details && (
                        <div className="text-[#475569] text-[11.5px] italic">
                          "{aud.details}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#F8FBFD] border-t border-[#DCE7EE] flex items-center justify-between">
          <span className="text-[12px] text-[#607483]">
            Trạng thái cấp ĐHĐN: <strong>{application.status}</strong>
          </span>
          <div className="flex items-center gap-2">
            <Button variant="quiet" size="sm" onClick={onClose}>
              Đóng
            </Button>
            {isManager && onOpenAssignDialog && (
              <Button variant="primary" size="sm" onClick={onOpenAssignDialog} className="gap-1.5 font-bold">
                <UserCheck size={14} />
                <span>
                  {status === 'city_unassigned' ? 'Phân công cán bộ' : 'Đổi cán bộ phụ trách'}
                </span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Realistic Evidence Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
          <div className="relative w-full max-w-3xl bg-white rounded-[16px] shadow-2xl border border-[#DCE7EE] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-3.5 bg-[#F8FBFD] border-b border-[#DCE7EE] flex items-center justify-between">
              <div className="flex items-center gap-2.5 truncate">
                <FileTypeIcon fileName={previewFile.name} fileType={previewFile.fileType} size="sm" />
                <div className="truncate">
                  <div className="font-bold text-[13.5px] text-[#172A3A] truncate">{previewFile.name}</div>
                  <div className="text-[11px] text-[#607483]">Tiêu chuẩn: {previewFile.reqCode} · {previewFile.size}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                className="p-1.5 rounded-[6px] text-[#728391] hover:text-[#172A3A] hover:bg-[#EEF4F8] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 p-6 overflow-y-auto flex items-center justify-center bg-[#F1F5F9]">
              <RealisticCertificatePreview
                fileName={previewFile.name}
                fileType={previewFile.fileType}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
