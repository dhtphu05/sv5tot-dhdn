import React from 'react';
import {
  FileText,
  Info,
  AlertCircle,
  CheckCircle2,
  X,
  Scale,
} from 'lucide-react';
import {
  CollectiveApplication,
  CollectiveRequirementId,
  CollectiveRequirementMeta,
  CollectiveSupplementRequestRecord,
  CityRequirementJudgment,
  CityRequirementReviewRecord,
} from '../../../collectiveTypes';
import { ApplicationEvidence } from '../../../../demo/fixtures/studentApplication';
import { Button } from '../../../../components/buttons/Button';

export interface CollectiveCommitteeCriterionDetailProps {
  activeTab: CollectiveRequirementId;
  appData: CollectiveApplication;
  reqMeta: CollectiveRequirementMeta;
  cityReview?: CityRequirementReviewRecord;
  relatedSupplements: CollectiveSupplementRequestRecord[];
  activeEvidences: ApplicationEvidence[];
  supplementFileIds: Set<string>;
  totalMembers: number;
  participationRate: number;
  sv5tRate: string;
  isTT02Met: boolean;
  isTT03Met: boolean;
  onViewEvidence: (fileUrl: string, fileName: string) => void;
}

export function getJudgmentBadge(j?: CityRequirementJudgment) {
  if (j === 'suitable') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#16A34A] bg-[#EDF9F1] px-2 py-0.5 rounded border border-[#C6EED5]">
        <CheckCircle2 size={12} /> Cán bộ: Phù hợp
      </span>
    );
  }
  if (j === 'unsuitable') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#DC2626] bg-[#FEF2F2] px-2 py-0.5 rounded border border-[#FECACA]">
        <X size={12} /> Cán bộ: Không phù hợp
      </span>
    );
  }
  if (j === 'needs_supplement') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#D97706] bg-[#FEF6EB] px-2 py-0.5 rounded border border-[#FADDB6]">
        <AlertCircle size={12} /> Cán bộ: Cần bổ sung
      </span>
    );
  }
  if (j === 'needs_consideration') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0D78AE] bg-[#EAF6FC] px-2 py-0.5 rounded border border-[#CFE3F0]">
        <Scale size={12} /> Cán bộ: Cần xem xét thêm
      </span>
    );
  }
  return (
    <span className="text-[11px] font-semibold text-[#8898AA]">
      Chưa thẩm định
    </span>
  );
}

export const CollectiveCommitteeCriterionDetail: React.FC<CollectiveCommitteeCriterionDetailProps> = ({
  activeTab,
  appData,
  reqMeta,
  cityReview,
  relatedSupplements,
  activeEvidences,
  supplementFileIds,
  totalMembers,
  participationRate,
  sv5tRate,
  isTT02Met,
  isTT03Met,
  onViewEvidence,
}) => {
  return (
    <main className="flex-1 overflow-y-auto p-6 space-y-5">
      {/* Header Card for Criterion */}
      <div className="bg-white border border-[#D4E2EC] rounded-[12px] p-5 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11.5px] font-extrabold text-[#0B64A0] uppercase tracking-wider">
              {reqMeta.id} — {reqMeta.ruleBadge}
            </span>
            <h2 className="text-[18px] font-extrabold text-[#0F2335] mt-0.5">
              {reqMeta.title}
            </h2>
          </div>
          <div>{getJudgmentBadge(cityReview?.judgment)}</div>
        </div>
        <p className="text-[12.5px] text-[#475569] leading-relaxed">
          {reqMeta.ruleHelper} ({reqMeta.thresholdHelper})
        </p>
      </div>

      {/* LAYER A — KÊ KHAI CỦA TẬP THỂ (Section 15) */}
      <section className="bg-white border border-[#D4E2EC] rounded-[12px] p-5 space-y-4 shadow-2xs">
        <div className="flex items-center gap-2 border-b border-[#E6EFF5] pb-2.5">
          <div className="w-5 h-5 rounded-[5px] bg-[#EAF6FC] text-[#0B64A0] flex items-center justify-center font-bold text-[11px]">
            A
          </div>
          <h3 className="text-[14px] font-extrabold text-[#0F2335]">
            LỚP 1 — KÊ KHAI CỦA TẬP THỂ
          </h3>
          <span className="text-[11px] text-[#607483]">
            (Dữ liệu và tài liệu do đơn vị tập thể trực tiếp nộp)
          </span>
        </div>

        {/* TT01 Data */}
        {activeTab === 'TT01' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12.5px]">
            <div className="p-3 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px]">
              <span className="text-[#607483] block text-[11.5px]">Công nhận cấp Trường:</span>
              <span className="font-bold text-[#16A34A] text-[14px] mt-0.5 block">
                {appData.tt01.isRecognizedSchoolLevel ? 'Đã đạt danh hiệu cấp Trường' : 'Chưa được công nhận'}
              </span>
            </div>
            <div className="p-3 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px]">
              <span className="text-[#607483] block text-[11.5px]">Số quyết định công nhận:</span>
              <span className="font-bold text-[#0F2335] text-[14px] mt-0.5 block">
                {appData.tt01.decisionNumber || 'Chưa cập nhật'}
              </span>
            </div>
            <div className="p-3 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px]">
              <span className="text-[#607483] block text-[11.5px]">Đơn vị ban hành:</span>
              <span className="font-bold text-[#0F2335] mt-0.5 block">
                {appData.tt01.issuingUnitName || appData.institutionName}
              </span>
            </div>
            <div className="p-3 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px]">
              <span className="text-[#607483] block text-[11.5px]">Ngày ban hành quyết định:</span>
              <span className="font-bold text-[#0F2335] mt-0.5 block">
                {appData.tt01.decisionDate || 'Chưa cập nhật'}
              </span>
            </div>
          </div>
        )}

        {/* TT02 Data */}
        {activeTab === 'TT02' && (
          <div className="space-y-3 text-[12.5px]">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px]">
                <span className="text-[#607483] block text-[11.5px]">Tổng số thành viên (Mẫu số chung):</span>
                <span className="font-extrabold text-[#0F2335] text-[17px] mt-0.5 block tabular-nums">
                  {appData.tt02.totalMembers} sinh viên
                </span>
              </div>
              <div className="p-3 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px]">
                <span className="text-[#607483] block text-[11.5px]">Tham gia phong trào:</span>
                <span className="font-extrabold text-[#0B64A0] text-[17px] mt-0.5 block tabular-nums">
                  {appData.tt02.participatingCount} sinh viên
                </span>
              </div>
              <div className="p-3 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px]">
                <span className="text-[#607483] block text-[11.5px]">Tỷ lệ tham gia (Yêu cầu 100%):</span>
                <span className={`font-extrabold text-[17px] mt-0.5 block tabular-nums ${isTT02Met ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                  {participationRate}% ({isTT02Met ? 'Đạt chuẩn' : 'Chưa đạt 100%'})
                </span>
              </div>
            </div>

            {/* Structured Members Preview */}
            {appData.tt02.structuredMembers && appData.tt02.structuredMembers.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <div className="text-[12px] font-bold text-[#172A3A]">
                  Danh sách {appData.tt02.structuredMembers.length} thành viên đã nộp:
                </div>
                <div className="border border-[#DCE7EE] rounded-[8px] overflow-hidden max-h-[190px] overflow-y-auto">
                  <table className="w-full text-left text-[11.5px]">
                    <thead className="bg-[#F8FBFD] border-b border-[#DCE7EE] text-[#526B7C] font-semibold sticky top-0">
                      <tr>
                        <th className="p-2">MSSV</th>
                        <th className="p-2">Họ và tên</th>
                        <th className="p-2">Tham gia phong trào</th>
                        <th className="p-2">Đạt SV5T cấp Trường</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EEF4F8]">
                      {appData.tt02.structuredMembers.map((m, idx) => (
                        <tr key={idx} className="hover:bg-[#F9FCFE]">
                          <td className="p-2 font-mono text-[#0B64A0]">{m.studentCode}</td>
                          <td className="p-2 font-semibold text-[#172A3A]">{m.fullName}</td>
                          <td className="p-2">
                            {m.isParticipatingMovement ? (
                              <span className="text-[#16A34A] font-semibold">Có tham gia</span>
                            ) : (
                              <span className="text-[#DC2626] font-semibold">Không</span>
                            )}
                          </td>
                          <td className="p-2">
                            {m.isSchoolSv5tRecognized ? (
                              <span className="text-[#16A34A] font-semibold">Đạt</span>
                            ) : (
                              <span className="text-[#64748B]">Chưa</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TT03 Data */}
        {activeTab === 'TT03' && (
          <div className="space-y-3 text-[12.5px]">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px]">
                <span className="text-[#607483] block text-[11.5px]">Tổng số thành viên (Mẫu số TT02):</span>
                <span className="font-extrabold text-[#0F2335] text-[17px] mt-0.5 block tabular-nums">
                  {totalMembers} sinh viên
                </span>
              </div>
              <div className="p-3 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px]">
                <span className="text-[#607483] block text-[11.5px]">Số sinh viên đạt SV5T cấp Trường:</span>
                <span className="font-extrabold text-[#136F3A] text-[17px] mt-0.5 block tabular-nums">
                  {appData.tt03.recognizedCount} sinh viên
                </span>
              </div>
              <div className="p-3 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px]">
                <span className="text-[#607483] block text-[11.5px]">Tỷ lệ SV5T (Yêu cầu ≥ 20%):</span>
                <span className={`font-extrabold text-[17px] mt-0.5 block tabular-nums ${isTT03Met ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                  {sv5tRate}% ({isTT03Met ? 'Đạt chuẩn ≥ 20%' : 'Chưa đạt ngưỡng 20%'})
                </span>
              </div>
            </div>

            {!isTT03Met && (
              <div className="p-3 rounded-[8px] bg-[#FEF2F2] border border-[#FECACA] text-[12px] text-[#991B1B] flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0 text-[#DC2626]" />
                <span>
                  <strong>Trường hợp chưa đạt điều kiện TT03:</strong> Tỷ lệ {sv5tRate}% dưới ngưỡng quy chế tối thiểu 20%. Hội đồng xem xét ghi nhận kết luận không công nhận theo quy định.
                </span>
              </div>
            )}
          </div>
        )}

        {/* TT04 Data */}
        {activeTab === 'TT04' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12.5px]">
            <div className="p-3 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px]">
              <span className="text-[#607483] block text-[11.5px]">Cam kết không vi phạm:</span>
              <span className="font-bold text-[#16A34A] text-[14px] mt-0.5 block">
                {appData.tt04.noViolationsConfirmed ? '100% sinh viên chấp hành tốt quy định' : 'Chưa xác nhận'}
              </span>
            </div>
            <div className="p-3 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px]">
              <span className="text-[#607483] block text-[11.5px]">Đơn vị xác nhận nội quy:</span>
              <span className="font-bold text-[#0F2335] mt-0.5 block">
                {appData.tt04.confirmingUnitName || 'Ban Chủ nhiệm Khoa / Đoàn Thanh niên'}
              </span>
            </div>
            <div className="p-3 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px]">
              <span className="text-[#607483] block text-[11.5px]">Văn bản xác nhận:</span>
              <span className="font-bold text-[#0F2335] mt-0.5 block">
                {appData.tt04.confirmationDocNumber || 'Đã đính kèm văn bản'}
              </span>
            </div>
            <div className="p-3 bg-[#F8FBFD] border border-[#DCE7EE] rounded-[8px]">
              <span className="text-[#607483] block text-[11.5px]">Phạm vi năm học:</span>
              <span className="font-bold text-[#0F2335] mt-0.5 block">
                {appData.tt04.scopeYear || appData.academicYear}
              </span>
            </div>
          </div>
        )}

        {/* Evidence Attachments for this Criterion */}
        <div className="pt-2 border-t border-[#EEF4F8] space-y-2">
          <div className="text-[12px] font-bold text-[#172A3A] flex items-center justify-between">
            <span>Tài liệu &amp; Minh chứng đính kèm ({activeEvidences.length}):</span>
            <span className="text-[11px] text-[#607483]">Hội đồng có quyền mở xem bản gốc</span>
          </div>

          {activeEvidences.length === 0 ? (
            <div className="p-3 bg-[#F8FBFD] border border-[#E2EDF5] rounded-[8px] text-[12px] text-[#728391] text-center">
              Chưa có minh chứng đính kèm.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {activeEvidences.map((ev) => {
                const isSupplement = supplementFileIds.has(ev.id);
                return (
                  <div
                    key={ev.id}
                    className="p-3 rounded-[8px] border border-[#DCE7EE] bg-[#F8FBFD] flex items-center justify-between gap-2.5"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText size={16} className="text-[#0B64A0] shrink-0" />
                      <div className="min-w-0">
                        <div className="font-bold text-[12px] text-[#172A3A] truncate">
                          {ev.name || (ev as any).fileName}
                        </div>
                        <div className="text-[10.5px] text-[#607483] flex items-center gap-1.5">
                          <span>{ev.fileType || 'pdf'} · {ev.size || '1.2 MB'}</span>
                          {isSupplement ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#FEF6EB] text-[#B45309] border border-[#FADDB6]">
                              Bổ sung
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold px-1 py-0.2 rounded bg-[#EAF6FC] text-[#0B64A0]">
                              Gốc
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        onViewEvidence(
                          (ev as any).fileUrl || ev.url || '',
                          ev.name || (ev as any).fileName
                        );
                      }}
                      className="text-[11px] shrink-0"
                    >
                      Xem minh chứng
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* LAYER B — KẾT QUẢ XÉT CỦA CÁN BỘ THÀNH PHỐ (Section 15) */}
      <section className="bg-white border border-[#D4E2EC] rounded-[12px] p-5 space-y-3.5 shadow-2xs">
        <div className="flex items-center gap-2 border-b border-[#E6EFF5] pb-2.5">
          <div className="w-5 h-5 rounded-[5px] bg-[#EAF6FC] text-[#0B64A0] flex items-center justify-center font-bold text-[11px]">
            B
          </div>
          <h3 className="text-[14px] font-extrabold text-[#0F2335]">
            LỚP 2 — KẾT QUẢ XÉT CỦA CÁN BỘ THÀNH PHỐ
          </h3>
          <span className="text-[11px] text-[#607483]">
            (Thẩm định độc lập từ Cán bộ xét duyệt Ban Thanh thiếu nhi - Trường học)
          </span>
        </div>

        <div className="p-4 rounded-[10px] bg-[#F8FAFC] border border-[#CBD5E1] space-y-2 text-[12.5px]">
          <div className="flex items-center justify-between">
            <div className="font-bold text-[#1E293B] flex items-center gap-1.5">
              <Info size={15} className="text-[#0D78AE]" />
              <span>Đánh giá của Cán bộ cấp Đại học Đà Nẵng:</span>
            </div>
            <div>{getJudgmentBadge(cityReview?.judgment)}</div>
          </div>

          <div className="text-[#334155] italic pl-5">
            &ldquo;{cityReview?.officerNotes || 'Hồ sơ đã được thẩm định đúng quy định, minh chứng hợp lệ.'}&rdquo;
          </div>

          <div className="text-[11px] text-[#64748B] pt-1 pl-5 border-t border-[#E2E8F0]">
            Thực hiện bởi Cán bộ: <strong>{cityReview?.reviewedBy || appData.assignedOfficerName || 'Cán bộ xét duyệt cấp ĐHĐN'}</strong>
            {cityReview?.reviewedAt && ` · ${new Date(cityReview.reviewedAt).toLocaleDateString('vi-VN')}`}
          </div>
        </div>

        {/* Relevant Supplement Cycle History if any (Section 21) */}
        {relatedSupplements.length > 0 && (
          <div className="p-3.5 rounded-[10px] bg-[#FEF6EB] border border-[#FADDB6] space-y-2 text-[12px]">
            <div className="font-bold text-[#92400E] flex items-center gap-1.5">
              <AlertCircle size={14} />
              <span>Lịch sử yêu cầu bổ sung tại điều kiện này:</span>
            </div>
            {relatedSupplements.map((supp) => (
              <div key={supp.id} className="pt-1.5 border-t border-[#FADDB6]/60 first:border-t-0 first:pt-0">
                <div className="text-[#78350F]">
                  • <strong>Lý do yêu cầu:</strong> {supp.reason} ({new Date(supp.requestedAt).toLocaleDateString('vi-VN')})
                </div>
                {supp.returnedAt && (
                  <div className="text-[#15803D] mt-0.5 pl-3">
                    ✓ <strong>Tập thể phản hồi:</strong> {supp.returnedNotes || 'Đã gửi bổ sung tài liệu'} ({new Date(supp.returnedAt).toLocaleDateString('vi-VN')})
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* LAYER C — KẾT LUẬN CỦA HỘI ĐỒNG (Section 15) */}
      <section className="bg-white border border-[#D4E2EC] rounded-[12px] p-5 space-y-3.5 shadow-2xs">
        <div className="flex items-center gap-2 border-b border-[#E6EFF5] pb-2.5">
          <div className="w-5 h-5 rounded-[5px] bg-[#EAF6FC] text-[#0B64A0] flex items-center justify-center font-bold text-[11px]">
            C
          </div>
          <h3 className="text-[14px] font-extrabold text-[#0F2335]">
            LỚP 3 — KẾT LUẬN CỦA HỘI ĐỒNG XÉT CHỌN
          </h3>
          <span className="text-[11px] text-[#607483]">
            (Kết luận chính thức của Hội đồng cấp Đại học Đà Nẵng dựa trên 2 lớp trước)
          </span>
        </div>

        <div className="text-[12.5px] text-[#334E68] p-3 rounded-[8px] bg-[#F6FAFD] border border-[#DCE7EE]">
          Hội đồng tiến hành thảo luận, rà soát đối chiếu Kê khai tập thể (Lớp A) và Thẩm định Cán bộ (Lớp B) để ghi nhận kết luận chung tại cột bên phải.
        </div>
      </section>
    </main>
  );
};
