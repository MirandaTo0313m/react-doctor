import { CalculateScoreOptions, ScoreDiagnostic, calculateScore, getScoreLabel } from "./score.js";
import { n as RuleContext, r as EsTreeNode, t as RuleVisitors } from "./rule-visitors-BaKMmsBH.js";
import {
  $ as Rule,
  A as SourceLocation,
  B as ReactDoctorErrorOptions,
  C as ReactDoctorJsonReport,
  D as ReactDoctorScore,
  E as ReactDoctorRuleSelection,
  F as ReactDoctorCheckSkippedError,
  G as ReactDoctorProjectNotFoundError,
  H as ReactDoctorNoReactDependencyError,
  I as ReactDoctorConfigError,
  J as ReactDoctorTimeoutError,
  K as ReactDoctorReportError,
  L as ReactDoctorConfigNotFoundError,
  M as ReactDoctorCancelledError,
  N as ReactDoctorCheckError,
  O as ReactProjectFramework,
  P as ReactDoctorCheckFailedError,
  Q as RulePlugin,
  R as ReactDoctorError,
  S as ReactDoctorIssueSource,
  T as ReactDoctorResult,
  U as ReactDoctorPackageJsonNotFoundError,
  V as ReactDoctorInvalidConfigError,
  W as ReactDoctorProjectError,
  X as isReactDoctorError,
  Y as ReactDoctorUnsupportedRuntimeError,
  Z as toReactDoctorErrorInfo,
  _ as ReactDoctorConfig,
  a as reactProjectStructureRule,
  b as ReactDoctorIgnoreOverride,
  c as defineRule,
  d as ReactDoctorRuleExample,
  et as RuleExample,
  f as ReactDoctorRuleMetadata,
  g as ReactDoctorCheckResult,
  h as LoadedReactDoctorConfig,
  i as reactDoctorOxlintPlugin,
  j as ReactDoctorAmbiguousProjectError,
  k as ReactProjectInfo,
  l as ReactDoctorRule,
  m as InspectReactProjectOptions,
  n as createRuleRegistry,
  o as ReactDoctorRuleRegistry,
  p as ReactDoctorRuleResult,
  q as ReactDoctorRunnerUnavailableError,
  r as ruleRegistry,
  s as RuleRegistryOptions,
  t as coreRules,
  u as ReactDoctorRuleContext,
  v as ReactDoctorFailOnLevel,
  w as ReactDoctorJsonReportSummary,
  x as ReactDoctorIssue,
  y as ReactDoctorIgnoreConfig,
  z as ReactDoctorErrorInfo,
} from "./index-BuoGgbB8.js";
import reactDoctorEslintPlugin from "./eslint-plugin.js";
import {
  DiagnoseOptions,
  DiagnoseResult,
  Diagnostic,
  ProjectInfo,
  ScoreResult,
  clearCaches,
  diagnose,
} from "./compat.js";

//#region src/core/rules/lint/utils/parsed-rgb.d.ts
interface ParsedRgb {
  red: number;
  green: number;
  blue: number;
}
//#endregion
//#region src/core/rules/codebase/dead-code.d.ts
declare const DEAD_CODE_RULE_ID = "react-doctor/codebase/dead-code";
//#endregion
//#region src/core/rules/codebase/dependencies.d.ts
declare const DEPENDENCIES_RULE_ID = "react-doctor/codebase/dependencies";
//#endregion
//#region src/core/rules/codebase/react-architecture.d.ts
declare const REACT_ARCHITECTURE_RULE_ID = "react-doctor/codebase/react-architecture";
//#endregion
//#region src/core/rules/lint/config.d.ts
interface OxlintRuleSeverityMap {
  [ruleKey: string]: "error" | "warn" | "off";
}
declare const REACT_COMPILER_OXLINT_RULES: OxlintRuleSeverityMap;
declare const BUILTIN_REACT_OXLINT_RULES: OxlintRuleSeverityMap;
declare const BUILTIN_A11Y_OXLINT_RULES: OxlintRuleSeverityMap;
declare const BUILTIN_OXLINT_RULES: OxlintRuleSeverityMap;
declare const NEXTJS_OXLINT_RULES: OxlintRuleSeverityMap;
declare const REACT_NATIVE_OXLINT_RULES: OxlintRuleSeverityMap;
declare const TANSTACK_START_OXLINT_RULES: OxlintRuleSeverityMap;
declare const TANSTACK_QUERY_OXLINT_RULES: OxlintRuleSeverityMap;
declare const GLOBAL_REACT_DOCTOR_OXLINT_RULES: OxlintRuleSeverityMap;
declare const REACT_DOCTOR_CUSTOM_OXLINT_RULES: OxlintRuleSeverityMap;
declare const CURATED_OXLINT_RULES: OxlintRuleSeverityMap;
declare const ALL_REACT_DOCTOR_OXLINT_RULE_KEYS: ReadonlySet<string>;
type ReactDoctorOxlintFramework =
  | "expo"
  | "nextjs"
  | "react"
  | "react-native"
  | "tanstack-start"
  | "unknown";
interface ReactDoctorOxlintConfigOptions {
  pluginPath: string;
  project?: ReactDoctorOxlintProjectInfo;
  framework?: ReactDoctorOxlintFramework;
  customRulesOnly?: boolean;
  hasReactCompiler?: boolean;
  hasTanStackAI?: boolean;
  hasTanStackQuery?: boolean;
  includeEcosystemRules?: boolean;
  extendsPaths?: string[];
  ignoredTags?: ReadonlySet<string>;
}
interface ReactDoctorOxlintProjectInfo {
  framework?: ReactDoctorOxlintFramework;
  hasReactCompiler?: boolean;
  hasTanStackAI?: boolean;
  hasTanStackQuery?: boolean;
  hasTypeScript?: boolean;
  reactMajorVersion?: number | null;
  reactPeerDependencyRange?: string | null;
  tailwindVersion?: string | null;
}
interface ReactDoctorOxlintJsPluginEntry {
  name: string;
  specifier: string;
}
interface ReactDoctorOxlintGeneratedConfig {
  extends?: string[];
  categories: Record<string, "off">;
  plugins: string[];
  jsPlugins: Array<string | ReactDoctorOxlintJsPluginEntry>;
  rules: OxlintRuleSeverityMap;
}
declare const reactPeerRangeMinMajor: (range: string | null | undefined) => number | null;
declare const buildReactDoctorOxlintCapabilities: (
  project: ReactDoctorOxlintProjectInfo,
) => ReadonlySet<string>;
declare const shouldEnableReactDoctorOxlintRule: (
  requires: ReadonlyArray<string> | undefined,
  tags: ReadonlySet<string>,
  capabilities: ReadonlySet<string>,
  ignoredTags: ReadonlySet<string>,
) => boolean;
declare const createReactDoctorOxlintConfig: ({
  pluginPath,
  project,
  framework,
  customRulesOnly,
  hasReactCompiler,
  hasTanStackAI,
  hasTanStackQuery,
  includeEcosystemRules,
  extendsPaths,
  ignoredTags,
}: ReactDoctorOxlintConfigOptions) => ReactDoctorOxlintGeneratedConfig;
//#endregion
//#region src/core/rules/lint/metadata.d.ts
interface OxlintRuleMetadata extends ReactDoctorRuleMetadata {
  oxlintRuleName: string;
  oxlintRuleKey: string;
}
declare const REACT_DOCTOR_OXLINT_PLUGIN_NAMESPACE = "react-doctor";
declare const REACT_DOCTOR_OXLINT_RULE_ID_PREFIX = "oxlint/react-doctor/";
declare const reactDoctorOxlintRuleMetadata: OxlintRuleMetadata[];
//#endregion
//#region src/core/config.d.ts
declare const clearReactDoctorConfigCache: () => void;
declare const loadReactDoctorConfig: (
  startDirectory: string,
) => Promise<LoadedReactDoctorConfig | null>;
declare const resolveConfigRootDirectory: (
  loadedConfig: LoadedReactDoctorConfig | null,
  fallbackDirectory: string,
) => Promise<string>;
//#endregion
//#region src/core/reports.d.ts
declare const calculateReactDoctorScore: (issues: ReactDoctorIssue[]) => ReactDoctorScore;
declare const summarizeReactDoctorResult: (
  result: ReactDoctorResult,
) => ReactDoctorJsonReportSummary;
declare const buildReactDoctorJsonReport: (result: ReactDoctorResult) => ReactDoctorJsonReport;
//#endregion
//#region src/core/project.d.ts
declare const parseReactMajorVersion: (version: string | null) => number | null;
declare const toOxlintProjectInfo: (project: ReactProjectInfo) => ReactDoctorOxlintProjectInfo;
declare const discoverReactProject: (rootDirectory: string) => Promise<ReactProjectInfo>;
//#endregion
//#region src/core/diagnostics.d.ts
interface FilterReactDoctorIssuesOptions {
  jsxImportSource?: string;
}
declare const filterReactDoctorIssues: (
  issues: ReactDoctorIssue[],
  config: ReactDoctorConfig,
  rootDirectory: string,
  readSourceLines?: (filePath: string) => string[] | undefined,
  options?: FilterReactDoctorIssuesOptions,
) => ReactDoctorIssue[];
//#endregion
//#region src/core/runners/oxlint.d.ts
interface RunOxlintOptions {
  rootDirectory: string;
  includePaths?: string[];
  excludePatterns?: string[];
  project: ReactDoctorOxlintProjectInfo;
  customRulesOnly?: boolean;
  includeEcosystemRules?: boolean;
  adoptExistingLintConfig?: boolean;
  ignoredTags?: ReadonlySet<string>;
  signal?: AbortSignal;
}
declare const OXLINT_CHECK_ID = "react-doctor/oxlint";
declare const runOxlint: (options: RunOxlintOptions) => Promise<ReactDoctorIssue[]>;
//#endregion
//#region src/sdk/create-react-doctor.d.ts
interface CreateReactDoctorOptions {
  rootDirectory?: string;
  includePaths?: string[];
  excludePatterns?: string[];
  rules?: InspectReactProjectOptions["rules"];
  lint?: boolean;
  deadCode?: boolean;
  customRulesOnly?: boolean;
  respectInlineDisables?: boolean;
  offline?: boolean;
}
interface ReactDoctor {
  inspect: (options?: InspectReactProjectOptions) => Promise<ReactDoctorResult>;
}
declare const createReactDoctor: (options?: CreateReactDoctorOptions) => ReactDoctor;
declare const inspectReactProject: (
  options?: InspectReactProjectOptions,
) => Promise<ReactDoctorResult>;
//#endregion
export {
  ALL_REACT_DOCTOR_OXLINT_RULE_KEYS,
  BUILTIN_A11Y_OXLINT_RULES,
  BUILTIN_OXLINT_RULES,
  BUILTIN_REACT_OXLINT_RULES,
  CURATED_OXLINT_RULES,
  type CalculateScoreOptions,
  type CreateReactDoctorOptions,
  DEAD_CODE_RULE_ID,
  DEPENDENCIES_RULE_ID,
  type DiagnoseOptions,
  type DiagnoseResult,
  type Diagnostic,
  GLOBAL_REACT_DOCTOR_OXLINT_RULES,
  type InspectReactProjectOptions,
  NEXTJS_OXLINT_RULES,
  OXLINT_CHECK_ID,
  type EsTreeNode as OxlintEsTreeNode,
  type ParsedRgb as OxlintParsedRgb,
  type Rule as OxlintRule,
  type RuleContext as OxlintRuleContext,
  type RuleExample as OxlintRuleExample,
  type OxlintRuleMetadata,
  type RulePlugin as OxlintRulePlugin,
  type OxlintRuleSeverityMap,
  type RuleVisitors as OxlintRuleVisitors,
  type ProjectInfo,
  REACT_ARCHITECTURE_RULE_ID,
  REACT_COMPILER_OXLINT_RULES,
  REACT_DOCTOR_CUSTOM_OXLINT_RULES,
  REACT_DOCTOR_OXLINT_PLUGIN_NAMESPACE,
  REACT_DOCTOR_OXLINT_RULE_ID_PREFIX,
  REACT_NATIVE_OXLINT_RULES,
  type ReactDoctor,
  ReactDoctorAmbiguousProjectError,
  ReactDoctorCancelledError,
  ReactDoctorCheckError,
  ReactDoctorCheckFailedError,
  type ReactDoctorCheckResult,
  ReactDoctorCheckSkippedError,
  type ReactDoctorConfig,
  ReactDoctorConfigError,
  ReactDoctorConfigNotFoundError,
  ReactDoctorError,
  type ReactDoctorErrorInfo,
  type ReactDoctorErrorOptions,
  type ReactDoctorFailOnLevel,
  type ReactDoctorIgnoreConfig,
  type ReactDoctorIgnoreOverride,
  ReactDoctorInvalidConfigError,
  type ReactDoctorIssue,
  type ReactDoctorIssueSource,
  type ReactDoctorJsonReport,
  type ReactDoctorJsonReportSummary,
  ReactDoctorNoReactDependencyError,
  type ReactDoctorOxlintConfigOptions,
  type ReactDoctorOxlintFramework,
  type ReactDoctorOxlintGeneratedConfig,
  type ReactDoctorOxlintJsPluginEntry,
  type ReactDoctorOxlintProjectInfo,
  ReactDoctorPackageJsonNotFoundError,
  ReactDoctorProjectError,
  ReactDoctorProjectNotFoundError,
  ReactDoctorReportError,
  type ReactDoctorResult,
  type ReactDoctorRule,
  type ReactDoctorRuleContext,
  type ReactDoctorRuleExample,
  type ReactDoctorRuleMetadata,
  type ReactDoctorRuleRegistry,
  type ReactDoctorRuleResult,
  type ReactDoctorRuleSelection,
  ReactDoctorRunnerUnavailableError,
  type ReactDoctorScore,
  ReactDoctorTimeoutError,
  ReactDoctorUnsupportedRuntimeError,
  type ReactProjectFramework,
  type ReactProjectInfo,
  type RuleRegistryOptions,
  type RunOxlintOptions,
  type ScoreDiagnostic,
  type ScoreResult,
  type SourceLocation,
  TANSTACK_QUERY_OXLINT_RULES,
  TANSTACK_START_OXLINT_RULES,
  buildReactDoctorJsonReport,
  buildReactDoctorOxlintCapabilities,
  calculateReactDoctorScore,
  calculateScore,
  clearCaches,
  clearReactDoctorConfigCache,
  coreRules,
  createReactDoctor,
  createReactDoctorOxlintConfig,
  createRuleRegistry,
  defineRule,
  diagnose,
  discoverReactProject,
  filterReactDoctorIssues,
  getScoreLabel,
  inspectReactProject,
  isReactDoctorError,
  loadReactDoctorConfig,
  parseReactMajorVersion,
  reactDoctorEslintPlugin,
  reactDoctorOxlintPlugin,
  reactDoctorOxlintRuleMetadata,
  reactPeerRangeMinMajor,
  reactProjectStructureRule,
  resolveConfigRootDirectory,
  ruleRegistry,
  runOxlint,
  shouldEnableReactDoctorOxlintRule,
  summarizeReactDoctorResult,
  toOxlintProjectInfo,
  toReactDoctorErrorInfo,
};
//# sourceMappingURL=sdk.d.ts.map
