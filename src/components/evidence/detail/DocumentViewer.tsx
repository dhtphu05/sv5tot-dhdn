import React, { useState, useEffect, useRef } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  ExternalLink,
  FileQuestion,
  RotateCcw,
  UploadCloud,
} from 'lucide-react';
import {
  getEvidenceBlobUrlByIdOrName,
  isLiveSessionBlobUrl,
  saveEvidenceFile,
} from '../../../staff/demoEvidenceStorage';

export interface DocumentViewerProps {
  fileId?: string;
  fileName: string;
  fileType?: string;
  fileUrl?: string;
  totalPage?: number;
  highlightRegion?: string | null;
  onSelectRegion?: (regionId: string) => void;
  isLoading?: boolean;
  isFailed?: boolean;
  onRetryPreview?: () => void;
}

function resolvePreviewUrl(
  _fileName: string,
  _fileType: string,
  explicitUrl?: string,
  _fileId?: string
): string {
  if (!explicitUrl) {
    return '';
  }
  return explicitUrl;
}

/**
 * DocumentViewer (Left Pane)
 * Uses the native browser PDF viewer (`<iframe src="...pdf">`) for PDF documents
 * and high-clarity zoomable canvas for images (.jpg, .png, .webp, .heic).
 */
export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  fileId,
  fileName,
  fileType = 'pdf',
  fileUrl,
  isLoading = false,
  isFailed = false,
  onRetryPreview,
}) => {
  const [zoomLevel, setZoomLevel] = useState(100);
  const [resolvedBlobUrl, setResolvedBlobUrl] = useState<string | null>(null);
  const [blobLoadFailed, setBlobLoadFailed] = useState(false);
  const relinkInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    setBlobLoadFailed(false);
    setResolvedBlobUrl(null);

    getEvidenceBlobUrlByIdOrName(fileId, fileName)
      .then((storedUrl) => {
        if (!cancelled && storedUrl) {
          setResolvedBlobUrl(storedUrl);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [fileId, fileName, fileUrl]);

  const handleRelinkLocalFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase() || fileType || 'pdf';
    const targetId = fileId || `ev-new-${Date.now()}`;
    await saveEvidenceFile(targetId, file, fileName || file.name, ext).catch(() => {});
    const freshUrl = await getEvidenceBlobUrlByIdOrName(targetId, fileName || file.name);
    if (freshUrl) {
      setResolvedBlobUrl(freshUrl);
      setBlobLoadFailed(false);
    } else if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      setResolvedBlobUrl(URL.createObjectURL(file));
      setBlobLoadFailed(false);
    }
  };

  const handleZoomIn = () => setZoomLevel((z) => Math.min(160, z + 15));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(65, z - 15));
  const handleResetZoom = () => setZoomLevel(100);

  const isPdf = fileName.toLowerCase().endsWith('.pdf') || fileType === 'pdf';
  const usableExplicitUrl =
    fileUrl && (!fileUrl.startsWith('blob:') || isLiveSessionBlobUrl(fileUrl))
      ? fileUrl
      : undefined;
  const candidateUrl =
    resolvedBlobUrl || (!blobLoadFailed ? usableExplicitUrl : undefined);
  const effectiveUrl = resolvePreviewUrl(fileName, fileType, candidateUrl, fileId);
  const isMissingLocalBinary = !effectiveUrl && !isLoading && !isFailed;

  return (
    <div className="relative flex-1 h-full bg-[#EEF3F7] overflow-auto flex flex-col min-w-0 select-none">
      {/* Floating Viewer Toolbar for Image files (PDFs use the browser'in built-in native PDF toolbar) */}
      {!isPdf && !isLoading && !isFailed && !isMissingLocalBinary && (
        <div className="sticky top-4 z-20 mx-auto pointer-events-none mt-3">
          <div className="pointer-events-auto inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/95 backdrop-blur-md rounded-full shadow-[0_4px_20px_rgba(23,42,58,0.12)] border border-[#DCE7EE] text-[12px] text-[#172A3A]">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 65}
              className="p-1 rounded-full text-[#607483] hover:text-[#172A3A] hover:bg-[#F1F6F9] disabled:opacity-30 transition-colors cursor-pointer"
              title="Thu nhỏ"
            >
              <ZoomOut size={14} strokeWidth={2.2} />
            </button>

            <button
              type="button"
              onClick={handleResetZoom}
              className="font-semibold text-[11px] px-1 hover:text-[#126A9C] cursor-pointer tabular-nums text-[#172A3A]"
              title="Đặt lại mức thu phóng 100%"
            >
              {zoomLevel}%
            </button>

            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 160}
              className="p-1 rounded-full text-[#607483] hover:text-[#172A3A] hover:bg-[#F1F6F9] disabled:opacity-30 transition-colors cursor-pointer"
              title="Phóng to"
            >
              <ZoomIn size={14} strokeWidth={2.2} />
            </button>

            <div className="w-[1px] h-4 bg-[#DCE7EE] mx-1" />

            <button
              type="button"
              onClick={handleResetZoom}
              className="p-1 rounded-full text-[#607483] hover:text-[#172A3A] hover:bg-[#F1F6F9] transition-colors cursor-pointer"
              title="Khớp chiều rộng"
            >
              <Maximize2 size={13} strokeWidth={2.2} />
            </button>

            <button
              type="button"
              onClick={() => window.open(effectiveUrl, '_blank')}
              className="p-1 rounded-full text-[#607483] hover:text-[#126A9C] hover:bg-[#F1F6F9] transition-colors cursor-pointer"
              title="Mở tệp gốc trong tab mới"
            >
              <ExternalLink size={13} strokeWidth={2.2} />
            </button>
          </div>
        </div>
      )}

      {/* Loading Skeleton State */}
      {isLoading && (
        <div className="flex-1 flex flex-col items-center justify-center p-12">
          <div className="w-[500px] h-[700px] bg-white rounded-[4px] shadow-md border border-[#DCE7EE] p-8 flex flex-col gap-4 animate-pulse">
            <div className="h-6 w-48 bg-gray-200 rounded mx-auto" />
            <div className="h-4 w-32 bg-gray-200 rounded mx-auto mb-8" />
            <div className="h-10 w-64 bg-gray-200 rounded mx-auto mb-6" />
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-5/6" />
              <div className="h-4 bg-gray-200 rounded w-4/6" />
            </div>
          </div>
          <p className="mt-4 text-[13px] font-medium text-[#607483]">
            Đang mở tài liệu...
          </p>
        </div>
      )}

      {/* Missing Local Binary State (for files attached before IndexedDB binary persistence) */}
      {isMissingLocalBinary && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="p-8 bg-white rounded-[12px] border border-[#DCE7EE] shadow-sm max-w-md flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-[#EAF6FC] text-[#126A9C] flex items-center justify-center mb-3">
              <UploadCloud size={24} />
            </div>
            <h4 className="text-[15px] font-bold text-[#172A3A]">
              Chưa có dữ liệu nhị phân cục bộ cho tệp này
            </h4>
            <p className="text-[12.5px] text-[#607483] mt-1.5 leading-relaxed break-words">
              Tệp <strong className="text-[#172A3A]">{fileName}</strong> được đính kèm từ phiên trước khi lưu tệp nhị phân cục bộ. Bạn có thể chọn lại tệp gốc từ máy tính để hiển thị bản xem trước chính xác ngay lập tức.
            </p>
            <input
              ref={relinkInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.heic"
              className="hidden"
              onChange={handleRelinkLocalFile}
            />
            <div className="flex items-center gap-2 mt-5">
              <button
                type="button"
                onClick={() => relinkInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-[12.5px] font-semibold text-white bg-[#126A9C] hover:bg-[#0D78AE] rounded-[7px] transition-colors cursor-pointer shadow-2xs"
              >
                <UploadCloud size={14} />
                <span>Chọn tệp gốc để hiển thị ngay</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Failure Fallback */}
      {!isLoading && isFailed && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="p-8 bg-white rounded-[12px] border border-[#DCE7EE] shadow-sm max-w-md flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center mb-3">
              <FileQuestion size={24} />
            </div>
            <h4 className="text-[15px] font-bold text-[#172A3A]">
              Không thể hiển thị bản xem trước
            </h4>
            <p className="text-[12.5px] text-[#607483] mt-1.5 leading-relaxed">
              Tệp <strong>{fileName}</strong> có định dạng hoặc kích thước không thể kết xuất xem trực tiếp.
              Các thông tin nhận diện ở bảng bên phải vẫn sẵn sàng để kiểm tra.
            </p>
            <div className="flex items-center gap-2 mt-5">
              {onRetryPreview && (
                <button
                  type="button"
                  onClick={onRetryPreview}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-[#126A9C] bg-[#EAF6FC] border border-[#D0E8F5] rounded-[6px] hover:bg-[#D0E8F5] transition-colors cursor-pointer"
                >
                  <RotateCcw size={13} />
                  <span>Thử tải lại</span>
                </button>
              )}
              {effectiveUrl && (
                <button
                  type="button"
                  onClick={() => window.open(effectiveUrl, '_blank')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-white bg-[#126A9C] hover:bg-[#0D78AE] rounded-[6px] transition-colors cursor-pointer"
                >
                  <ExternalLink size={13} />
                  <span>Mở tài liệu gốc</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Render Document: Full-bleed Native Browser PDF Viewer for PDFs, Zoomable Card for Images */}
      {!isLoading && !isFailed && !isMissingLocalBinary && (
        isPdf ? (
          <div className="flex-1 w-full h-full min-h-[680px] flex flex-col bg-[#525659]">
            <iframe
              key={effectiveUrl}
              src={effectiveUrl}
              title={fileName}
              className="w-full flex-1 h-full min-h-[680px] border-0"
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-start pb-12 pt-2 px-4">
            <div
              className="flex items-center justify-center p-4 transition-transform duration-150 origin-top"
              style={{ transform: `scale(${zoomLevel / 100})` }}
            >
              <div className="bg-white rounded-[12px] shadow-lg border border-[#DCE7EE] overflow-hidden max-w-[760px] w-full">
                <img
                  src={effectiveUrl}
                  alt={fileName}
                  onError={() => {
                    if (effectiveUrl.startsWith('blob:')) {
                      setBlobLoadFailed(true);
                    }
                  }}
                  className="w-full max-h-[720px] object-contain bg-[#F8FBFD]"
                />
                <div className="px-4 py-2.5 bg-white border-t border-[#E6EFF5] flex items-center justify-between gap-3 text-[12px] text-[#607483]">
                  <span className="truncate font-medium text-[#172A3A]">{fileName}</span>
                  <span className="uppercase font-semibold text-[#0D78AE] shrink-0">{fileType}</span>
                </div>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
};
