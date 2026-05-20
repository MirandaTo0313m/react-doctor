import { Effect, Layer, Ref, Stream } from "effect";
import {
  combineDiagnostics,
  computeJsxIncludePaths,
  filterDiagnosticsForSurface,
  resolveLintIncludePaths,
} from "@react-doctor/core";
import type {
  Diagnostic as LegacyDiagnostic,
  DiagnosticSurface,
  ProjectInfo,
  ReactDoctorConfig,
  ScoreResult,
} from "@react-doctor/types";
import { Config, type ResolvedConfig } from "./config.js";
import type { Diagnostic } from "./diagnostic-schema.js";
import { formatReactDoctorError, NoReactDependency, ReactDoctorError } from "./errors.js";
import { LintPartialFailures, Linter } from "./linter.js";
import { Project } from "./project.js";
import { Reporter } from "./reporter.js";
import { Score } from "./score.js";

/**
 * Inputs that the orchestrating Effect needs from the caller. CLI
 * flags + config defaults already collapse to this shape in
 * `react-doctor/src/inspect.ts` — keeping the type narrow keeps
 * the orchestrator independent of how those defaults were merged.
 */
export interface RunInspectInput {
  readonly directory: string;
  readonly includePaths: ReadonlyArray<string>;
  readonly customRulesOnly: boolean;
  readonly respectInlineDisables: boolean;
  readonly adoptExistingLintConfig: boolean;
  readonly ignoredTags: ReadonlySet<string>;
  readonly outputSurface: DiagnosticSurface;
  readonly nodeBinaryPath?: string;
}

/**
 * Outputs the orchestrator hands back to the caller. Keeps the
 * shape minimal — the CLI / programmatic API merges this with
 * timings + the resolved project to produce the
 * public-API `InspectResult`.
 */
export interface RunInspectOutput {
  readonly project: ProjectInfo;
  readonly userConfig: ReactDoctorConfig | null;
  readonly resolvedDirectory: string;
  readonly diagnostics: ReadonlyArray<LegacyDiagnostic>;
  readonly score: ScoreResult | null;
  readonly didLintFail: boolean;
  readonly lintFailureReason: string | null;
  readonly lintPartialFailures: ReadonlyArray<string>;
}

/**
 * Hooks the caller can pass to participate in the streaming
 * pipeline without owning the orchestration. Today the CLI uses
 * them to wrap the lint phase in a spinner and to print the
 * project-detection block before the lint stream starts. A future
 * LSP host would use them to publish `Diagnostic` events as they
 * stream past, instead of waiting for the collected array.
 */
export interface RunInspectHooks {
  readonly beforeLint?: (
    project: ProjectInfo,
    lintIncludePaths: ReadonlyArray<string> | undefined,
  ) => Effect.Effect<void>;
  readonly afterLint?: (didFail: boolean) => Effect.Effect<void>;
}

const NO_HOOKS: Required<RunInspectHooks> = {
  beforeLint: () => Effect.void,
  afterLint: () => Effect.void,
};

/**
 * The full inspect orchestration as a single composable Effect.
 *
 * Replaces the imperative `runInspect` body in
 * `react-doctor/src/inspect.ts` (the spinner / lint / combine /
 * score / render flow) with a Layer-driven pipeline. Each axis is
 * a Service with multiple Layers, so:
 *
 *  - The CLI provides `Project.layerNode + Config.layerNode +
 *    Linter.layerOxlint + Score.layerHttp` (or `Score.layerOffline`
 *    for `--offline`) plus a Reporter.
 *  - A future LSP host provides the same Project/Config layers but
 *    swaps Linter for an in-process ESLint worker pool and Reporter
 *    for an LSP `publishDiagnostics` adapter.
 *  - Tests provide `Project.layerOf + Config.layerOf + Linter.layerOf
 *    + Score.layerOf` and assert against a `Reporter.layerCapture`
 *    Ref.
 *
 * Lint failures are tagged: a `ReactDoctorError` from `Linter.lint`
 * is caught with `Effect.catchTag` and folded into a non-fatal
 * `didLintFail / lintFailureReason` pair on the result, exactly
 * how the legacy entry point handled them. The renderer keeps
 * showing skipped checks; only the error type changes.
 */
export const runInspect = (
  input: RunInspectInput,
  hooks: RunInspectHooks = {},
): Effect.Effect<
  RunInspectOutput,
  ReactDoctorError,
  Project | Config | Linter | LintPartialFailures | Reporter | Score
> =>
  Effect.gen(function* () {
    const projectService = yield* Project;
    const configService = yield* Config;
    const linterService = yield* Linter;
    const reporterService = yield* Reporter;
    const scoreService = yield* Score;
    const partialFailuresRef = yield* LintPartialFailures;

    const resolvedConfig: ResolvedConfig = yield* configService.resolve(input.directory);
    const scanDirectory = resolvedConfig.resolvedDirectory;

    const project = yield* projectService.discover(scanDirectory);
    if (project.reactVersion === null) {
      return yield* new ReactDoctorError({
        reason: new NoReactDependency({ directory: scanDirectory }),
      });
    }

    const jsxIncludePaths = computeJsxIncludePaths([...input.includePaths]);
    const lintIncludePaths =
      jsxIncludePaths ?? resolveLintIncludePaths(scanDirectory, resolvedConfig.config);

    const beforeLint = hooks.beforeLint ?? NO_HOOKS.beforeLint;
    const afterLint = hooks.afterLint ?? NO_HOOKS.afterLint;
    yield* beforeLint(project, lintIncludePaths);

    const lintFailure = yield* Ref.make<{
      didFail: boolean;
      reason: string | null;
    }>({ didFail: false, reason: null });

    const lintStream = linterService
      .lint({
        rootDirectory: scanDirectory,
        project,
        includePaths: lintIncludePaths ?? undefined,
        nodeBinaryPath: input.nodeBinaryPath,
        customRulesOnly: input.customRulesOnly,
        respectInlineDisables: input.respectInlineDisables,
        adoptExistingLintConfig: input.adoptExistingLintConfig,
        ignoredTags: input.ignoredTags,
        userConfig: resolvedConfig.config ?? undefined,
      })
      .pipe(
        Stream.tap((diagnostic) => reporterService.emit(diagnostic)),
        Stream.catchTag("ReactDoctorError", (error) =>
          Stream.unwrap(
            Effect.gen(function* () {
              yield* Ref.set(lintFailure, {
                didFail: true,
                reason: formatReactDoctorError(error),
              });
              return Stream.empty as Stream.Stream<Diagnostic, never>;
            }),
          ),
        ),
      );

    const lintDiagnostics = yield* Stream.runCollect(lintStream);
    yield* reporterService.finalize;
    const lintFailureState = yield* Ref.get(lintFailure);
    yield* afterLint(lintFailureState.didFail);

    const lintDiagnosticsAsLegacy: LegacyDiagnostic[] = [...lintDiagnostics] as LegacyDiagnostic[];

    const combined = combineDiagnostics({
      lintDiagnostics: lintDiagnosticsAsLegacy,
      directory: scanDirectory,
      isDiffMode: input.includePaths.length > 0,
      userConfig: resolvedConfig.config,
      respectInlineDisables: input.respectInlineDisables,
    });

    const scoringDiagnostics = filterDiagnosticsForSurface(
      combined,
      "score",
      resolvedConfig.config,
    );
    const score = lintFailureState.didFail ? null : yield* scoreService.compute(scoringDiagnostics);

    const lintPartialFailures = yield* Ref.get(partialFailuresRef);

    return {
      project,
      userConfig: resolvedConfig.config,
      resolvedDirectory: scanDirectory,
      diagnostics: combined,
      score,
      didLintFail: lintFailureState.didFail,
      lintFailureReason: lintFailureState.reason,
      lintPartialFailures,
    };
  });

/**
 * Default layer stack for the production CLI / programmatic API:
 * real Node-side services for Project / Config / Linter; HTTP for
 * Score; capture Reporter so the caller can read the emitted
 * diagnostics off the Ref after the pipeline finishes.
 *
 * Callers tweak by providing different layers. `--offline` swaps
 * `Score.layerHttp` for `Score.layerOffline`; an LSP host would
 * swap `Reporter.layerCapture` for an LSP-publishing reporter.
 */
export const layerInspectLive = Layer.mergeAll(
  Project.layerNode,
  Config.layerNode,
  Linter.layerOxlint,
  LintPartialFailures.layerLive,
  Reporter.layerCapture,
  Score.layerHttp,
);
