/**
 * 5TOT ĐHĐN — Centralized Season Analytics & Operational Reporting Selectors
 * Types and filter interfaces
 */

export type AnalyticsWorkflowGroupKey =
  | 'all'
  | 'unassigned'
  | 'under_review'
  | 'supplement_waiting'
  | 'supplement_returned'
  | 'review_completed'
  | 'waiting_decision'
  | 'decided';

export type AnalyticsResultFilterKey =
  | 'all'
  | 'recognized'
  | 'not_recognized'
  | 'published'
  | 'unpublished';

export type AnalyticsSubmittedPeriodKey =
  | 'all'
  | 'early_oct' // 01/10/2026 – 10/10/2026
  | 'mid_oct';  // 11/10/2026 – 15/10/2026

export interface AnalyticsFilterState {
  season: string;
  institutionId: string;
  workflowGroup: AnalyticsWorkflowGroupKey;
  officerId: string;
  submittedPeriod: AnalyticsSubmittedPeriodKey;
  resultFilter: AnalyticsResultFilterKey;
  searchQuery: string;
}

export const DEFAULT_ANALYTICS_FILTERS: AnalyticsFilterState = {
  season: 'Năm học 2025–2026',
  institutionId: 'all',
  workflowGroup: 'all',
  officerId: 'all',
  submittedPeriod: 'all',
  resultFilter: 'all',
  searchQuery: '',
};
