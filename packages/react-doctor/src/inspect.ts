import { performance } from "node:perf_hooks";
import { Effect, Layer, Ref } from "effect";
import {
  OXLINT_NODE_REQUIREMENT,
  filterDiagnosticsForSurface,
  highlighter,
  isLoggerSilent,
  loadConfigWithSource,
  logger,
  setLoggerSilent,
} from "@react-doctor/core";
import { NoReactDependencyError } from "@react-doctor/project-info";
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
  Spinner,
  type RunInspectInput,
  type SpinnerHandle,
} from "@react-doctor/runtime";
import type {
  DiagnosticSurface,
  InspectOptions,
  InspectResult,
  ReactDoctorConfig,
} from "@react-doctor/types";
import { printDiagnostics } from "./cli/utils/render-diagnostics.js";
import { printProjectDetection } from "./cli/utils/render-project-detection.js";
import {
  printBrandingOnlyHeader,
  printNoScoreHeader,
  printScoreHeader,
} from "./cli/utils/render-score-header.js";
import { printSummary } from "./cli/utils/render-summary.js";
import { resolveOxlintNode } from "./cli/utils/resolve-oxlint-node.js";
import { isSpinnerSilent, setSpinnerSilent, spinner } from "./cli/utils/spinner.js";

interface ResolvedInspectOptions {
  lint: boolean;
  deadCode: boolean;
  verbose: boolean;
  scoreOnly: boolean;
  offline: boolean;
  silent: boolean;
  includePaths: string[];
  customRulesOnly: boolean;
  share: boolean;
  respectInlineDisables: boolean;
  adoptExistingLintConfig: boolean;
  ignoredTags: ReadonlySet<string>;
  outputSurface: DiagnosticSurface;
}

const buildIgnoredTags = (userConfig: ReactDoctorConfig | null): ReadonlySet<string> => {
  const tags = new Set<string>();
  if (userConfig?.ignore?.tags) {
    for (const tag of userConfig.ignore.tags) tags.add(tag);
  }
  return tags;
};

const mergeInspectOptions = (
  inputOptions: InspectOptions,
  userConfig: ReactDoctorConfig | null,
): ResolvedInspectOptions => ({
  lint: inputOptions.lint ?? userConfig?.lint ?? true,
  deadCode: inputOptions.deadCode ?? userConfig?.deadCode ?? true,
  verbose: inputOptions.verbose ?? userConfig?.verbose ?? false,
  scoreOnly: inputOptions.scoreOnly ?? false,
  offline: inputOptions.offline ?? false,
  silent: inputOptions.silent ?? false,
  includePaths: inputOptions.includePaths ?? [],
  customRulesOnly: userConfig?.customRulesOnly ?? false,
  share: userConfig?.share ?? true,
  respectInlineDisables:
    inputOptions.respectInlineDisables ?? userConfig?.respectInlineDisables ?? true,
  adoptExistingLintConfig: userConfig?.adoptExistingLintConfig ?? true,
  ignoredTags: buildIgnoredTags(userConfig),
  outputSurface: inputOptions.outputSurface ?? "cli",
});

/**
 * Structural tag check. Empirically, `instanceof ReactDoctorError`
 * was unreliable here when crossing the runtime → public-API
 * module boundary in test environments — the imported binding
 * could read as `undefined` at the catch site even though the
 * thrown value's `_tag` was correct. Rather than diagnose every
 * possible cause (ESM live-binding init order, dual class names
 * in the bundle graph from the legacy project-info
 * `ReactDoctorError` and the new tagged class, vitest's module
 * loader, …), we discriminate on the structural `_tag` field the
 * runtime publishes — the same contract `Effect.catchTag` and
 * every downstream renderer already use.
 */
const isReactDoctorErrorLike = (cause: unknown): cause is ReactDoctorError =>
  typeof cause === "object" &&
  cause !== null &&
  (cause as { _tag?: unknown })._tag === "ReactDoctorError" &&
  typeof (cause as { reason?: { _tag?: unknown } }).reason === "object" &&
  (cause as { reason?: { _tag?: unknown } }).reason !== null;

/**
 * Translates a runtime tagged-error back into the legacy thrown
 * class the public `inspect()` API has always advertised (and that
 * existing tests assert via `instanceof` / message substring).
 *
 * This is the boundary between the runtime's `ReactDoctorError`
 * (`reason: Schema.Union(...)`) and the long-standing public errors
 * exported from `@react-doctor/project-info`. Adding a new public
 * thrown class — say a future `ConfigParseError` — is one new
 * `case` here; everything inside the runtime keeps speaking in
 * tagged reasons.
 */
const restoreLegacyThrow = (error: ReactDoctorError): never => {
  const reason = error.reason;
  switch (reason._tag) {
    case "NoReactDependency":
      throw new NoReactDependencyError(reason.directory);
    default:
      throw new Error(formatReactDoctorError(error));
  }
};

export const inspect = async (
  directory: string,
  inputOptions: InspectOptions = {},
): Promise<InspectResult> => {
  const startTime = performance.now();

  const hasConfigOverride = inputOptions.configOverride !== undefined;
  const userConfig: ReactDoctorConfig | null = hasConfigOverride
    ? (inputOptions.configOverride ?? null)
    : (loadConfigWithSource(directory)?.config ?? null);
  const options = mergeInspectOptions(inputOptions, userConfig);

  const wasLoggerSilent = isLoggerSilent();
  const wasSpinnerSilent = isSpinnerSilent();
  if (options.silent) {
    setLoggerSilent(true);
    setSpinnerSilent(true);
  }

  try {
    return await runInspectWithRuntime(
      directory,
      options,
      userConfig,
      hasConfigOverride,
      startTime,
    );
  } finally {
    if (options.silent) {
      setLoggerSilent(wasLoggerSilent);
      setSpinnerSilent(wasSpinnerSilent);
    }
  }
};

const runInspectWithRuntime = async (
  directory: string,
  options: ResolvedInspectOptions,
  configOverride: ReactDoctorConfig | null,
  hasConfigOverride: boolean,
  startTime: number,
): Promise<InspectResult> => {
  const isDiffMode = options.includePaths.length > 0;

  // Pre-check the oxlint native binding the same way the legacy
  // entry point did: `resolveOxlintNode` prints its own warnings /
  // upgrade hints to the user, and returns `null` when the binding
  // can't be loaded for the current Node. In that mode we run the
  // pipeline with the noop linter so the rest of the orchestration
  // (project detection, score, rendering) still happens, with
  // `skippedChecks: ["lint"]` surfacing the missed coverage.
  const resolvedNodeBinaryPath = await resolveOxlintNode(
    options.lint,
    options.scoreOnly || options.silent,
  );
  const lintBindingMissing = options.lint && !resolvedNodeBinaryPath;

  // CLI factory that adapts the existing ora-backed `spinner()`
  // helper to the runtime's `Spinner` service shape (Effect-typed
  // succeed/fail). Tests provide `Spinner.layerCapture` instead of
  // `vi.mock("ora")` — same dispatch, no module-level monkey-patch.
  const oraFactory = (text: string): SpinnerHandle => {
    const handle = spinner(text).start();
    return {
      succeed: (displayText: string) => Effect.sync(() => handle.succeed(displayText)),
      fail: (displayText: string) => Effect.sync(() => handle.fail(displayText)),
    };
  };

  const runtimeInput: RunInspectInput = {
    directory,
    includePaths: options.includePaths,
    customRulesOnly: options.customRulesOnly,
    respectInlineDisables: options.respectInlineDisables,
    adoptExistingLintConfig: options.adoptExistingLintConfig,
    ignoredTags: options.ignoredTags,
    outputSurface: options.outputSurface,
    nodeBinaryPath: resolvedNodeBinaryPath ?? undefined,
    runDeadCode: options.deadCode,
  };

  // Custom layer stack so `--offline` swaps `Score`, the missing
  // binding case swaps `Linter` to noop, `--no-dead-code` swaps
  // `DeadCode` to noop, and a caller-supplied `configOverride`
  // skips the on-disk re-load through `Config.layerOf`.
  const lintLayer = !options.lint || lintBindingMissing ? Linter.layerNoop : Linter.layerOxlint;
  const scoreLayer = options.offline ? Score.layerOffline : Score.layerHttp;
  const deadCodeLayer = options.deadCode ? DeadCode.layerNode : DeadCode.layerNoop;
  const configLayer = hasConfigOverride
    ? Config.layerOf({ config: configOverride, resolvedDirectory: directory })
    : Config.layerNode;

  // Spinner handle is shared between `beforeLint` (which starts it
  // when lint actually runs) and `afterLint` plus the post-runtime
  // failure branch below. A `Ref` instead of a closure-mutated
  // variable keeps the hook scopes pure-Effect.
  const program = Effect.gen(function* () {
    const spinnerService = yield* Spinner;
    const spinnerRef = yield* Ref.make<SpinnerHandle | null>(null);

    const result = yield* runInspectEffect(runtimeInput, {
      beforeLint: (projectInfo, lintIncludePaths) =>
        Effect.gen(function* () {
          const lintSourceFileCount = lintIncludePaths?.length ?? projectInfo.sourceFileCount;
          if (!options.scoreOnly) {
            printProjectDetection(
              projectInfo,
              configOverride,
              isDiffMode,
              options.includePaths,
              lintSourceFileCount,
            );
          }
          if (options.lint && resolvedNodeBinaryPath && !options.scoreOnly) {
            const handle = yield* spinnerService.start("Running lint checks...");
            yield* Ref.set(spinnerRef, handle);
          }
        }),
      afterLint: (didFail) =>
        Effect.gen(function* () {
          const handle = yield* Ref.get(spinnerRef);
          if (!handle) return;
          if (!didFail) {
            yield* handle.succeed("Running lint checks.");
          }
        }),
    });

    const spinnerHandle = yield* Ref.get(spinnerRef);
    return { result, spinnerHandle };
  });

  const layerStack = Layer.mergeAll(
    Project.layerNode,
    configLayer,
    deadCodeLayer,
    Files.layerNode,
    lintLayer,
    LintPartialFailures.layerLive,
    Reporter.layerCapture,
    scoreLayer,
    options.silent ? Spinner.layerNoop : Spinner.layerOra(oraFactory),
  );

  let result;
  let spinnerHandleAfterRun: SpinnerHandle | null;
  try {
    const programResult = await Effect.runPromise(program.pipe(Effect.provide(layerStack)));
    result = programResult.result;
    spinnerHandleAfterRun = programResult.spinnerHandle;
  } catch (cause) {
    if (isReactDoctorErrorLike(cause)) restoreLegacyThrow(cause);
    throw cause;
  }

  // Surface a stream-level lint failure through the same spinner
  // and dim-hint UX the legacy entry point produced. The renderer
  // distinguishes "native binding missing" from generic spawn /
  // timeout / parse failures because that drives a different next
  // step for the user (upgrade Node vs. retry with a smaller
  // include set).
  const didLintFail = lintBindingMissing || result.didLintFail;
  const lintFailureReason = lintBindingMissing
    ? `oxlint native binding not found for Node ${process.version}; expected one matching ${OXLINT_NODE_REQUIREMENT}`
    : result.lintFailureReason;
  // Tagged-reason dispatch beats string sniffing on `lintFailureReason`
  // — the runtime carries `lintFailureReasonTag` exactly so this
  // renderer doesn't have to know the format strings the runner
  // produces.
  const isNativeBindingFailure =
    result.lintFailureReasonTag === "OxlintNativeBindingFailed" ||
    result.lintFailureReasonTag === "OxlintBinaryNotFound";
  if (
    !options.scoreOnly &&
    !lintBindingMissing &&
    result.didLintFail &&
    spinnerHandleAfterRun !== null &&
    lintFailureReason !== null
  ) {
    if (isNativeBindingFailure) {
      await Effect.runPromise(
        spinnerHandleAfterRun.fail(
          `Lint checks failed — oxlint native binding not found (Node ${process.version}).`,
        ),
      );
      logger.dim(
        `  Upgrade to Node ${OXLINT_NODE_REQUIREMENT} or run: npx -p oxlint@latest react-doctor@latest`,
      );
    } else {
      await Effect.runPromise(
        spinnerHandleAfterRun.fail("Lint checks failed (non-fatal, skipping)."),
      );
      logger.error(lintFailureReason);
    }
  }

  // Dead-code analysis runs inside the runtime stream; surface
  // its outcome to the user as a separate spinner line. Dead-code
  // is sequential after lint in the current pipeline, so showing
  // its line only after lint finalizes keeps two ora frame loops
  // from competing for stderr.
  const shouldRenderDeadCodeLine =
    !options.scoreOnly && !options.silent && options.deadCode && !isDiffMode;
  if (shouldRenderDeadCodeLine) {
    const deadCodeHandle = oraFactory("Analyzing dead code...");
    if (result.didDeadCodeFail) {
      await Effect.runPromise(
        deadCodeHandle.fail("Dead-code analysis failed (non-fatal, skipping)."),
      );
    } else {
      await Effect.runPromise(deadCodeHandle.succeed("Analyzing dead code."));
    }
  }

  const elapsedMilliseconds = performance.now() - startTime;
  return finalizeAndRender({
    options,
    elapsedMilliseconds,
    diagnostics: [...result.diagnostics],
    score: didLintFail ? null : result.score,
    project: result.project,
    userConfig: result.userConfig,
    didLintFail,
    lintFailureReason,
    lintPartialFailures: [...result.lintPartialFailures],
    didDeadCodeFail: result.didDeadCodeFail,
    deadCodeFailureReason: result.deadCodeFailureReason,
    directory: result.resolvedDirectory,
  });
};

interface FinalizeInput {
  options: ResolvedInspectOptions;
  elapsedMilliseconds: number;
  diagnostics: ReadonlyArray<InspectResult["diagnostics"][number]>;
  score: InspectResult["score"];
  project: InspectResult["project"];
  userConfig: ReactDoctorConfig | null;
  didLintFail: boolean;
  lintFailureReason: string | null;
  lintPartialFailures: ReadonlyArray<string>;
  didDeadCodeFail: boolean;
  deadCodeFailureReason: string | null;
  directory: string;
}

const finalizeAndRender = (input: FinalizeInput): InspectResult => {
  const {
    options,
    elapsedMilliseconds,
    diagnostics,
    score,
    project,
    userConfig,
    didLintFail,
    lintFailureReason,
    lintPartialFailures,
    didDeadCodeFail,
    deadCodeFailureReason,
    directory,
  } = input;

  const skippedChecks: string[] = [];
  if (didLintFail) skippedChecks.push("lint");
  if (didDeadCodeFail) skippedChecks.push("dead-code");
  const hasSkippedChecks = skippedChecks.length > 0;

  const noScoreMessage = options.offline
    ? "Score unavailable in offline mode."
    : "Score unavailable (could not reach the score API).";

  const skippedCheckReasons: Record<string, string> = {};
  if (didLintFail && lintFailureReason !== null) {
    skippedCheckReasons.lint = lintFailureReason;
  } else if (lintPartialFailures.length > 0) {
    skippedCheckReasons["lint:partial"] = lintPartialFailures.join("; ");
  }
  if (didDeadCodeFail && deadCodeFailureReason !== null) {
    skippedCheckReasons["dead-code"] = deadCodeFailureReason;
  }

  const buildResult = (): InspectResult => ({
    diagnostics: [...diagnostics],
    score,
    skippedChecks,
    ...(Object.keys(skippedCheckReasons).length > 0 ? { skippedCheckReasons } : {}),
    project,
    elapsedMilliseconds,
  });

  if (options.scoreOnly) {
    if (score) {
      logger.log(`${score.score}`);
    } else {
      logger.dim(noScoreMessage);
    }
    return buildResult();
  }

  const surfaceDiagnostics = filterDiagnosticsForSurface(
    [...diagnostics],
    options.outputSurface,
    userConfig,
  );
  const demotedDiagnosticCount = diagnostics.length - surfaceDiagnostics.length;
  const isDiffMode = options.includePaths.length > 0;
  const lintSourceFileCount = isDiffMode ? options.includePaths.length : project.sourceFileCount;

  if (surfaceDiagnostics.length === 0) {
    if (hasSkippedChecks) {
      const skippedLabel = skippedChecks.join(" and ");
      logger.warn(
        `No issues detected, but ${skippedLabel} checks failed — results are incomplete.`,
      );
    } else if (demotedDiagnosticCount > 0) {
      logger.success(
        `No issues found! (${demotedDiagnosticCount} demoted from the ${options.outputSurface} surface — see config.surfaces.)`,
      );
    } else {
      logger.success("No issues found!");
    }
    logger.break();
    if (hasSkippedChecks) {
      printBrandingOnlyHeader();
      logger.log(highlighter.gray("  Score not shown — some checks could not complete."));
    } else if (score) {
      printScoreHeader(score);
    } else {
      printNoScoreHeader(noScoreMessage);
    }
    return buildResult();
  }

  logger.break();
  printDiagnostics(surfaceDiagnostics, options.verbose, directory);

  if (demotedDiagnosticCount > 0) {
    logger.log(
      highlighter.gray(
        `  ${demotedDiagnosticCount} demoted from the ${options.outputSurface} surface (e.g. design cleanup) — run \`npx react-doctor@latest .\` locally for the full list.`,
      ),
    );
    logger.break();
  }

  const shouldShowShareLink = !options.offline && options.share;
  printSummary(
    surfaceDiagnostics,
    elapsedMilliseconds,
    score,
    project.projectName,
    lintSourceFileCount,
    noScoreMessage,
    !shouldShowShareLink,
  );

  if (hasSkippedChecks) {
    const skippedLabel = skippedChecks.join(" and ");
    logger.break();
    logger.warn(`  Note: ${skippedLabel} checks failed — score may be incomplete.`);
  }

  return buildResult();
};
