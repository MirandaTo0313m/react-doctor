import path from "node:path";
import { Effect, Layer } from "effect";
import {
  buildJsonReport,
  buildJsonReportError,
  loadConfigWithSource,
  resolveConfigRootDir,
  resolveDiagnoseTarget,
} from "@react-doctor/core";
import {
  AmbiguousProjectError,
  clearPackageJsonCache,
  clearProjectCache,
  NoReactDependencyError,
  ProjectNotFoundError,
} from "@react-doctor/project-info";
import {
  Config,
  DeadCode,
  Files,
  formatReactDoctorError,
  LintPartialFailures,
  Linter,
  Project,
  ReactDoctorError,
  Reporter,
  runInspect as runInspectEffect,
  Score,
  type RunInspectInput,
} from "@react-doctor/runtime";
import {
  clearAutoSuppressionCaches,
  clearConfigCache,
  clearIgnorePatternsCache,
} from "@react-doctor/core";
import type {
  Diagnostic,
  DiagnoseOptions,
  DiagnoseResult,
  DiffInfo,
  JsonReport,
  JsonReportDiffInfo,
  JsonReportError,
  JsonReportMode,
  JsonReportProjectEntry,
  JsonReportSummary,
  ProjectInfo,
  ReactDoctorConfig,
  ScoreResult,
} from "@react-doctor/types";

export type {
  Diagnostic,
  DiagnoseOptions,
  DiagnoseResult,
  DiffInfo,
  JsonReport,
  JsonReportDiffInfo,
  JsonReportError,
  JsonReportMode,
  JsonReportProjectEntry,
  JsonReportSummary,
  ProjectInfo,
  ReactDoctorConfig,
  ScoreResult,
};
export { getDiffInfo, filterSourceFiles, summarizeDiagnostics } from "@react-doctor/core";
export { buildJsonReport, buildJsonReportError };
export {
  ReactDoctorError as ProjectInfoError,
  ProjectNotFoundError,
  NoReactDependencyError,
  PackageJsonNotFoundError,
  isReactDoctorError,
} from "@react-doctor/project-info";
export { AmbiguousProjectError };

// HACK: programmatic API consumers (watch-mode tools, test runners,
// agentic CLI flows) call diagnose() repeatedly on the same directory.
// project / config / package.json results are memoized at module scope
// to keep CLI scans fast — this hook lets long-running consumers
// invalidate when the underlying files change between calls.
export const clearCaches = (): void => {
  clearProjectCache();
  clearConfigCache();
  clearPackageJsonCache();
  clearIgnorePatternsCache();
  clearAutoSuppressionCaches();
};

interface ToJsonReportOptions {
  version: string;
  directory?: string;
  mode?: JsonReportMode;
}

export const toJsonReport = (result: DiagnoseResult, options: ToJsonReportOptions): JsonReport =>
  buildJsonReport({
    version: options.version,
    directory: options.directory ?? result.project.rootDirectory,
    mode: options.mode ?? "full",
    diff: null,
    scans: [
      {
        directory: result.project.rootDirectory,
        result: {
          diagnostics: result.diagnostics,
          score: result.score,
          skippedChecks: [],
          project: result.project,
          elapsedMilliseconds: result.elapsedMilliseconds,
        },
      },
    ],
    totalElapsedMilliseconds: result.elapsedMilliseconds,
  });

/**
 * Structural tag check (see `inspect.ts` for the full rationale).
 * The short version: `instanceof ReactDoctorError` is unreliable
 * across the runtime → public-API module boundary in some test
 * environments, while the `_tag` field is the structural contract
 * the runtime publishes and every downstream renderer already
 * consumes.
 */
const isReactDoctorErrorLike = (cause: unknown): cause is ReactDoctorError =>
  typeof cause === "object" &&
  cause !== null &&
  (cause as { _tag?: unknown })._tag === "ReactDoctorError" &&
  typeof (cause as { reason?: { _tag?: unknown } }).reason === "object" &&
  (cause as { reason?: { _tag?: unknown } }).reason !== null;

const restoreLegacyThrow = (error: ReactDoctorError, fallbackDirectory: string): never => {
  const reason = error.reason;
  switch (reason._tag) {
    case "NoReactDependency":
      throw new NoReactDependencyError(reason.directory);
    case "ProjectNotFound":
      throw new ProjectNotFoundError(reason.directory);
    case "AmbiguousProject":
      throw new AmbiguousProjectError(reason.directory, [...reason.candidates]);
    default:
      throw new Error(`${formatReactDoctorError(error)} (at ${fallbackDirectory})`);
  }
};

/**
 * Programmatic API. Reuses the same Effect runtime that powers the
 * CLI's `inspect()` — both entry points share the Project /
 * Config / Files / Linter / Score services below this layer.
 * CLI-only concerns (spinner, project-detection block,
 * pretty-printed diagnostics) live in `inspect.ts` instead, which
 * provides its own hooks. Here we just collect the result.
 */
export const diagnose = async (
  directory: string,
  options: DiagnoseOptions = {},
): Promise<DiagnoseResult> => {
  const startTime = globalThis.performance.now();
  const requestedDirectory = path.resolve(directory);

  // `diagnose()` historically auto-falls-back to a nested React
  // subproject when the requested directory has no root
  // package.json. That isn't `inspect()` behavior — `inspect()`
  // assumes the user pointed at a real project — so we do the walk
  // here, before handing control to the runtime. Throws
  // `AmbiguousProjectError` when more than one nested candidate
  // exists; the runtime never has to know about that case.
  const initialLoadedConfig = loadConfigWithSource(requestedDirectory);
  const redirectedDirectory = resolveConfigRootDir(
    initialLoadedConfig?.config ?? null,
    initialLoadedConfig?.sourceDirectory ?? null,
  );
  const directoryAfterRedirect = redirectedDirectory ?? requestedDirectory;
  let resolvedDirectory: string | null;
  try {
    resolvedDirectory = resolveDiagnoseTarget(directoryAfterRedirect);
  } catch (error) {
    if (error instanceof AmbiguousProjectError) throw error;
    throw error;
  }
  if (!resolvedDirectory) {
    throw new ProjectNotFoundError(directoryAfterRedirect);
  }

  const userConfig =
    initialLoadedConfig?.config ?? loadConfigWithSource(resolvedDirectory)?.config ?? null;

  const includePaths = options.includePaths ?? [];
  const effectiveDeadCode = options.deadCode ?? userConfig?.deadCode ?? true;

  const runtimeInput: RunInspectInput = {
    directory: resolvedDirectory,
    includePaths,
    customRulesOnly: userConfig?.customRulesOnly ?? false,
    respectInlineDisables:
      options.respectInlineDisables ?? userConfig?.respectInlineDisables ?? true,
    adoptExistingLintConfig: userConfig?.adoptExistingLintConfig ?? true,
    ignoredTags: new Set<string>(userConfig?.ignore?.tags ?? []),
    outputSurface: "cli",
    runDeadCode: effectiveDeadCode,
  };

  const lintLayer =
    (options.lint ?? userConfig?.lint ?? true) ? Linter.layerOxlint : Linter.layerNoop;
  const deadCodeLayer = effectiveDeadCode ? DeadCode.layerNode : DeadCode.layerNoop;

  // `Config.layerOf` short-circuits the on-disk re-resolve we
  // already performed above, so the runtime sees the same config /
  // resolved directory the public API just chose. Without this, the
  // runtime would re-walk and could pick a different nested project
  // than the one the public-API fallback resolved.
  const configLayer = Config.layerOf({
    config: userConfig,
    resolvedDirectory: resolvedDirectory,
  });

  const layerStack = Layer.mergeAll(
    Project.layerNode,
    configLayer,
    deadCodeLayer,
    Files.layerNode,
    lintLayer,
    LintPartialFailures.layerLive,
    Reporter.layerCapture,
    Score.layerHttp,
  );

  let result;
  try {
    result = await Effect.runPromise(
      runInspectEffect(runtimeInput).pipe(Effect.provide(layerStack)),
    );
  } catch (cause) {
    if (isReactDoctorErrorLike(cause)) restoreLegacyThrow(cause, requestedDirectory);
    throw cause;
  }

  const skippedChecks: string[] = [];
  const skippedCheckReasons: Record<string, string> = {};
  if (result.didDeadCodeFail) {
    skippedChecks.push("dead-code");
    if (result.deadCodeFailureReason !== null) {
      skippedCheckReasons["dead-code"] = result.deadCodeFailureReason;
    }
  }

  return {
    diagnostics: [...result.diagnostics],
    score: result.score,
    skippedChecks,
    ...(Object.keys(skippedCheckReasons).length > 0 ? { skippedCheckReasons } : {}),
    project: result.project,
    elapsedMilliseconds: globalThis.performance.now() - startTime,
  };
};
