/**
 * 5TOT ĐHĐN — Supplement Dev Scenario Toolbar
 * Implements Prompt 10 Section 68: Development Demo States
 * Discrete QA control panel for verifying all 6+ supplement edge cases.
 */

import { useState } from 'react';
import { Layers, ChevronDown, ChevronUp, RotateCcw, CheckCircle2 } from 'lucide-react';
import {
  SupplementDemoStateId,
  SUPPLEMENT_DEMO_SCENARIOS,
  SupplementScenarioConfig,
} from '../../demo/fixtures/supplementScenarios';
import { useDevQaMode } from '../../demo/useDevQaMode';

export interface SupplementDevToolbarProps {
  currentScenarioId: SupplementDemoStateId;
  onSelectScenario: (scenario: SupplementScenarioConfig) => void;
  onReset: () => void;
  className?: string;
}

export const SupplementDevToolbar: React.FC<SupplementDevToolbarProps> = ({
  currentScenarioId,
  onSelectScenario,
  onReset,
  className = '',
}) => {
  const [isQaMode] = useDevQaMode();
  const [isOpen, setIsOpen] = useState(false);
  const activeConfig = SUPPLEMENT_DEMO_SCENARIOS[currentScenarioId];

  if (!isQaMode) return null;

  return (
    <div
      role="region"
      aria-label="Khung kiểm thử nghiệp vụ Bổ sung hồ sơ"
      className={`bg-white border border-[#DCE7EE] rounded-[10px] shadow-xs overflow-hidden text-[12px] select-none ${className}`}
    >
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="px-3.5 py-2 bg-[#F8FAFC] flex items-center justify-between cursor-pointer hover:bg-[#F1F5F9] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Layers size={13.5} className="text-[#0D78AE]" />
          <span className="font-bold text-[#172A3A]">
            Kiểm thử Bổ sung hồ sơ (Prompt 10 QA)
          </span>
          <span className="text-[#B9CCD9]">·</span>
          <span className="text-[#64748B] font-medium truncate max-w-[260px]">
            {activeConfig.label}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onReset();
            }}
            title="Khôi phục trạng thái ban đầu"
            className="p-1 text-[#64748B] hover:text-[#172A3A] hover:bg-white rounded transition-colors"
          >
            <RotateCcw size={12} />
          </button>
          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </div>

      {isOpen && (
        <div className="p-3 bg-white border-t border-[#E2E8F0] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {Object.values(SUPPLEMENT_DEMO_SCENARIOS).map((scenario) => {
            const isSelected = scenario.id === currentScenarioId;

            return (
              <button
                key={scenario.id}
                type="button"
                onClick={() => {
                  onSelectScenario(scenario);
                }}
                className={`p-2.5 rounded-[8px] border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#0284C7] bg-[#F0F9FF] shadow-2xs'
                    : 'border-[#E2E8F0] hover:border-[#CBD5E1] bg-white'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`font-bold text-[12px] ${
                      isSelected ? 'text-[#0369A1]' : 'text-[#1E293B]'
                    }`}
                  >
                    {scenario.label}
                  </span>
                  {isSelected && (
                    <CheckCircle2 size={13} className="text-[#0284C7] shrink-0" />
                  )}
                </div>
                <span className="text-[11px] text-[#64748B] leading-snug line-clamp-2">
                  {scenario.description}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
