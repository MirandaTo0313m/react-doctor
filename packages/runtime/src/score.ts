import { Context, Effect, Layer } from "effect";
import { calculateScore } from "@react-doctor/core";
import type { Diagnostic, ScoreResult } from "@react-doctor/types";

/**
 * `Score` wraps the score-API round trip in a service so the rest
 * of the pipeline can speak in terms of "compute a score for these
 * diagnostics" without caring whether the answer comes from the
 * hosted API, an offline fallback, or a captured fixture in tests.
 *
 * The hosted API can be unreachable for legitimate reasons
 * (offline laptop, locked-down CI egress); both cases collapse to
 * `null`, with the renderer distinguishing "user opted out" from
 * "we tried and failed" via the `noScoreMessage` it reads off the
 * inspect result. Forcing `null` into the success channel is
 * deliberate — score isn't load-bearing for the linter contract,
 * so an outage shouldn't propagate through `E`.
 */
export class Score extends Context.Service<
  Score,
  {
    readonly compute: (diagnostics: ReadonlyArray<Diagnostic>) => Effect.Effect<ScoreResult | null>;
  }
>()("@react-doctor/runtime/Score") {
  static readonly layerHttp = Layer.succeed(
    Score,
    Score.of({
      compute: (diagnostics) =>
        Effect.promise(() =>
          calculateScore([...diagnostics]).catch((): ScoreResult | null => null),
        ),
    }),
  );

  static readonly layerOffline = Layer.succeed(
    Score,
    Score.of({
      compute: () => Effect.succeed(null),
    }),
  );

  static readonly layerOf = (result: ScoreResult | null): Layer.Layer<Score> =>
    Layer.succeed(
      Score,
      Score.of({
        compute: () => Effect.succeed(result),
      }),
    );
}
