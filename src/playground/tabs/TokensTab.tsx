import React from "react";
import { HsvEmblem, InstitutionLockup, ProductBrandLockup } from "../../components/brand/HsvLogo";
import { CRITERIA, CRITERIA_LIST, CriterionDefinition } from "../../tokens";

export const TokensTab: React.FC = () => {
  return (
          <div className="flex flex-col gap-10">
            {/* 1. Brand Identity */}
            <section className="flex flex-col gap-4">
              <h2 className="text-[20px] font-bold text-[#1D1D1F] tracking-tight">
                1. Bộ nhận diện Hội Sinh viên Việt Nam Đại học Đà Nẵng
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-6 rounded-[14px] border border-black/[0.05]">
                <div className="flex flex-col items-center justify-center p-6 bg-[#F9FAFB] rounded-[10px]">
                  <HsvEmblem size={64} />
                  <span className="text-[12px] font-medium text-[#6E6E73] mt-3">
                    Biểu trưng HSV Việt Nam
                  </span>
                </div>
                <div className="flex flex-col justify-center p-6 bg-[#F9FAFB] rounded-[10px] gap-4">
                  <InstitutionLockup size={40} />
                  <span className="text-[12px] text-[#86868B]">
                    Khóa biểu trưng cơ quan chủ quản
                  </span>
                </div>
                <div className="flex flex-col justify-center p-6 bg-[#F9FAFB] rounded-[10px] gap-4">
                  <ProductBrandLockup size={40} badgeLabel="SV5T ĐHĐN" />
                  <span className="text-[12px] text-[#86868B]">
                    Khóa nhận diện sản phẩm 5TOT ĐHĐN
                  </span>
                </div>
              </div>
            </section>

            {/* 2. Exactly Five Criteria Definition */}
            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[20px] font-bold text-[#1D1D1F] tracking-tight">
                  2. Đúng 5 tiêu chuẩn chuẩn tắc (Fixed 5 Criteria)
                </h2>
                <span className="text-[13px] text-[#6E6E73]">
                  Không bao giờ thêm tiêu chí thứ 6 · Màu sắc trung tính, không ám chỉ đậu/rớt
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {CRITERIA_LIST.map((criterion) => (
                  <div
                    key={criterion.id}
                    className="p-4 bg-white rounded-[12px] border border-black/[0.05] flex flex-col justify-between h-40"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className="w-6 h-6 rounded-[6px] text-[12px] font-bold flex items-center justify-center"
                          style={{
                            backgroundColor: criterion.accentSoft,
                            color: criterion.accentColor,
                          }}
                        >
                          {criterion.number}
                        </span>
                        <span className="text-[11px] text-[#86868B]">Tiêu chuẩn</span>
                      </div>
                      <h3 className="text-[15px] font-semibold text-[#1D1D1F]">
                        {criterion.name}
                      </h3>
                      <p className="text-[12px] text-[#6E6E73] mt-1.5 leading-snug line-clamp-3">
                        {criterion.shortDescription}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-black/[0.04] text-[11px] text-[#86868B]">
                      Cố định toàn hệ thống
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 3. Color Tokens & Discipline */}
            <section className="flex flex-col gap-4">
              <h2 className="text-[20px] font-bold text-[#1D1D1F] tracking-tight">
                3. Bảng mã màu & Kỷ luật màu sắc
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-white rounded-[12px] border border-black/[0.05]">
                  <div className="w-full h-12 rounded-[8px] bg-[#22A9E0] mb-3" />
                  <div className="text-[13.5px] font-semibold text-[#1D1D1F]">HSV Brand Blue</div>
                  <div className="text-[12px] text-[#86868B]">#22A9E0 · Nhận diện & Active</div>
                </div>
                <div className="p-4 bg-white rounded-[12px] border border-black/[0.05]">
                  <div className="w-full h-12 rounded-[8px] bg-[#16689E] mb-3" />
                  <div className="text-[13.5px] font-semibold text-[#1D1D1F]">HSV Deep Blue</div>
                  <div className="text-[12px] text-[#86868B]">#16689E · Text & Hành động</div>
                </div>
                <div className="p-4 bg-white rounded-[12px] border border-black/[0.05]">
                  <div className="w-full h-12 rounded-[8px] bg-[#1A934E] mb-3" />
                  <div className="text-[13.5px] font-semibold text-[#1D1D1F]">Semantic Green</div>
                  <div className="text-[12px] text-[#86868B]">Chỉ dùng cho sự thật đã xác nhận</div>
                </div>
                <div className="p-4 bg-white rounded-[12px] border border-black/[0.05]">
                  <div className="w-full h-12 rounded-[8px] bg-[#D97706] mb-3" />
                  <div className="text-[13.5px] font-semibold text-[#1D1D1F]">Semantic Amber</div>
                  <div className="text-[12px] text-[#86868B]">Gợi ý, chú ý, không báo động đỏ</div>
                </div>
              </div>
            </section>

            {/* 4. Typography Hierarchy */}
            <section className="flex flex-col gap-4">
              <h2 className="text-[20px] font-bold text-[#1D1D1F] tracking-tight">
                4. Hệ thống phân cấp Typography (Tiếng Việt chuẩn xác)
              </h2>
              <div className="p-6 bg-white rounded-[14px] border border-black/[0.05] space-y-5">
                <div className="flex items-baseline justify-between border-b border-black/[0.04] pb-3">
                  <span className="text-[12px] text-[#86868B] uppercase w-48">Display Large (44–48px)</span>
                  <div className="text-[44px] font-semibold tracking-tight text-[#1D1D1F] flex-1">
                    Sinh viên 5 tốt Đại học Đà Nẵng
                  </div>
                </div>
                <div className="flex items-baseline justify-between border-b border-black/[0.04] pb-3">
                  <span className="text-[12px] text-[#86868B] uppercase w-48">Page Title (32px)</span>
                  <div className="text-[32px] font-semibold tracking-tight text-[#1D1D1F] flex-1">
                    Hồ sơ đề nghị xét chọn danh hiệu
                  </div>
                </div>
                <div className="flex items-baseline justify-between border-b border-black/[0.04] pb-3">
                  <span className="text-[12px] text-[#86868B] uppercase w-48">Section Title (22px)</span>
                  <div className="text-[22px] font-semibold text-[#1D1D1F] flex-1">
                    Danh mục các nội dung và tiêu chuẩn rèn luyện
                  </div>
                </div>
                <div className="flex items-baseline justify-between border-b border-black/[0.04] pb-3">
                  <span className="text-[12px] text-[#86868B] uppercase w-48">Criterion Title (18px)</span>
                  <div className="text-[18px] font-semibold text-[#1D1D1F] flex-1">
                    Tiêu chí 2: Học tập tốt (Năm học 2026–2027)
                  </div>
                </div>
                <div className="flex items-baseline justify-between border-b border-black/[0.04] pb-3">
                  <span className="text-[12px] text-[#86868B] uppercase w-48">Body & Metadata (14/12px)</span>
                  <div className="flex flex-col gap-1 flex-1">
                    <p className="text-[14px] text-[#1D1D1F]">
                      Sinh viên nộp minh chứng chính xác và kiểm tra kỹ thông tin đã khai báo.
                    </p>
                    <p className="text-[12px] text-[#86868B]">
                      Cập nhật lần cuối: 15/10/2026 · Định dạng tệp PDF/JPG/PNG
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
  );
};
