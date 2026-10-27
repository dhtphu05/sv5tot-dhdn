/**
 * 5TOT ĐHĐN — Discreet Collapsible Prototype Demo Toolbar
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Prompt 14.9 Sections 11–16 + Prompt 17 Section 130:
 * - Discreet bottom-right presentation control (~38px collapsed height, neutral white surface, soft shadow).
 * - Starts collapsed so stakeholders view the real Student or Staff interface unobstructed.
 * - Supports switching between:
 *   1. Sinh viên (9 canonical Student lifecycle scenarios)
 *   2. Cán bộ xét duyệt (Officer Review Workspace scenarios: Đang xét hồ sơ, Cần bổ sung,
 *      Đã nhận bổ sung, Sẵn sàng hoàn tất xét, etc.)
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Check,
  RotateCcw,
  LayoutGrid,
  EyeOff,
  Globe,
  UserCheck,
  GraduationCap,
  Scale,
  ShieldCheck,
  Users,
  Building2,
} from 'lucide-react';
import {
  IS_DEMO_MODE_ENABLED,
  PROTOTYPE_SCENARIOS,
  PROTOTYPE_SCENARIO_MAP,
  PrototypeScenarioId,
  DEFAULT_PROTOTYPE_SCENARIO_ID,
} from '../../demo/prototypeDemoMode';
import { OfficerDemoScenarioId } from '../../staff/reviewTypes';
import {
  OFFICER_DEMO_SCENARIOS,
  OFFICER_DEMO_SCENARIO_MAP,
  DEFAULT_OFFICER_SCENARIO_ID,
} from '../../staff/fixtures/officerReviewFixtures';
import { CommitteeDemoScenarioId } from '../../staff/committeeTypes';
import {
  COMMITTEE_DEMO_SCENARIOS,
  COMMITTEE_DEMO_SCENARIO_MAP,
  DEFAULT_COMMITTEE_SCENARIO_ID,
} from '../../staff/fixtures/committeeFixtures';
import { StaffRole, StaffRouteId } from '../../staff/types';
import { MANAGER_DEMO_SCENARIOS } from '../../staff/fixtures/demoScenarios';
import {
  SCHOOL_DEMO_SCENARIOS,
  SchoolDemoScenarioId,
} from '../../staff/fixtures/schoolReviewFixtures';

export interface PrototypeDemoToolbarProps {
  isVisible: boolean;
  isHiddenByUser: boolean;
  activeScenarioId: PrototypeScenarioId;
  activeOfficerScenarioId?: OfficerDemoScenarioId;
  activeCommitteeScenarioId?: CommitteeDemoScenarioId;
  activeSchoolScenarioId?: SchoolDemoScenarioId;
  activeStaffRole?: StaffRole;
  isStaffMode?: boolean;
  isOnPublicPage?: boolean;
  onSelectScenario: (scenarioId: PrototypeScenarioId) => void;
  onSelectOfficerScenario?: (scenarioId: OfficerDemoScenarioId) => void;
  onSelectCommitteeScenario?: (scenarioId: CommitteeDemoScenarioId) => void;
  onSelectSchoolScenario?: (scenarioId: SchoolDemoScenarioId) => void;
  onSelectManagerScenario?: (routeId: StaffRouteId) => void;
  onSelectAdminRoute?: (routeId: StaffRouteId) => void;
  onOpenOfficerQueue?: () => void;
  onOpenSchoolQueue?: () => void;
  onResetScenario: () => void;
  onOpenDemoLauncher: () => void;
  onOpenPublicEntry: () => void;
  onEnterStudentApp: () => void;
  onHideToolbar: () => void;
  onRestoreToolbar: () => void;
}

export const PrototypeDemoToolbar: React.FC<PrototypeDemoToolbarProps> = ({
  isVisible,
  isHiddenByUser,
  activeScenarioId,
  activeOfficerScenarioId = DEFAULT_OFFICER_SCENARIO_ID,
  activeCommitteeScenarioId = DEFAULT_COMMITTEE_SCENARIO_ID,
  activeSchoolScenarioId = 'B_school_under_review',
  activeStaffRole = 'CITY_OFFICER',
  isStaffMode = false,
  isOnPublicPage = false,
  onSelectScenario,
  onSelectOfficerScenario,
  onSelectCommitteeScenario,
  onSelectSchoolScenario,
  onSelectManagerScenario,
  onSelectAdminRoute,
  onOpenOfficerQueue,
  onOpenSchoolQueue,
  onResetScenario,
  onOpenDemoLauncher,
  onOpenPublicEntry,
  onEnterStudentApp,
  onHideToolbar,
  onRestoreToolbar,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<
    'student' | 'school' | 'officer' | 'manager' | 'committee' | 'admin'
  >(
    !isStaffMode
      ? 'student'
      : activeStaffRole === 'SCHOOL_OFFICER'
      ? 'school'
      : activeStaffRole === 'ADMIN'
      ? 'admin'
      : activeStaffRole === 'CITY_COMMITTEE'
      ? 'committee'
      : activeStaffRole === 'CITY_MANAGER'
      ? 'manager'
      : 'officer'
  );
  const [showHiddenHint, setShowHiddenHint] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveTab(
      !isStaffMode
        ? 'student'
        : activeStaffRole === 'SCHOOL_OFFICER'
        ? 'school'
        : activeStaffRole === 'ADMIN'
        ? 'admin'
        : activeStaffRole === 'CITY_COMMITTEE'
        ? 'committee'
        : activeStaffRole === 'CITY_MANAGER'
        ? 'manager'
        : 'officer'
    );
  }, [isStaffMode, activeStaffRole]);

  const activeStudentScenario =
    PROTOTYPE_SCENARIO_MAP[activeScenarioId] ||
    PROTOTYPE_SCENARIO_MAP[DEFAULT_PROTOTYPE_SCENARIO_ID];

  const activeOfficerScenario =
    OFFICER_DEMO_SCENARIO_MAP[activeOfficerScenarioId] ||
    OFFICER_DEMO_SCENARIO_MAP[DEFAULT_OFFICER_SCENARIO_ID];

  const activeCommitteeScenario =
    COMMITTEE_DEMO_SCENARIO_MAP[activeCommitteeScenarioId] ||
    COMMITTEE_DEMO_SCENARIO_MAP[DEFAULT_COMMITTEE_SCENARIO_ID];

  // Keyboard shortcut (Alt + D) to restore or toggle toolbar visibility (Section 14)
  useEffect(() => {
    if (!IS_DEMO_MODE_ENABLED) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        if (isHiddenByUser) {
          onRestoreToolbar();
          setShowHiddenHint(false);
        } else {
          setIsExpanded((prev) => !prev);
        }
      } else if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHiddenByUser, isExpanded, onRestoreToolbar]);

  // Close popover when clicking outside
  useEffect(() => {
    if (!isExpanded) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded]);

  if (!IS_DEMO_MODE_ENABLED || !isVisible) {
    return null;
  }

  if (isHiddenByUser) {
    if (!showHiddenHint) return null;
    return (
      <div
        role="status"
        className="fixed bottom-4 right-4 z-50 bg-white border border-[#DCE7EE] text-[#172A3A] text-[12px] font-medium px-3.5 py-2 rounded-[10px] shadow-[0_6px_20px_rgba(15,35,53,0.10)] flex items-center gap-2.5 select-none print:hidden"
      >
        <span>Đã ẩn thanh trình diễn (Nhấn Alt + D hoặc mở /demo để hiện lại)</span>
        <button
          type="button"
          onClick={() => {
            onRestoreToolbar();
            setShowHiddenHint(false);
          }}
          className="text-[#0B64A0] font-bold hover:underline cursor-pointer"
        >
          Hiện lại
        </button>
      </div>
    );
  }

  const collapsedLabel = !isStaffMode
    ? activeStudentScenario.toolbarLabel
    : activeStaffRole === 'SCHOOL_OFFICER'
    ? 'Sơ tuyển: Nguyễn Văn An (ĐHĐN)'
    : activeStaffRole === 'ADMIN'
    ? 'Quản trị: Phạm Ngọc Lan'
    : activeStaffRole === 'CITY_COMMITTEE'
    ? `Hội đồng: ${activeCommitteeScenario.shortToolbarLabel}`
    : `Cán bộ: ${activeOfficerScenario.shortToolbarLabel}`;

  return (
    <div
      ref={containerRef}
      className="fixed bottom-4 right-4 z-50 select-none print:hidden"
    >
      {/* Expanded Scenario Popover */}
      {isExpanded && (
        <div
          role="dialog"
          aria-label="Chọn kịch bản trình diễn"
          className="mb-2 w-[348px] bg-white border border-[#D4E3EE] rounded-[12px] shadow-[0_12px_32px_rgba(15,35,53,0.14)] overflow-hidden text-[12.5px] text-[#172A3A]"
        >
          {/* Role Mode Switcher Tabs: Sinh viên vs Sơ tuyển Trường vs Cán bộ TP vs Quản lý vs Hội đồng vs Quản trị */}
          <div className="p-2 bg-[#F8FBFD] border-b border-[#E5EFF6]">
            <div className="grid grid-cols-6 gap-0.5 bg-[#E5EFF6] p-0.5 rounded-[8px]">
              <button
                type="button"
                onClick={() => setActiveTab('student')}
                className={`py-1.5 px-0.5 rounded-[6px] text-[9.5px] font-bold inline-flex items-center justify-center gap-0.5 transition-colors cursor-pointer ${
                  activeTab === 'student'
                    ? 'bg-white text-[#0F2335] shadow-2xs'
                    : 'text-[#526B7C] hover:text-[#0F2335]'
                }`}
              >
                <GraduationCap size={10} />
                <span>Sinh viên</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('school')}
                className={`py-1.5 px-0.5 rounded-[6px] text-[9.5px] font-bold inline-flex items-center justify-center gap-0.5 transition-colors cursor-pointer ${
                  activeTab === 'school'
                    ? 'bg-white text-[#0B64A0] shadow-2xs'
                    : 'text-[#526B7C] hover:text-[#0F2335]'
                }`}
              >
                <Building2 size={10} />
                <span>Trường</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('officer')}
                className={`py-1.5 px-0.5 rounded-[6px] text-[9.5px] font-bold inline-flex items-center justify-center gap-0.5 transition-colors cursor-pointer ${
                  activeTab === 'officer'
                    ? 'bg-white text-[#0B64A0] shadow-2xs'
                    : 'text-[#526B7C] hover:text-[#0F2335]'
                }`}
              >
                <UserCheck size={10} />
                <span>Cấp ĐHĐN</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('manager')}
                className={`py-1.5 px-0.5 rounded-[6px] text-[9.5px] font-bold inline-flex items-center justify-center gap-0.5 transition-colors cursor-pointer ${
                  activeTab === 'manager'
                    ? 'bg-white text-[#0B64A0] shadow-2xs'
                    : 'text-[#526B7C] hover:text-[#0F2335]'
                }`}
              >
                <Users size={10} />
                <span>Quản lý</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('committee')}
                className={`py-1.5 px-0.5 rounded-[6px] text-[9.5px] font-bold inline-flex items-center justify-center gap-0.5 transition-colors cursor-pointer ${
                  activeTab === 'committee'
                    ? 'bg-white text-[#0B64A0] shadow-2xs'
                    : 'text-[#526B7C] hover:text-[#0F2335]'
                }`}
              >
                <Scale size={10} />
                <span>Hội đồng</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('admin')}
                className={`py-1.5 px-0.5 rounded-[6px] text-[9.5px] font-bold inline-flex items-center justify-center gap-0.5 transition-colors cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-white text-[#7E22CE] shadow-2xs'
                    : 'text-[#526B7C] hover:text-[#0F2335]'
                }`}
              >
                <ShieldCheck size={10} />
                <span>Quản trị</span>
              </button>
            </div>
          </div>

          {activeTab === 'student' ? (
            /* 9 Student Scenarios List */
            <div className="py-1 max-h-[290px] overflow-y-auto divide-y divide-[#F1F6FA]">
              {PROTOTYPE_SCENARIOS.map((scenario) => {
                const isSelected =
                  !isStaffMode && scenario.id === activeScenarioId;
                return (
                  <button
                    key={scenario.id}
                    type="button"
                    onClick={() => {
                      onSelectScenario(scenario.id);
                      setIsExpanded(false);
                    }}
                    className={`w-full px-3.5 py-2 text-left flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#EAF6FC] text-[#0B64A0] font-bold'
                        : 'hover:bg-[#F5FAFE] text-[#172A3A] font-medium'
                    }`}
                  >
                    <span className="truncate">{scenario.label}</span>
                    {isSelected && (
                      <Check size={14} className="text-[#0B64A0] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          ) : activeTab === 'school' ? (
            /* School Officer Review Scenarios (Prompt S2) */
            <div className="py-1 max-h-[290px] overflow-y-auto divide-y divide-[#F1F6FA]">
              {onOpenSchoolQueue && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenSchoolQueue();
                    setIsExpanded(false);
                  }}
                  className="w-full px-3.5 py-2 text-left flex items-center justify-between gap-2 hover:bg-[#F5FAFE] text-[#0D78AE] font-bold cursor-pointer"
                >
                  <span>Bàn làm việc xét sơ tuyển (ĐHĐN)</span>
                  <span className="text-[11px] font-semibold">Mở →</span>
                </button>
              )}

              {SCHOOL_DEMO_SCENARIOS.map((sc) => {
                const isSelected =
                  isStaffMode &&
                  activeStaffRole === 'SCHOOL_OFFICER' &&
                  sc.id === activeSchoolScenarioId;
                return (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => {
                      onSelectSchoolScenario?.(sc.id);
                      setIsExpanded(false);
                    }}
                    className={`w-full px-3.5 py-2 text-left flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#EAF6FC] text-[#0B64A0] font-bold'
                        : 'hover:bg-[#F5FAFE] text-[#172A3A] font-medium'
                    }`}
                  >
                    <span className="truncate">
                      {sc.code}. {sc.shortLabel}
                    </span>
                    {isSelected && (
                      <Check size={14} className="text-[#0B64A0] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          ) : activeTab === 'officer' ? (
            /* Officer Review Scenarios (Prompt 17 Section 130) */
            <div className="py-1 max-h-[290px] overflow-y-auto divide-y divide-[#F1F6FA]">
              {onOpenOfficerQueue && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenOfficerQueue();
                    setIsExpanded(false);
                  }}
                  className="w-full px-3.5 py-2 text-left flex items-center justify-between gap-2 hover:bg-[#F5FAFE] text-[#0D78AE] font-bold cursor-pointer"
                >
                  <span>Danh sách Hồ sơ được phân công</span>
                  <span className="text-[11px] font-semibold">Mở →</span>
                </button>
              )}

              {OFFICER_DEMO_SCENARIOS.map((sc) => {
                const isSelected =
                  isStaffMode &&
                  activeStaffRole === 'CITY_OFFICER' &&
                  sc.id === activeOfficerScenarioId;
                return (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => {
                      onSelectOfficerScenario?.(sc.id);
                      setIsExpanded(false);
                    }}
                    className={`w-full px-3.5 py-2 text-left flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#EAF6FC] text-[#0B64A0] font-bold'
                        : 'hover:bg-[#F5FAFE] text-[#172A3A] font-medium'
                    }`}
                  >
                    <span className="truncate">
                      {sc.code}. {sc.label}
                    </span>
                    {isSelected && (
                      <Check size={14} className="text-[#0B64A0] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          ) : activeTab === 'committee' ? (
            /* Committee Review & Publication Scenarios (Prompt 19 Section 98) */
            <div className="py-1 max-h-[290px] overflow-y-auto divide-y divide-[#F1F6FA]">
              {COMMITTEE_DEMO_SCENARIOS.map((sc) => {
                const isSelected =
                  isStaffMode &&
                  activeStaffRole === 'CITY_COMMITTEE' &&
                  sc.id === activeCommitteeScenarioId;
                return (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => {
                      onSelectCommitteeScenario?.(sc.id);
                      setIsExpanded(false);
                    }}
                    className={`w-full px-3.5 py-2 text-left flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#EAF6FC] text-[#0B64A0] font-bold'
                        : 'hover:bg-[#F5FAFE] text-[#172A3A] font-medium'
                    }`}
                  >
                    <span className="truncate">{sc.label}</span>
                    {isSelected && (
                      <Check size={14} className="text-[#0B64A0] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          ) : activeTab === 'manager' ? (
            /* Manager Coordination Scenarios (Prompt 22 Section 25) */
            <div className="py-1 max-h-[290px] overflow-y-auto divide-y divide-[#F1F6FA]">
              {MANAGER_DEMO_SCENARIOS.map((sc) => {
                return (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => {
                      onSelectManagerScenario?.(sc.defaultRoute);
                      setIsExpanded(false);
                    }}
                    className="w-full px-3.5 py-2 text-left flex items-center justify-between gap-2 transition-colors cursor-pointer hover:bg-[#F5FAFE] text-[#172A3A] font-medium"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#EAF6FC] text-[#0B64A0] shrink-0">
                        {sc.code}
                      </span>
                      <span className="truncate">{sc.label}</span>
                    </div>
                    <span className="text-[11px] text-[#0B64A0] font-bold shrink-0">
                      Mở →
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            /* Admin Control Plane Routes (Prompt 21) */
            <div className="py-1 max-h-[290px] overflow-y-auto divide-y divide-[#F1F6FA]">
              {[
                { id: 'overview' as StaffRouteId, label: 'Tổng quan Quản trị' },
                {
                  id: 'admin_institutions' as StaffRouteId,
                  label: 'Đơn vị đào tạo (32 trường)',
                },
                {
                  id: 'admin_users' as StaffRouteId,
                  label: 'Người dùng & cán bộ (18 tài khoản)',
                },
                {
                  id: 'admin_season' as StaffRouteId,
                  label: 'Mùa xét chọn (2026–2027)',
                },
                {
                  id: 'admin_criteria' as StaffRouteId,
                  label: 'Cấu hình 05 tiêu chí',
                },
                {
                  id: 'admin_deadlines' as StaffRouteId,
                  label: 'Mốc thời gian',
                },
                {
                  id: 'admin_permissions' as StaffRouteId,
                  label: 'Quyền truy cập',
                },
                {
                  id: 'admin_audit' as StaffRouteId,
                  label: 'Lịch sử hoạt động',
                },
              ].map((adm) => {
                const isSelected =
                  isStaffMode && activeStaffRole === 'ADMIN';
                return (
                  <button
                    key={adm.id}
                    type="button"
                    onClick={() => {
                      onSelectAdminRoute?.(adm.id);
                      setIsExpanded(false);
                    }}
                    className="w-full px-3.5 py-2 text-left flex items-center justify-between gap-2 transition-colors cursor-pointer hover:bg-[#FAF5FF] text-[#172A3A] hover:text-[#7E22CE] font-medium"
                  >
                    <span className="truncate">{adm.label}</span>
                    <span className="text-[11px] text-[#A855F7] font-bold">Mở →</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Footer Controls */}
          <div className="p-2 bg-[#F8FBFD] border-t border-[#E5EFF6] flex flex-col gap-1">
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => {
                  onResetScenario();
                  setIsExpanded(false);
                }}
                className="flex items-center justify-center gap-1.5 h-[30px] px-2.5 rounded-[7px] bg-white hover:bg-[#F1F7FB] border border-[#DCE7EE] text-[#172A3A] text-[11.5px] font-semibold transition-colors cursor-pointer"
              >
                <RotateCcw size={12} className="text-[#4A6275]" />
                <span>Đặt lại kịch bản</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onOpenDemoLauncher();
                  setIsExpanded(false);
                }}
                className="flex items-center justify-center gap-1.5 h-[30px] px-2.5 rounded-[7px] bg-white hover:bg-[#F1F7FB] border border-[#DCE7EE] text-[#172A3A] text-[11.5px] font-semibold transition-colors cursor-pointer"
              >
                <LayoutGrid size={12} className="text-[#0B64A0]" />
                <span>Về màn hình Demo</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-1 px-1">
              {isOnPublicPage ? (
                <button
                  type="button"
                  onClick={() => {
                    onEnterStudentApp();
                    setIsExpanded(false);
                  }}
                  className="text-[11.5px] font-semibold text-[#0B64A0] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Globe size={11.5} />
                  <span>Vào ứng dụng sinh viên</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onOpenPublicEntry();
                    setIsExpanded(false);
                  }}
                  className="text-[11.5px] font-semibold text-[#4A6275] hover:text-[#172A3A] flex items-center gap-1 cursor-pointer"
                >
                  <Globe size={11.5} />
                  <span>Xem trang công khai</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsExpanded(false);
                  onHideToolbar();
                  setShowHiddenHint(true);
                  setTimeout(() => setShowHiddenHint(false), 3800);
                }}
                className="text-[11.5px] font-medium text-[#607483] hover:text-[#172A3A] flex items-center gap-1 cursor-pointer"
              >
                <EyeOff size={11.5} />
                <span>Ẩn thanh Demo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Collapsed Pill (~38px height, neutral white surface, soft shadow — Sections 11 & 12) */}
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        aria-expanded={isExpanded}
        aria-label={`Chế độ trình diễn: ${collapsedLabel}`}
        className="h-[38px] px-3.5 rounded-full bg-white hover:bg-[#F8FBFD] border border-[#D4E3EE] shadow-[0_6px_18px_rgba(15,35,53,0.10)] text-[#172A3A] text-[12.5px] font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer"
      >
        <span className="w-2 h-2 rounded-full bg-[#0B64A0] shrink-0" />
        <span className="text-[#526B7C] font-medium">Demo</span>
        <span className="text-[#B8CAD8]">·</span>
        <span className="font-bold text-[#0F2335]">{collapsedLabel}</span>
        {isExpanded ? (
          <ChevronUp size={13.5} className="text-[#526B7C] ml-0.5" />
        ) : (
          <ChevronDown size={13.5} className="text-[#526B7C] ml-0.5" />
        )}
      </button>
    </div>
  );
};
