import { reactProjectStructureRule } from "./react-project-structure.js";
import { createRuleRegistry as createBaseRuleRegistry } from "./registry.js";
import {
  DEAD_CODE_RULE_ID,
  DEPENDENCIES_RULE_ID,
  REACT_ARCHITECTURE_RULE_ID,
  deadCodeRule,
  dependenciesRule,
  reactArchitectureRule,
} from "./codebase/index.js";
import type { RuleRegistryOptions } from "./registry.js";
import type { ReactDoctorRule } from "./types.js";

export { defineRule } from "./registry.js";
export type {
  ReactDoctorRule,
  ReactDoctorRuleContext,
  ReactDoctorRuleExample,
  ReactDoctorRuleMetadata,
  ReactDoctorRuleResult,
} from "./types.js";
export * from "./lint/index.js";
export {
  DEAD_CODE_RULE_ID,
  DEPENDENCIES_RULE_ID,
  REACT_ARCHITECTURE_RULE_ID,
  deadCodeRule,
  dependenciesRule,
  reactArchitectureRule,
  reactProjectStructureRule,
};

export const coreRules: ReactDoctorRule[] = [
  reactProjectStructureRule,
  deadCodeRule,
  dependenciesRule,
  reactArchitectureRule,
];

export const createRuleRegistry = (options: RuleRegistryOptions = {}) =>
  createBaseRuleRegistry({
    ...options,
    rules: options.rules ?? coreRules,
  });

export const ruleRegistry = createRuleRegistry();
