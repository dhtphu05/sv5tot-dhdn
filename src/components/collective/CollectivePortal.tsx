/**
 * 5TOT ĐHĐN — Collective Portal (FSD Route Composition)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 * Niên khóa áp dụng: Năm học 2025–2026
 *
 * Implements Prompt S4.8.7A-R2:
 * Decomposed into Feature-Sliced portal modules:
 * - portal/CollectiveOverviewTab: Status dashboard, metrics overview & quick actions
 * - portal/CollectiveEvidenceTab: Complete repository of evidence attachments
 * - portal/CollectiveSupplementsTab: Official City supplement requests & history
 * - portal/CollectiveResultsTab: Final recognition decision, certificate & decree
 * - portal/CollectiveAccountTab: Account profile and collective profile switcher
 * - CollectiveWorkspace: Dedicated 4-requirement editing & submission workspace
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  Building2,
  FileText,
  FileCheck2,
  Bell,
  Award,
  LogOut,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  getAllCollectiveApplications,
  createCollectiveApplication,
  subscribeToCollectiveStore,
} from '../../staff/collectiveStore';
import {
  AUTHORIZED_COLLECTIVE_REGISTRY,
  CollectiveApplication,
  CollectiveType,
} from '../../staff/collectiveTypes';
import { SchoolReviewUnitId } from '../../staff/schoolReviewTypes';
import { CollectiveWorkspace } from './CollectiveWorkspace';
import { CollectiveResultModal } from './CollectiveResultModal';
import { CreateCollectiveModal } from './CreateCollectiveModal';
import { CollectiveOverviewTab } from './portal/CollectiveOverviewTab';
import { CollectiveEvidenceTab } from './portal/CollectiveEvidenceTab';
import { CollectiveSupplementsTab } from './portal/CollectiveSupplementsTab';
import { CollectiveResultsTab } from './portal/CollectiveResultsTab';
import { CollectiveAccountTab } from './portal/CollectiveAccountTab';
import {
  calculateParticipationRate,
  calculateRecognitionRate,
} from '../../entities/collective/collectiveCalculations';

export type CollectivePortalTab =
  | 'overview'
  | 'application'
  | 'evidence'
  | 'supplements'
  | 'notifications'
  | 'results'
  | 'account';

export interface CollectivePortalProps {
  initialAppId?: string;
  currentEmail?: string;
  onLogout?: () => void;
  onSwitchToIndividual?: () => void;
  onSwitchToStudentPortal?: () => void;
}

export const CollectivePortal: React.FC<CollectivePortalProps> = ({
  initialAppId,
  currentEmail,
  onLogout,
  onSwitchToIndividual,
  onSwitchToStudentPortal,
}) => {
  const [activeTab, setActiveTab] = useState<CollectivePortalTab>('overview');
  const [selectedAppId, setSelectedAppId] = useState<string>(() => {
    if (initialAppId) return initialAppId;
    const normalizedEmail = (currentEmail || '').trim().toLowerCase();
    if (normalizedEmail) {
      const existing = getAllCollectiveApplications().find(
        (a) => a.preparedByUserEmail.toLowerCase() === normalizedEmail
      );
      if (existing) return existing.id;
      const registryMatch = AUTHORIZED_COLLECTIVE_REGISTRY.find(
        (r) => r.authorizedPreparerEmail.toLowerCase() === normalizedEmail
      );
      if (registryMatch) {
        const created = createCollectiveApplication({
          collectiveName: registryMatch.name,
          collectiveType: registryMatch.type,
          institutionId: registryMatch.institutionId,
          institutionName: registryMatch.institutionName,
          schoolReviewUnitId: registryMatch.schoolReviewUnitId,
          schoolReviewUnitName: registryMatch.schoolReviewUnitName,
          facultyName: registryMatch.facultyName,
          contactPhone: registryMatch.defaultContactPhone,
          preparedByUserId: `user-preparer-${registryMatch.id}`,
          preparedByUserName: registryMatch.authorizedPreparerName,
          preparedByUserEmail: registryMatch.authorizedPreparerEmail,
        });
        return created.id;
      }
    }
    return 'COL-2026-DN-21TCLC-DT1';
  });
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [, setStoreVersion] = useState(0);

  const handleSwitchToStudent = onSwitchToIndividual || onSwitchToStudentPortal;

  // Subscribe to persistent store updates
  useEffect(() => {
    const unsubscribe = subscribeToCollectiveStore(() => {
      setStoreVersion((v) => v + 1);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (initialAppId) return;
    const normalizedEmail = (currentEmail || '').trim().toLowerCase();
    if (!normalizedEmail) return;
    const apps = getAllCollectiveApplications();
    const existing = apps.find(
      (a) => a.preparedByUserEmail.toLowerCase() === normalizedEmail
    );
    if (existing) {
      setSelectedAppId(existing.id);
      return;
    }
    const registryMatch = AUTHORIZED_COLLECTIVE_REGISTRY.find(
      (r) => r.authorizedPreparerEmail.toLowerCase() === normalizedEmail
    );
    if (registryMatch) {
      const created = createCollectiveApplication({
        collectiveName: registryMatch.name,
        collectiveType: registryMatch.type,
        institutionId: registryMatch.institutionId,
        institutionName: registryMatch.institutionName,
        schoolReviewUnitId: registryMatch.schoolReviewUnitId,
        schoolReviewUnitName: registryMatch.schoolReviewUnitName,
        facultyName: registryMatch.facultyName,
        contactPhone: registryMatch.defaultContactPhone,
        preparedByUserId: `user-preparer-${registryMatch.id}`,
        preparedByUserName: registryMatch.authorizedPreparerName,
        preparedByUserEmail: registryMatch.authorizedPreparerEmail,
      });
      setSelectedAppId(created.id);
    }
  }, [currentEmail, initialAppId]);

  const allApps = getAllCollectiveApplications();
  const currentApp: CollectiveApplication =
    allApps.find((a) => a.id === selectedAppId) || allApps[0] || ({} as CollectiveApplication);

  const { tt01, tt02, tt03, tt04, status } = currentApp;

  const participationRate = calculateParticipationRate(tt02.participatingCount, tt02.totalMembers);
  const recognitionRate = calculateRecognitionRate(tt03.recognizedCount, tt02.totalMembers);

  const allEvidence = useMemo(() => {
    const list: Array<any> = [];
    tt01.evidenceFiles?.forEach((f) => list.push({ ...f, reqCode: 'TT01' }));
    tt02.evidenceFiles?.forEach((f) => list.push({ ...f, reqCode: 'TT02' }));
    tt03.evidenceFiles?.forEach((f) => list.push({ ...f, reqCode: 'TT03' }));
    tt04.evidenceFiles?.forEach((f) => list.push({ ...f, reqCode: 'TT04' }));
    return list;
  }, [tt01, tt02, tt03, tt04]);

  const pendingSupplement = currentApp.supplementRequests?.find((s) => s.status === 'pending');

  const navItems = [
    { id: 'overview', label: 'Tổng quan hồ sơ', icon: <Building2 size={16} /> },
    { id: 'application', label: 'Kê khai 04 Tiêu chuẩn', icon: <FileText size={16} /> },
    {
      id: 'evidence',
      label: 'Kho minh chứng',
      icon: <FileCheck2 size={16} />,
      badge: allEvidence.length,
      badgeColor: 'bg-[#0D78AE]/10 text-[#0D78AE]',
    },
    {
      id: 'supplements',
      label: 'Yêu cầu bổ sung',
      icon: <Clock size={16} />,
      badge: pendingSupplement ? 1 : 0,
      badgeColor: 'bg-[#D97706]/15 text-[#D97706]',
    },
    {
      id: 'notifications',
      label: 'Thông báo',
      icon: <Bell size={16} />,
      badge: currentApp.supplementRequests?.length || 0,
    },
    {
      id: 'results',
      label: 'Kết quả xét chọn',
      icon: <Award size={16} />,
      badge: status === 'published' ? 1 : undefined,
      badgeColor: 'bg-[#16A34A]/15 text-[#16A34A]',
    },
    { id: 'account', label: 'Tài khoản tập thể', icon: <Users size={16} /> },
  ];

  return (
    <div className="flex h-screen bg-[#F3F8FC] text-[#172A3A] overflow-hidden select-text">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-[#DCE7EE] flex flex-col shrink-0 shadow-2xs z-20">
        <div className="p-4 border-b border-[#DCE7EE] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[8px] bg-[#0D78AE] text-white flex items-center justify-center font-black text-[13px]">
              5T
            </div>
            <div>
              <div className="font-extrabold text-[13.5px] tracking-tight leading-tight text-[#0D78AE]">
                5TOT ĐÀ NẴNG
              </div>
              <div className="text-[10px] text-[#607483] font-semibold tracking-wider uppercase">
                Cổng Tập Thể
              </div>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="text-[11px] font-bold text-[#607483] uppercase tracking-wider px-2 py-1">
            Điều hướng
          </div>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id as CollectivePortalTab)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-[9px] text-[13px] font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#EAF6FC] text-[#0D78AE] font-bold shadow-2xs'
                    : 'text-[#607483] hover:text-[#172A3A] hover:bg-[#F8FBFD]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={isActive ? 'text-[#0D78AE]' : 'text-[#728391]'}>
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`text-[10.5px] font-bold px-1.5 py-0.2 rounded-full tabular-nums ${
                      item.badgeColor || 'bg-[#E2EDF5] text-[#475569]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Collective Account Identity Section */}
        <div className="p-3 border-t border-[#DCE7EE] bg-[#F8FBFD] space-y-2.5">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-[8px] bg-[#0D78AE] text-white font-bold text-[12px] flex items-center justify-center shrink-0">
              <Users size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[12.5px] font-bold text-[#172A3A] truncate" title={currentApp.collectiveName}>
                {currentApp.collectiveName}
              </div>
              <div className="text-[11px] text-[#607483] truncate" title={currentApp.institutionName}>
                {currentApp.institutionName}
              </div>
              <div className="text-[10.5px] text-[#0D78AE] font-semibold truncate mt-0.5">
                {currentApp.preparedByUserName}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-[7px] text-[12px] font-semibold text-[#466474] hover:text-[#DC2626] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
          >
            <span>Đăng xuất Cổng Tập thể</span>
            <LogOut size={13.5} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col min-h-screen overflow-y-auto">
        {/* TAB 1: TỔNG QUAN */}
        {activeTab === 'overview' && (
          <CollectiveOverviewTab
            currentApp={currentApp}
            participationRate={participationRate}
            recognitionRate={recognitionRate}
            allEvidence={allEvidence}
            onGoToApplication={() => setActiveTab('application')}
            onGoToSupplements={() => setActiveTab('supplements')}
            onOpenResultModal={() => setIsResultModalOpen(true)}
          />
        )}

        {/* TAB 2: KHÔNG GIAN KÊ KHAI 04 TIÊU CHUẨN */}
        {activeTab === 'application' && (
          <CollectiveWorkspace
            application={currentApp}
            onBackToList={() => setActiveTab('overview')}
            currentUserEmail={currentApp.preparedByUserEmail}
            currentUserName={currentApp.preparedByUserName}
          />
        )}

        {/* TAB 3: KHO MINH CHỨNG */}
        {activeTab === 'evidence' && (
          <CollectiveEvidenceTab
            currentApp={currentApp}
            allEvidence={allEvidence}
            onGoToApplication={() => setActiveTab('application')}
          />
        )}

        {/* TAB 4: YÊU CẦU BỔ SUNG */}
        {activeTab === 'supplements' && (
          <CollectiveSupplementsTab
            currentApp={currentApp}
            onGoToApplication={() => setActiveTab('application')}
          />
        )}

        {/* TAB 5: THÔNG BÁO */}
        {activeTab === 'notifications' && (
          <div className="p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-5 animate-in fade-in duration-150">
            <div>
              <h2 className="text-[20px] font-black text-[#172A3A]">Hộp thư & Thông báo xét duyệt</h2>
              <p className="text-[13px] text-[#607483] mt-0.5">
                Các cập nhật chính thức từ Hội Sinh viên Đại học Đà Nẵng về tiến độ hồ sơ tập thể
              </p>
            </div>

            <div className="p-4 bg-white border border-[#DCE7EE] rounded-[14px] space-y-3">
              <div className="flex items-center gap-2.5 font-bold text-[13.5px] text-[#172A3A]">
                <Bell size={16} className="text-[#0D78AE]" />
                <span>Tiến trình tiếp nhận hồ sơ</span>
              </div>
              <p className="text-[12.5px] text-[#607483] leading-relaxed">
                Hồ sơ {currentApp.collectiveName} hiện đang ở trạng thái:{' '}
                <strong className="text-[#172A3A]">{currentApp.status}</strong>. Mọi yêu cầu điều chỉnh hoặc quyết định công nhận sẽ được thông báo trực tiếp qua Cổng này.
              </p>
            </div>
          </div>
        )}

        {/* TAB 6: KẾT QUẢ XÉT CHỌN */}
        {activeTab === 'results' && (
          <CollectiveResultsTab
            currentApp={currentApp}
            onOpenResultModal={() => setIsResultModalOpen(true)}
          />
        )}

        {/* TAB 7: TÀI KHOẢN TẬP THỂ */}
        {activeTab === 'account' && (
          <CollectiveAccountTab
            currentApp={currentApp}
            allApps={allApps}
            onSelectApp={(appId) => setSelectedAppId(appId)}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
            onLogout={onLogout}
          />
        )}
      </main>

      {/* Result Certificate Modal */}
      <CollectiveResultModal
        isOpen={isResultModalOpen}
        onClose={() => setIsResultModalOpen(false)}
        application={currentApp}
      />

      {/* Create New Collective Application Modal */}
      <CreateCollectiveModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={(payload) => {
          const created = createCollectiveApplication({
            collectiveName: payload.collectiveName,
            collectiveType: payload.collectiveType as CollectiveType,
            institutionId: payload.institutionId,
            institutionName: payload.institutionName,
            schoolReviewUnitId: payload.schoolReviewUnitId as SchoolReviewUnitId,
            schoolReviewUnitName: payload.schoolReviewUnitName,
            facultyName: payload.facultyName,
            contactPhone: payload.contactPhone,
            preparedByUserId: currentApp.preparedByUserId || 'user-preparer-mai',
            preparedByUserName: currentApp.preparedByUserName || 'Nguyễn Thị Mai',
            preparedByUserEmail:
              currentEmail || currentApp.preparedByUserEmail || 'mai.nt@dut.udn.vn',
          });
          setSelectedAppId(created.id);
          setIsCreateModalOpen(false);
          setActiveTab('application');
        }}
      />
    </div>
  );
};
