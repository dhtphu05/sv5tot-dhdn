/**
 * 5TOT ĐHĐN — Feature: Collective Declaration Saving (FSD Features Layer)
 * Encapsulates TT01–TT04 requirement saving, member management, and declaration forms.
 */

export {
  updateCollectiveRequirement,
  addCollectiveStructuredMember,
  addCollectiveRecognizedMember,
} from '../../staff/collective/collectiveOperations';

export { TT01RecognitionForm } from '../../components/collective/forms/TT01RecognitionForm';
export { TT02ParticipationForm } from '../../components/collective/forms/TT02ParticipationForm';
export { TT03SchoolAwardForm } from '../../components/collective/forms/TT03SchoolAwardForm';
export { TT04ComplianceForm } from '../../components/collective/forms/TT04ComplianceForm';
