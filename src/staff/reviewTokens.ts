/**
 * 5TOT ĐHĐN — Staff Review Tokens & Status Metadata Re-exports
 */

import { CRITERIA_LIST, CriterionDefinition } from '../tokens';
import {
  ITEM_REVIEW_STATUS_META,
  EVIDENCE_REVIEW_STATUS_META,
  CRITERION_WORKSPACE_STATUS_META,
} from './reviewTypes';

export type CriterionToken = CriterionDefinition;
export const CRITERION_TOKENS = CRITERIA_LIST;
export const CRITERION_REVIEW_STATUS_META = CRITERION_WORKSPACE_STATUS_META;
export { ITEM_REVIEW_STATUS_META, EVIDENCE_REVIEW_STATUS_META };
