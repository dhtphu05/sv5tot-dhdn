/**
 * 5TOT ĐHĐN — Officer Review Responsive Inspector Host Widget (FSD Widgets Layer)
 * Renders ReviewInspector in both 2xl sticky sidebar and <2xl slide-over overlay without duplicated prop wiring.
 */

import React from 'react';
import { ReviewInspector } from '../../staff/components/review/ReviewInspector';

export interface OfficerReviewInspectorHostProps
  extends React.ComponentProps<typeof ReviewInspector> {
  isOpen: boolean;
  onCloseCompactOverlay: () => void;
}

export const OfficerReviewInspectorHost: React.FC<
  OfficerReviewInspectorHostProps
> = ({
  isOpen,
  onCloseCompactOverlay,
  onOpenSupplementModal,
  onOpenFullHistory,
  ...inspectorProps
}) => {
  if (!isOpen) return null;

  return (
    <>
      <aside
        aria-label="Khung xét duyệt cán bộ"
        className="hidden 2xl:flex w-[420px] shrink-0 sticky top-6 bg-white rounded-[20px] shadow-[0_4px_24px_rgba(23,42,58,0.06)] border border-[#DCE7EE] overflow-hidden self-start h-[calc(100vh-48px)] flex-col z-20"
      >
        <ReviewInspector
          {...inspectorProps}
          onOpenSupplementModal={onOpenSupplementModal}
          onOpenFullHistory={onOpenFullHistory}
          onCloseMobileOverlay={onCloseCompactOverlay}
        />
      </aside>

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Khung xét duyệt"
        className="fixed inset-0 z-50 2xl:hidden bg-[#0F2335]/35 backdrop-blur-[1px] flex justify-end"
        onClick={onCloseCompactOverlay}
      >
        <div
          className="w-full sm:w-[420px] max-w-full h-full bg-white shadow-[-16px_0_48px_rgba(23,42,58,0.18)] flex flex-col select-none overflow-hidden border-l border-[#DCE7EE]"
          onClick={(e) => e.stopPropagation()}
        >
          <ReviewInspector
            {...inspectorProps}
            onOpenSupplementModal={(scope, draftText) => {
              onCloseCompactOverlay();
              onOpenSupplementModal(scope, draftText);
            }}
            onOpenFullHistory={() => {
              onCloseCompactOverlay();
              onOpenFullHistory();
            }}
            onCloseMobileOverlay={onCloseCompactOverlay}
          />
        </div>
      </div>
    </>
  );
};
