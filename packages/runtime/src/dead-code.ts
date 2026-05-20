import { Context, Effect, Layer } from "effect";
import { checkDeadCode } from "@react-doctor/core";
import type { Diagnostic, ReactDoctorConfig } from "@react-doctor/types";

/**
 * `DeadCode` runs whole-project reachability analysis against the
 * supplied directory and returns the resulting diagnostics. Wraps
 * the existing `checkDeadCode` (which delegates to `deslop-js`).
 *
 * Reachability is a whole-project property, so the orchestrator
 * skips this pass in `--diff` / `--staged` mode (matching the
 * gate `combineDiagnostics` already applies to
 * `checkReducedMotion`). When the underlying native binding
 * crashes — `deslop-js` ships a Rust binary that has occasional
 * platform-specific issues — `DeadCode.compute` raises so the
 * orchestrator can fold the failure into
 * `skippedChecks: ["dead-code"]` without sinking the whole scan.
 */
export class DeadCode extends Context.Service<
  DeadCode,
  {
    readonly compute: (
      rootDirectory: string,
      userConfig: ReactDoctorConfig | null,
    ) => Effect.Effect<ReadonlyArray<Diagnostic>, Error>;
  }
>()("@react-doctor/runtime/DeadCode") {
  static readonly layerNode = Layer.succeed(
    DeadCode,
    DeadCode.of({
      compute: (rootDirectory, userConfig) =>
        Effect.tryPromise({
          try: () => checkDeadCode({ rootDirectory, userConfig }),
          catch: (cause) => (cause instanceof Error ? cause : new Error(String(cause))),
        }),
    }),
  );

  /**
   * No-op layer used when the caller opted out via `--no-dead-code`
   * or set `deadCode: false` in config. Returns an empty array
   * immediately; never raises.
   */
  static readonly layerNoop = Layer.succeed(
    DeadCode,
    DeadCode.of({
      compute: () => Effect.succeed([]),
    }),
  );

  /**
   * Test layer: returns the supplied diagnostics regardless of
   * input. Same shape as `Linter.layerOf` — provide in tests, then
   * assert against the captured pipeline output.
   */
  static readonly layerOf = (diagnostics: ReadonlyArray<Diagnostic>): Layer.Layer<DeadCode> =>
    Layer.succeed(
      DeadCode,
      DeadCode.of({
        compute: () => Effect.succeed(diagnostics),
      }),
    );
}
