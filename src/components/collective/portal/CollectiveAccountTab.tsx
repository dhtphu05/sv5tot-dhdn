import React from 'react';
import { Users, Building2, Plus, ArrowRight, Check } from 'lucide-react';
import { Button } from '../../buttons/Button';
import { CollectiveApplication, COLLECTIVE_TYPE_LABELS } from '../../../staff/collectiveTypes';

export interface CollectiveAccountTabProps {
  currentApp: CollectiveApplication;
  allApps: CollectiveApplication[];
  onSelectApp: (id: string) => void;
  onOpenCreateModal: () => void;
  onLogout?: () => void;
}

export const CollectiveAccountTab: React.FC<CollectiveAccountTabProps> = ({
  currentApp,
  allApps,
  onSelectApp,
  onOpenCreateModal,
  onLogout,
}) => {
  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto w-full space-y-6 animate-in fade-in duration-150">
      <h2 className="text-[20px] font-extrabold text-[#172A3A]">
        Thông tin tài khoản phụ trách tập thể
      </h2>

      <div className="bg-white border border-[#DCE7EE] rounded-[16px] p-6 space-y-4 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px]">
          <div>
            <label className="text-[12px] text-[#728391] font-semibold">Tên tập thể</label>
            <div className="font-bold text-[#172A3A] mt-0.5">{currentApp.collectiveName}</div>
          </div>
          <div>
            <label className="text-[12px] text-[#728391] font-semibold">Loại hình tập thể</label>
            <div className="font-bold text-[#172A3A] mt-0.5">
              {COLLECTIVE_TYPE_LABELS[currentApp.collectiveType] || currentApp.collectiveType}
            </div>
          </div>
          <div>
            <label className="text-[12px] text-[#728391] font-semibold">Đơn vị đào tạo</label>
            <div className="font-bold text-[#172A3A] mt-0.5">{currentApp.institutionName}</div>
          </div>
          <div>
            <label className="text-[12px] text-[#728391] font-semibold">Khoa / Liên chi</label>
            <div className="font-bold text-[#172A3A] mt-0.5">{currentApp.facultyName}</div>
          </div>
          <div>
            <label className="text-[12px] text-[#728391] font-semibold">Người phụ trách hồ sơ</label>
            <div className="font-bold text-[#172A3A] mt-0.5">{currentApp.preparedByUserName}</div>
          </div>
          <div>
            <label className="text-[12px] text-[#728391] font-semibold">Email liên hệ</label>
            <div className="font-bold text-[#172A3A] mt-0.5">{currentApp.preparedByUserEmail}</div>
          </div>
          <div>
            <label className="text-[12px] text-[#728391] font-semibold">Số điện thoại</label>
            <div className="font-bold text-[#172A3A] mt-0.5">{currentApp.contactPhone}</div>
          </div>
          <div>
            <label className="text-[12px] text-[#728391] font-semibold">Năm học xét chọn</label>
            <div className="font-bold text-[#172A3A] mt-0.5">{currentApp.academicYear}</div>
          </div>
        </div>

        {onLogout && (
          <div className="pt-4 border-t border-[#EEF4F8] flex items-center justify-between">
            <span className="text-[12px] text-[#728391]">Phiên làm việc bảo mật cấp Đại học Đà Nẵng</span>
            <Button type="button" variant="danger" size="sm" onClick={onLogout}>
              Đăng xuất
            </Button>
          </div>
        )}
      </div>

      {/* Danh sách tập thể do tài khoản quản lý */}
      <div className="bg-white border border-[#DCE7EE] rounded-[16px] p-6 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-bold text-[#172A3A]">
              Hồ sơ tập thể đang quản lý ({allApps.length})
            </h3>
            <p className="text-[12px] text-[#728391] mt-0.5">
              Chuyển đổi giữa các chi hội, câu lạc bộ hoặc tạo hồ sơ tập thể mới
            </p>
          </div>
          <Button type="button" variant="primary" size="sm" onClick={onOpenCreateModal}>
            <Plus size={14} className="mr-1.5" />
            Tạo hồ sơ mới
          </Button>
        </div>

        <div className="space-y-2 pt-2">
          {allApps.map((app) => {
            const isSelected = app.id === currentApp.id;
            return (
              <div
                key={app.id}
                onClick={() => onSelectApp(app.id)}
                className={`p-3.5 rounded-[12px] border transition-all flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'border-[#0D78AE] bg-[#F0F8FD] ring-1 ring-[#0D78AE]'
                    : 'border-[#E2EDF5] hover:border-[#B5D5E8] bg-white'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-[10px] flex items-center justify-center font-bold text-[13px] shrink-0 ${
                      isSelected ? 'bg-[#0D78AE] text-white' : 'bg-[#EBF3F8] text-[#556977]'
                    }`}
                  >
                    <Users size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-[13.5px] text-[#172A3A] truncate">
                      {app.collectiveName}
                    </div>
                    <div className="text-[11.5px] text-[#607483] truncate">
                      {COLLECTIVE_TYPE_LABELS[app.collectiveType]} • {app.institutionName}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isSelected ? (
                    <span className="text-[12px] font-bold text-[#0D78AE] flex items-center gap-1 bg-white px-2 py-0.5 rounded-full border border-[#0D78AE]/30">
                      <Check size={12} /> Đang chọn
                    </span>
                  ) : (
                    <span className="text-[12px] text-[#728391] flex items-center gap-0.5 hover:text-[#0D78AE]">
                      Chọn <ArrowRight size={12} />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
