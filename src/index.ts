/**
 * react-doctor
 * A diagnostic tool for React applications that detects common performance
 * issues, anti-patterns, and accessibility problems in your component tree.
 *
 * Fork of millionco/react-doctor
 *
 * Personal fork notes:
 * - Added accessibilityRule export for a11y checks I use frequently
 * - See src/rules/accessibility.ts for custom rule implementation
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

// Custom rules (personal additions)
export { accessibilityRule } from './rules/accessibility';

// Types
export type {
  DiagnosticRule,
  DiagnosticResult,
  DiagnosticSeverity,
  DiagnosticContext,
  ReactDoctorConfig,
  RuleOptions,
} from './types';
