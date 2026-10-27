/**
 * 5TOT ĐHĐN — Centralized Collective Store Architecture
 * Decomposed into Feature-Sliced collective store modules:
 * - collectiveFixtures: Demo collective application records
 * - collectiveStoreCore: Storage management, listeners, and core getters
 * - collectiveOperations: Create, update declarations, members, evidence, submission
 * - collectiveReviewOperations: City officer assignment, criteria judgments, and completion
 * - collectiveDecisionOperations: Supplement requests, committee decisions, and publishing
 */

export * from "./collective/collectiveFixtures";
export * from "./collective/collectiveStoreCore";
export * from "./collective/collectiveOperations";
export * from "./collective/collectiveReviewOperations";
export * from "./collective/collectiveDecisionOperations";
