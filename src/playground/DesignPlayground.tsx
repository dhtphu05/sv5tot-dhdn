import React, { useState } from 'react';
import {
  BookOpen,
  FileText,
  Layers,
} from 'lucide-react';
import { ProductBrandLockup } from '../components/brand/HsvLogo';
import { DomainAuditDevView } from '../components/dev/DomainAuditDevView';
import { InteractiveAppTab } from './tabs/InteractiveAppTab';
import { TokensTab } from './tabs/TokensTab';
import { PrimitivesTab } from './tabs/PrimitivesTab';
import { StatesTab } from './tabs/StatesTab';

export const DesignPlayground: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'domain_audit' | 'interactive_app' | 'tokens' | 'primitives' | 'states'
  >('domain_audit');

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F]">
      {/* Top Review Board Nav Bar */}
      <div className="bg-white border-b border-black/[0.06] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ProductBrandLockup size={28} badgeLabel="Design System Foundation" />
            <span className="text-[#86868B] text-[13px] hidden md:inline">|</span>
            <span className="text-[13px] text-[#6E6E73] hidden md:inline font-medium">
              Đoàn Thanh niên – Hội Sinh viên Đại học Đà Nẵng
            </span>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 bg-[#F5F5F7] p-1 rounded-[10px]">
            <button
              onClick={() => setActiveTab('domain_audit')}
              className={`px-3 py-1.5 text-[12.5px] font-medium rounded-[7px] transition-all flex items-center gap-1.5 ${
                activeTab === 'domain_audit'
                  ? 'bg-white text-[#1D1D1F] font-semibold shadow-xs'
                  : 'text-[#6E6E73] hover:text-[#1D1D1F]'
              }`}
            >
              <FileText size={14} className={activeTab === 'domain_audit' ? 'text-[#0088CC]' : ''} />
              <span>Audit 2025–2026</span>
            </button>

            <button
              onClick={() => setActiveTab('interactive_app')}
              className={`px-3 py-1.5 text-[12.5px] font-medium rounded-[7px] transition-all flex items-center gap-1.5 ${
                activeTab === 'interactive_app'
                  ? 'bg-white text-[#1D1D1F] font-semibold shadow-xs'
                  : 'text-[#6E6E73] hover:text-[#1D1D1F]'
              }`}
            >
              <FileText size={14} className={activeTab === 'interactive_app' ? 'text-[#0088CC]' : ''} />
              <span>Hồ sơ mẫu</span>
            </button>

            <button
              onClick={() => setActiveTab('tokens')}
              className={`px-3 py-1.5 text-[12.5px] font-medium rounded-[7px] transition-all flex items-center gap-1.5 ${
                activeTab === 'tokens'
                  ? 'bg-white text-[#1D1D1F] font-semibold shadow-xs'
                  : 'text-[#6E6E73] hover:text-[#1D1D1F]'
              }`}
            >
              <BookOpen size={14} className={activeTab === 'tokens' ? 'text-[#0088CC]' : ''} />
              <span>Design Tokens</span>
            </button>

            <button
              onClick={() => setActiveTab('primitives')}
              className={`px-3 py-1.5 text-[12.5px] font-medium rounded-[7px] transition-all flex items-center gap-1.5 ${
                activeTab === 'primitives'
                  ? 'bg-white text-[#1D1D1F] font-semibold shadow-xs'
                  : 'text-[#6E6E73] hover:text-[#1D1D1F]'
              }`}
            >
              <Layers size={14} className={activeTab === 'primitives' ? 'text-[#0088CC]' : ''} />
              <span>UI Primitives</span>
            </button>

            <button
              onClick={() => setActiveTab('states')}
              className={`px-3 py-1.5 text-[12.5px] font-medium rounded-[7px] transition-all flex items-center gap-1.5 ${
                activeTab === 'states'
                  ? 'bg-white text-[#1D1D1F] font-semibold shadow-xs'
                  : 'text-[#6E6E73] hover:text-[#1D1D1F]'
              }`}
            >
              <span>Feedback & States</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Review Board Container */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'domain_audit' && <DomainAuditDevView />}
        {activeTab === 'interactive_app' && <InteractiveAppTab />}
        {activeTab === 'tokens' && <TokensTab />}
        {activeTab === 'primitives' && <PrimitivesTab />}
        {activeTab === 'states' && <StatesTab />}
      </div>
    </div>
  );
};
