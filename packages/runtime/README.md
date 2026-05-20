# @react-doctor/runtime

Internal Effect v4 runtime layer for React Doctor. **Not published.**

The runtime is the place where React Doctor's diagnostic pipeline becomes
schema-decoded at the wire, swappable behind `Context.Service`s, and consumed
as a `Stream` instead of an array. Both public entry points — the CLI's
`inspect()` and the programmatic `diagnose()` — are thin shells around the
runtime's `runInspect` Effect.

## Services

One `Context.Service` per orthogonal axis. Adding a new backend (a second
linter, a SARIF reporter, an LSP host's diagnostic publisher) is one new
`Layer` that satisfies the existing service interface — the orchestration
above doesn't change.

| Service                                                                                  | Live layer                                                  | Test surface                                |
| ---------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------- |
| `Project` — discover the React project at a directory                                    | `layerNode` (wraps `discoverProject`)                       | `layerOf(projectInfo)`                      |
| `Config` — load `react-doctor.config.json` + `rootDir` redirect, cached via `Cache.make` | `layerNode`                                                 | `layerOf({ config, resolvedDirectory })`    |
| `Files` — every read / list / stat the pipeline needs                                    | `layerNode`                                                 | `layerInMemory(Map<absolutePath, content>)` |
| `Linter` — stream diagnostics for an input                                               | `layerOxlint`, `layerComposite([...])`                      | `layerNoop`, `layerOf(diagnostics)`         |
| `Reporter` — `emit(diagnostic)` + `finalize`                                             | `layerNdjson(path)` (Schema-encoded NDJSON), `layerCapture` | `layerNoop`, `layerCapture`                 |
| `Score` — compute the score                                                              | `layerHttp`                                                 | `layerOffline`, `layerOf(result)`           |
| `Spinner` — terminal feedback during long phases                                         | `layerOra(factory)`                                         | `layerNoop`, `layerCapture`                 |
| `LintPartialFailures` — per-batch soft-failure messages from linters                     | `layerLive` (Ref)                                           | (replaceable in tests)                      |

The only production linter today is `Linter.layerOxlint`, which wraps the
existing `runOxlint` subprocess runner from `@react-doctor/core`. Per-batch
soft failures (a single batch hit the timeout and was dropped) flow into the
`LintPartialFailures` Ref so the orchestrator folds them into
`skippedCheckReasons["lint:partial"]` without the diagnostic stream itself
becoming a failure channel for non-fatal events.

## Schemas — the wire

`runtime/diagnostic-schema.ts` exports `Diagnostic` + `Severity` + the
deterministic `buildDiagnosticIdentity`
(`${file}::${line}:${col}::${plugin}/${rule}`). The same identity unblocks
suppression files, baselines, content-hash-keyed caches, and IDE
"ignore this" actions without each consumer re-deriving the key.

`runtime/json-report-schema.ts` exports `JsonReport` as
`Schema.Union([JsonReportV1])`. Adding `schemaVersion: 2` later is one new
union member; every downstream consumer decodes through the same schema
instead of trusting fields. Decode failure is a typed
`Schema.decodeUnknownSync` throw, not an `undefined`-field crash three layers
in.

`Reporter.layerNdjson(filePath)` Schema-encodes every diagnostic at the
emit boundary, so the wire format is symmetrical: read-side via
`Schema.decode`, write-side via `Schema.encode`.

## Tagged errors — `ReactDoctorError { reason: Schema.Union([...]) }`

Lives in `@react-doctor/core` so the runtime can re-export without a
circular dep. Every leaf failure is a `Schema.TaggedErrorClass`:

`OxlintBinaryNotFound`, `OxlintNativeBindingFailed`, `OxlintSpawnFailed`,
`OxlintTimedOut`, `OxlintOutputTooLarge`, `OxlintOutOfMemory`,
`OxlintKilled`, `OxlintOutputUnparseable`, `ConfigParseFailed`,
`ProjectNotFound`, `NoReactDependency`, `AmbiguousProject`.

`runOxlint` raises tagged errors directly. `formatReactDoctorError` is the
single place wording lives — CLI's `handle-error.ts` and JSON's
`build-json-report-error.ts` defer to it for tagged errors.
`isSplittableReactDoctorError` discriminates "splittable batch failures"
(timeout, output-too-large, OOM) by `_tag`, not by `error.message.includes(...)`.

## Streaming pipeline

`runInspect` flows diagnostics through one `Stream` end to end with no
intermediate array materialization:

```
Stream.fromIterable(checkReducedMotion(scanDirectory))
  .pipe(
    Stream.concat(Linter.lint(...)),
    Stream.catchTag("ReactDoctorError", ...),     // fold mid-stream lint failures
    Stream.filterMap(transform.apply),            // per-element auto-suppress / severity / ignore / inline
    Stream.tap(Reporter.emit),                    // mid-stream reporter
  )
```

The per-element transform is `buildDiagnosticPipeline` in
`@react-doctor/core`. Both this streaming pipeline and the legacy
array-shaped `mergeAndFilterDiagnostics` route through it — there is no
second copy of the auto-suppress / severity / ignore / inline-suppression
chain.

`runDiagnosticPipeline` is a smaller helper for callers that just want to
fold severity counts in a single pass via `Stream.runFoldEffect`; the full
inspect orchestration uses `runInspect` instead.

## Orchestration — `runInspect`

```ts
runInspect(input, hooks): Effect<
  RunInspectOutput,
  ReactDoctorError,
  Project | Config | Files | Linter | LintPartialFailures | Reporter | Score | HooksR
>
```

1. `Config.resolve(directory)` → `{ config, resolvedDirectory }`
2. `Project.discover(resolvedDirectory)` → `ProjectInfo`; raises tagged
   `NoReactDependency` when `reactVersion === null`
3. `buildDiagnosticPipeline({ files, ... })` → per-element transform
4. `Linter.lint(...)` stream → `Stream.tap(Reporter.emit)` →
   `Stream.catchTag("ReactDoctorError", ...)` folding into
   `didLintFail / lintFailureReason / lintFailureReasonTag`
5. `Score.compute(...)` over the surface-filtered subset
6. Returns `RunInspectOutput`

`RunInspectHooks<HooksR>` is parametric on the hook environment so a caller
can `yield* AnyService` from a hook (the CLI does this for `Spinner`).

## Public API rewires

`react-doctor/src/inspect.ts` (the CLI's entry point) and
`react-doctor/src/index.ts` (the programmatic `diagnose()`) are now thin
shells around `runInspect`. They:

- Resolve config + merge options
- Build a tailored layer stack (`Linter.layerNoop` for `--no-lint` /
  missing oxlint native binding, `Linter.layerOxlint` otherwise;
  `Score.layerOffline` for `--offline`, `Score.layerHttp` otherwise;
  `Spinner.layerNoop` for `--silent` / `--score` / `--json`,
  `Spinner.layerOra(oraFactory)` otherwise; `Config.layerOf` when the
  caller supplied `configOverride`)
- Run via `Effect.runPromise`
- Translate runtime tagged errors back into the legacy thrown classes
  (`NoReactDependencyError`, `ProjectNotFoundError`,
  `AmbiguousProjectError`) at the public-API boundary so existing
  contracts hold

## Tests

Runtime tests use `vite-plus/test` (the workspace's vitest wrapper) and
provide layered services per case rather than mocking modules:

- `diagnostic-schema.test.ts` — decode + identity
- `json-report-schema.test.ts` — v1 round-trip + missing-discriminator
  rejection
- `errors.test.ts` — facade renders, propagates as a tagged failure,
  recovers via `Effect.catchTag`
- `pipeline.test.ts` — `Linter.layerOf` + `Reporter.layerCapture` over
  `runDiagnosticPipeline`
- `run-inspect.test.ts` — full orchestration with all-`layerOf` services
  - `Files.layerInMemory`; mid-stream `Stream.fail` folds into
    `didLintFail`; missing React yields `NoReactDependency`
- `tagged-errors.test.ts` — `isSplittableReactDoctorError` by tag;
  `formatReactDoctorError` rendering
- `files.test.ts` — `layerInMemory` exposes the four primitives
- `spinner.test.ts` — `layerCapture` / `layerNoop` / `layerOra`
- `reporter-ndjson.test.ts` — Schema-encoded NDJSON line per emit
- `linter-composite.test.ts` — backends concatenate; backends share the
  `LintPartialFailures` Ref via the runtime context

## What this package does **not** do

- It does **not** define rules. Rules live in
  `oxlint-plugin-react-doctor`; the runtime's `Linter` is the runner-side
  abstraction over them.
- It is **not** Node-free. `Files.layerNode` and `Reporter.layerNdjson`
  call `node:fs` directly (the alternative is duplicating those calls
  across every consumer). Schemas, errors, the orchestrator, and the
  per-element pipeline transform stay framework-free.
- It does **not** ship a second `Linter` backend, an LSP host, a SARIF
  reporter, or a watch mode. The layer slots for those exist; the
  implementations are downstream product decisions.
