/**
 * 5TOT UDN — Announcements & Official Guidance Documents Section (Section 6)
 * Đơn vị tổ chức: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 * Cổng xét chọn Danh hiệu và Giải thưởng Sinh viên Đại học Đà Nẵng
 */

import React, { useState, useMemo } from 'react';
import {
  Bell,
  FileText,
  Calendar,
  ArrowRight,
  Search,
  ExternalLink,
  ChevronRight,
  X,
} from 'lucide-react';
import { UDN_ANNOUNCEMENTS, UdnAnnouncementItem } from './udnLandingData';

export const PublicAnnouncementsSection: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<
    'all' | 'sv5t_individual' | 'sv5t_collective' | 'white_bird'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDocument, setActiveDocument] = useState<UdnAnnouncementItem | null>(null);

  const filteredAnnouncements = useMemo(() => {
    return UDN_ANNOUNCEMENTS.filter((item) => {
      const matchCat =
        selectedCategory === 'all' || item.category === selectedCategory;
      const matchQuery =
        !searchQuery.trim() ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <section
      id="thong-bao"
      aria-labelledby="announcements-heading"
      className="py-14 sm:py-20 bg-[#F8FBFD] border-b border-[#E3EDF5]"
    >
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-12">
        {/* Section Header */}
        <div className="text-center max-w-[780px] mx-auto mb-10 sm:mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.14em] text-[#0B64A0] bg-[#E1F0FA] px-3.5 py-1 rounded-full border border-[#C5E1F5]">
            <Bell size={14} />
            <span>Văn bản & Kế hoạch chính thức</span>
          </div>
          <h2
            id="announcements-heading"
            className="text-[28px] sm:text-[38px] font-extrabold text-[#0E2538] tracking-tight leading-tight"
          >
            Thông báo và văn bản hướng dẫn
          </h2>
          <p className="text-[15.5px] sm:text-[17px] text-[#4A6377] leading-relaxed">
            Cập nhật các thông tri, kế hoạch xét chọn, quy chế giải thưởng và biểu mẫu minh chứng hợp lệ từ Hội Sinh viên Đại học Đà Nẵng.
          </p>
        </div>

        {/* Filter Bar & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          {/* Segmented Category Buttons */}
          <div className="flex items-center p-1 bg-white rounded-xl border border-[#D5E6F2] shadow-2xs overflow-x-auto max-w-full">
            {[
              { id: 'all', label: 'Tất cả văn bản' },
              { id: 'sv5t_individual', label: 'Sinh viên 5 tốt' },
              { id: 'sv5t_collective', label: 'Tập thể SV5T' },
              { id: 'white_bird', label: 'Cánh chim trắng' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCategory(tab.id as any)}
                className={`px-3.5 sm:px-4 py-2 rounded-lg text-[13px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === tab.id
                    ? 'bg-[#0B64A0] text-white shadow-xs'
                    : 'text-[#4A6377] hover:text-[#0E2538]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Quick Search Input */}
          <div className="relative w-full sm:w-[280px]">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#71899B]"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm văn bản..."
              className="w-full h-[40px] pl-9 pr-3 rounded-xl border border-[#D5E6F2] bg-white text-[13.5px] text-[#0E2538] placeholder-[#71899B] focus:outline-none focus:ring-2 focus:ring-[#0B64A0] focus:border-transparent transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#71899B] hover:text-[#0E2538] p-1 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Announcements List */}
        {filteredAnnouncements.length > 0 ? (
          <div className="space-y-4">
            {filteredAnnouncements.map((ann) => (
              <div
                key={ann.id}
                className="rounded-2xl border border-[#D5E6F2] bg-white p-5 sm:p-6 hover:shadow-md hover:border-[#BCD8EC] transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-5 group"
              >
                <div className="space-y-2 max-w-[840px]">
                  <div className="flex flex-wrap items-center gap-2.5 text-[12px]">
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[11px] ${
                        ann.category === 'white_bird'
                          ? 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]'
                          : ann.category === 'sv5t_collective'
                          ? 'bg-[#E6F8F5] text-[#0D9488] border border-[#BCF0E6]'
                          : 'bg-[#EBF5FB] text-[#0B64A0] border border-[#C5E1F5]'
                      }`}
                    >
                      {ann.categoryLabel}
                    </span>

                    {ann.documentRef && (
                      <span className="text-[#647C8E] font-medium font-mono text-[11.5px]">
                        {ann.documentRef}
                      </span>
                    )}

                    <span className="text-[#9DB0BE]">•</span>

                    <span className="inline-flex items-center gap-1.5 text-[#647C8E] font-medium">
                      <Calendar size={13} className="text-[#0B64A0]" />
                      <span>{ann.publishDate}</span>
                    </span>
                  </div>

                  <h3 className="text-[17px] sm:text-[18px] font-bold text-[#0E2538] group-hover:text-[#0B64A0] transition-colors leading-snug">
                    {ann.title}
                  </h3>

                  <p className="text-[13.5px] text-[#4A6377] leading-relaxed">
                    {ann.excerpt}
                  </p>
                </div>

                <div className="shrink-0 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveDocument(ann)}
                    className="inline-flex items-center gap-1.5 h-[38px] px-4 rounded-xl border border-[#CFE1EE] bg-[#F8FCFF] hover:bg-[#EDF7FC] text-[#0B64A0] text-[13.5px] font-bold transition-colors cursor-pointer"
                  >
                    <span>Xem chi tiết</span>
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center rounded-2xl bg-white border border-[#D5E6F2] space-y-3">
            <FileText size={36} className="mx-auto text-[#9DB0BE]" />
            <h3 className="text-[16px] font-bold text-[#0E2538]">
              Không tìm thấy văn bản phù hợp
            </h3>
            <p className="text-[13.5px] text-[#647C8E]">
              Vui lòng thử lại với từ khóa tìm kiếm khác hoặc chuyển sang hạng mục văn bản khác.
            </p>
          </div>
        )}
      </div>

      {/* DOCUMENT VIEWER MODAL */}
      {activeDocument && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="doc-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F2231]/55 backdrop-blur-xs"
          onClick={() => setActiveDocument(null)}
        >
          <div
            className="w-full max-w-[760px] max-h-[85vh] bg-white rounded-2xl border border-[#CFE0EC] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#F5F9FC] border-b border-[#CFE0EC] flex items-start justify-between gap-4 shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#0B64A0] bg-[#E1F0FA] px-2 py-0.5 rounded">
                    {activeDocument.categoryLabel}
                  </span>
                  {activeDocument.documentRef && (
                    <span className="text-[12px] text-[#526B7E] font-mono">
                      {activeDocument.documentRef}
                    </span>
                  )}
                </div>
                <h2
                  id="doc-modal-title"
                  className="text-[18px] font-bold text-[#0E2538] leading-snug"
                >
                  {activeDocument.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setActiveDocument(null)}
                className="p-1.5 rounded-lg text-[#526B7E] hover:text-[#0E2538] hover:bg-[#E6EFF5] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-4 text-[14px] text-[#2C4A5F] leading-relaxed">
              {activeDocument.content.map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}

              {activeDocument.category === 'white_bird' && (
                <div className="mt-4 p-4 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] flex items-center justify-between gap-3">
                  <span className="text-[13px] text-[#92400E]">
                    Tra cứu toàn văn Quyết định số 1720/QĐ-HSV và hướng dẫn chi tiết tại trang thông tin Tuổi trẻ ĐHĐN:
                  </span>
                  <a
                    href="https://tuoitredhdn.udn.vn/hoi-sinh-vien-dai-hoc-da-nang/giai-thuong-canh-chim-trang/quy-che-giai-thuong-canh-chim-trang-1720.html"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D97706] text-white text-[12.5px] font-bold hover:bg-[#B45309] transition-colors shrink-0"
                  >
                    <span>Xem bài viết</span>
                    <ExternalLink size={13} />
                  </a>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-[#F5F9FC] border-t border-[#CFE0EC] flex items-center justify-between text-[12px] text-[#526B7E] shrink-0">
              <span>Hội Sinh viên Việt Nam Đại học Đà Nẵng</span>
              <button
                type="button"
                onClick={() => setActiveDocument(null)}
                className="h-[34px] px-4 rounded-lg bg-[#0B64A0] text-white font-bold text-[13px] hover:bg-[#095386] transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
