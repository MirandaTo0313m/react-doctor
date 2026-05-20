import { Effect, Stream } from "effect";
import type { Diagnostic } from "./diagnostic-schema.js";
import type { ReactDoctorError } from "./errors.js";
import { LintPartialFailures, Linter, type LintInput } from "./linter.js";
import { Reporter } from "./reporter.js";

/**
 * Counters returned by `runDiagnosticPipeline`. The caller decides
 * what to do with them (CLI summary, `--fail-on` exit code, JSON
 * report summary, GitHub Actions job-level annotation). They're
 * computed inline by the streaming sink so the full diagnostic list
 * never has to materialize.
 */
export interface DiagnosticPipelineCounts {
  readonly errorCount: number;
  readonly warningCount: number;
  readonly totalCount: number;
}

const EMPTY_COUNTS: DiagnosticPipelineCounts = {
  errorCount: 0,
  warningCount: 0,
  totalCount: 0,
};

/**
 * Per-diagnostic predicate hook. Returns `true` to keep the
 * diagnostic, `false` to drop it. The non-streaming equivalents
 * already live in `@react-doctor/core`
 * (`apply-ignore-overrides.ts`, `apply-severity-controls.ts`,
 * `filter-for-surface.ts`, `evaluate-suppression.ts`) and are
 * straight array-in/array-out transforms — exactly the shape that
 * lifts cleanly into a `Stream.filter`. This option lets a caller
 * compose those existing transforms one at a time without rebuilding
 * the streaming pipeline for each.
 */
export interface DiagnosticPipelineOptions {
  readonly keep?: (diagnostic: Diagnostic) => boolean;
}

/**
 * Streaming diagnostic pipeline.
 *
 * Replaces the current `runOxlint().then(combineDiagnostics).then(filter…)`
 * array-of-arrays shape with a single `Stream` that emits as
 * diagnostics are produced and folds counters in one pass. Three
 * properties fall out for free, matching the moves in
 * react-doctor-evals' `Runner.run`:
 *
 *  - **TTFB**: a future LSP host or watch mode can flush diagnostics
 *    to the editor as they're discovered, instead of after every
 *    file is parsed.
 *  - **Bounded memory**: counters are per-element folds, never an
 *    intermediate array. A 50k-diagnostic monorepo scan never holds
 *    more than one diagnostic in flight in this layer.
 *  - **Resumable / cancelable**: composes with a `FiberMap` keyed by
 *    project root. A new file change cancels the previous fiber for
 *    the same key without leaking work.
 */
export const runDiagnosticPipeline = (
  input: LintInput,
  options: DiagnosticPipelineOptions = {},
): Effect.Effect<
  DiagnosticPipelineCounts,
  ReactDoctorError,
  Linter | LintPartialFailures | Reporter
> =>
  Effect.gen(function* () {
    const linter = yield* Linter;
    const reporter = yield* Reporter;

    const filtered = options.keep
      ? linter.lint(input).pipe(Stream.filter(options.keep))
      : linter.lint(input);

    const counts = yield* filtered.pipe(
      Stream.runFoldEffect<DiagnosticPipelineCounts, Diagnostic, never, Reporter>(
        () => EMPTY_COUNTS,
        (accumulator, diagnostic) =>
          Effect.as(reporter.emit(diagnostic), {
            errorCount: accumulator.errorCount + (diagnostic.severity === "error" ? 1 : 0),
            warningCount: accumulator.warningCount + (diagnostic.severity === "warning" ? 1 : 0),
            totalCount: accumulator.totalCount + 1,
          }),
      ),
    );

    yield* reporter.finalize;
    return counts;
  });
