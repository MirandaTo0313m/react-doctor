import { reactDoctorRules } from "./plugin/rule-registry.js";
import type { RuleFramework } from "./plugin/utils/rule.js";
import type { OxlintRuleSeverity } from "./types.js";

interface RuleMapEntry {
  key: string;
  severity: OxlintRuleSeverity;
}

const toRuleMap = (rules: ReadonlyArray<RuleMapEntry>): Record<string, OxlintRuleSeverity> =>
  Object.fromEntries(rules.map((rule) => [rule.key, rule.severity]));

const collectReactDoctorRulesByFramework = (frameworkName: RuleFramework) =>
  reactDoctorRules.filter((rule) => rule.framework === frameworkName);

const collectExternalRulesBySource = (source: string) =>
  EXTERNAL_RULES.filter((rule) => rule.source === source);

const collectFrameworkSpecificRuleKeys = (): ReadonlySet<string> => {
  const collected = new Set<string>();
  for (const rule of reactDoctorRules) {
    if (rule.framework !== "global") collected.add(rule.key);
  }
  return collected;
};

export const REACT_DOCTOR_RULES = reactDoctorRules;

// Only React Compiler rules remain external. The previous
// `react/*`, `jsx-a11y/*`, and `effect/*` entries are now natively
// ported into this package and ship through `REACT_DOCTOR_RULES`.
export const EXTERNAL_RULES = [
  { key: "react-hooks-js/set-state-in-render", source: "react-compiler", severity: "error" },
  { key: "react-hooks-js/immutability", source: "react-compiler", severity: "error" },
  { key: "react-hooks-js/refs", source: "react-compiler", severity: "error" },
  { key: "react-hooks-js/purity", source: "react-compiler", severity: "error" },
  { key: "react-hooks-js/hooks", source: "react-compiler", severity: "error" },
  { key: "react-hooks-js/set-state-in-effect", source: "react-compiler", severity: "error" },
  { key: "react-hooks-js/globals", source: "react-compiler", severity: "error" },
  { key: "react-hooks-js/error-boundaries", source: "react-compiler", severity: "error" },
  {
    key: "react-hooks-js/preserve-manual-memoization",
    source: "react-compiler",
    severity: "error",
  },
  { key: "react-hooks-js/unsupported-syntax", source: "react-compiler", severity: "error" },
  {
    key: "react-hooks-js/component-hook-factories",
    source: "react-compiler",
    severity: "error",
  },
  { key: "react-hooks-js/static-components", source: "react-compiler", severity: "error" },
  { key: "react-hooks-js/use-memo", source: "react-compiler", severity: "error" },
  { key: "react-hooks-js/void-use-memo", source: "react-compiler", severity: "error" },
  { key: "react-hooks-js/incompatible-library", source: "react-compiler", severity: "error" },
  { key: "react-hooks-js/todo", source: "react-compiler", severity: "error" },
] as const;

export const RULES = [...REACT_DOCTOR_RULES, ...EXTERNAL_RULES] as const;

export const RECOMMENDED_RULES = toRuleMap(collectReactDoctorRulesByFramework("global"));
export const NEXTJS_RULES = toRuleMap(collectReactDoctorRulesByFramework("nextjs"));
export const REACT_NATIVE_RULES = toRuleMap(collectReactDoctorRulesByFramework("react-native"));
export const TANSTACK_START_RULES = toRuleMap(collectReactDoctorRulesByFramework("tanstack-start"));
export const TANSTACK_QUERY_RULES = toRuleMap(collectReactDoctorRulesByFramework("tanstack-query"));
export const ALL_REACT_DOCTOR_RULES = toRuleMap(REACT_DOCTOR_RULES);
export const ALL_REACT_DOCTOR_RULE_KEYS: ReadonlySet<string> = new Set(
  REACT_DOCTOR_RULES.map((rule) => rule.key),
);
export const FRAMEWORK_SPECIFIC_RULE_KEYS = collectFrameworkSpecificRuleKeys();
export const REACT_COMPILER_RULES = toRuleMap(collectExternalRulesBySource("react-compiler"));
// Empty maps preserved for back-compat with consumers that still
// import these symbols. The 8 rules formerly in
// YOU_MIGHT_NOT_NEED_EFFECT_RULES, the 12 rules in BUILTIN_REACT_RULES,
// and the 14 rules in BUILTIN_A11Y_RULES are all now native
// `react-doctor/*` rules served via REACT_DOCTOR_RULES.
export const YOU_MIGHT_NOT_NEED_EFFECT_RULES: Record<string, OxlintRuleSeverity> = {};
export const BUILTIN_REACT_RULES: Record<string, OxlintRuleSeverity> = {};
export const BUILTIN_A11Y_RULES: Record<string, OxlintRuleSeverity> = {};
