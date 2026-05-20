import { Effect, Filter, Layer, Option, Ref, Stream } from "effect";

const filterMapNullable = <A, B>(transform: (value: A) => B | null): Filter.Filter<A, B> =>
  Filter.fromPredicateOption((value) => {
    const result = transform(value);
    return result === null ? Option.none() : Option.some(result);
  });
import {
  buildDiagnosticPipeline,
  checkReducedMotion,
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
import {
  formatReactDoctorError,
  NoReactDependency,
  ReactDoctorError,
  type ReactDoctorErrorReason,
} from "./errors.js";
import { buildSyncReadFileLines, Files } from "./files.js";
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
  /**
   * The `_tag` of the lint failure's `reason` when the lint stream
   * raised a `ReactDoctorError`, or `null` otherwise. Lets renderers
   * dispatch on the typed reason (e.g. show the "upgrade Node"
   * hint only on `OxlintNativeBindingFailed`) without falling back
   * to `lintFailureReason.includes("native binding")`-style sniffs.
   */
  readonly lintFailureReasonTag: ReactDoctorErrorReason["_tag"] | null;
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
export interface RunInspectHooks<HooksR = never> {
  readonly beforeLint?: (
    project: ProjectInfo,
    lintIncludePaths: ReadonlyArray<string> | undefined,
  ) => Effect.Effect<void, never, HooksR>;
  readonly afterLint?: (didFail: boolean) => Effect.Effect<void, never, HooksR>;
}

const NO_HOOKS: Required<RunInspectHooks<never>> = {
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
 *    Files.layerNode + Linter.layerOxlint + Reporter.layerCapture
 *    + Score.layerHttp` (or `Score.layerOffline` for `--offline`).
 *  - Tests provide `Project.layerOf + Config.layerOf +
 *    Files.layerInMemory + Linter.layerOf + Score.layerOf` and
 *    assert against a `Reporter.layerCapture` Ref.
 *  - Future runtime consumers (an LSP host, a watch mode, a
 *    daemon) would swap whichever layers fit their surface — the
 *    orchestrator doesn't change.
 *
 * Lint failures are tagged: a `ReactDoctorError` from `Linter.lint`
 * is caught with `Effect.catchTag` and folded into a non-fatal
 * `didLintFail / lintFailureReason` pair on the result, exactly
 * how the legacy entry point handled them. The renderer keeps
 * showing skipped checks; only the error type changes.
 */
export const runInspect = <HooksR = never>(
  input: RunInspectInput,
  hooks: RunInspectHooks<HooksR> = {},
): Effect.Effect<
  RunInspectOutput,
  ReactDoctorError,
  Project | Config | Files | Linter | LintPartialFailures | Reporter | Score | HooksR
> =>
  Effect.gen(function* () {
    const projectService = yield* Project;
    const configService = yield* Config;
    const filesService = yield* Files;
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
      reasonTag: ReactDoctorErrorReason["_tag"] | null;
    }>({ didFail: false, reason: null, reasonTag: null });

    const isDiffMode = input.includePaths.length > 0;

    // Pre-compile the per-element pipeline once. Auto-suppress,
    // severity overrides, ignore filters, inline-suppression
    // evaluation — every stage is wrapped in a single closure
    // invoked from `Stream.filterMap` below. The legacy array
    // entry point in `mergeAndFilterDiagnostics` shares this exact
    // transform, so there is no second copy of the chain to keep
    // in sync.
    const readFileLinesSync = buildSyncReadFileLines(filesService, scanDirectory);
    const transform = buildDiagnosticPipeline({
      rootDirectory: scanDirectory,
      userConfig: resolvedConfig.config,
      readFileLinesSync,
      respectInlineDisables: input.respectInlineDisables,
    });

    // Environment-side diagnostics (e.g. the
    // `prefers-reduced-motion` CSS audit) come from the filesystem
    // directly, not from the linter. They prepend the lint stream
    // so they flow through the same per-element transform and the
    // same `Reporter.emit` calls a future LSP host would observe.
    const environmentDiagnostics: ReadonlyArray<LegacyDiagnostic> = isDiffMode
      ? []
      : checkReducedMotion(scanDirectory);

    const rawLintStream = linterService
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
        Stream.catchTag("ReactDoctorError", (error) =>
          Stream.unwrap(
            Effect.gen(function* () {
              yield* Ref.set(lintFailure, {
                didFail: true,
                reason: formatReactDoctorError(error),
                reasonTag: error.reason._tag,
              });
              return Stream.empty as Stream.Stream<Diagnostic, never>;
            }),
          ),
        ),
      );

    // Stream stages: prepend env-side diagnostics; apply the
    // per-element pipeline (drop-on-null); push survivors to the
    // reporter as they emerge so a streaming reporter (LSP
    // `publishDiagnostics`, NDJSON cache, SARIF) sees diagnostics
    // mid-scan instead of after `runCollect`.
    const transformedStream: Stream.Stream<LegacyDiagnostic> = Stream.fromIterable(
      environmentDiagnostics,
    ).pipe(
      Stream.concat(rawLintStream as Stream.Stream<LegacyDiagnostic>),
      Stream.filterMap(filterMapNullable<LegacyDiagnostic, LegacyDiagnostic>(transform.apply)),
      Stream.tap((diagnostic) => reporterService.emit(diagnostic as Diagnostic)),
    );

    const survivingDiagnostics = yield* Stream.runCollect(transformedStream);
    yield* reporterService.finalize;
    const lintFailureState = yield* Ref.get(lintFailure);
    yield* afterLint(lintFailureState.didFail);

    const finalDiagnostics: ReadonlyArray<LegacyDiagnostic> = [...survivingDiagnostics];

    const scoringDiagnostics = filterDiagnosticsForSurface(
      [...finalDiagnostics],
      "score",
      resolvedConfig.config,
    );
    const score = lintFailureState.didFail ? null : yield* scoreService.compute(scoringDiagnostics);

    const lintPartialFailures = yield* Ref.get(partialFailuresRef);

    return {
      project,
      userConfig: resolvedConfig.config,
      resolvedDirectory: scanDirectory,
      diagnostics: finalDiagnostics,
      score,
      didLintFail: lintFailureState.didFail,
      lintFailureReason: lintFailureState.reason,
      lintFailureReasonTag: lintFailureState.reasonTag,
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
  Files.layerNode,
  Linter.layerOxlint,
  LintPartialFailures.layerLive,
  Reporter.layerCapture,
  Score.layerHttp,
);
