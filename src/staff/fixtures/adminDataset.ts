/**
 * 5TOT ĐHĐN — Admin & System Settings Master Fixture Dataset
 * Re-exports modular entities across institutions, school review units, staff accounts, and configurations.
 */

export { INITIAL_INSTITUTIONS, INITIAL_SCHOOL_REVIEW_UNITS } from './admin/institutions';
export { INITIAL_STAFF_ACCOUNTS } from './admin/staffAccounts';
export {
  INITIAL_SEASONS,
  INITIAL_CRITERIA_VERSIONS,
  INITIAL_COLLECTIVE_CRITERIA_CONFIG,
  INITIAL_DEADLINE_ITEMS,
  ALL_CAPABILITY_METADATA,
  INITIAL_NOTIFICATION_TEMPLATES,
  INITIAL_WORKFLOW_POLICY,
  INITIAL_SYSTEM_HEALTH,
  INITIAL_AUDIT_LOGS,
} from './admin/systemConfigs';
