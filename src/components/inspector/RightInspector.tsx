import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface RightInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
  triggerElement?: HTMLElement | null;
  zIndexClassName?: string;
}

export const RightInspector: React.FC<RightInspectorProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 400,
  triggerElement = null,
  zIndexClassName = 'z-40',
}) => {
  // Close on Escape key and restore focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.stopPropagation();
        onClose();
        if (triggerElement) {
          triggerElement.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, triggerElement]);

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 ${zIndexClassName} flex justify-end`}>
      {/* Soft subtle translucent backdrop that leaves application workspace visible for direct comparison */}
      <div
        className="fixed inset-0 bg-black/10 backdrop-blur-[0.5px] transition-opacity duration-200"
        onClick={() => {
          onClose();
          if (triggerElement) triggerElement.focus();
        }}
        aria-hidden="true"
      />

      {/* Inspector Panel */}
      <div
        className="relative z-10 h-full bg-white shadow-[-12px_0_32px_rgba(20,60,80,0.08)] border-l border-[#DCE7EE] flex flex-col transition-transform duration-200 ease-out"
        style={{ width: `min(100vw, ${width}px)` }}
        role="dialog"
        aria-modal="true"
      >
        {/* Sticky Inspector Header */}
        <div className="flex items-start justify-between p-4 px-5 border-b border-[#DCE7EE] shrink-0 bg-[#F8FBFD] sticky top-0 z-10">
          <div className="flex flex-col min-w-0 pr-3">
            <h2 className="text-[16px] font-bold text-[#172A3A] tracking-tight truncate">
              {title}
            </h2>
            {subtitle && (
              <span className="text-[12px] text-[#607483] mt-0.5 truncate font-medium">
                {subtitle}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              if (triggerElement) triggerElement.focus();
            }}
            className="p-1.5 rounded-[8px] text-[#607483] hover:text-[#172A3A] hover:bg-[#EAF6FC] transition-colors cursor-pointer"
            aria-label="Đóng bảng chi tiết"
          >
            <X size={17} strokeWidth={2.2} />
          </button>
        </div>

        {/* Inspector Body (controlled independent scrolling) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 min-w-0">
          {children}
        </div>

        {/* Inspector Sticky Footer */}
        {footer && (
          <div className="p-4 border-t border-[#DCE7EE] bg-[#F8FBFD] shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
