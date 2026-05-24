/**
 * react-doctor
 * A diagnostic tool for React applications that detects common performance
 * issues, anti-patterns, and accessibility problems in your component tree.
 *
 * Fork of millionco/react-doctor
 */

export { ReactDoctor } from './ReactDoctor';
export { diagnose } from './diagnose';
export { createRule } from './rules/createRule';

// Built-in rules
export { unnecessaryRerenderRule } from './rules/unnecessaryRerender';
export { missingKeyRule } from './rules/missingKey';
export { inlineObjectRule } from './rules/inlineObject';
export { inlineFunctionRule } from './rules/inlineFunction';
export { largeComponentRule } from './rules/largeComponent';

// Types
export type {
  DiagnosticRule,
  DiagnosticResult,
  DiagnosticSeverity,
  DiagnosticContext,
  ReactDoctorConfig,
  RuleOptions,
} from './types';
