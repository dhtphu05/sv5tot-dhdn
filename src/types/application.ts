/**
 * 5TOT ĐHĐN — Canonical Application Type Re-exports
 */

import { CriterionDefinition } from '../tokens';
import {
  RequirementGroupDefinition,
  RequirementDefinition,
  CriterionDefinitionData,
} from '../demo/fixtures/criteriaDefinitions';
import {
  StudentApplicationData,
  ApplicationDeclaration,
  ApplicationEvidence,
  ApplicationCriterion,
  ApplicationRequirement,
} from '../entities/application/studentApplicationTypes';

export type CriterionId = CriterionDefinition['id'];
export type StudentApplication = StudentApplicationData;
export type EvidenceFile = ApplicationEvidence;

export type {
  RequirementGroupDefinition,
  RequirementDefinition,
  CriterionDefinitionData,
  StudentApplicationData,
  ApplicationDeclaration,
  ApplicationEvidence,
  ApplicationCriterion,
  ApplicationRequirement,
};
