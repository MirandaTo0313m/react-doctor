//#region src/sdk/compat.d.ts
interface Diagnostic {
  filePath: string;
  plugin: string;
  rule: string;
  severity: "error" | "warning";
  message: string;
  help: string;
  url?: string;
  line: number;
  column: number;
  category: string;
  suppressionHint?: string;
}
interface ScoreResult {
  score: number;
  label: string;
}
interface ProjectInfo {
  rootDirectory: string;
  projectName: string;
  reactVersion: string | null;
  tailwindVersion: string | null;
  framework: string;
  hasTypeScript: boolean;
  hasReactCompiler: boolean;
  hasTanStackQuery: boolean;
  sourceFileCount: number;
}
interface DiagnoseOptions {
  lint?: boolean;
  deadCode?: boolean;
  verbose?: boolean;
  includePaths?: string[];
  respectInlineDisables?: boolean;
  signal?: AbortSignal;
}
interface DiagnoseResult {
  diagnostics: Diagnostic[];
  score: ScoreResult | null;
  project: ProjectInfo;
  elapsedMilliseconds: number;
}
/**
 * @deprecated Use `createReactDoctor({ rootDirectory }).inspect()` from the main SDK instead.
 */
declare const diagnose: (directory: string, options?: DiagnoseOptions) => Promise<DiagnoseResult>;
declare const clearCaches: () => void;
//#endregion
export {
  DiagnoseOptions,
  DiagnoseResult,
  Diagnostic,
  ProjectInfo,
  ScoreResult,
  clearCaches,
  diagnose,
};
//# sourceMappingURL=compat.d.ts.map
