/**
 * 5TOT ĐHĐN — Reusable Supplement Scope Editor & Request Composer (FSD Features Layer)
 */

import React from 'react';

export interface SupplementScopeEditorProps {
  selectedScopeLabel: string;
  allowedActions: {
    addEvidence: boolean;
    addExplanation: boolean;
    editDeclaration: boolean;
  };
  onToggleAction: (key: 'addEvidence' | 'addExplanation' | 'editDeclaration') => void;
}

export const SupplementScopeEditor: React.FC<SupplementScopeEditorProps> = ({
  selectedScopeLabel,
  allowedActions,
  onToggleAction,
}) => (
  <div className="p-3.5 rounded-[12px] bg-[#F8FBFD] border border-[#DCE7EE] space-y-2.5">
    <div className="text-[12px] font-bold text-[#172A3A]">
      Phạm vi mở khóa bổ sung:{' '}
      <span className="text-[#0D78AE]">{selectedScopeLabel}</span>
    </div>
    <div className="flex flex-wrap gap-3 text-[12px] text-[#334E68]">
      <label className="inline-flex items-center gap-1.5 cursor-pointer">
        <input
          type="checkbox"
          checked={allowedActions.addEvidence}
          onChange={() => onToggleAction('addEvidence')}
          className="rounded border-[#CBD5E1] text-[#0D78AE]"
        />
        <span>Bổ sung tệp minh chứng</span>
      </label>
      <label className="inline-flex items-center gap-1.5 cursor-pointer">
        <input
          type="checkbox"
          checked={allowedActions.addExplanation}
          onChange={() => onToggleAction('addExplanation')}
          className="rounded border-[#CBD5E1] text-[#0D78AE]"
        />
        <span>Giải trình bổ sung</span>
      </label>
      <label className="inline-flex items-center gap-1.5 cursor-pointer">
        <input
          type="checkbox"
          checked={allowedActions.editDeclaration}
          onChange={() => onToggleAction('editDeclaration')}
          className="rounded border-[#CBD5E1] text-[#0D78AE]"
        />
        <span>Chỉnh sửa thông tin kê khai</span>
      </label>
    </div>
  </div>
);

export interface SupplementRequestComposerProps {
  reason: string;
  deadline: string;
  onChangeReason: (val: string) => void;
  onChangeDeadline: (val: string) => void;
  placeholder?: string;
}

export const SupplementRequestComposer: React.FC<SupplementRequestComposerProps> = ({
  reason,
  deadline,
  onChangeReason,
  onChangeDeadline,
  placeholder = 'Nhập nội dung yêu cầu bổ sung cụ thể để đơn vị/sinh viên thực hiện...',
}) => (
  <div className="space-y-3">
    <div>
      <label className="block text-[12.5px] font-bold text-[#172A3A] mb-1">
        Nội dung hướng dẫn bổ sung <span className="text-[#DC2626]">*</span>
      </label>
      <textarea
        rows={3}
        value={reason}
        onChange={(e) => onChangeReason(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 rounded-[10px] border border-[#CBD5E1] text-[13px] text-[#172A3A] focus:outline-none focus:border-[#0D78AE]"
      />
    </div>
    <div>
      <label className="block text-[12.5px] font-bold text-[#172A3A] mb-1">
        Thời hạn phản hồi bổ sung
      </label>
      <input
        type="text"
        value={deadline}
        onChange={(e) => onChangeDeadline(e.target.value)}
        className="w-full h-[38px] px-3.5 rounded-[10px] border border-[#CBD5E1] text-[13px] text-[#172A3A] focus:outline-none focus:border-[#0D78AE]"
      />
    </div>
  </div>
);
