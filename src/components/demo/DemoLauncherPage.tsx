/**
 * 5TOT ĐHĐN — Prototype Demo Launcher (/demo)
 * Cơ quan quản lý: Đoàn Thanh niên - Hội Sinh viên Đại học Đà Nẵng
 * Đơn vị tổ chức / vận hành nghiệp vụ: Hội Sinh viên Việt Nam Đại học Đà Nẵng
 *
 * Implements Prompt 14.9 Sections 6–10 + Prompt 17 Section 130:
 * - Clean internal presentation surface using the 5TOT design system.
 * - Allows presenters and stakeholders to launch:
 *   1. Cán bộ xét duyệt (Officer Review Workspace scenarios + Assigned Queue)
 *   2. Sinh viên (9 canonical Student lifecycle scenarios)
 */

import React from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  FileEdit,
  FilePlus2,
  AlertCircle,
  Send,
  Award,
  Globe,
  RotateCcw,
  FileCheck2,
  UserCheck,
  FolderKanban,
  Scale,
  ShieldCheck,
  Users,
  Building2,
} from 'lucide-react';
import { HsvEmblem } from '../brand/HsvLogo';
import { StaffRouteId } from '../../staff/types';
import { MANAGER_DEMO_SCENARIOS } from '../../staff/fixtures/demoScenarios';
import {
  PROTOTYPE_SCENARIOS,
  PrototypeScenarioConfig,
  PrototypeScenarioId,
} from '../../demo/prototypeDemoMode';
import { OfficerDemoScenarioId } from '../../staff/reviewTypes';
import {
  OFFICER_DEMO_SCENARIOS,
  DEFAULT_OFFICER_SCENARIO_ID,
} from '../../staff/fixtures/officerReviewFixtures';
import { CommitteeDemoScenarioId } from '../../staff/committeeTypes';
import {
  COMMITTEE_DEMO_SCENARIOS,
  DEFAULT_COMMITTEE_SCENARIO_ID,
} from '../../staff/fixtures/committeeFixtures';
import {
  SCHOOL_DEMO_SCENARIOS,
  SchoolDemoScenarioId,
} from '../../staff/fixtures/schoolReviewFixtures';

export interface DemoLauncherPageProps {
  activeScenarioId: PrototypeScenarioId;
  activeOfficerScenarioId?: OfficerDemoScenarioId;
  activeCommitteeScenarioId?: CommitteeDemoScenarioId;
  activeSchoolScenarioId?: SchoolDemoScenarioId;
  onLaunchScenario: (scenarioId: PrototypeScenarioId) => void;
  onLaunchOfficerScenario?: (scenarioId: OfficerDemoScenarioId) => void;
  onLaunchCommitteeScenario?: (scenarioId: CommitteeDemoScenarioId) => void;
  onLaunchSchoolScenario?: (scenarioId: SchoolDemoScenarioId) => void;
  onLaunchManagerScenario?: (routeId: StaffRouteId) => void;
  onLaunchAdminRoute?: (routeId: StaffRouteId) => void;
  onOpenOfficerQueue?: () => void;
  onOpenSchoolQueue?: () => void;
  onResetCurrentScenario: () => void;
  onOpenPublicEntry: () => void;
  onEnterStudentApp: () => void;
  onLaunchCollectivePortal?: () => void;
}

function renderScenarioIcon(scenario: PrototypeScenarioConfig) {
  switch (scenario.id) {
    case 'new_student':
      return <FilePlus2 size={17} className="text-[#4A6275]" />;
    case 'draft':
      return <FileEdit size={17} className="text-[#0D78AE]" />;
    case 'ready_to_submit':
      return <FileCheck2 size={17} className="text-[#0D78AE]" />;
    case 'under_review':
      return <Clock size={17} className="text-[#0D78AE]" />;
    case 'supplement_required':
      return <AlertCircle size={17} className="text-[#B75B00]" />;
    case 'supplement_submitted':
      return <Send size={17} className="text-[#0D78AE]" />;
    case 'waiting_final':
      return <Clock size={17} className="text-[#0D78AE]" />;
    case 'final_recognized':
      return <Award size={17} className="text-[#1A934E]" />;
    case 'final_not_recognized':
    default:
      return <CheckCircle2 size={17} className="text-[#4A6275]" />;
  }
}

function getIconBadgeClasses(tone: PrototypeScenarioConfig['tone']) {
  switch (tone) {
    case 'warning':
      return 'bg-[#FEF6EB] border-[#FADDB6]';
    case 'success':
      return 'bg-[#EAFBF1] border-[#B6E6C9]';
    case 'brand':
      return 'bg-[#EAF6FC] border-[#CBE5F6]';
    case 'neutral':
    default:
      return 'bg-[#F3F7FA] border-[#DCE7EE]';
  }
}

export const DemoLauncherPage: React.FC<DemoLauncherPageProps> = ({
  activeScenarioId,
  activeOfficerScenarioId = DEFAULT_OFFICER_SCENARIO_ID,
  activeCommitteeScenarioId = DEFAULT_COMMITTEE_SCENARIO_ID,
  activeSchoolScenarioId = 'B_school_under_review',
  onLaunchScenario,
  onLaunchOfficerScenario,
  onLaunchCommitteeScenario,
  onLaunchSchoolScenario,
  onLaunchManagerScenario,
  onLaunchAdminRoute,
  onOpenOfficerQueue,
  onOpenSchoolQueue,
  onResetCurrentScenario,
  onOpenPublicEntry,
  onEnterStudentApp,
  onLaunchCollectivePortal,
}) => {
  const activeScenario =
    PROTOTYPE_SCENARIOS.find((s) => s.id === activeScenarioId) ||
    PROTOTYPE_SCENARIOS[1];

  return (
    <div className="min-h-screen bg-[#F3F8FC] text-[#172A3A] flex flex-col">
      {/* Top Institutional Bar */}
      <header className="w-full bg-white border-b border-[#DCE7EE]">
        <div className="max-w-[1040px] mx-auto px-6 h-[68px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <HsvEmblem size={38} />
            <div className="flex flex-col leading-tight min-w-0">
              <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#4A6275]">
                ĐẠI HỌC ĐÀ NẴNG · HỘI SINH VIÊN VIỆT NAM ĐẠI HỌC ĐÀ NẴNG
              </span>
              <span className="text-[14.5px] font-extrabold text-[#0B64A0] tracking-tight truncate">
                Hệ thống xét duyệt Sinh viên 5 tốt cấp Đại học Đà Nẵng
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onOpenPublicEntry}
              className="inline-flex items-center gap-1.5 h-[36px] px-3.5 rounded-[8px] bg-white hover:bg-[#F3F8FC] border border-[#CFE0EC] text-[#172A3A] text-[13px] font-semibold transition-colors cursor-pointer"
            >
              <Globe size={14} className="text-[#0D78AE]" />
              <span>Xem trang công khai</span>
            </button>

            {onLaunchCollectivePortal && (
              <button
                type="button"
                onClick={onLaunchCollectivePortal}
                className="inline-flex items-center gap-1.5 h-[36px] px-3.5 rounded-[8px] bg-[#EAF6FC] hover:bg-[#D5EBF8] border border-[#CBE5F6] text-[#0D78AE] text-[13px] font-bold transition-colors cursor-pointer"
              >
                <Users size={14} className="text-[#0D78AE]" />
                <span>Cổng Tập thể SV5T</span>
              </button>
            )}

            {onOpenSchoolQueue && (
              <button
                type="button"
                onClick={onOpenSchoolQueue}
                className="inline-flex items-center gap-1.5 h-[36px] px-3.5 rounded-[8px] bg-white hover:bg-[#F3F8FC] border border-[#CFE0EC] text-[#0B64A0] text-[13px] font-bold transition-colors cursor-pointer"
              >
                <Building2 size={14} className="text-[#0D78AE]" />
                <span>Xét sơ cấp Trường (ĐHĐN)</span>
              </button>
            )}

            {onOpenOfficerQueue && (
              <button
                type="button"
                onClick={onOpenOfficerQueue}
                className="inline-flex items-center gap-1.5 h-[36px] px-3.5 rounded-[8px] bg-[#0F2335] hover:bg-[#1B3752] text-white text-[13px] font-bold transition-colors cursor-pointer"
              >
                <FolderKanban size={14} className="text-[#7CC4EE]" />
                <span>Thẩm định cấp ĐHĐN</span>
              </button>
            )}

            <button
              type="button"
              onClick={onEnterStudentApp}
              className="inline-flex items-center gap-1.5 h-[36px] px-3.5 rounded-[8px] bg-[#0B64A0] hover:bg-[#095386] text-white text-[13px] font-bold shadow-2xs transition-colors cursor-pointer"
            >
              <span>Vào ứng dụng sinh viên</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Launcher Content */}
      <main className="flex-1 w-full max-w-[1040px] mx-auto px-6 py-8 space-y-8">
        {/* Title & Active Scenario Summary */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-[6px] bg-[#E5F4FC] text-[#0B64A0] text-[11.5px] font-bold mb-2">
              <span>5TOT ĐHĐN</span>
              <span>·</span>
              <span>Năm học 2025–2026</span>
            </div>
            <h1 className="text-[24px] sm:text-[26px] font-extrabold text-[#0F2335] tracking-tight leading-tight">
              5TOT ĐHĐN — Chế độ trình diễn
            </h1>
            <p className="text-[14px] text-[#4A6275] mt-1">
              Chọn kịch bản của Hội đồng xét chọn, Cán bộ xét duyệt hoặc Sinh viên để kiểm thử đầy đủ quy trình cấp Đại học Đà Nẵng.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-[12.5px] text-[#4A6275] font-medium">
              Đang chọn:{' '}
              <strong className="font-bold text-[#172A3A]">
                {activeScenario.label}
              </strong>
            </span>
            <button
              type="button"
              onClick={onResetCurrentScenario}
              title="Đặt lại dữ liệu gốc của kịch bản hiện tại"
              className="inline-flex items-center gap-1.5 h-[32px] px-2.5 rounded-[7px] bg-white hover:bg-[#F3F8FC] border border-[#DCE7EE] text-[#4A6275] hover:text-[#172A3A] text-[12px] font-semibold transition-colors cursor-pointer"
            >
              <RotateCcw size={12.5} />
              <span>Đặt lại kịch bản</span>
            </button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* SECTION 0A: SCHOOL OFFICER PRELIMINARY REVIEW (Prompt S2)         */}
        {/* ================================================================= */}
        {onLaunchSchoolScenario && (
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Building2 size={18} className="text-[#0B64A0]" />
                <h2 className="text-[16px] font-extrabold text-[#0F2335]">
                  Cán bộ xét sơ tuyển cấp Trường (Nguyễn Văn An — Đại học Đà Nẵng)
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {onOpenSchoolQueue && (
                  <button
                    type="button"
                    onClick={onOpenSchoolQueue}
                    className="text-[12px] font-bold text-[#0D78AE] hover:underline cursor-pointer"
                  >
                    Mở Bàn làm việc xét sơ →
                  </button>
                )}
                <span className="text-[12px] font-semibold text-[#526B7C]">
                  12 trường thành viên ĐH Đà Nẵng
                </span>
              </div>
            </div>

            <div className="bg-white rounded-[14px] border border-[#DCE7EE] shadow-2xs divide-y divide-[#E6EFF5] overflow-hidden">
              {SCHOOL_DEMO_SCENARIOS.map((sc) => {
                const isSelected = sc.id === activeSchoolScenarioId;
                return (
                  <div
                    key={sc.id}
                    className={`px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                      isSelected ? 'bg-[#F4FAFE]' : 'hover:bg-[#F9FCFE]'
                    }`}
                  >
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                      <div className="w-10 h-9 rounded-[10px] bg-[#EAF6FC] border border-[#CBE5F6] text-[#0B64A0] font-extrabold text-[12px] flex items-center justify-center shrink-0">
                        {sc.code}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[14.5px] font-bold text-[#172A3A]">
                            {sc.label}
                          </span>
                          {sc.id === 'B_school_under_review' && (
                            <span className="px-2 py-0.5 rounded-[5px] bg-[#E5F4FC] text-[#0B64A0] text-[11px] font-bold">
                              Kịch bản chính
                            </span>
                          )}
                        </div>
                        <p className="text-[12.5px] text-[#4A6275] mt-0.5 line-clamp-2">
                          {sc.description}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onLaunchSchoolScenario(sc.id)}
                      className="inline-flex items-center justify-center gap-1.5 h-[34px] px-3.5 rounded-[8px] bg-white hover:bg-[#EAF6FC] border border-[#DCE7EE] hover:border-[#BCE0F5] text-[#0B64A0] text-[12.5px] font-bold transition-all shrink-0 cursor-pointer shadow-2xs"
                    >
                      <span>Vào xét sơ</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ================================================================= */}
        {/* SECTION 0: COMMITTEE REVIEW & FINAL DECISION SCENARIOS (Prompt 19)*/}
        {/* ================================================================= */}
        {onLaunchCommitteeScenario && (
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Scale size={18} className="text-[#0B64A0]" />
                <h2 className="text-[16px] font-extrabold text-[#0F2335]">
                  Hội đồng xét chọn &amp; Quyết định cuối (Lê Minh Quân)
                </h2>
              </div>
              <span className="text-[12px] font-semibold text-[#526B7C]">
                Hồ sơ trong phạm vi Hội đồng · Năm học 2025–2026
              </span>
            </div>

            <div className="bg-white rounded-[14px] border border-[#DCE7EE] shadow-2xs divide-y divide-[#E6EFF5] overflow-hidden">
              {COMMITTEE_DEMO_SCENARIOS.map((sc) => {
                const isSelected = sc.id === activeCommitteeScenarioId;
                return (
                  <div
                    key={sc.id}
                    className={`px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                      isSelected ? 'bg-[#F4FAFE]' : 'hover:bg-[#F9FCFE]'
                    }`}
                  >
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                      <div className="w-10 h-9 rounded-[10px] bg-[#EAF6FC] border border-[#CBE5F6] text-[#0B64A0] font-extrabold text-[12px] flex items-center justify-center shrink-0">
                        {sc.code}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[14.5px] font-bold text-[#172A3A]">
                            {sc.label}
                          </span>
                          {sc.id === 'committee_needs_review' && (
                            <span className="px-2 py-0.5 rounded-[5px] bg-[#E5F4FC] text-[#0B64A0] text-[11px] font-bold">
                              Kịch bản chính
                            </span>
                          )}
                        </div>
                        <p className="text-[13px] text-[#526B7C] mt-0.5 leading-snug">
                          {sc.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end shrink-0">
                      <button
                        type="button"
                        onClick={() => onLaunchCommitteeScenario(sc.id)}
                        className="inline-flex items-center gap-1.5 h-[36px] px-4 rounded-[8px] bg-[#0B64A0] hover:bg-[#095386] text-white text-[13px] font-bold transition-all cursor-pointer whitespace-nowrap"
                      >
                        <span>Mở Hội đồng xét chọn</span>
                        <ArrowRight size={13.5} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ================================================================= */}
        {/* SECTION 0.8: MANAGER COORDINATION & ASSIGNMENT (Prompt 22 Sec 25) */}
        {/* ================================================================= */}
        {onLaunchManagerScenario && (
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-[#0D78AE]" />
                <h2 className="text-[16px] font-extrabold text-[#0F2335]">
                  Quản lý xét duyệt &amp; Điều phối hồ sơ (Nguyễn Thu Hà)
                </h2>
              </div>
              <span className="text-[12px] font-semibold text-[#526B7C]">
                Ban Thư ký · Phân công, theo dõi tiến độ và khối lượng cán bộ
              </span>
            </div>

            <div className="bg-white rounded-[14px] border border-[#DCE7EE] shadow-2xs divide-y divide-[#E6EFF5] overflow-hidden">
              {MANAGER_DEMO_SCENARIOS.map((sc) => (
                <div
                  key={sc.id}
                  className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-[#F8FCFF]"
                >
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <div className="w-14 h-9 rounded-[10px] bg-[#EAF6FC] border border-[#CBE5F6] text-[#0B64A0] font-extrabold text-[11px] tracking-tight flex items-center justify-center shrink-0">
                      {sc.code}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[14.5px] font-bold text-[#172A3A]">
                          {sc.label}
                        </span>
                        {sc.id === 'manager_active_season' && (
                          <span className="px-2 py-0.5 rounded-[5px] bg-[#E5F4FC] text-[#0B64A0] text-[11px] font-bold">
                            Kịch bản chính
                          </span>
                        )}
                      </div>
                      <p className="text-[13px] text-[#526B7C] mt-0.5 leading-snug">
                        {sc.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end shrink-0">
                    <button
                      type="button"
                      onClick={() => onLaunchManagerScenario(sc.defaultRoute)}
                      className="inline-flex items-center gap-1.5 h-[36px] px-4 rounded-[8px] bg-[#0F2335] hover:bg-[#1A354E] text-white text-[13px] font-bold transition-all cursor-pointer whitespace-nowrap shadow-2xs"
                    >
                      <span>Vào điều phối</span>
                      <ArrowRight size={13.5} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ================================================================= */}
        {/* SECTION 0.9: COLLECTIVE APPLICATION PORTAL (Direct-to-City Track)  */}
        {/* ================================================================= */}
        {onLaunchCollectivePortal && (
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-[#0D78AE]" />
                <h2 className="text-[16px] font-extrabold text-[#0F2335]">
                  Cổng Kê khai Tập thể "Sinh viên 5 tốt" (Chi hội 21TCLC_DT1)
                </h2>
              </div>
              <span className="text-[12px] font-semibold text-[#526B7C]">
                Quy trình Nộp trực tiếp lên cấp Đại học Đà Nẵng · 04 Tiêu chuẩn TT01–TT04
              </span>
            </div>

            <div className="bg-white rounded-[14px] border border-[#DCE7EE] shadow-2xs divide-y divide-[#E6EFF5] overflow-hidden">
              <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-[#F8FCFF]">
                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                  <div className="w-14 h-9 rounded-[10px] bg-[#EAF6FC] border border-[#CBE5F6] text-[#0D78AE] font-extrabold text-[11px] tracking-tight flex items-center justify-center shrink-0">
                    TT-2026
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[14.5px] font-bold text-[#172A3A]">
                        Chi hội 21TCLC_DT1 — Trường ĐH Bách khoa (ĐH Đà Nẵng)
                      </span>
                      <span className="px-2 py-0.5 rounded-[5px] bg-[#EDF9F1] text-[#16A34A] border border-[#C6EED5] text-[11px] font-bold">
                        Nộp trực tiếp TP
                      </span>
                    </div>
                    <p className="text-[13px] text-[#526B7C] mt-0.5 leading-snug">
                      Phụ trách: Nguyễn Thị Mai (mai.nt@dut.udn.vn) · Kê khai TT01 (Cấp trường), TT02 (100% phong trào), TT03 (21.43% SV5T trường), TT04 (Không vi phạm) và nộp trực tiếp cấp ĐHĐN.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end shrink-0">
                  <button
                    type="button"
                    onClick={onLaunchCollectivePortal}
                    className="inline-flex items-center gap-1.5 h-[36px] px-4 rounded-[8px] bg-[#0D78AE] hover:bg-[#0B64A0] text-white text-[13px] font-bold transition-all cursor-pointer whitespace-nowrap shadow-2xs"
                  >
                    <span>Vào Cổng Tập thể</span>
                    <ArrowRight size={13.5} />
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ================================================================= */}
        {/* SECTION 1: OFFICER REVIEW WORKSPACE SCENARIOS (Prompt 17 Sec 130) */}
        {/* ================================================================= */}
        {onLaunchOfficerScenario && (
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <UserCheck size={18} className="text-[#0D78AE]" />
                <h2 className="text-[16px] font-extrabold text-[#0F2335]">
                  Không gian xét duyệt hồ sơ của Cán bộ (Trần Hoàng Nam)
                </h2>
              </div>
              {onOpenOfficerQueue && (
                <button
                  type="button"
                  onClick={onOpenOfficerQueue}
                  className="text-[12.5px] font-bold text-[#0D78AE] hover:underline cursor-pointer"
                >
                  Mở danh sách Hồ sơ được phân công →
                </button>
              )}
            </div>

            <div className="bg-white rounded-[14px] border border-[#DCE7EE] shadow-2xs divide-y divide-[#E6EFF5] overflow-hidden">
              {OFFICER_DEMO_SCENARIOS.map((sc) => {
                const isSelected = sc.id === activeOfficerScenarioId;
                return (
                  <div
                    key={sc.id}
                    className={`px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                      isSelected ? 'bg-[#F4FAFE]' : 'hover:bg-[#F9FCFE]'
                    }`}
                  >
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                      <div className="w-9 h-9 rounded-[10px] bg-[#EAF6FC] border border-[#CBE5F6] text-[#0B64A0] font-extrabold text-[13px] flex items-center justify-center shrink-0">
                        {sc.code}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[14.5px] font-bold text-[#172A3A]">
                            {sc.label}
                          </span>
                          {sc.id === 'B_in_review_primary' && (
                            <span className="px-2 py-0.5 rounded-[5px] bg-[#E5F4FC] text-[#0B64A0] text-[11px] font-bold">
                              Kịch bản chính
                            </span>
                          )}
                        </div>
                        <p className="text-[13px] text-[#526B7C] mt-0.5 leading-snug">
                          {sc.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end shrink-0">
                      <button
                        type="button"
                        onClick={() => onLaunchOfficerScenario(sc.id)}
                        className="inline-flex items-center gap-1.5 h-[36px] px-4 rounded-[8px] bg-[#0F2335] hover:bg-[#1A354E] text-white text-[13px] font-bold transition-all cursor-pointer whitespace-nowrap"
                      >
                        <span>Mở không gian xét</span>
                        <ArrowRight size={13.5} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ================================================================= */}
        {/* SECTION 1.5: ADMIN CONTROL PLANE (Prompt 21 — Phạm Ngọc Lan)      */}
        {/* ================================================================= */}
        {onLaunchAdminRoute && (
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-[#7E22CE]" />
                <h2 className="text-[16px] font-extrabold text-[#0F2335]">
                  Bàn điều khiển Quản trị hệ thống (Phạm Ngọc Lan)
                </h2>
              </div>
              <span className="text-[12px] font-semibold text-[#526B7C]">
                Toàn quyền cấu hình · 09 Trường thành viên ĐHĐN · 05 Tiêu chí cấp Đại học Đà Nẵng
              </span>
            </div>

            <div className="bg-white rounded-[14px] border border-[#DCE7EE] shadow-2xs divide-y divide-[#E6EFF5] overflow-hidden">
              {[
                {
                  routeId: 'overview' as StaffRouteId,
                  code: 'TỔNG QUAN',
                  title: 'Tổng quan Quản trị & Cảnh báo an toàn hệ thống',
                  desc: 'Theo dõi mốc thời gian, trạng thái mùa xét 2025–2026 (Hạn nhận hồ sơ: 10/11/2026), đơn vị chưa nộp và tài khoản chờ kích hoạt.',
                },
                {
                  routeId: 'admin_institutions' as StaffRouteId,
                  code: 'ĐƠN VỊ',
                  title: 'Quản lý 09 Trường & Đơn vị thành viên Đại học Đà Nẵng',
                  desc: 'Đầy đủ 09 trường/viện/khoa/phân hiệu thuộc ĐH Đà Nẵng; cơ chế sơ tuyển cấp trường, địa chỉ và mã định danh.',
                },
                {
                  routeId: 'admin_users' as StaffRouteId,
                  code: 'CÁN BỘ',
                  title: 'Người dùng & Phân quyền cán bộ cấp Đại học Đà Nẵng',
                  desc: 'Quản lý 13 tài khoản cán bộ sơ tuyển cấp trường, xét duyệt, quản lý, hội đồng; kích hoạt an toàn trước khi đổi quyền.',
                },
                {
                  routeId: 'admin_criteria' as StaffRouteId,
                  code: 'TIÊU CHÍ',
                  title: 'Cấu hình chuẩn hóa 05 tiêu chí & Quản lý phiên bản',
                  desc: 'Bảo toàn tuyệt đối 5 tiêu chí; nhóm điều kiện, số lượng minh chứng, bộ thu thập thành tích và xem trước giao diện sinh viên.',
                },
                {
                  routeId: 'admin_deadlines' as StaffRouteId,
                  code: 'MỐC GIỜ',
                  title: 'Mốc thời gian xét chọn & Khóa cứng cổng nộp',
                  desc: 'Quản lý mốc tiếp nhận, bổ sung, hội đồng và công bố; cơ chế Hard Gate bảo vệ tính toàn vẹn kèm nhật ký bắt buộc.',
                },
                {
                  routeId: 'admin_audit' as StaffRouteId,
                  code: 'NHẬT KÝ',
                  title: 'Lịch sử hoạt động & Kiểm toán nghiệp vụ (Audit Log)',
                  desc: 'Nhật ký bất biến ghi nhận chi tiết người thực hiện, lý do, giá trị trước/sau; tìm kiếm và lọc đa chiều.',
                },
              ].map((item) => (
                <div
                  key={item.routeId}
                  className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-[#FAF5FF]"
                >
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <div className="w-16 h-9 rounded-[10px] bg-[#FAF5FF] border border-[#E9D5FF] text-[#7E22CE] font-extrabold text-[10.5px] tracking-tight flex items-center justify-center shrink-0">
                      {item.code}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[14.5px] font-bold text-[#172A3A]">
                          {item.title}
                        </span>
                      </div>
                      <p className="text-[13px] text-[#526B7C] mt-0.5 leading-snug">
                        {item.desc}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end shrink-0">
                    <button
                      type="button"
                      onClick={() => onLaunchAdminRoute(item.routeId)}
                      className="inline-flex items-center gap-1.5 h-[36px] px-4 rounded-[8px] bg-[#7E22CE] hover:bg-[#6B21A8] text-white text-[13px] font-bold transition-all cursor-pointer whitespace-nowrap shadow-2xs"
                    >
                      <span>Vào quản trị</span>
                      <ArrowRight size={13.5} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ================================================================= */}
        {/* SECTION 2: 9 CANONICAL STUDENT SCENARIOS                          */}
        {/* ================================================================= */}
        <section className="space-y-3">
          <h2 className="text-[16px] font-extrabold text-[#0F2335]">
            Hành trình hồ sơ của Sinh viên (Nguyễn Minh Anh · MSSV: 102220123)
          </h2>

          <div
            aria-label="Danh sách trạng thái trình diễn sinh viên"
            className="bg-white rounded-[14px] border border-[#DCE7EE] shadow-2xs divide-y divide-[#E6EFF5] overflow-hidden"
          >
            {PROTOTYPE_SCENARIOS.map((scenario) => {
              const isSelected = scenario.id === activeScenarioId;

              return (
                <div
                  key={scenario.id}
                  className={`px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                    isSelected ? 'bg-[#F4FAFE]' : 'hover:bg-[#F9FCFE]'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-[10px] border flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 ${getIconBadgeClasses(
                        scenario.tone
                      )}`}
                    >
                      {renderScenarioIcon(scenario)}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[14.5px] font-bold text-[#172A3A]">
                          {scenario.label}
                        </span>
                        {scenario.isDefault && (
                          <span className="px-2 py-0.5 rounded-[5px] bg-[#E5F4FC] text-[#0B64A0] text-[11px] font-bold">
                            Mặc định
                          </span>
                        )}
                        {isSelected && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[5px] bg-[#EAFBF1] text-[#136F3A] text-[11px] font-bold">
                            <CheckCircle2 size={11.5} />
                            <span>Đang kích hoạt</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[13px] text-[#526B7C] mt-0.5 leading-snug">
                        {scenario.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end shrink-0">
                    <button
                      type="button"
                      onClick={() => onLaunchScenario(scenario.id)}
                      className={`inline-flex items-center gap-1.5 h-[36px] px-4 rounded-[8px] text-[13px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                        isSelected
                          ? 'bg-[#0B64A0] hover:bg-[#095386] text-white shadow-2xs'
                          : 'bg-[#F2F8FC] hover:bg-[#E3F1FA] text-[#0B64A0] border border-[#CBE2F2]'
                      }`}
                    >
                      <span>Trình diễn</span>
                      <ArrowRight size={13.5} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
};
