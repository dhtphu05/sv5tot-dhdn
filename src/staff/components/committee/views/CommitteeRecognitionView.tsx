import React, { useState } from 'react';
import {
  AlertCircle,
  ExternalLink,
  Eye,
  FileText,
  Send,
  ShieldCheck,
  Trash2,
  Upload,
} from 'lucide-react';
import { StaffRouteId } from '../../../types';
import { CURRENT_STAFF_SEASON } from '../../../fixtures/staffDataset';
import {
  PublicationReadinessResult,
  canFinalizeResults,
} from '../../../committeeSelectors';
import { Button } from '../../../../components/buttons/Button';

export interface CityRecognitionDecisionMetadata {
  decisionNumber: string;
  signedDate: string;
  signerName: string;
  fileName: string;
  fileSizeLabel: string;
  fileUrl: string;
  uploadedAt: string;
}

export interface CommitteeRecognitionViewProps {
  publicationReadiness: PublicationReadinessResult;
  finalizationCheck: ReturnType<typeof canFinalizeResults>;
  onSelectRoute: (routeId: StaffRouteId) => void;
  onOpenApplicationWorkspace: (applicationId: string) => void;
  onFinalizeResultSet: () => void;
  onOpenPublicationDialog: () => void;
  renderCommitteeScenarioStrip: () => React.ReactNode;
  activeSeasonLabel?: string;
  decisionDoc?: CityRecognitionDecisionMetadata | null;
  onUpdateDecisionDoc?: (doc: CityRecognitionDecisionMetadata | null) => void;
}

export const CommitteeRecognitionView: React.FC<CommitteeRecognitionViewProps> = ({
  publicationReadiness,
  finalizationCheck,
  onSelectRoute,
  onOpenApplicationWorkspace,
  onFinalizeResultSet,
  onOpenPublicationDialog,
  renderCommitteeScenarioStrip,
  activeSeasonLabel,
  decisionDoc: externalDecisionDoc,
  onUpdateDecisionDoc,
}) => {
  const [internalDecisionDoc, setInternalDecisionDoc] =
    useState<CityRecognitionDecisionMetadata | null>(null);
  const [decisionNumberInput, setDecisionNumberInput] = useState<string>('');
  const [signedDateInput, setSignedDateInput] = useState<string>('');
  const [signerNameInput, setSignerNameInput] = useState<string>('');
  const [showPdfPreview, setShowPdfPreview] = useState<boolean>(false);

  const decisionDoc =
    externalDecisionDoc !== undefined ? externalDecisionDoc : internalDecisionDoc;
  const setDecisionDoc = (next: CityRecognitionDecisionMetadata | null) => {
    if (onUpdateDecisionDoc) {
      onUpdateDecisionDoc(next);
    } else {
      setInternalDecisionDoc(next);
    }
  };

  const seasonLabel = activeSeasonLabel || CURRENT_STAFF_SEASON.schoolYear;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    const sizeKb = Math.max(1, Math.round(file.size / 1024));
    const sizeLabel =
      sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(2)} MB` : `${sizeKb} KB`;
    const nowStr = new Date().toLocaleDateString('vi-VN');

    const nextDoc: CityRecognitionDecisionMetadata = {
      decisionNumber: decisionNumberInput.trim(),
      signedDate: signedDateInput.trim() || nowStr,
      signerName: signerNameInput.trim(),
      fileName: file.name,
      fileSizeLabel: sizeLabel,
      fileUrl: objectUrl,
      uploadedAt: new Date().toLocaleString('vi-VN'),
    };
    setDecisionDoc(nextDoc);
    setShowPdfPreview(true);
    e.target.value = '';
  };

  return (
    <div className="p-6 max-w-[1120px] w-full mx-auto space-y-5">
      {renderCommitteeScenarioStrip()}

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#DCE7EE] pb-4">
        <div>
          <div className="text-[12px] font-bold text-[#0B64A0]">
            {seasonLabel} · {CURRENT_STAFF_SEASON.scopeLabel}
          </div>
          <h1 className="text-[21px] font-extrabold text-[#0F2335] mt-0.5">
            Quyết định công nhận &amp; Công bố kết quả
          </h1>
          <p className="text-[13px] text-[#4A6275] mt-0.5">
            Tải lên văn bản Quyết định công nhận chính thức (.PDF) và điều khiển công bố kết quả theo thẩm quyền.
          </p>
        </div>
      </div>

      {/* Authoritative Season & Result Set Context (Section 58) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <section className="bg-white rounded-[12px] border border-[#D4E2EC] p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-[#E6EFF5] pb-3">
              <h2 className="text-[15.5px] font-extrabold text-[#0F2335]">
                Thông tin đợt xét chọn &amp; Danh sách kết luận
              </h2>
              <span
                className={`px-2.5 py-0.5 rounded-[6px] text-[11.5px] font-bold border ${
                  publicationReadiness.isAlreadyPublished
                    ? 'bg-[#EAFBF1] text-[#136F3A] border-[#B6E6C9]'
                    : publicationReadiness.canPublish
                    ? 'bg-[#EAF6FC] text-[#0B64A0] border-[#CBE5F6]'
                    : 'bg-[#FEF6EB] text-[#B45309] border-[#FADDB6]'
                }`}
              >
                {publicationReadiness.isAlreadyPublished
                  ? 'Đã công bố'
                  : publicationReadiness.canPublish
                  ? 'Sẵn sàng công bố'
                  : 'Chưa công bố'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-[13px]">
              <div className="p-3.5 rounded-[9px] bg-[#F8FBFD] border border-[#E2EDF5]">
                <div className="text-[11.5px] text-[#526B7C]">
                  Đơn vị tổ chức / vận hành
                </div>
                <div className="font-bold text-[#0F2335] mt-0.5">
                  Hội Sinh viên Việt Nam Đại học Đà Nẵng
                </div>
              </div>

              <div className="p-3.5 rounded-[9px] bg-[#F8FBFD] border border-[#E2EDF5]">
                <div className="text-[11.5px] text-[#526B7C]">
                  Đợt xét chọn &amp; Cấp danh hiệu
                </div>
                <div className="font-bold text-[#0F2335] mt-0.5">
                  {seasonLabel} · Cấp Đại học Đà Nẵng
                </div>
              </div>

              <div className="p-3.5 rounded-[9px] bg-[#F8FBFD] border border-[#E2EDF5]">
                <div className="text-[11.5px] text-[#526B7C]">
                  Được công nhận Sinh viên 5 tốt cấp Đại học Đà Nẵng
                </div>
                <div className="text-[16px] font-extrabold text-[#136F3A] tabular-nums mt-0.5">
                  {publicationReadiness.recognizedCount} sinh viên
                </div>
              </div>

              <div className="p-3.5 rounded-[9px] bg-[#F8FBFD] border border-[#E2EDF5]">
                <div className="text-[11.5px] text-[#526B7C]">
                  Chưa được công nhận trong đợt xét này
                </div>
                <div className="text-[16px] font-extrabold text-[#334E68] tabular-nums mt-0.5">
                  {publicationReadiness.notRecognizedCount} sinh viên
                </div>
              </div>
            </div>

            {/* Real Official Decision Document Upload & PDF Viewer */}
            <div className="p-4 rounded-[10px] bg-[#F6FAFD] border border-[#DCE7EE] space-y-3.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-[#0B64A0] shrink-0" />
                  <div>
                    <div className="font-bold text-[13.5px] text-[#0F2335]">
                      Văn bản Quyết định công nhận chính thức (.PDF)
                    </div>
                    <p className="text-[11.5px] text-[#607483]">
                      Tải lên tệp PDF Quyết định công nhận đã ký đóng dấu của Ban Thư ký Hội Sinh viên Đại học Đà Nẵng.
                    </p>
                  </div>
                </div>

                {!publicationReadiness.isAlreadyPublished && (
                  <label className="inline-flex items-center gap-1.5 h-[34px] px-3.5 rounded-[8px] bg-[#0B64A0] hover:bg-[#095386] text-white text-[12px] font-bold cursor-pointer transition-colors shadow-2xs">
                    <Upload size={14} />
                    <span>
                      {decisionDoc ? 'Thay tệp Quyết định (.PDF)' : 'Tải lên Quyết định (.PDF)'}
                    </span>
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Optional Metadata Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[12px]">
                <div>
                  <label className="block text-[11px] font-semibold text-[#526B7C] mb-1">
                    Số Quyết định (tùy chọn)
                  </label>
                  <input
                    type="text"
                    disabled={publicationReadiness.isAlreadyPublished}
                    value={decisionDoc ? decisionDoc.decisionNumber : decisionNumberInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDecisionNumberInput(val);
                      if (decisionDoc) {
                        setDecisionDoc({ ...decisionDoc, decisionNumber: val });
                      }
                    }}
                    placeholder="Nhập số hiệu quyết định..."
                    className="w-full h-[34px] px-2.5 rounded-[7px] bg-white border border-[#DCE7EE] text-[12.5px] text-[#0F2335] outline-none focus:border-[#0D78AE]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#526B7C] mb-1">
                    Ngày ban hành (tùy chọn)
                  </label>
                  <input
                    type="text"
                    disabled={publicationReadiness.isAlreadyPublished}
                    value={decisionDoc ? decisionDoc.signedDate : signedDateInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSignedDateInput(val);
                      if (decisionDoc) {
                        setDecisionDoc({ ...decisionDoc, signedDate: val });
                      }
                    }}
                    placeholder="DD/MM/YYYY"
                    className="w-full h-[34px] px-2.5 rounded-[7px] bg-white border border-[#DCE7EE] text-[12.5px] text-[#0F2335] outline-none focus:border-[#0D78AE]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#526B7C] mb-1">
                    Người ký ban hành (tùy chọn)
                  </label>
                  <input
                    type="text"
                    disabled={publicationReadiness.isAlreadyPublished}
                    value={decisionDoc ? decisionDoc.signerName : signerNameInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSignerNameInput(val);
                      if (decisionDoc) {
                        setDecisionDoc({ ...decisionDoc, signerName: val });
                      }
                    }}
                    placeholder="Nhập họ tên & chức vụ..."
                    className="w-full h-[34px] px-2.5 rounded-[7px] bg-white border border-[#DCE7EE] text-[12.5px] text-[#0F2335] outline-none focus:border-[#0D78AE]"
                  />
                </div>
              </div>

              {decisionDoc ? (
                <div className="space-y-3 pt-1">
                  <div className="p-3 rounded-[8px] bg-white border border-[#CBE5F6] flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText size={18} className="text-[#0D78AE] shrink-0" />
                      <div className="min-w-0">
                        <div className="font-bold text-[13px] text-[#0F2335] truncate">
                          {decisionDoc.fileName}
                        </div>
                        <div className="text-[11px] text-[#607483] flex items-center gap-2 flex-wrap">
                          <span>{decisionDoc.fileSizeLabel}</span>
                          <span>·</span>
                          <span>Tải lên: {decisionDoc.uploadedAt}</span>
                          {decisionDoc.decisionNumber && (
                            <>
                              <span>·</span>
                              <span className="font-semibold text-[#0B64A0]">
                                Số QĐ: {decisionDoc.decisionNumber}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setShowPdfPreview((p) => !p)}
                        className="inline-flex items-center gap-1 h-[30px] px-2.5 rounded-[6px] bg-[#EAF6FC] hover:bg-[#D8EEFA] text-[#0B64A0] text-[11.5px] font-bold cursor-pointer transition-colors"
                      >
                        <Eye size={13} />
                        <span>{showPdfPreview ? 'Ẩn xem trước' : 'Xem tệp PDF'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => window.open(decisionDoc.fileUrl, '_blank')}
                        className="inline-flex items-center gap-1 h-[30px] px-2.5 rounded-[6px] bg-white hover:bg-[#F1F5F9] border border-[#DCE7EE] text-[#334E68] text-[11.5px] font-semibold cursor-pointer transition-colors"
                      >
                        <ExternalLink size={12} />
                        <span>Mở tab mới</span>
                      </button>
                      {!publicationReadiness.isAlreadyPublished && (
                        <button
                          type="button"
                          onClick={() => {
                            setDecisionDoc(null);
                            setShowPdfPreview(false);
                          }}
                          className="inline-flex items-center gap-1 h-[30px] px-2 rounded-[6px] bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#DC2626] text-[11.5px] font-semibold cursor-pointer transition-colors"
                          title="Gỡ tệp PDF"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  {showPdfPreview && decisionDoc.fileUrl && (
                    <div className="rounded-[8px] overflow-hidden border border-[#DCE7EE] bg-[#525659] h-[500px]">
                      <iframe
                        src={decisionDoc.fileUrl}
                        title={decisionDoc.fileName}
                        className="w-full h-full border-0"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 rounded-[8px] bg-white border border-dashed border-[#CBD5E1] text-[12px] text-[#64748B] flex items-center justify-between gap-2">
                  <span>
                    Chưa có tệp Quyết định công nhận (.PDF) nào được tải lên cho đợt xét này.
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* Incomplete Result Set Blocking List if applicable (Section 66) */}
          {publicationReadiness.undecidedCount > 0 && (
            <section className="bg-white rounded-[12px] border border-[#FADDB6] overflow-hidden shadow-2xs">
              <div className="px-5 py-3.5 bg-[#FEF6EB] border-b border-[#FADDB6] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[#92400E] font-extrabold text-[14px]">
                  <AlertCircle size={16} className="text-[#D97706]" />
                  <span>
                    Còn {publicationReadiness.undecidedCount} hồ sơ chưa có kết luận xét chọn.
                  </span>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onSelectRoute('committee')}
                >
                  Mở danh sách Hội đồng
                </Button>
              </div>
              <div className="divide-y divide-[#EEF4F8]">
                {publicationReadiness.undecidedApplications.map((app) => (
                  <div
                    key={app.applicationId}
                    className="px-5 py-3 flex items-center justify-between gap-3 text-[13px]"
                  >
                    <div>
                      <strong className="font-bold text-[#0F2335]">
                        {app.student.fullName}
                      </strong>{' '}
                      <span className="text-[#526B7C] font-mono">
                        ({app.student.studentCode})
                      </span>
                      <div className="text-[12px] text-[#607483]">
                        {app.institution.officialName}
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        onOpenApplicationWorkspace(app.applicationId)
                      }
                    >
                      Xem hồ sơ
                    </Button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right Column: Finalization & Authorized Publication Workflow */}
        <div className="space-y-4">
          <section className="bg-white rounded-[12px] border border-[#D4E2EC] p-5 space-y-4 shadow-2xs">
            <div className="flex items-center gap-2">
              <Send size={16} className="text-[#0B64A0]" />
              <h2 className="text-[15px] font-extrabold text-[#0F2335]">
                Quy trình Hoàn tất &amp; Công bố
              </h2>
            </div>
            <div className="space-y-2.5 text-[12.5px]">
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-[8px] bg-[#F8FBFD] border border-[#E2EDF5]">
                <span className="text-[#4A6275]">1. Kết luận xét chọn:</span>
                <span
                  className={`font-bold ${
                    publicationReadiness.isAllDecided
                      ? 'text-[#136F3A]'
                      : 'text-[#B45309]'
                  }`}
                >
                  {publicationReadiness.decidedCount}/
                  {publicationReadiness.totalRecords} hồ sơ
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-[8px] bg-[#F8FBFD] border border-[#E2EDF5]">
                <span className="text-[#4A6275]">2. Hoàn tất quyết định:</span>
                <span
                  className={`font-bold ${
                    publicationReadiness.isResultSetFinalized
                      ? 'text-[#136F3A]'
                      : 'text-[#B45309]'
                  }`}
                >
                  {publicationReadiness.isResultSetFinalized
                    ? 'Đã hoàn tất'
                    : 'Chưa hoàn tất'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-[8px] bg-[#F8FBFD] border border-[#E2EDF5]">
                <span className="text-[#4A6275]">3. Công bố kết quả:</span>
                <span
                  className={`font-bold ${
                    publicationReadiness.isAlreadyPublished
                      ? 'text-[#136F3A]'
                      : 'text-[#334E68]'
                  }`}
                >
                  {publicationReadiness.isAlreadyPublished
                    ? 'Đã công bố'
                    : 'Chưa công bố'}
                </span>
              </div>
            </div>

            {publicationReadiness.blockingMessage &&
              !publicationReadiness.isAlreadyPublished && (
                <div className="p-3 rounded-[9px] bg-[#FEF6EB] border border-[#FADDB6] text-[12px] text-[#92400E] space-y-1">
                  <div className="font-bold">Điều kiện trước khi công bố:</div>
                  <p>{publicationReadiness.blockingMessage}</p>
                </div>
              )}

            {!publicationReadiness.isAlreadyPublished && (
              <div className="space-y-2.5 pt-1">
                {!publicationReadiness.isResultSetFinalized && (
                  <Button
                    variant="secondary"
                    size="md"
                    disabled={!finalizationCheck.allowed}
                    onClick={onFinalizeResultSet}
                    className="w-full justify-center"
                  >
                    Hoàn tất quyết định danh sách
                  </Button>
                )}
                <Button
                  variant="primary"
                  size="md"
                  disabled={!publicationReadiness.canPublish}
                  onClick={onOpenPublicationDialog}
                  className="w-full justify-center"
                >
                  Công bố kết quả
                </Button>
              </div>
            )}

            {publicationReadiness.isAlreadyPublished && (
              <div className="p-3 rounded-[9px] bg-[#EAFBF1] border border-[#B6E6C9] text-[12.5px] text-[#136F3A] flex items-start gap-2">
                <ShieldCheck size={16} className="shrink-0 mt-0.5" />
                <div>
                  <strong>Đã công bố kết quả chính thức.</strong> Các sinh viên và tập thể trong đợt xét đã có thể tra cứu kết quả chính thức trên hệ thống.
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
