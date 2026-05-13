import { n as RuleContext, t as RuleVisitors } from "./rule-visitors-BaKMmsBH.js";

//#region src/core/rules/lint/utils/rule-example.d.ts
interface RuleExample {
  before: string;
  after: string;
}
//#endregion
//#region src/core/rules/lint/utils/rule.d.ts
interface Rule {
  recommendation: string;
  examples?: RuleExample[];
  create: (context: RuleContext) => RuleVisitors;
}
//#endregion
//#region src/core/rules/lint/utils/rule-plugin.d.ts
interface RulePlugin {
  meta: {
    name: string;
  };
  rules: Record<string, Rule>;
}
//#endregion
//#region src/core/rules/codebase/analyzer/plugins/types.d.ts
interface CodebasePluginResult {
  entryPatterns: CodebasePluginEntryPattern[];
  alwaysUsedPatterns: string[];
  usedExports: Map<string, Set<string>>;
  toolingDependencies: Set<string>;
  virtualModulePrefixes: string[];
  generatedImportSuffixes: string[];
}
interface CodebasePluginEntryPattern {
  pattern: string;
  role: EntryPointRole;
}
//#endregion
//#region src/core/rules/codebase/analyzer/types.d.ts
interface CodebaseAnalysisConfig {
  rootDirectory: string;
  includePaths: string[];
  excludePatterns: string[];
  conditionNames: string[];
  production: boolean;
}
interface PackageJsonObject {
  name?: string;
  version?: string;
  type?: string;
  main?: string;
  module?: string;
  browser?: string | Record<string, string | false>;
  source?: string;
  types?: string;
  typings?: string;
  bin?: string | Record<string, string>;
  exports?: unknown;
  imports?: unknown;
  files?: string[];
  sideEffects?: boolean | string[];
  scripts?: Record<string, string>;
  workspaces?:
    | string[]
    | {
        packages?: string[];
      };
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  peerDependenciesMeta?: Record<
    string,
    {
      optional?: boolean;
    }
  >;
  [key: string]: unknown;
}
interface DependencyBuckets {
  dependencies: Map<string, string>;
  devDependencies: Map<string, string>;
  peerDependencies: Map<string, string>;
  optionalDependencies: Map<string, string>;
}
interface WorkspaceSourceMap {
  sourceDirectory: string;
  outputDirectory: string;
}
interface WorkspaceInfo {
  id: number;
  name: string;
  directory: string;
  relativeDirectory: string;
  packageJsonPath: string;
  manifest: PackageJsonObject;
  dependencyBuckets: DependencyBuckets;
  dependencyNames: Set<string>;
  manifestDependencyNames: Set<string>;
  scriptDependencyNames: Set<string>;
  typeScriptConfigDependencyNames: Set<string>;
  cssImportDependencyNames: Set<string>;
  sourceMaps: WorkspaceSourceMap[];
}
interface ProjectFile {
  id: number;
  filePath: string;
  relativePath: string;
  extension: string;
  sourceText: string;
  workspaceId: number;
  lineStarts: number[];
}
interface SourcePosition {
  line: number;
  column: number;
}
interface ImportedBinding {
  importedName: string;
  localName: string;
  isTypeOnly: boolean;
  isNamespace: boolean;
  start: number;
  end: number;
}
interface ImportRecord {
  source: string;
  bindings: ImportedBinding[];
  kind:
    | "static"
    | "dynamic"
    | "comment"
    | "re-export"
    | "require"
    | "require-resolve"
    | "import-meta"
    | "context"
    | "asset";
  context?: ContextImportOptions;
  isTypeOnly: boolean;
  isSideEffectOnly: boolean;
  isOptional: boolean;
  start: number;
  end: number;
  position: SourcePosition;
}
interface ContextImportOptions {
  kind: "glob" | "require-context";
  recursive?: boolean;
  regexPattern?: string;
  regexFlags?: string;
}
interface ExportMemberRecord {
  name: string;
  kind: "class" | "enum" | "namespace";
  start: number;
  end: number;
  position: SourcePosition;
  jsDocTags: Set<string>;
  hasLocalReferences: boolean;
}
interface ExportRecord {
  exportedName: string;
  localName: string | null;
  source: string | null;
  importedName: string | null;
  symbolKind: "value" | "type" | "interface" | "enum" | "class" | "namespace" | "unknown";
  isTypeOnly: boolean;
  isReExport: boolean;
  isCommonJs: boolean;
  isNamespace: boolean;
  isReactComponentLike: boolean;
  jsDocTags: Set<string>;
  members: ExportMemberRecord[];
  hasLocalReferences: boolean;
  start: number;
  end: number;
  position: SourcePosition;
}
interface NamespaceMemberReference {
  namespace: string;
  memberName: string;
  memberPath: string[];
}
interface MemberObjectReference {
  namespace: string;
  memberPath: string[];
}
interface NamespaceObjectAlias {
  exportName: string;
  propertyName: string;
  namespaceLocalName: string;
}
interface NamespaceLocalAlias {
  aliasName: string;
  namespaceLocalName: string;
}
interface NamespaceLocalObjectAlias {
  objectLocalName: string;
  propertyName: string;
  namespaceLocalName: string;
}
interface ResolvedImport {
  importRecord: ImportRecord;
  targetKind: "internal" | "external" | "builtin" | "asset" | "unresolved";
  targetFilePath: string | null;
  packageName: string | null;
  error: string | null;
}
interface SymbolReference {
  fromFileId: number;
  kind:
    | "named"
    | "default"
    | "namespace"
    | "namespace-member"
    | "re-export"
    | "dynamic"
    | "side-effect";
  importRecord: ImportRecord;
}
interface GraphExportSymbol extends ExportRecord {
  references: SymbolReference[];
  isPluginUsed: boolean;
  isReferencedByNamespace: boolean;
  referencedMemberNames: Set<string>;
}
interface ModuleGraphNode {
  file: ProjectFile;
  imports: ResolvedImport[];
  importedBy: Set<number>;
  exports: Map<string, GraphExportSymbol>;
  directives: Set<string>;
  parseErrors: string[];
  usedIdentifiers: Set<string>;
  namespaceMemberReferences: NamespaceMemberReference[];
  memberObjectReferences: MemberObjectReference[];
  namespaceObjectAliases: NamespaceObjectAlias[];
  namespaceLocalAliases: NamespaceLocalAlias[];
  namespaceLocalObjectAliases: NamespaceLocalObjectAlias[];
  entryRoles: Set<EntryPointRole>;
  entrySources: Set<string>;
  isReachable: boolean;
  isRuntimeReachable: boolean;
  isTestReachable: boolean;
  isTypeReachable: boolean;
  hasCjsExports: boolean;
}
interface EntryPoint {
  fileId: number;
  role: EntryPointRole;
  source: string;
}
interface PackageUsage {
  packageName: string;
  workspaceId: number;
  fromFileId: number;
  specifier: string;
  isTypeOnly: boolean;
  isRuntime: boolean;
  isTestOnly: boolean;
}
interface ModuleGraph {
  rootDirectory: string;
  config: CodebaseAnalysisConfig;
  workspaces: WorkspaceInfo[];
  files: ProjectFile[];
  nodes: Map<number, ModuleGraphNode>;
  pathToFileId: Map<string, number>;
  entryPoints: EntryPoint[];
  packageUsages: PackageUsage[];
  unresolvedImports: ResolvedImport[];
  pluginResults: ReadonlyMap<number, CodebasePluginResult>;
}
interface CodebaseAnalysisResult {
  graph: ModuleGraph;
}
type EntryPointRole = "runtime" | "test" | "support";
//#endregion
//#region src/core/errors.d.ts
interface ReactDoctorErrorInfo {
  name: string;
  message: string;
  code: string;
  cause?: ReactDoctorErrorInfo;
}
interface ReactDoctorErrorOptions extends ErrorOptions {
  code?: string;
}
declare class ReactDoctorError extends Error {
  readonly name: string;
  readonly code: string;
  constructor(message: string, options?: ReactDoctorErrorOptions);
}
declare class ReactDoctorCancelledError extends ReactDoctorError {
  readonly name: string;
  constructor(message?: string, options?: ErrorOptions);
}
declare class ReactDoctorConfigError extends ReactDoctorError {
  readonly name: string;
  constructor(message: string, options?: ReactDoctorErrorOptions);
}
declare class ReactDoctorConfigNotFoundError extends ReactDoctorConfigError {
  readonly name: string;
  constructor(message?: string, options?: ErrorOptions);
}
declare class ReactDoctorInvalidConfigError extends ReactDoctorConfigError {
  readonly name: string;
  constructor(message: string, options?: ErrorOptions);
}
declare class ReactDoctorProjectError extends ReactDoctorError {
  readonly name: string;
  readonly rootDirectory: string;
  constructor(rootDirectory: string, message: string, options?: ReactDoctorErrorOptions);
}
declare class ReactDoctorProjectNotFoundError extends ReactDoctorProjectError {
  readonly name: string;
  constructor(rootDirectory: string, options?: ErrorOptions);
}
declare class ReactDoctorPackageJsonNotFoundError extends ReactDoctorProjectError {
  readonly name: string;
  constructor(rootDirectory: string, options?: ErrorOptions);
}
declare class ReactDoctorNoReactDependencyError extends ReactDoctorProjectError {
  readonly name: string;
  constructor(rootDirectory: string, options?: ErrorOptions);
}
declare class ReactDoctorAmbiguousProjectError extends ReactDoctorProjectError {
  readonly name: string;
  readonly candidates: readonly string[];
  constructor(rootDirectory: string, candidates: readonly string[], options?: ErrorOptions);
}
declare class ReactDoctorCheckError extends ReactDoctorError {
  readonly name: string;
  readonly checkId: string;
  constructor(checkId: string, message: string, options?: ReactDoctorErrorOptions);
}
declare class ReactDoctorCheckFailedError extends ReactDoctorCheckError {
  readonly name: string;
  constructor(checkId: string, message: string, options?: ErrorOptions);
}
declare class ReactDoctorCheckSkippedError extends ReactDoctorCheckError {
  readonly name: string;
  constructor(checkId: string, message: string, options?: ErrorOptions);
}
declare class ReactDoctorRunnerUnavailableError extends ReactDoctorCheckError {
  readonly name: string;
  constructor(checkId: string, message: string, options?: ErrorOptions);
}
declare class ReactDoctorUnsupportedRuntimeError extends ReactDoctorError {
  readonly name: string;
  constructor(message: string, options?: ErrorOptions);
}
declare class ReactDoctorTimeoutError extends ReactDoctorError {
  readonly name: string;
  constructor(message: string, options?: ErrorOptions);
}
declare class ReactDoctorReportError extends ReactDoctorError {
  readonly name: string;
  constructor(message: string, options?: ErrorOptions);
}
declare const isReactDoctorError: (value: unknown) => value is ReactDoctorError;
declare const toReactDoctorErrorInfo: (error: unknown) => ReactDoctorErrorInfo;
//#endregion
//#region src/core/types.d.ts
interface SourceLocation {
  filePath: string;
  line?: number;
  column?: number;
  endLine?: number;
  endColumn?: number;
}
interface ReactDoctorIssueSource {
  checkId: string;
  pluginName?: string;
  ruleId?: string;
}
interface ReactDoctorIssue {
  id: string;
  title: string;
  message: string;
  severity: "error" | "warning" | "info";
  category: string;
  location?: SourceLocation;
  recommendation?: string;
  source?: ReactDoctorIssueSource;
}
interface ReactDoctorCheckResult {
  id: string;
  name: string;
  status: "completed" | "failed" | "skipped";
  issues: ReactDoctorIssue[];
  durationMilliseconds: number;
  error?: ReactDoctorErrorInfo;
}
interface ReactDoctorScore {
  value: number;
  label: string;
}
type ReactDoctorFailOnLevel = "error" | "warning" | "none";
type ReactProjectFramework =
  | "cra"
  | "expo"
  | "gatsby"
  | "nextjs"
  | "react"
  | "react-native"
  | "remix"
  | "tanstack-start"
  | "unknown"
  | "vite";
interface ReactProjectInfo {
  rootDirectory: string;
  projectName: string;
  packageJsonPath: string | null;
  reactVersion: string | null;
  reactMajorVersion: number | null;
  reactPeerDependencyRange: string | null;
  tailwindVersion: string | null;
  framework: ReactProjectFramework;
  hasTypeScript: boolean;
  hasReactCompiler: boolean;
  hasTanStackAI: boolean;
  hasTanStackQuery: boolean;
  sourceFileCount: number;
}
interface ReactDoctorResult {
  status: "completed" | "completed-with-errors" | "failed";
  project: ReactProjectInfo;
  issues: ReactDoctorIssue[];
  checks: ReactDoctorCheckResult[];
  score: ReactDoctorScore | null;
  startedAt: string;
  completedAt: string;
  durationMilliseconds: number;
}
interface ReactDoctorRuleSelection {
  enabledRuleIds?: string[];
  disabledRuleIds?: string[];
}
interface ReactDoctorIgnoreOverride {
  files: string[];
  rules?: string[];
}
interface ReactDoctorIgnoreConfig {
  rules?: string[];
  files?: string[];
  overrides?: ReactDoctorIgnoreOverride[];
}
interface ReactDoctorConfig {
  ignore?: ReactDoctorIgnoreConfig;
  lint?: boolean;
  deadCode?: boolean;
  verbose?: boolean;
  diff?: boolean | string;
  offline?: boolean;
  failOn?: ReactDoctorFailOnLevel;
  customRulesOnly?: boolean;
  rootDir?: string;
  textComponents?: string[];
  rawTextWrapperComponents?: string[];
  respectInlineDisables?: boolean;
  adoptExistingLintConfig?: boolean;
  includeEcosystemRules?: boolean;
  ignoredTags?: string[];
}
interface LoadedReactDoctorConfig {
  config: ReactDoctorConfig;
  sourceDirectory: string;
  sourcePath: string;
}
interface ReactDoctorJsonReportSummary {
  errorCount: number;
  warningCount: number;
  affectedFileCount: number;
  totalIssueCount: number;
  score: number | null;
  scoreLabel: string | null;
}
interface ReactDoctorJsonReport {
  schemaVersion: 1;
  ok: boolean;
  project: ReactProjectInfo;
  issues: ReactDoctorIssue[];
  checks: ReactDoctorCheckResult[];
  summary: ReactDoctorJsonReportSummary;
  startedAt: string;
  completedAt: string;
  durationMilliseconds: number;
}
interface InspectReactProjectOptions {
  rootDirectory?: string;
  includePaths?: string[];
  excludePatterns?: string[];
  rules?: ReactDoctorRuleSelection;
  config?: ReactDoctorConfig | null;
  lint?: boolean;
  deadCode?: boolean;
  customRulesOnly?: boolean;
  respectInlineDisables?: boolean;
  offline?: boolean;
  signal?: AbortSignal;
}
//#endregion
//#region src/core/rules/types.d.ts
interface ReactDoctorRuleExample {
  before: string;
  after: string;
}
interface ReactDoctorRuleMetadata {
  id: string;
  name: string;
  description: string;
  recommendation?: string;
  examples?: ReactDoctorRuleExample[];
  category: string;
  severity: ReactDoctorIssue["severity"];
  defaultEnabled: boolean;
  tags: string[];
  docsUrl?: string;
}
interface ReactDoctorRuleContext {
  rootDirectory: string;
  includePaths?: string[];
  excludePatterns?: string[];
  signal?: AbortSignal;
  getCodebaseAnalysis?: () => Promise<CodebaseAnalysisResult>;
}
interface ReactDoctorRuleResult {
  issues: ReactDoctorIssue[];
}
interface ReactDoctorRule {
  metadata: ReactDoctorRuleMetadata;
  run: (context: ReactDoctorRuleContext) => ReactDoctorRuleResult | Promise<ReactDoctorRuleResult>;
}
//#endregion
//#region src/core/rules/registry.d.ts
interface DefineRule {
  (rule: ReactDoctorRule): ReactDoctorRule;
  <RuleDefinition>(rule: RuleDefinition): RuleDefinition;
}
declare const defineRule: DefineRule;
interface RuleRegistryOptions {
  rules?: ReactDoctorRule[];
  enabledRuleIds?: string[];
  disabledRuleIds?: string[];
}
interface ReactDoctorRuleRegistry {
  listRules: () => ReactDoctorRule[];
  listMetadata: () => ReactDoctorRuleMetadata[];
  getRule: (ruleId: string) => ReactDoctorRule | null;
  isRuleEnabled: (ruleId: string, selection?: ReactDoctorRuleSelection) => boolean;
  selectRules: (selection?: ReactDoctorRuleSelection) => ReactDoctorRule[];
  runRules: (context: RunRulesContext) => Promise<ReactDoctorCheckResult[]>;
  enableRule: (ruleId: string) => ReactDoctorRuleRegistry;
  disableRule: (ruleId: string) => ReactDoctorRuleRegistry;
}
interface RunRulesContext {
  rootDirectory: string;
  includePaths?: string[];
  excludePatterns?: string[];
  selection?: ReactDoctorRuleSelection;
  signal?: AbortSignal;
  getCodebaseAnalysis?: () => Promise<CodebaseAnalysisResult>;
}
//#endregion
//#region src/core/rules/react-project-structure.d.ts
declare const reactProjectStructureRule: ReactDoctorRule;
//#endregion
//#region src/core/rules/lint/rules.d.ts
declare const reactDoctorOxlintPlugin: RulePlugin;
//#endregion
//#region src/core/rules/index.d.ts
declare const coreRules: ReactDoctorRule[];
declare const createRuleRegistry: (options?: RuleRegistryOptions) => ReactDoctorRuleRegistry;
declare const ruleRegistry: ReactDoctorRuleRegistry;
//#endregion
export {
  Rule as $,
  SourceLocation as A,
  ReactDoctorErrorOptions as B,
  ReactDoctorJsonReport as C,
  ReactDoctorScore as D,
  ReactDoctorRuleSelection as E,
  ReactDoctorCheckSkippedError as F,
  ReactDoctorProjectNotFoundError as G,
  ReactDoctorNoReactDependencyError as H,
  ReactDoctorConfigError as I,
  ReactDoctorTimeoutError as J,
  ReactDoctorReportError as K,
  ReactDoctorConfigNotFoundError as L,
  ReactDoctorCancelledError as M,
  ReactDoctorCheckError as N,
  ReactProjectFramework as O,
  ReactDoctorCheckFailedError as P,
  RulePlugin as Q,
  ReactDoctorError as R,
  ReactDoctorIssueSource as S,
  ReactDoctorResult as T,
  ReactDoctorPackageJsonNotFoundError as U,
  ReactDoctorInvalidConfigError as V,
  ReactDoctorProjectError as W,
  isReactDoctorError as X,
  ReactDoctorUnsupportedRuntimeError as Y,
  toReactDoctorErrorInfo as Z,
  ReactDoctorConfig as _,
  reactProjectStructureRule as a,
  ReactDoctorIgnoreOverride as b,
  defineRule as c,
  ReactDoctorRuleExample as d,
  RuleExample as et,
  ReactDoctorRuleMetadata as f,
  ReactDoctorCheckResult as g,
  LoadedReactDoctorConfig as h,
  reactDoctorOxlintPlugin as i,
  ReactDoctorAmbiguousProjectError as j,
  ReactProjectInfo as k,
  ReactDoctorRule as l,
  InspectReactProjectOptions as m,
  createRuleRegistry as n,
  ReactDoctorRuleRegistry as o,
  ReactDoctorRuleResult as p,
  ReactDoctorRunnerUnavailableError as q,
  ruleRegistry as r,
  RuleRegistryOptions as s,
  coreRules as t,
  ReactDoctorRuleContext as u,
  ReactDoctorFailOnLevel as v,
  ReactDoctorJsonReportSummary as w,
  ReactDoctorIssue as x,
  ReactDoctorIgnoreConfig as y,
  ReactDoctorErrorInfo as z,
};
//# sourceMappingURL=index-BuoGgbB8.d.ts.map
