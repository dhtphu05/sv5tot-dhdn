/**
 * 5TOT ĐHĐN — Feature: Evidence Upload & Management (FSD Features Layer)
 * Encapsulates persistent evidence upload, removal, and preview across Individual & Collective workflows.
 */

export {
  addCollectiveEvidence,
  removeCollectiveEvidence,
} from '../../staff/collective/collectiveOperations';

export {
  saveEvidenceFile,
  getEvidenceFile,
  getEvidenceBlobUrl,
  deleteEvidenceFile,
  downloadEvidenceFile,
} from '../../staff/demoEvidenceStorage';

export { CollectiveEvidenceArea } from '../../components/collective/forms/CollectiveEvidenceArea';
export { CollectiveDocumentPreviewModal } from '../../components/collective/forms/CollectiveDocumentPreviewModal';
