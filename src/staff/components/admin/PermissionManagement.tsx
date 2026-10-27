/**
 * 5TOT ĐHĐN — Role & Capability Matrix (Quyền truy cập)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Prompt 21 Sections 74–79:
 * - Clear role-to-capability inspection matrix.
 * - 6 Functional Categories: Hồ sơ, Xét duyệt, Điều phối, Hội đồng, Báo cáo, Quản trị.
 * - Vietnamese labels, descriptions, and high-risk action flags.
 * - Enforces principle: "Admin ≠ Automatic Everything" (Section 77).
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  Check,
  X,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { getRoleCapabilityMatrix } from '../../adminSelectors';

export const PermissionManagement: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const matrix = getRoleCapabilityMatrix();

  const filteredMatrix =
    selectedCategory === 'all'
      ? matrix
      : matrix.filter((cat) => cat.category === selectedCategory);

  return (
    <div className="p-6 max-w-[1360px] w-full mx-auto space-y-5">
      {/* 1. Header (Prompt 21 Section 74) */}
      <div className="border-b border-[#DCE7EE] pb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-[12px] font-semibold text-[#526B7C]">
            Kiểm soát quyền hạn · Hội Sinh viên Đại học Đà Nẵng
          </div>
          <h1 className="text-[20px] font-extrabold text-[#0F2335] mt-0.5 flex items-center gap-2">
            <ShieldCheck size={20} className="text-[#0D78AE]" />
            <span>Ma trận phân quyền &amp; Năng lực hệ thống</span>
          </h1>
          <p className="text-[12.5px] text-[#526B7C] mt-1">
            Tra cứu và giám sát phạm vi quyền truy cập của 04 nhóm vai trò chuyên
            trách trong quy trình xét chọn Sinh viên 5 tốt cấp Đại học Đà Nẵng.
          </p>
        </div>
      </div>

      {/* Principle Banner (Prompt 21 Section 77: Admin ≠ Automatic Everything) */}
      <div className="p-4 rounded-[10px] bg-white border border-[#D4E2EC] shadow-2xs space-y-2">
        <div className="flex items-center gap-2 text-[13px] font-extrabold text-[#0F2335]">
          <Info size={16} className="text-[#0D78AE]" />
          <span>Nguyên tắc tách biệt quyền hạn (Separation of Concerns)</span>
        </div>
        <p className="text-[12.5px] text-[#526B7C] leading-relaxed">
          Tài khoản <strong>Quản trị hệ thống (Admin)</strong> quản lý cấu hình,
          đơn vị, mùa xét, tiêu chí và tài khoản; nhưng <strong>không đóng vai trò thẩm định hồ sơ</strong>,
          không điều phối phân công thay Quản lý và không tham gia biểu quyết kết
          quả thay Hội đồng. Mọi vai trò tuân thủ đúng chức năng nghiệp vụ được
          giao.
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[12px] font-bold text-[#526B7C] mr-2">
          Lọc theo nhóm nghiệp vụ:
        </span>
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded-[8px] text-[12px] font-bold transition-colors cursor-pointer border ${
            selectedCategory === 'all'
              ? 'bg-[#0D78AE] text-white border-[#0D78AE]'
              : 'bg-white text-[#526B7C] border-[#DCE7EE] hover:bg-[#F8FBFD]'
          }`}
        >
          Tất cả (6 nhóm)
        </button>
        {matrix.map((cat) => (
          <button
            key={cat.category}
            type="button"
            onClick={() => setSelectedCategory(cat.category)}
            className={`px-3 py-1.5 rounded-[8px] text-[12px] font-bold transition-colors cursor-pointer border ${
              selectedCategory === cat.category
                ? 'bg-[#0D78AE] text-white border-[#0D78AE]'
                : 'bg-white text-[#526B7C] border-[#DCE7EE] hover:bg-[#F8FBFD]'
            }`}
          >
            {cat.categoryLabel} ({cat.capabilities.length})
          </button>
        ))}
      </div>

      {/* Role Matrix Table (Prompt 21 Section 75 & 76) */}
      <div className="bg-white rounded-[12px] border border-[#D4E2EC] overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0F2335] text-white text-[12px] uppercase tracking-[0.04em] font-extrabold border-b border-[#1E364D]">
                <th className="py-3.5 px-4 w-[38%]">Quyền hạn &amp; Năng lực nghiệp vụ</th>
                <th className="py-3.5 px-3 text-center w-[15.5%] text-[#BAE0F7]">
                  Cán bộ xét duyệt
                </th>
                <th className="py-3.5 px-3 text-center w-[15.5%] text-[#FDE68A]">
                  Quản lý xét duyệt
                </th>
                <th className="py-3.5 px-3 text-center w-[15.5%] text-[#C7D2FE]">
                  Hội đồng xét chọn
                </th>
                <th className="py-3.5 px-3 text-center w-[15.5%] text-[#E9D5FF]">
                  Quản trị hệ thống
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF4F8] text-[12.5px]">
              {filteredMatrix.map((cat) => (
                <React.Fragment key={cat.category}>
                  {/* Category Header Row */}
                  <tr className="bg-[#F8FBFD] border-y border-[#DCE7EE]">
                    <td
                      colSpan={5}
                      className="py-2.5 px-4 font-extrabold text-[12px] text-[#0D78AE] uppercase tracking-[0.05em]"
                    >
                      Nhóm quyền: {cat.categoryLabel}
                    </td>
                  </tr>

                  {/* Capabilities Rows */}
                  {cat.capabilities.map((item, idx) => (
                    <tr
                      key={item.meta.key}
                      className={`hover:bg-[#F2F8FC] transition-colors ${
                        idx % 2 === 1 ? 'bg-[#FAFCFE]' : 'bg-white'
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-[#172A3A]">
                            {item.meta.label}
                          </span>
                          {item.meta.isHighRisk && (
                            <span className="px-1.5 py-0.2 rounded text-[10.5px] font-bold bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA] flex items-center gap-0.5">
                              <AlertTriangle size={10} />
                              <span>Tác vụ trọng yếu</span>
                            </span>
                          )}
                        </div>
                        <p className="text-[11.5px] text-[#526B7C] mt-0.5">
                          {item.meta.description}
                        </p>
                      </td>

                      {/* Officer */}
                      <td className="py-3 px-3 text-center">
                        {item.roles.CITY_OFFICER ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#EAFBF1] text-[#136F3A]">
                            <Check size={14} strokeWidth={2.5} />
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#F8FAFC] text-[#CBD5E1]">
                            <X size={13} />
                          </span>
                        )}
                      </td>

                      {/* Manager */}
                      <td className="py-3 px-3 text-center">
                        {item.roles.CITY_MANAGER ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#EAFBF1] text-[#136F3A]">
                            <Check size={14} strokeWidth={2.5} />
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#F8FAFC] text-[#CBD5E1]">
                            <X size={13} />
                          </span>
                        )}
                      </td>

                      {/* Committee */}
                      <td className="py-3 px-3 text-center">
                        {item.roles.CITY_COMMITTEE ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#EAFBF1] text-[#136F3A]">
                            <Check size={14} strokeWidth={2.5} />
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#F8FAFC] text-[#CBD5E1]">
                            <X size={13} />
                          </span>
                        )}
                      </td>

                      {/* Admin */}
                      <td className="py-3 px-3 text-center">
                        {item.roles.ADMIN ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#EAFBF1] text-[#136F3A]">
                            <Check size={14} strokeWidth={2.5} />
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#F8FAFC] text-[#CBD5E1]">
                            <X size={13} />
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
