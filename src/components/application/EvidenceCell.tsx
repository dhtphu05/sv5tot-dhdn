import React from 'react';
import { ApplicationEvidence } from '../../demo/fixtures/studentApplication';
import { EvidenceSummary } from '../evidence/EvidenceSummary';

export interface EvidenceCellProps {
  files: ApplicationEvidence[];
  editable?: boolean;
  isDeclarationEmpty?: boolean;
  onFileClick?: (file: ApplicationEvidence) => void;
  onExpandListClick?: () => void;
  onAddClick?: () => void;
  className?: string;
}

export const EvidenceCell: React.FC<EvidenceCellProps> = ({
  files = [],
  editable = true,
  isDeclarationEmpty = false,
  onFileClick,
  onExpandListClick,
  onAddClick,
  className = '',
}) => {
  return (
    <EvidenceSummary
      files={files}
      editable={editable}
      isDeclarationEmpty={isDeclarationEmpty}
      onExpand={onExpandListClick}
      onAdd={editable && onAddClick ? onAddClick : undefined}
      onFileClick={onFileClick}
      className={className}
    />
  );
};
